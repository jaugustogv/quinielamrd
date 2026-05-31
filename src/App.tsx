/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
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
import { getAllSubmissions, saveSubmission, deleteSubmission, syncLocalSubmissions } from "./storage";
import { QuinielaSubmission } from "./types";
import { isFirebaseConfigured } from "./firebase";
import { MATCHES } from "./games";

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

  // Fetch registered submissions from storage
  useEffect(() => {
    async function fetchSubmissions() {
      try {
        // Try to push local registrations to Firebase Firestore if online/active
        await syncLocalSubmissions();
        const data = await getAllSubmissions();
        setSubmissions(data);
      } catch (err) {
        console.error("Error fetching submissions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubmissions();
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
    } catch (err) {
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
        totalMatchesPredicted: 72
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
      <Header totalParticipants={submissions.length} />

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
                      Participa en la quiniela más completa. Registra tus pronósticos para los <span className="text-white font-bold pb-0.5 border-b border-[#00FF00]/40">72 partidos oficiales</span> de la Fase de Grupos y demuestra que eres el mayor conocedor de fútbol.
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
                          <p className="font-bold text-white">72 Cotejos de Inauguración</p>
                          <p className="text-white/50 mt-1 font-light leading-relaxed">Secuencia de partidos oficiales ordenada con precisión suiza igual a las planillas estándar.</p>
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
                                Hola <strong>{searchEmailFeedback.name}</strong>, tienes <strong>{searchEmailFeedback.count}/72</strong> partidos pronosticados.
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
                                  {Math.round((sub.totalMatchesPredicted / 72) * 100)}%
                                </span>
                                <span className="px-2 py-0.5 bg-[#00FF00]/10 border border-[#00FF00]/20 text-[#00FF00] text-[10px] font-mono font-bold rounded flex items-center gap-1 select-none">
                                  {!isOwnSubmission && <Lock className="w-2.5 h-2.5 text-[#00FF00]/60 shrink-0" />} {sub.totalMatchesPredicted}/72
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
                  onSuccess={handleSubmissionSuccess} 
                  isSubmitting={isSubmitting} 
                  submissions={submissions}
                  initialEmail={resumeEmail}
                  onClearInitialEmail={() => setResumeEmail("")}
                />
              </div>
            )}

            {activeTab === "success" && currentSubmission && (
              /* TAB 3: RECEIPT / SHARING SCREEN */
              <div className="animate-fade-in">
                <ResumenRecibo 
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
                  submissions={submissions} 
                  currentSubmission={currentSubmission}
                  onSelectSubmission={handleSelectParticipantReceipt}
                  isFirebaseConnected={isFirebaseConfigured}
                  onDeleteSubmission={handleDeleteSubmission}
                  onGenerateMockData={handleGenerateMockData}
                  onUpdateSubmissionPin={handleUpdateSubmissionPin}
                />
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Footer / Bottom Rail */}
      <footer className="mt-auto border-t border-white/10 bg-[#000000] py-10 text-center">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] uppercase tracking-[0.25em] font-bold text-white/45">
          <div>
            © 2026 GESTOR DE QUINIELAS DIGITAL • BY @ugusto 
            <span className="text-xs text-[#EF4444] font-mono normal-case tracking-normal ml-1 sm:ml-2 font-bold">(Augusto)</span>
            <span className="text-white/25 font-mono normal-case tracking-normal ml-2 sm:ml-3">
              | codiseñado por el agente inteligente de google studio build
            </span>
          </div>
          <div className="flex gap-6 font-mono text-[#00FF00]/70">
            <span>SEDE: MX · CA · US</span>
            <span>|</span>
            <span>CONECTADO AL ADMIN PLANILLAS FWC-26</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
