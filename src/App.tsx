/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { 
  Trophy, 
  PenTool, 
  ClipboardList, 
  Sparkles, 
  Clock, 
  Flame,
  Info,
  Calendar,
  Layers,
  Sparkle,
  Mail,
  Lock
} from "lucide-react";
import Header from "./components/Header";
import FormularioRegistro from "./components/FormularioRegistro";
import ResumenRecibo from "./components/ResumenRecibo";
import ListaParticipantes from "./components/ListaParticipantes";
import { 
  getAllSubmissions, 
  saveSubmission, 
  deleteSubmission, 
  syncLocalSubmissions, 
  getEditingLocked, 
  saveEditingLocked, 
  getRegistrationLocked, 
  saveRegistrationLocked, 
  getGroupPhaseLocked, 
  saveGroupPhaseLocked, 
  getSecondPhaseLocked, 
  saveSecondPhaseLocked, 
  getThirdPhaseLocked,
  saveThirdPhaseLocked,
  getFourthPhaseLocked,
  saveFourthPhaseLocked,
  getFifthPhaseLocked,
  saveFifthPhaseLocked,
  getSixthPhaseLocked,
  saveSixthPhaseLocked,
  getSeventhPhaseLocked,
  saveSeventhPhaseLocked,
  getLocalSubmissions, 
  getTeamOverrides, 
  saveTeamOverrides 
} from "./storage";
import { QuinielaSubmission } from "./types";
import { isFirebaseConfigured } from "./firebase";
import { MATCHES } from "./games";
import { APP_VERSION, VERSION_DATE, APP_CHANGELOG, forceBustCacheAndReload } from "./version";

export default function App() {
  const [activeTab, setActiveTab] = useState<"home" | "register" | "success" | "list">("home");
  const [submissions, setSubmissions] = useState<QuinielaSubmission[]>([]);
  const [currentSubmission, setCurrentSubmission] = useState<QuinielaSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeEmail, setResumeEmail] = useState("");
  const [searchEmailInput, setSearchEmailInput] = useState("");
  const [searchEmailFeedback, setSearchEmailFeedback] = useState<any | null>(null);
  const [searchPinInput, setSearchPinInput] = useState("");
  const [searchPinError, setSearchPinError] = useState("");
  const [isSearchUnlocked, setIsSearchUnlocked] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  
  // Phase and generic locks
  const [isEditingLocked, setIsEditingLocked] = useState(false);
  const [isRegistrationLocked, setIsRegistrationLocked] = useState(false);
  const [isGroupPhaseLocked, setIsGroupPhaseLocked] = useState(true);
  const [isSecondPhaseLocked, setIsSecondPhaseLocked] = useState(false);
  const [isThirdPhaseLocked, setIsThirdPhaseLocked] = useState(false);
  const [isFourthPhaseLocked, setIsFourthPhaseLocked] = useState(false);
  const [isFifthPhaseLocked, setIsFifthPhaseLocked] = useState(false);
  const [isSixthPhaseLocked, setIsSixthPhaseLocked] = useState(false);
  const [isSeventhPhaseLocked, setIsSeventhPhaseLocked] = useState(false);
  
  const [teamOverrides, setTeamOverrides] = useState<Record<string, string>>({});

  // Dynamically compute matches array with overrides applied
  const dynamicMatches = useMemo(() => {
    return MATCHES.map((m) => {
      const newHome = teamOverrides[m.homeTeam] || m.homeTeam;
      const newAway = teamOverrides[m.awayTeam] || m.awayTeam;
      return {
        ...m,
        homeTeam: newHome,
        awayTeam: newAway,
      };
    });
  }, [teamOverrides]);

  // Fetch registered submissions from storage
  useEffect(() => {
    async function syncAndLoadSubmissions() {
      try {
        await syncLocalSubmissions();
        let data = await getAllSubmissions();

        // Load dynamic team name overrides
        try {
          const overrides = await getTeamOverrides();
          setTeamOverrides(overrides);
        } catch (oe) {
          console.warn("Failed to load team overrides:", oe);
        }
        
        // One-time auto-healing patch: Change the dates of the 3 latest manual load submissions to June 7, 2026.
        // We find the first 3 submissions on the list (which currently are sorted descending and appear first due to the incorrect date).
        const hasAppliedDatePatch = localStorage.getItem("patch_dates_7_junio_v3");
        if (!hasAppliedDatePatch && data.length > 0) {
          const candidates = data.slice(0, 3);
          let patchedAny = false;
          for (const sub of candidates) {
            const subDate = new Date(sub.submittedAt);
            const day = subDate.getUTCDate();
            const month = subDate.getUTCMonth(); // June is 5
            const year = subDate.getUTCFullYear();
            
            // Check if date is June 8 or 9, 2026 (the yesterday/today manual load window)
            if (year === 2026 && month === 5 && (day === 8 || day === 9)) {
              const updatedSub: QuinielaSubmission = {
                ...sub,
                submittedAt: "2026-06-07T12:00:00.000Z",
                participant: {
                  ...sub.participant,
                  registeredAt: sub.participant.registeredAt.startsWith("2026-06-08") || sub.participant.registeredAt.startsWith("2026-06-09")
                    ? "2026-06-07T12:00:00.000Z"
                    : sub.participant.registeredAt
                }
              };
              await saveSubmission(updatedSub);
              patchedAny = true;
            }
          }
          localStorage.setItem("patch_dates_7_junio_v3", "true");
          if (patchedAny) {
            data = await getAllSubmissions();
          }
        }

        // Automatic persistent correction: Change any submission with August (-08-) or July (-07-) dates to June (-06-)
        let patchedMonths = false;
        for (const sub of data) {
          const hasAugust = sub.submittedAt && sub.submittedAt.includes("-08-");
          const hasJuly = sub.submittedAt && sub.submittedAt.includes("-07-");
          const hasRegAugust = sub.participant.registeredAt && sub.participant.registeredAt.includes("-08-");
          const hasRegJuly = sub.participant.registeredAt && sub.participant.registeredAt.includes("-07-");

          if (hasAugust || hasJuly || hasRegAugust || hasRegJuly) {
            const correctedTime = sub.submittedAt
              ? sub.submittedAt.replace(/-08-/g, "-06-").replace(/-07-/g, "-06-")
              : "2026-06-07T12:00:00.000Z";

            const rawReg = sub.participant.registeredAt || correctedTime;
            const correctedReg = rawReg.replace(/-08-/g, "-06-").replace(/-07-/g, "-06-");

            const updatedSub: QuinielaSubmission = {
              ...sub,
              submittedAt: correctedTime,
              participant: {
                ...sub.participant,
                registeredAt: correctedReg
              }
            };
            await saveSubmission(updatedSub);
            patchedMonths = true;
          }
        }
        if (patchedMonths) {
          data = await getAllSubmissions();
        }
        
        setSubmissions(data);
        
        // Load lock state
        const locked = await getEditingLocked();
        setIsEditingLocked(locked);
        const regLocked = await getRegistrationLocked();
        setIsRegistrationLocked(regLocked);
        const gpLock = await getGroupPhaseLocked();
        setIsGroupPhaseLocked(gpLock);
        const spLock = await getSecondPhaseLocked();
        setIsSecondPhaseLocked(spLock);
        const tpLock = await getThirdPhaseLocked();
        setIsThirdPhaseLocked(tpLock);
        const qpLock = await getFourthPhaseLocked();
        setIsFourthPhaseLocked(qpLock);
        const sfLock = await getFifthPhaseLocked();
        setIsFifthPhaseLocked(sfLock);
        const t3Lock = await getSixthPhaseLocked();
        setIsSixthPhaseLocked(t3Lock);
        const fLock = await getSeventhPhaseLocked();
        setIsSeventhPhaseLocked(fLock);
      } catch (err) {
        console.warn("Silent sync error on load:", err);
        // Load fallback local items if Firestore fails
        try {
          const data = await getAllSubmissions();
          setSubmissions(data);
        } catch (e) {
          console.error("Fallback load failed:", e);
        }
      } finally {
        setLoading(false);
      }
    }
    syncAndLoadSubmissions();

    // Setup an automatic dynamic sync every 15 seconds to sync behind the scenes
    const interval = setInterval(async () => {
      try {
        await syncLocalSubmissions();
        const data = await getAllSubmissions();
        setSubmissions(data);
      } catch (err) {
        console.warn("Background sync error:", err);
      }
    }, 15000);

    // Setup automatic sync when the user switches tabs back or focuses the window/tab
    const handleVisibilityAndSync = async () => {
      if (document.visibilityState === "visible") {
        try {
          await syncLocalSubmissions();
          const data = await getAllSubmissions();
          setSubmissions(data);
        } catch (err) {
          console.warn("Auto-sync on window focus failed:", err);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityAndSync);
    window.addEventListener("focus", handleVisibilityAndSync);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityAndSync);
      window.removeEventListener("focus", handleVisibilityAndSync);
    };
  }, []);

  // Synchronize state and trigger routing from search params (?tab=list) or hashes (#list) on initial load and navigation popstate/hashchange
  useEffect(() => {
    function handleRouting() {
      const p = new URLSearchParams(window.location.search);
      const tabParam = p.get("tab");
      const hash = window.location.hash;
      
      if (tabParam === "list" || tabParam === "participantes" || hash === "#list" || hash === "#participantes") {
        setActiveTab("list");
      } else if (tabParam === "register" || hash === "#register") {
        setActiveTab("register");
      } else if (tabParam === "success" || hash === "#success") {
        setActiveTab("success");
      } else if (tabParam === "home" || hash === "#home") {
        setActiveTab("home");
      }
    }
    
    handleRouting();
    window.addEventListener("popstate", handleRouting);
    window.addEventListener("hashchange", handleRouting);
    return () => {
      window.removeEventListener("popstate", handleRouting);
      window.removeEventListener("hashchange", handleRouting);
    };
  }, []);

  // Helper to change tab and scroll to top smoothly
  const navigateToTab = (tab: "home" | "register" | "success" | "list") => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    // Clear homepage rescue search queries when changing tabs
    if (tab !== "home") {
      setSearchEmailInput("");
      setSearchEmailFeedback(null);
    }
    
    try {
      const url = new URL(window.location.href);
      if (tab === "home") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", tab);
      }
      window.history.pushState({}, "", url.toString());
    } catch (e) {
      console.warn("Failed to update history state", e);
    }
  };

  // Helper to scroll to recovery / edit email field
  const scrollToRecovery = () => {
    setActiveTab("home");
    setTimeout(() => {
      const el = document.getElementById("txt-search-resume-email");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
      }
    }, 150);
  };

  // Handle successful form submission
  const handleSubmissionSuccess = async (sub: QuinielaSubmission) => {
    setIsSubmitting(true);
    try {
      const docId = await saveSubmission(sub);
      const submissionWithId = { ...sub, id: docId };
      
      // Prevent duplicates in active state list when overwriting/re-submitting an existing email
      setSubmissions((prev) => {
        const filtered = prev.filter(
          (s) => s.participant.email.toLowerCase().trim() !== sub.participant.email.toLowerCase().trim()
        );
        return [submissionWithId, ...filtered];
      });
      
      setCurrentSubmission(submissionWithId);
      navigateToTab("success");
    } catch (err: any) {
      console.error("Submission failed, using local storage fallback:", err);
      
      // Fallback: saveSubmission already successfully wrote to browser localStorage during step 1.
      // We will generate/reuse a local-prefixed ID to let the user proceed seamlessly to their receipt.
      const localId = sub.id || "local_" + Date.now();
      const submissionWithId = { ...sub, id: localId };
      
      setSubmissions((prev) => {
        const filtered = prev.filter(
          (s) => s.participant.email.toLowerCase().trim() !== sub.participant.email.toLowerCase().trim()
        );
        return [submissionWithId, ...filtered];
      });
      
      setCurrentSubmission(submissionWithId);
      navigateToTab("success");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectParticipantReceipt = (sub: QuinielaSubmission) => {
    setCurrentSubmission(sub);
    navigateToTab("success");
  };

  const handleDeleteSubmission = async (id: string | undefined, email: string, submittedAt: string) => {
    try {
      await deleteSubmission(id, email, submittedAt);
      setSubmissions((prev) => prev.filter((sub) => !(sub.participant.email === email && sub.submittedAt === submittedAt)));
      if (currentSubmission && currentSubmission.participant.email === email && currentSubmission.submittedAt === submittedAt) {
        setCurrentSubmission(null);
      }
    } catch (err) {
      console.error("Failed to delete submission:", err);
    }
  };

  const handleUpdateSubmissionPin = async (id: string | undefined, email: string, submittedAt: string, newPin: string) => {
    try {
      const foundIdx = submissions.findIndex(
        (s) => s.participant.email === email && s.submittedAt === submittedAt
      );
      if (foundIdx === -1) return;
      
      const updatedSubmission = {
        ...submissions[foundIdx],
        participant: {
          ...submissions[foundIdx].participant,
          pin: newPin,
        },
      };

      const docId = await saveSubmission(updatedSubmission);
      updatedSubmission.id = docId;

      setSubmissions((prev) => {
        const copy = [...prev];
        copy[foundIdx] = updatedSubmission;
        return copy;
      });

      // Update current submission if it matches
      if (currentSubmission && currentSubmission.participant.email === email && currentSubmission.submittedAt === submittedAt) {
        setCurrentSubmission(updatedSubmission);
      }
    } catch (err) {
      console.error("Failed to update PIN:", err);
      throw err;
    }
  };

  const handleUpdateSubmissionEmail = async (id: string | undefined, oldEmail: string, submittedAt: string, newEmail: string) => {
    try {
      const normalizedNewEmail = newEmail.toLowerCase().trim();
      const normalizedOldEmail = oldEmail.toLowerCase().trim();

      // Ensure no OTHER participant already exists with that new email
      const emailConflict = submissions.some(
        (s) => s.participant.email.toLowerCase().trim() === normalizedNewEmail && 
              !(s.participant.email.toLowerCase().trim() === normalizedOldEmail && s.submittedAt === submittedAt)
      );
      if (emailConflict) {
        throw new Error("Ya existe un participante registrado con ese correo electrónico.");
      }

      const foundIdx = submissions.findIndex(
        (s) => s.participant.email.toLowerCase().trim() === normalizedOldEmail && s.submittedAt === submittedAt
      );
      if (foundIdx === -1) {
        throw new Error("No se pudo localizar el registro original para modificar.");
      }
      
      const previousSubmission = submissions[foundIdx];
      const updatedSubmission = {
        ...previousSubmission,
        participant: {
          ...previousSubmission.participant,
          email: normalizedNewEmail,
        },
      };

      // Perfect local data synchronization
      const localData = getLocalSubmissions();
      const existingLocalIndex = localData.findIndex(
        (sub) => sub.participant.email.toLowerCase().trim() === normalizedOldEmail && sub.submittedAt === submittedAt
      );
      if (existingLocalIndex !== -1) {
        localData[existingLocalIndex].participant.email = normalizedNewEmail;
        localStorage.setItem("quiniela_submissions_v1", JSON.stringify(localData));
      }

      // Save updated submission (this will overwrite in Firestore or local fallback)
      const docId = await saveSubmission(updatedSubmission);
      updatedSubmission.id = docId;

      setSubmissions((prev) => {
        const copy = [...prev];
        copy[foundIdx] = updatedSubmission;
        return copy;
      });

      // Update current submission if it matches
      if (currentSubmission && currentSubmission.participant.email.toLowerCase().trim() === normalizedOldEmail && currentSubmission.submittedAt === submittedAt) {
        setCurrentSubmission(updatedSubmission);
      }
    } catch (err) {
      console.error("Failed to update Email:", err);
      throw err;
    }
  };

  const handleToggleEditingLock = async (newVal: boolean) => {
    try {
      await saveEditingLocked(newVal);
      setIsEditingLocked(newVal);
    } catch (err) {
      console.error("Failed to change editing lock state:", err);
    }
  };

  const handleToggleRegistrationLock = async (newVal: boolean) => {
    try {
      await saveRegistrationLocked(newVal);
      setIsRegistrationLocked(newVal);
    } catch (err) {
      console.error("Failed to change registration lock state:", err);
    }
  };

  const handleToggleGroupPhaseLock = async (newVal: boolean) => {
    try {
      await saveGroupPhaseLocked(newVal);
      setIsGroupPhaseLocked(newVal);
    } catch (err) {
      console.error("Failed to change group phase lock state:", err);
    }
  };

  const handleToggleSecondPhaseLock = async (newVal: boolean) => {
    try {
      await saveSecondPhaseLocked(newVal);
      setIsSecondPhaseLocked(newVal);
    } catch (err) {
      console.error("Failed to change second phase lock state:", err);
    }
  };

  const handleToggleThirdPhaseLock = async (newVal: boolean) => {
    try {
      await saveThirdPhaseLocked(newVal);
      setIsThirdPhaseLocked(newVal);
    } catch (err) {
      console.error("Failed to change third phase lock state:", err);
    }
  };

  const handleToggleFourthPhaseLock = async (newVal: boolean) => {
    try {
      await saveFourthPhaseLocked(newVal);
      setIsFourthPhaseLocked(newVal);
    } catch (err) {
      console.error("Failed to change fourth phase lock state:", err);
    }
  };

  const handleToggleFifthPhaseLock = async (newVal: boolean) => {
    try {
      await saveFifthPhaseLocked(newVal);
      setIsFifthPhaseLocked(newVal);
    } catch (err) {
      console.error("Failed to change fifth phase lock state:", err);
    }
  };

  const handleToggleSixthPhaseLock = async (newVal: boolean) => {
    try {
      await saveSixthPhaseLocked(newVal);
      setIsSixthPhaseLocked(newVal);
    } catch (err) {
      console.error("Failed to change sixth phase lock state:", err);
    }
  };

  const handleToggleSeventhPhaseLock = async (newVal: boolean) => {
    try {
      await saveSeventhPhaseLocked(newVal);
      setIsSeventhPhaseLocked(newVal);
    } catch (err) {
      console.error("Failed to change seventh phase lock state:", err);
    }
  };

  const handleUpdateTeamOverrides = async (newOverrides: Record<string, string>) => {
    try {
      await saveTeamOverrides(newOverrides);
      setTeamOverrides(newOverrides);
    } catch (err) {
      console.error("Failed to save team overrides:", err);
      throw err;
    }
  };

  const handleReloadAllSubmissions = async () => {
    try {
      const data = await getAllSubmissions();
      setSubmissions(data);

      // Also reload dynamic team overrides and lock states to ensure everything is fully synchronized
      try {
        const overrides = await getTeamOverrides();
        setTeamOverrides(overrides);

        const locked = await getEditingLocked();
        setIsEditingLocked(locked);
        const regLocked = await getRegistrationLocked();
        setIsRegistrationLocked(regLocked);
        const gpLock = await getGroupPhaseLocked();
        setIsGroupPhaseLocked(gpLock);
        const spLock = await getSecondPhaseLocked();
        setIsSecondPhaseLocked(spLock);
        const tpLock = await getThirdPhaseLocked();
        setIsThirdPhaseLocked(tpLock);
        const qpLock = await getFourthPhaseLocked();
        setIsFourthPhaseLocked(qpLock);
        const sfLock = await getFifthPhaseLocked();
        setIsFifthPhaseLocked(sfLock);
        const t3Lock = await getSixthPhaseLocked();
        setIsSixthPhaseLocked(t3Lock);
        const fLock = await getSeventhPhaseLocked();
        setIsSeventhPhaseLocked(fLock);
      } catch (errOverrides) {
        console.warn("Failed to reload locks or team overrides:", errOverrides);
      }
    } catch (err) {
      console.error("Failed to reload submissions:", err);
    }
  };

  const handleGenerateMockData = async () => {
    const mockNames = [
      { name: "Julio Augusto", email: "julio.augusto@test.com", phone: "+51999888777" },
      { name: "Laura Benítez", email: "laura.b@test.com", phone: "+541144445555" },
      { name: "Carla Esparza", email: "carla.esparza@test.com", phone: "+525543210987" },
      { name: "Matías Rossi", email: "rossi.matias@test.com", phone: "+34612345678" },
      { name: "Lionel Gómez", email: "gomez.lio@test.com", phone: "+549341555123" }
    ];

    const newSubs: QuinielaSubmission[] = [];
    const rightNow = new Date().toISOString();

    for (const person of mockNames) {
      // Create random predictions
      const predictions: { [matchId: number]: { homeScore: number | ""; awayScore: number | "" } } = {};
      MATCHES.forEach((m) => {
        // Guarantee random score in predictions to be fully completed as expected for simulated submissions
        predictions[m.id] = {
          homeScore: Math.floor(Math.random() * 4),
          awayScore: Math.floor(Math.random() * 4)
        };
      });

      const participant = {
        ...person,
        registeredAt: rightNow
      };

      const mockSub: QuinielaSubmission = {
        participant,
        predictions,
        submittedAt: new Date(Date.now() - Math.random() * 10 * 3600000).toISOString(),
        totalMatchesPredicted: MATCHES.length
      };

      try {
        const id = await saveSubmission(mockSub);
        newSubs.push({ ...mockSub, id });
      } catch (err) {
        console.warn("Firestore write failed for mock, falling back to local storage:", err);
        const fallbackId = "local_" + Date.now() + "_" + Math.floor(Math.random() * 1000000);
        newSubs.push({ ...mockSub, id: fallbackId });
      }
    }

    setSubmissions((prev) => [...newSubs, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-[#00FF00] selection:text-black">
      {/* Editorial Navigation Tab Menu Bar */}
      <nav className="bg-[#0A0A0A]/90 border-b border-white/10 backdrop-blur-md text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="flex items-center justify-between h-20">
            <div className="flex flex-col items-start cursor-pointer group" onClick={() => navigateToTab("home")}>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter italic flex items-center leading-none">
                Quinielas<span className="text-[#00FF00] non-italic font-black">MRD</span>
              </h1>
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#EF4444] uppercase leading-none mt-1">
                By Augusto 2026
              </span>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-6 text-xs font-mono uppercase font-semibold">
              <button
                id="nav-tab-home"
                onClick={() => navigateToTab("home")}
                className={`px-3 py-2 transition-all cursor-pointer tracking-wider ${
                  activeTab === "home" ? "border-b-2 border-[#00FF00] text-white" : "text-white/45 hover:text-white"
                }`}
              >
                Inicio
              </button>
              <button
                id="nav-tab-register"
                onClick={() => navigateToTab("register")}
                className={`px-3.5 py-2.5 rounded-md font-mono transition-all cursor-pointer tracking-tight text-center ${
                  activeTab === "register" 
                    ? "bg-[#00FF00] text-black font-black" 
                    : "border border-white/15 text-white/80 hover:text-white hover:bg-white/5 hover:border-white/25"
                }`}
              >
                Pronosticar
              </button>
              <button
                id="nav-tab-list"
                onClick={() => navigateToTab("list")}
                className={`px-3 py-2 transition-all cursor-pointer tracking-wider flex items-center gap-1.5 ${
                  activeTab === "list" ? "border-b-2 border-[#00FF00] text-white" : "text-white/45 hover:text-white"
                }`}
              >
                Inscritos ({submissions.length})
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Header with real-time stats */}
      <Header totalParticipants={submissions.length} onVersionClick={() => setShowVersionModal(true)} />

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 pb-16 pt-8 sm:px-8 lg:px-12 relative">

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#00FF00]/20 border-t-[#00FF00]" />
          </div>
        ) : (
          <div>
            {activeTab === "home" && (
              /* PRIMARY HOME DASHBOARD SCREEN */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in relative z-10">
                
                {/* Visual Left: Editorial Welcome Poster */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Promo Layout Poster Card */}
                  <div className="relative overflow-hidden bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 sm:p-12 shadow-2xl bg-gradient-to-br from-white/[0.02] to-transparent">
                    {/* Decorative Background Text */}
                    <div className="absolute inset-x-0 bottom-0 pointer-events-none select-none overflow-hidden h-36 flex items-end">
                      <span className="text-[180px] font-black opacity-[0.025] leading-none translate-y-16 -translate-x-10 italic w-full">
                        NORTH AMERICA
                      </span>
                    </div>

                    <span className="inline-block px-3 py-1 border border-[#00FF00] text-[#00FF00] text-[10px] uppercase tracking-[0.2em] font-mono font-bold rounded-full mb-6">
                      Copa Mundial de la FIFA 2026
                    </span>
                    
                    <h2 className="text-5xl sm:text-7xl font-black leading-[0.9] tracking-tighter">
                      DEMUESTRA <br/>TU <span className="text-transparent stroke-text" style={{ WebkitTextStroke: "1px white" }}>TALENTO</span>
                    </h2>
                    
                    <p className="mt-6 text-sm sm:text-base text-white/60 leading-relaxed max-w-xl font-light">
                      La <strong className="text-[#00FF00]">Fase de Grupos (72 partidos) ha cerrado</strong>. Pronostica de manera exclusiva los <span className="text-white font-bold pb-0.5 border-b border-[#00FF00]/40">16 partidos de la Segunda Fase (16avos de Final)</span> y demuestra que eres el mayor conocedor de fútbol del torneo.
                    </p>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-10">
                      <button
                        id="hero-btn-register"
                        onClick={() => setActiveTab("register")}
                        className="bg-[#00FF00] hover:bg-white text-black font-black py-4.5 px-8 rounded-lg shadow-lg shadow-[#00FF00]/10 transition-all flex items-center justify-center gap-3 cursor-pointer text-sm uppercase tracking-tighter"
                      >
                        <PenTool className="w-4.5 h-4.5 stroke-[2.5]" /> Registrar Marcadores
                      </button>

                      <button
                        id="hero-btn-edit"
                        onClick={scrollToRecovery}
                        className="bg-white/5 hover:bg-white/12 border border-white/10 text-[#00FF00] hover:text-white font-bold py-4.5 px-8 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm uppercase tracking-tighter"
                      >
                        <Clock className="w-4.5 h-4.5 text-[#00FF00]/70" /> Editar Quiniela
                      </button>
                      
                      <button
                        id="hero-btn-list"
                        onClick={() => setActiveTab("list")}
                        className="bg-white/5 hover:bg-white/15 text-white border border-white/10 font-bold py-4.5 px-8 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm uppercase tracking-tighter"
                      >
                        <ClipboardList className="w-4.5 h-4.5 text-white/50" /> Ver Jugadores
                      </button>
                    </div>
                  </div>

                  {/* Rules / Steps */}
                  <div className="bg-white/2 border border-white/10 rounded-2xl p-6 sm:p-8">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wide font-sans">
                      <Info className="w-5 h-5 text-[#00FF00]" /> Guía de Participación
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs sm:text-sm">
                      <div className="space-y-2 bg-white/5 p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <div className="text-sm font-mono font-bold text-[#00FF00]">01 / ID</div>
                        <h4 className="font-bold text-white">Registra tu Perfil</h4>
                        <p className="text-white/50 text-xs leading-relaxed font-light mt-1">
                          Ingresa tus señas esenciales (nombre, correo y WhatsApp) para acreditar tu planilla oficial de juego de manera unívoca.
                        </p>
                      </div>

                      <div className="space-y-2 bg-white/5 p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <div className="text-sm font-mono font-bold text-[#00FF00]">02 / SCORES</div>
                        <h4 className="font-bold text-white">Redacta Marcadores</h4>
                        <p className="text-white/50 text-xs leading-relaxed font-light mt-1">
                          Define la cantidad de goles pronosticados para las 12 secciones (Grupos A al L) con nuestros selectores dinámicos.
                        </p>
                      </div>

                      <div className="space-y-2 bg-white/5 p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <div className="text-sm font-mono font-bold text-[#00FF00]">03 / VALIDATE</div>
                        <h4 className="font-bold text-white">Certifica y Envía</h4>
                        <p className="text-white/50 text-xs leading-relaxed font-light mt-1">
                          Al enviar obtendrás un enlace automatizado de WhatsApp para coordinar tu ingreso con el administrador y validar el token.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Sidebar stats */}
                <div className="lg:col-span-4 space-y-8">
                  {/* Tournament Info */}
                  <div className="bg-white/2 border border-white/10 rounded-2xl p-6 shadow-md">
                    <span className="text-[10px] uppercase tracking-widest text-[#00FF00] block mb-1 font-mono">Ficha de Torneo</span>
                    <h3 className="font-bold text-white italic font-serif text-2xl border-b border-white/10 pb-3 mb-5 flex items-center gap-2">
                      <Flame className="w-5 h-5 text-amber-500" /> Sede Mundialista 2026
                    </h3>
                    
                    <div className="space-y-5 text-xs">
                      <div className="flex items-start gap-3.5">
                        <div className="p-2 bg-white/5 border border-white/10 rounded-lg font-bold text-[#00FF00] text-center min-w-[36px] font-mono">
                          A1
                        </div>
                        <div>
                          <p className="font-bold text-white">Territorio de Norteamérica</p>
                          <p className="text-white/50 mt-1 font-light leading-relaxed">Coordinado simultáneamente en estadios seleccionados de Canadá, Estados Unidos y México.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3.5">
                        <div className="p-2 bg-white/5 border border-white/10 rounded-lg font-bold text-[#00FF00] text-center min-w-[36px] font-mono">
                          A2
                        </div>
                        <div>
                          <p className="font-bold text-white">48 Selecciones Competidoras</p>
                          <p className="text-white/50 mt-1 font-light leading-relaxed">El mayor mundial en cronograma deportivo, estructurado en 12 grupos iniciales.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3.5">
                        <div className="p-2 bg-white/5 border border-white/10 rounded-lg font-bold text-[#00FF00] text-center min-w-[36px] font-mono">
                          A3
                        </div>
                        <div>
                          <p className="font-bold text-white">{MATCHES.length} Cotejos Oficiales</p>
                          <p className="text-white/50 mt-1 font-light leading-relaxed">Secuencia de partidos oficiales (72 de grupos y 16 de 16avos) ordenada con precisión.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recuperar / Continuar Quiniela Widget */}
                  <div className="bg-white/2 border border-white/10 rounded-2xl p-6 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#00FF00]/5 rounded-full blur-xl pointer-events-none" />
                    
                    <span className="text-[10px] uppercase tracking-widest text-[#00FF00] block mb-1 font-mono">Control de Avance</span>
                    <h3 className="font-bold text-white italic font-serif text-2xl border-b border-white/10 pb-3 mb-5 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#00FF00]" /> Recuperar Quiniela
                    </h3>
                    
                    <p className="text-xs text-white/50 leading-relaxed mb-4">
                      ¿Ya te registraste y quieres completar tus pronósticos o descargar tu recibo? Ingresa tu correo para continuar de inmediato.
                    </p>

                    <div className="space-y-3">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/30">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          id="txt-search-resume-email"
                          type="email"
                          placeholder="tu-correo@ejemplo.com"
                          value={searchEmailInput}
                          onChange={(e) => {
                            setSearchEmailInput(e.target.value);
                            setSearchEmailFeedback(null);
                            setSearchPinInput("");
                            setSearchPinError("");
                            setIsSearchUnlocked(false);
                          }}
                          className="block w-full pl-9 pr-3 py-2.5 bg-[#121212] border border-white/10 focus:border-[#00FF00] focus:ring-2 focus:ring-[#00FF00]/10 rounded-lg text-xs font-medium text-white transition-all placeholder-white/20 focus:outline-none"
                        />
                      </div>

                      {searchEmailFeedback && (
                        <div className={`p-4 rounded-xl border text-[11px] leading-relaxed animate-fade-in ${
                          searchEmailFeedback.success 
                            ? "bg-[#00FF00]/10 border-[#00FF00]/20 text-[#00FF00]" 
                            : "bg-amber-500/10 border-amber-500/20 text-yellow-400"
                        }`}>
                          {searchEmailFeedback.success ? (
                            <div className="text-left font-sans space-y-3">
                              <p className="font-bold text-white mb-1 uppercase tracking-tight text-xs">¡Quiniela Encontrada!</p>
                              <p className="text-white/70">
                                Hola <strong>{searchEmailFeedback.name}</strong>, tienes <strong>{searchEmailFeedback.count}/{MATCHES.length}</strong> partidos pronosticados.
                              </p>
                              
                              {searchEmailFeedback.submission.participant.pin && !isSearchUnlocked ? (
                                <div className="space-y-2 pt-2 border-t border-white/10">
                                  <label className="block text-[10px] uppercase font-semibold tracking-wider text-[#00FF00] font-mono">
                                    Introduce tu PIN de 4 dígitos para acceder:
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="password"
                                      maxLength={4}
                                      inputMode="numeric"
                                      pattern="\d*"
                                      placeholder="••••"
                                      value={searchPinInput}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                                        setSearchPinInput(val);
                                        setSearchPinError("");
                                        if (val.length === 4) {
                                          if (val === searchEmailFeedback.submission.participant.pin) {
                                            setIsSearchUnlocked(true);
                                            setCurrentSubmission(searchEmailFeedback.submission);
                                          } else {
                                            setSearchPinError("PIN de seguridad incorrecto.");
                                          }
                                        }
                                      }}
                                      className="block w-full text-center py-2 bg-black/40 border border-white/25 focus:border-[#00FF00] rounded-lg text-sm font-mono font-black tracking-[0.5em] text-white focus:outline-none placeholder-white/20"
                                    />
                                  </div>
                                  {searchPinError && (
                                    <p className="text-red-400 text-[10px] font-mono font-bold">⚠️ {searchPinError}</p>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (searchPinInput === searchEmailFeedback.submission.participant.pin) {
                                        setIsSearchUnlocked(true);
                                        setCurrentSubmission(searchEmailFeedback.submission);
                                      } else {
                                        setSearchPinError("PIN de seguridad incorrecto.");
                                      }
                                    }}
                                    className="w-full mt-1.5 py-2 bg-[#00FF00] hover:bg-white text-black font-black uppercase rounded text-[10px] tracking-tight cursor-pointer transition-colors text-center font-mono"
                                  >
                                    Verificar y Desbloquear
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-2 mt-3.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setResumeEmail(searchEmailInput.trim().toLowerCase());
                                      navigateToTab("register");
                                    }}
                                    className="flex-1 py-2 px-2.5 bg-[#00FF00] hover:bg-white text-black font-black uppercase rounded text-[10px] tracking-tight cursor-pointer transition-colors text-center"
                                  >
                                    Reanudar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleSelectParticipantReceipt(searchEmailFeedback.submission);
                                    }}
                                    className="py-2 px-2.5 bg-white/5 hover:bg-white/15 text-white border border-white/10 rounded text-[10px] uppercase font-bold cursor-pointer transition-colors"
                                  >
                                    Ver Recibo
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-left font-sans">
                              <p className="font-bold text-white mb-1 uppercase tracking-tight text-xs">Sin registros</p>
                              <p className="text-white/70">
                                El correo ingresado no se encuentra registrado aún como participante. ¡Inicia tu marcador ahora!
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  navigateToTab("register");
                                }}
                                className="mt-2.5 w-full py-2 bg-white/5 hover:bg-white text-white hover:text-black font-bold uppercase rounded text-[10px] border border-white/10 transition-colors cursor-pointer text-center"
                              >
                                Comenzar Nueva
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {!searchEmailFeedback && (
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = searchEmailInput.trim().toLowerCase();
                            if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
                              setSearchEmailFeedback({
                                success: false
                              });
                              return;
                            }
                            const found = submissions.find(
                              (s) => s.participant.email.toLowerCase().trim() === trimmed
                            );
                            setSearchPinInput("");
                            setSearchPinError("");
                            setIsSearchUnlocked(false);
                            if (found) {
                              setSearchEmailFeedback({
                                success: true,
                                name: found.participant.name,
                                count: found.totalMatchesPredicted,
                                submission: found
                              });
                            } else {
                              setSearchEmailFeedback({
                                success: false
                              });
                            }
                          }}
                          className="w-full py-2.5 bg-[#00FF00] hover:bg-white text-black font-black rounded-lg transition-colors text-xs uppercase tracking-tighter cursor-pointer text-center"
                        >
                          Buscar Quiniela
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Recent Activity widget */}
                  <div className="bg-white/2 border border-white/10 rounded-2xl p-6 shadow-md">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                      <h3 className="font-bold uppercase tracking-wider text-xs text-white">Recientes</h3>
                      <button 
                        id="widget-btn-all"
                        onClick={() => setActiveTab("list")} 
                        className="text-[10px] text-[#00FF00] hover:text-white font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        Ver todos ({submissions.length})
                      </button>
                    </div>

                    {submissions.length === 0 ? (
                      <div className="text-center py-8 text-white/30 font-mono text-xs">
                        <Clock className="w-6 h-6 text-white/10 mx-auto mb-2" />
                        <p className="font-bold">LISTA DE ESPERA VACÍA</p>
                        <p className="text-[10px] mt-1 text-white/20">Registra tus marcadores y lidera el tablero.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 font-sans">
                        {submissions.slice(0, 3).map((sub, idx) => {
                          const isOwnSubmission = currentSubmission && currentSubmission.participant.email.toLowerCase().trim() === sub.participant.email.toLowerCase().trim();
                          
                          return (
                            <div 
                              key={sub.id || idx}
                              className={`bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs transition-colors ${
                                isOwnSubmission ? "cursor-pointer hover:bg-white/15 border-[#00FF00]/30 animate-pulse-subtle" : ""
                              }`}
                              onClick={() => {
                                if (isOwnSubmission) {
                                  handleSelectParticipantReceipt(sub);
                                }
                              }}
                            >
                              <div className="truncate pr-1.5 flex flex-col gap-1">
                                <p className="font-bold text-white truncate flex items-center gap-1.5">
                                  {sub.participant.name}
                                  {isOwnSubmission && (
                                    <span className="text-[9px] bg-[#00FF00]/10 border border-[#00FF00]/20 text-[#00FF00] px-1.5 py-0.5 rounded font-mono font-black uppercase tracking-tight leading-none">Tú</span>
                                  )}
                                </p>
                                <p className="text-[10px] text-white/40 uppercase font-mono flex items-center gap-1 leading-none">
                                  {new Date(sub.submittedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[9px] font-mono shrink-0 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">
                                  {Math.round((sub.totalMatchesPredicted / MATCHES.length) * 100)}%
                                </span>
                                <span className="px-2 py-0.5 bg-[#00FF00]/10 border border-[#00FF00]/20 text-[#00FF00] text-[10px] font-mono font-bold rounded flex items-center gap-1 select-none">
                                  {!isOwnSubmission && <Lock className="w-2.5 h-2.5 text-[#00FF00]/60 shrink-0" />} {sub.totalMatchesPredicted}/{MATCHES.length}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "register" && (
              /* TAB 2: REGISTRATION & PREDICTIONS FORM */
              <div className="animate-fade-in">
                <FormularioRegistro 
                  matches={dynamicMatches}
                  onSuccess={handleSubmissionSuccess} 
                  isSubmitting={isSubmitting} 
                  submissions={submissions}
                  initialEmail={resumeEmail}
                  onClearInitialEmail={() => setResumeEmail("")}
                  isEditingLocked={isEditingLocked}
                  isRegistrationLocked={isRegistrationLocked}
                  isGroupPhaseLocked={isGroupPhaseLocked}
                  isSecondPhaseLocked={isSecondPhaseLocked}
                  isThirdPhaseLocked={isThirdPhaseLocked}
                  isFourthPhaseLocked={isFourthPhaseLocked}
                  isFifthPhaseLocked={isFifthPhaseLocked}
                  isSixthPhaseLocked={isSixthPhaseLocked}
                  isSeventhPhaseLocked={isSeventhPhaseLocked}
                />
              </div>
            )}

            {activeTab === "success" && currentSubmission && (
              /* TAB 3: RECEIPT / SHARING SCREEN */
              <div className="animate-fade-in">
                <ResumenRecibo 
                  matches={dynamicMatches}
                  submission={currentSubmission} 
                  onClose={() => {
                    setCurrentSubmission(null);
                    setActiveTab("home");
                  }} 
                />
              </div>
            )}

            {activeTab === "list" && (
              /* TAB 4: TOTAL LIST PARTICIPANTS SCREEN */
              <div className="animate-fade-in">
                <ListaParticipantes 
                  matches={dynamicMatches}
                  teamOverrides={teamOverrides}
                  onUpdateTeamOverrides={handleUpdateTeamOverrides}
                  submissions={submissions} 
                  currentSubmission={currentSubmission}
                  onSelectSubmission={handleSelectParticipantReceipt}
                  isFirebaseConnected={isFirebaseConfigured}
                  onDeleteSubmission={handleDeleteSubmission}
                  onGenerateMockData={handleGenerateMockData}
                  onUpdateSubmissionPin={handleUpdateSubmissionPin}
                  onUpdateSubmissionEmail={handleUpdateSubmissionEmail}
                  isEditingLocked={isEditingLocked}
                  onToggleEditingLock={handleToggleEditingLock}
                  isRegistrationLocked={isRegistrationLocked}
                  onToggleRegistrationLock={handleToggleRegistrationLock}
                  isGroupPhaseLocked={isGroupPhaseLocked}
                  onToggleGroupPhaseLock={handleToggleGroupPhaseLock}
                  isSecondPhaseLocked={isSecondPhaseLocked}
                  onToggleSecondPhaseLock={handleToggleSecondPhaseLock}
                  isThirdPhaseLocked={isThirdPhaseLocked}
                  onToggleThirdPhaseLock={handleToggleThirdPhaseLock}
                  isFourthPhaseLocked={isFourthPhaseLocked}
                  onToggleFourthPhaseLock={handleToggleFourthPhaseLock}
                  isFifthPhaseLocked={isFifthPhaseLocked}
                  onToggleFifthPhaseLock={handleToggleFifthPhaseLock}
                  isSixthPhaseLocked={isSixthPhaseLocked}
                  onToggleSixthPhaseLock={handleToggleSixthPhaseLock}
                  isSeventhPhaseLocked={isSeventhPhaseLocked}
                  onToggleSeventhPhaseLock={handleToggleSeventhPhaseLock}
                  onRefreshSubmissions={handleReloadAllSubmissions}
                />
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Footer / Bottom Rail */}
      <footer className="mt-auto border-t border-white/10 bg-[#000000] py-10 text-center">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] uppercase tracking-[0.25em] font-bold text-white/45">
          <div className="text-left sm:text-left select-text">
            © 2026 GESTOR DE QUINIELAS DIGITAL • BY @ugusto 
            <span className="text-xs text-[#EF4444] font-mono normal-case tracking-normal ml-1 sm:ml-2 font-bold">(Augusto)</span>
            <span className="text-white/25 font-mono normal-case tracking-normal ml-2 sm:ml-3">
              | codiseñado por el agente inteligente de google studio build
            </span>
          </div>
          <div className="flex flex-wrap gap-4 items-center justify-center font-mono text-[#00FF00]/70">
            <button
              type="button"
              onClick={() => setShowVersionModal(true)}
              className="hover:text-[#00FF00] hover:underline underline-offset-4 cursor-pointer select-none text-[10px] uppercase font-bold tracking-[0.20em]"
            >
              Versión v{APP_VERSION}
            </button>
            <span>|</span>
            <span>SEDE: MX · CA · US</span>
            <span>|</span>
            <span>CONECTADO AL ADMIN PLANILLAS FWC-26</span>
          </div>
        </div>
      </footer>

      {/* Version and Cache Control Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#121212] border border-white/15 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#1A1A1A] border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-[#00FF00] rounded-full animate-pulse" />
                <h3 className="text-sm font-mono uppercase tracking-[0.15em] text-white">Historial de Actualizaciones</h3>
              </div>
              <button 
                onClick={() => setShowVersionModal(false)}
                className="text-white/40 hover:text-white text-xs px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 transition-all font-mono cursor-pointer"
              >
                CERRAR
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6 text-sm">
              <div className="flex items-start justify-between border-b border-white/5 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#00FF00] tracking-wider select-none font-bold">Versión Instalada</span>
                  <h4 className="text-2xl font-black italic text-white select-all">v{APP_VERSION}</h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-white/40 tracking-wider">Último Cambio</span>
                  <p className="text-xs text-white/80 font-mono font-medium">{VERSION_DATE}</p>
                </div>
              </div>
              
              {/* Force refresh helper info */}
              <div className="bg-[#0A0A0A] border border-white/5 p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white/80 font-mono tracking-wide">¿Los cambios no aparecen?</span>
                  <span className="text-[9px] font-mono text-[#EF4444]">CERO CONFLICTOS</span>
                </div>
                <p className="text-xs text-[#CCCCCC] leading-relaxed font-sans">
                  Si tu navegador guardó una copia antigua en caché y no visualizas tus cambios, puedes limpiar el almacenamiento interno de la app pulsando este botón. Tus datos de predicción locales NO se perderán.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("¿Estás seguro de que deseas refrescar y limpiar el caché local? Se reinstalarán los recursos de inmediato para asegurar conexión limpia.")) {
                      forceBustCacheAndReload();
                    }
                  }}
                  className="w-full bg-[#00FF00] hover:bg-[#00FF00]/80 active:scale-[0.99] text-black font-extrabold py-2 px-3 rounded uppercase tracking-wider font-sans select-none cursor-pointer transition-all border border-transparent shadow-lg text-xs"
                >
                  ⚡ Vaciar Caché y Forzar Recarga
                </button>
              </div>

              {/* Version List */}
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-mono text-white/40 tracking-widest block font-bold">Cronología de Versiones</span>
                <div className="space-y-4 border-l border-white/5 pl-3">
                  {APP_CHANGELOG.map((item) => (
                    <div key={item.version} className="relative group">
                      <div className="absolute -left-[16.5px] top-1.5 w-2 h-2 rounded-full border border-[#121212] bg-[#00FF00]/40 group-hover:bg-[#00FF00] transition-colors" />
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-between select-none">
                          <span className="font-mono text-xs font-bold text-white/95">
                            v{item.version}
                          </span>
                          <span className="text-[9px] font-mono text-white/40">{item.date}</span>
                        </div>
                        <p className="text-[11px] text-[#00FF00] font-semibold">{item.title}</p>
                        <p className="text-[11px] text-white/60 leading-relaxed font-sans">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-3 bg-[#1A1A1A] border-t border-white/10 text-center select-none">
              <span className="text-[9px] font-mono text-white/35 uppercase tracking-[0.2em]">DESARROLLADO EN CHILE PARA EL MUNDO • 2026</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
