/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  RefreshCw,
  Gamepad2,
  Lock
} from "lucide-react";
import { MATCHES } from "../games";
import { getTeamFlag, getTeamFlagUrl } from "../utils";
import { Participant, QuinielaSubmission } from "../types";

interface FormularioRegistroProps {
  onSuccess: (submission: QuinielaSubmission) => void;
  isSubmitting: boolean;
  submissions?: QuinielaSubmission[];
  initialEmail?: string;
  onClearInitialEmail?: () => void;
}

export default function FormularioRegistro({ 
  onSuccess, 
  isSubmitting, 
  submissions = [],
  initialEmail = "",
  onClearInitialEmail
}: FormularioRegistroProps) {
  // Step 1: Info, Step 2: Predictions
  const [step, setStep] = useState<1 | 2>(1);
  
  // Custom dialog states to bypass iframe native prompt/alert blocks completely
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showIncompleteConfirm, setShowIncompleteConfirm] = useState(false);
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  
  // Participant Info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; pin?: string }>({});

  // Editing state to track if we loaded an existing submission
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | undefined>(undefined);
  const [editingSubmittedAt, setEditingSubmittedAt] = useState<string | undefined>(undefined);

  // Match email to find an existing submission
  const foundExistingSubmission = useMemo(() => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return null;
    }
    return submissions.find(
      (s) => s.participant.email.toLowerCase().trim() === email.toLowerCase().trim()
    ) || null;
  }, [email, submissions]);

  // Active Group filtering (Groups A to L)
  const groupsList = useMemo(() => ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"], []);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const activeGroup = `Grupo ${groupsList[activeGroupIndex]}`;

  // Predictions State: key is match.id (1 to 72)
  const [predictions, setPredictions] = useState<{
    [matchId: number]: { homeScore: number | ""; awayScore: number | "" };
  }>(() => {
    const initial: { [key: number]: { homeScore: ""; awayScore: "" } } = {};
    MATCHES.forEach((m) => {
      initial[m.id] = { homeScore: "", awayScore: "" };
    });
    return initial;
  });

  // Watch for initialEmail prop (e.g. from homepage recovery) and auto-load if set
  useEffect(() => {
    if (initialEmail && initialEmail.trim()) {
      const emailLower = initialEmail.trim().toLowerCase();
      setEmail(emailLower);
      
      const found = submissions.find(
        (s) => s.participant.email.toLowerCase().trim() === emailLower
      );
      
      // If it has NO pin, we can safely auto-load it instantly as before
      if (found && !found.participant.pin) {
        setName(found.participant.name);
        setPhone(found.participant.phone || "");
        setEditingSubmissionId(found.id);
        setEditingSubmittedAt(found.submittedAt);
        setStep(2); // Jump to predictions directly
        
        const loadedPredictions: any = {};
        MATCHES.forEach((m) => {
          const pred = found.predictions[m.id];
          loadedPredictions[m.id] = {
            homeScore: pred && typeof pred.homeScore === "number" ? pred.homeScore : "",
            awayScore: pred && typeof pred.awayScore === "number" ? pred.awayScore : "",
          };
        });
        setPredictions(loadedPredictions);
      } else if (found && found.participant.pin) {
        // If it DOES have a pin, keep them on step 1 and show a notice to type the PIN
        setStep(1);
        setErrors((prev) => ({ 
          ...prev, 
          pin: "Esta quiniela de un jugador registrado está protegida. Ingresa tu clave/PIN de 4 dígitos para editarla." 
        }));
      }
      
      if (onClearInitialEmail) {
        onClearInitialEmail();
      }
    }
  }, [initialEmail, submissions, onClearInitialEmail]);

  // Calculate stats
  const totalPredicted = useMemo(() => {
    return Object.values(predictions).filter(
      (p: any) => p.homeScore !== "" && p.awayScore !== ""
    ).length;
  }, [predictions]);

  const progressPercentage = Math.round((totalPredicted / 72) * 100);

  // Grouped matches helper
  const filteredMatches = useMemo(() => {
    return MATCHES.filter((m) => m.group === activeGroup);
  }, [activeGroup]);

  // Validation for Step 1
  const validateStep1 = () => {
    const errs: { name?: string; email?: string; pin?: string } = {};
    if (!name.trim()) errs.name = "El nombre completo es obligatorio.";
    
    // Email check
    if (!email.trim()) {
      errs.email = "El correo electrónico es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Por favor introduce un correo electrónico válido.";
    }

    // PIN check (4-digit numerical passcode)
    if (!pin.trim()) {
      errs.pin = "La clave de 4 dígitos es obligatoria para proteger tu quiniela.";
    } else if (!/^\d{4}$/.test(pin.trim())) {
      errs.pin = "La clave debe tener exactamente 4 dígitos numéricos (ej. 1234).";
    } else if (foundExistingSubmission && foundExistingSubmission.participant.pin && foundExistingSubmission.participant.pin !== pin.trim()) {
      errs.pin = "La clave de seguridad ingresada es incorrecta para este participante.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      if (foundExistingSubmission) {
        // Auto-load current submission predictions and info upon verification of the correct PIN
        setName(foundExistingSubmission.participant.name);
        setPhone(foundExistingSubmission.participant.phone || "");
        setEditingSubmissionId(foundExistingSubmission.id);
        setEditingSubmittedAt(foundExistingSubmission.submittedAt);
        
        const loadedPredictions: any = {};
        MATCHES.forEach((m) => {
          const pred = foundExistingSubmission.predictions[m.id];
          loadedPredictions[m.id] = {
            homeScore: pred && typeof pred.homeScore === "number" ? pred.homeScore : "",
            awayScore: pred && typeof pred.awayScore === "number" ? pred.awayScore : "",
          };
        });
        setPredictions(loadedPredictions);
      }
      setStep(2);
    }
  };

  // Increment/Decrement score helpers
  const updateScore = (matchId: number, team: "home" | "away", action: "inc" | "dec" | number) => {
    setPredictions((prev) => {
      const current = prev[matchId];
      let val = team === "home" ? current.homeScore : current.awayScore;
      
      if (action === "inc") {
        val = val === "" ? 0 : Number(val) + 1;
      } else if (action === "dec") {
        if (val === "" || Number(val) <= 0) {
          val = 0;
        } else {
          val = Number(val) - 1;
        }
      } else {
        val = action >= 0 ? action : "";
      }

      // If one side is updated but the other is empty, default the other side to 0 to prevent partial state
      let updatedHome = team === "home" ? val : current.homeScore;
      let updatedAway = team === "away" ? val : current.awayScore;

      if (updatedHome !== "" && updatedAway === "") {
        updatedAway = 0;
      } else if (updatedAway !== "" && updatedHome === "") {
        updatedHome = 0;
      }

      return {
        ...prev,
        [matchId]: { homeScore: updatedHome, awayScore: updatedAway },
      };
    });
  };

  const handleClearPredictions = () => {
    setShowClearConfirm(true);
  };

  const handleAutoFillRandom = () => {
    const randomScores = [
      { h: 1, a: 0 }, { h: 2, a: 1 }, { h: 1, a: 1 }, { h: 0, a: 0 },
      { h: 0, a: 1 }, { h: 0, a: 2 }, { h: 2, a: 0 }, { h: 3, a: 1 },
      { h: 1, a: 2 }, { h: 2, a: 2 }, { h: 3, a: 0 }, { h: 1, a: 3 }
    ];
    const filled: any = { ...predictions };
    MATCHES.forEach((m) => {
      if (filled[m.id].homeScore === "" || filled[m.id].awayScore === "") {
        const pick = randomScores[Math.floor(Math.random() * randomScores.length)];
        filled[m.id] = { homeScore: pick.h, awayScore: pick.a };
      }
    });
    setPredictions(filled);
  };

  const executeSubmit = () => {
    // Format predictions safely, preserving empty predictions so we don't overwrite them with 0s
    const formattedPredictions: { [matchId: number]: { homeScore: number | ""; awayScore: number | "" } } = {};
    MATCHES.forEach((m) => {
      const pred = predictions[m.id];
      formattedPredictions[m.id] = {
        homeScore: pred.homeScore === "" ? "" : Number(pred.homeScore),
        awayScore: pred.awayScore === "" ? "" : Number(pred.awayScore),
      };
    });

    const participant: Participant = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      pin: pin.trim() || (foundExistingSubmission?.participant.pin) || undefined,
      registeredAt: new Date().toISOString(),
    };

    const submission: QuinielaSubmission = {
      id: editingSubmissionId,
      participant,
      predictions: formattedPredictions,
      submittedAt: editingSubmittedAt || new Date().toISOString(),
      totalMatchesPredicted: totalPredicted,
    };

    onSuccess(submission);
  };

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) {
      setShowValidationAlert(true);
      return;
    }

    if (totalPredicted < 72) {
      setShowIncompleteConfirm(true);
    } else {
      executeSubmit();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-4 mb-10">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center gap-3 px-5 py-3 rounded-lg font-bold transition-all border duration-200 cursor-pointer ${
            step === 1
              ? "bg-[#00FF00] text-black border-transparent shadow-lg shadow-[#00FF00]/10"
              : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
          }`}
        >
          <span className={`flex items-center justify-center w-5.5 h-5.5 rounded-full text-xs font-mono font-bold border ${
            step === 1 ? "bg-black/10 border-black/10 text-black" : "bg-white/5 border-white/10 text-white/50"
          }`}>01</span>
          <span className="tracking-tight uppercase text-xs">Datos de Registro</span>
        </button>
        <div className="w-8 h-[1px] bg-white/10" />
        <button
          onClick={handleNextStep}
          className={`flex items-center gap-3 px-5 py-3 rounded-lg font-bold transition-all border duration-200 cursor-pointer ${
            step === 2
              ? "bg-[#00FF00] text-black border-transparent shadow-lg shadow-[#00FF00]/10"
              : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
          }`}
        >
          <span className={`flex items-center justify-center w-5.5 h-5.5 rounded-full text-xs font-mono font-bold border ${
            step === 2 ? "bg-black/10 border-black/10 text-black" : "bg-white/5 border-white/10 text-white/50"
          }`}>02</span>
          <span className="tracking-tight uppercase text-xs">Pronosticar Partidos</span>
        </button>
      </div>

      {step === 1 ? (
        /* PASS 1: Participant Identity Info */
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 sm:p-12 transition-all duration-300 max-w-xl mx-auto backdrop-blur-md relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FF00]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 border border-[#00FF00] text-[#00FF00] text-[9px] uppercase tracking-[0.2em] font-bold rounded-full mb-4">
              Identificación Oficial
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold italic tracking-tight font-serif text-white">
              Crea tu Perfil
            </h2>
            <p className="text-xs text-white/50 mt-2 max-w-md mx-auto leading-relaxed">
              Ingresa tus datos personales para certificar tus pronósticos y poder calcular tus estadísticas.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label id="lbl-name" htmlFor="txt-name" className="block text-[10px] uppercase font-semibold tracking-widest text-[#00FF00] mb-2 font-mono">
                Nombre Completo <span className="text-[#00FF00]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="txt-name"
                  type="text"
                  placeholder="Augusto González"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (e.target.value.trim()) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={`block w-full pl-11 pr-4 py-3.5 bg-white/5 border ${
                    errors.name ? "border-red-500 focus:ring-red-500/20" : "border-white/10 focus:border-[#00FF00] focus:ring-[#00FF00]/10"
                  } rounded-lg focus:outline-none focus:ring-4 font-medium text-white transition-all placeholder-white/20`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-400 font-bold mt-1.5 flex items-center gap-1 font-mono">⚠️ {errors.name}</p>}
            </div>

            <div>
              <label id="lbl-email" htmlFor="txt-email" className="block text-[10px] uppercase font-semibold tracking-widest text-[#00FF00] mb-2 font-mono">
                Correo Electrónico <span className="text-[#00FF00]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="txt-email"
                  type="email"
                  placeholder="nombre@correo.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (e.target.value.trim()) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`block w-full pl-11 pr-4 py-3.5 bg-white/5 border ${
                    errors.email ? "border-red-500 focus:ring-red-500/20" : "border-white/10 focus:border-[#00FF00] focus:ring-[#00FF00]/10"
                  } rounded-lg focus:outline-none focus:ring-4 font-medium text-white transition-all placeholder-white/20`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-400 font-bold mt-1.5 flex items-center gap-1 font-mono">⚠️ {errors.email}</p>}

              {foundExistingSubmission && (
                <div className="bg-[#00FF00]/15 border border-[#00FF00]/30 rounded-xl p-4.5 mt-4 text-left animate-fade-in shadow-md">
                  <p className="text-xs text-white leading-relaxed font-bold flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 bg-[#00FF00] rounded-full animate-ping-slow shrink-0" />
                    ¡Planilla existente registrada!
                  </p>
                  <p className="text-[11px] text-white/75 mt-1.5 leading-normal">
                    Tienes una participación con <span className="text-[#00FF00] font-mono font-black">{foundExistingSubmission.totalMatchesPredicted}/72</span> partidos ya pronosticados. ¡Ingresa tu clave de 4 dígitos abajo para verificar tu identidad y reanudar o editar tu quiniela!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (!pin.trim() || !/^\d{4}$/.test(pin.trim())) {
                        setErrors((prev) => ({ 
                          ...prev, 
                          pin: "Introduce tu PIN de 4 dígitos para poder cargar y editar esta planilla." 
                        }));
                        return;
                      }
                      if (foundExistingSubmission.participant.pin && foundExistingSubmission.participant.pin !== pin.trim()) {
                        setErrors((prev) => ({ 
                          ...prev, 
                          pin: "La clave PIN de seguridad ingresada es incorrecta." 
                        }));
                        return;
                      }

                      setName(foundExistingSubmission.participant.name);
                      setPhone(foundExistingSubmission.participant.phone || "");
                      setEditingSubmissionId(foundExistingSubmission.id);
                      setEditingSubmittedAt(foundExistingSubmission.submittedAt);
                      
                      // Map predictions safely
                      const loadedPredictions: any = {};
                      MATCHES.forEach((m) => {
                        const pred = foundExistingSubmission.predictions[m.id];
                        loadedPredictions[m.id] = {
                          homeScore: pred ? (pred.homeScore === null || pred.homeScore === "" ? "" : Number(pred.homeScore)) : "",
                          awayScore: pred ? (pred.awayScore === null || pred.awayScore === "" ? "" : Number(pred.awayScore)) : "",
                        };
                      });
                      setPredictions(loadedPredictions);
                      setStep(2);
                    }}
                    className="mt-3 w-full bg-[#00FF00] hover:bg-white text-black font-black text-xs py-2.5 px-3 rounded-lg transition-all active:scale-[0.98] cursor-pointer text-center font-mono flex items-center justify-center gap-2 uppercase tracking-tight"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reanudar y Editar Planilla
                  </button>
                </div>
              )}
            </div>

            <div>
              <label id="lbl-phone" htmlFor="txt-phone" className="block text-[10px] uppercase font-semibold tracking-widest text-[#00FF00] mb-2 font-mono">
                WhatsApp / Celular <span className="text-white/30 font-normal font-sans">(Opcional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  id="txt-phone"
                  type="tel"
                  placeholder="Ej: +58 412 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 focus:border-[#00FF00] focus:ring-[#00FF00]/10 rounded-lg focus:outline-none focus:ring-4 font-medium text-white transition-all placeholder-white/20"
                />
              </div>
              <p className="text-[10px] text-white/40 mt-2 leading-relaxed">
                Utilizado para generar el enlace directo que envía tus marcadores en un solo bloque a WhatsApp.
              </p>
            </div>

            <div>
              <label id="lbl-pin" htmlFor="txt-pin" className="block text-[10px] uppercase font-semibold tracking-widest text-[#00FF00] mb-2 font-mono">
                Clave PIN de Seguridad <span className="text-[#00FF00]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
                  <Lock className="w-5 h-5 text-white/30" />
                </div>
                <input
                  id="txt-pin"
                  type="password"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setPin(val);
                    if (val.length === 4) {
                      setErrors((prev) => ({ ...prev, pin: undefined }));
                    }
                  }}
                  className={`block w-full pl-11 pr-4 py-3.5 bg-white/5 border ${
                    errors.pin ? "border-red-500 focus:ring-red-500/20" : "border-white/10 focus:border-[#00FF00] focus:ring-[#00FF00]/10"
                  } rounded-lg focus:outline-none focus:ring-4 font-mono font-black tracking-[0.5em] text-center text-sm text-white transition-all placeholder-white/20`}
                />
              </div>
              {errors.pin && <p className="text-xs text-red-400 font-bold mt-1.5 flex items-center gap-1 font-mono">⚠️ {errors.pin}</p>}
              <p className="text-[10px] text-white/40 mt-2 leading-relaxed font-light">
                {foundExistingSubmission 
                  ? foundExistingSubmission.participant.pin 
                    ? "Esta planilla tiene una clave registrada. Introduce tu PIN de 4 dígitos para poder editarla o reanudarla." 
                    : "Este participante no tiene clave PIN registrada. ¡Establece una clave de 4 dígitos para protegerla!"
                  : "Crea una clave numérica de 4 dígitos para poder volver a acceder o modificar tus marcadores en el futuro."}
              </p>
            </div>

            <button
              id="btn-go-to-predictions"
              onClick={handleNextStep}
              className="w-full bg-[#00FF00] hover:bg-white text-black font-black py-4 rounded-lg active:scale-[0.98] transition-colors flex items-center justify-center gap-3 mt-8 uppercase tracking-tighter text-sm cursor-pointer"
            >
              Comenzar a Pronosticar <ArrowRight className="w-4.5 h-4.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      ) : (
        /* PASS 2: Score Predictions Matrix */
        <div className="space-y-8 animate-fade-in">
          {editingSubmissionId && (
            <div className="bg-[#00FF00]/10 border border-[#00FF00]/20 rounded-xl px-5 py-3 text-white flex items-center justify-between gap-4 text-xs font-mono font-bold animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-[#00FF00] rounded-full shrink-0" />
                <span className="text-[#00FF00]">MODO DE EDICIÓN ACTIVO</span>
              </div>
              <span className="text-white/60 text-[11px] font-sans font-normal truncate max-w-[200px] sm:max-w-none">
                Editando planilla de <span className="text-white font-bold">{name}</span>
              </span>
            </div>
          )}
          {/* Progress Banner */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 text-white relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 border border-white/10 text-[#00FF00] rounded-xl">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif italic text-2xl text-white">Progreso del Pronóstico</h3>
                  <p className="text-xs text-white/50 mt-1 font-mono">
                    Has definido <span className="text-[#00FF00] font-black">{totalPredicted}</span> de <span className="font-bold text-white">72</span> partidos obligatorios.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  id="btn-auto-fill"
                  onClick={handleAutoFillRandom}
                  title="Modelar marcadores aleatorios en espacios vacíos"
                  className="flex-1 md:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#00FF00]" /> Autocompletar Vacíos
                </button>
                <button
                  id="btn-clear-preds"
                  onClick={handleClearPredictions}
                  className="flex-1 md:flex-none px-4 py-2 bg-red-950/20 hover:bg-red-900/30 border border-red-500/20 text-red-300 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Limpiar Todo
                </button>
              </div>
            </div>
            
            {/* Editorial Progress Line */}
            <div className="flex items-center gap-4">
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10 p-0 hover:border-white/20 transition-colors">
                <div 
                  className="bg-[#00FF00] h-full transition-all duration-500 shadow-[0_0_8px_rgba(0,255,0,0.5)]"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className="text-xs font-bold font-mono text-[#00FF00] bg-[#00FF00]/10 px-2.5 py-1 rounded border border-[#00FF00]/20 min-w-[50px] text-center">
                {progressPercentage}%
              </span>
            </div>
          </div>

          {/* Group Selector Menu Tab - Grid layout */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-5">
            <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 block mb-4 border-b border-white/10 pb-2">
              Índice de Grupos de la Fase
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-12 gap-2">
              {groupsList.map((g, idx) => {
                const groupMatches = MATCHES.filter((m) => m.group === `Grupo ${g}`);
                const answeredInGroup = groupMatches.filter(
                  (m) => predictions[m.id].homeScore !== "" && predictions[m.id].awayScore !== ""
                ).length;
                const isGroupCompleted = answeredInGroup === 6;

                return (
                  <button
                    key={g}
                    id={`btn-group-tab-${g}`}
                    onClick={() => setActiveGroupIndex(idx)}
                    className={`relative py-3 px-2 rounded-lg font-bold text-center flex flex-col justify-center items-center transition-all border cursor-pointer ${
                      activeGroupIndex === idx
                        ? "bg-[#00FF00] text-black border-transparent shadow-md"
                        : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="text-sm font-bold tracking-tight">G-{g}</span>
                    <span className={`text-[10px] mt-0.5 font-mono ${
                      activeGroupIndex === idx
                        ? "text-black/60 font-bold"
                        : isGroupCompleted
                        ? "text-[#00FF00]"
                        : answeredInGroup > 0
                        ? "text-white/80"
                        : "text-white/30"
                    }`}>
                      {answeredInGroup}/6
                    </span>
                    
                    {isGroupCompleted && (
                      <div className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                        activeGroupIndex === idx ? "bg-black" : "bg-[#00FF00]"
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Group Navigation */}
          <div className="flex items-center justify-between col-span-12 border border-white/10 p-4 rounded-xl bg-gradient-to-br from-white/[0.02] to-transparent">
            <button
              id="btn-prev-group-nav"
              disabled={activeGroupIndex === 0}
              onClick={() => setActiveGroupIndex((prev) => Math.max(0, prev - 1))}
              className={`p-2 rounded-lg transition-all border flex items-center justify-center cursor-pointer ${
                activeGroupIndex === 0 
                  ? "border-white/5 opacity-20 cursor-not-allowed text-white/30" 
                  : "border-white/10 hover:bg-white/5 text-white"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#00FF00] block mb-0.5 font-mono">
                Partido Actual de Ronda
              </span>
              <h2 className="text-2xl font-black tracking-tight italic font-serif text-white uppercase">{activeGroup}</h2>
            </div>
            <button
              id="btn-next-group-nav"
              disabled={activeGroupIndex === groupsList.length - 1}
              onClick={() => setActiveGroupIndex((prev) => Math.min(groupsList.length - 1, prev + 1))}
              className={`p-2 rounded-lg transition-all border flex items-center justify-center cursor-pointer ${
                activeGroupIndex === groupsList.length - 1 
                  ? "border-white/5 opacity-20 cursor-not-allowed text-white/30" 
                  : "border-white/10 hover:bg-white/5 text-white"
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Matches List layout Container */}
          <div className="space-y-4">
            {filteredMatches.map((match) => {
              const pred = predictions[match.id];
              return (
                <div
                  key={match.id}
                  id={`match-row-${match.id}`}
                  className="bg-[#0A0A0A] border border-white/10 rounded-xl p-4 sm:p-5 hover:border-white/20 transition-all focus-within:border-[#00FF00]/40"
                >
                  {/* Top compact indicator bar */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3.5">
                    <span className="text-xs font-mono font-bold text-white/40">
                      PARTIDO #{String(match.id).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] uppercase font-mono font-extrabold text-[#00FF00] bg-[#00FF00]/10 border border-[#00FF00]/20 px-2.5 py-0.5 rounded-full">
                      {match.group}
                    </span>
                  </div>

                  {/* Main match inputs and flag assets columns */}
                  <div className="flex items-center justify-between gap-1.5 sm:gap-6 w-full">
                    
                    {/* Team 1: Home Team Column */}
                    <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 flex-1 min-w-0 text-center">
                      <div className="w-8 h-5.5 sm:w-11 sm:h-7 shrink-0 relative overflow-hidden rounded bg-white/5 border border-white/10 flex items-center justify-center shadow-sm">
                        <img
                          src={getTeamFlagUrl(match.homeTeam)}
                          alt={match.homeTeam}
                          className="w-full h-full object-cover z-10"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.opacity = '0';
                          }}
                        />
                        <span className="absolute text-sm select-none pointer-events-none z-0">
                          {getTeamFlag(match.homeTeam)}
                        </span>
                      </div>
                      <span className="text-white text-xs sm:text-sm font-bold tracking-tight text-center leading-snug break-words max-w-full">
                        {match.homeTeam}
                      </span>
                    </div>

                    {/* Numeric Input block - Directly accessible via tapping with no clattery buttons */}
                    <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 bg-[#121212]/50 p-1 sm:p-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                      <input
                        id={`input-home-score-${match.id}`}
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder="-"
                        value={pred.homeScore}
                        onFocus={(e) => {
                          try {
                            e.target.select();
                          } catch (err) {}
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            updateScore(match.id, "home", -1);
                          } else {
                            const parsed = parseInt(val, 10);
                            if (!isNaN(parsed) && parsed >= 0) {
                              updateScore(match.id, "home", parsed);
                            }
                          }
                        }}
                        className="w-10 h-10 sm:w-14 sm:h-11 text-center font-bold font-mono text-white bg-[#1A1A1A] border border-white/10 focus:border-[#00FF00] focus:ring-2 focus:ring-[#00FF00]/10 rounded focus:outline-none placeholder-white/20 text-base sm:text-lg transition-all"
                      />

                      <span className="text-white/25 text-[10px] sm:text-xs font-mono font-bold select-none uppercase px-0.5">vs</span>

                      <input
                        id={`input-away-score-${match.id}`}
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder="-"
                        value={pred.awayScore}
                        onFocus={(e) => {
                          try {
                            e.target.select();
                          } catch (err) {}
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            updateScore(match.id, "away", -1);
                          } else {
                            const parsed = parseInt(val, 10);
                            if (!isNaN(parsed) && parsed >= 0) {
                              updateScore(match.id, "away", parsed);
                            }
                          }
                        }}
                        className="w-10 h-10 sm:w-14 sm:h-11 text-center font-bold font-mono text-white bg-[#1A1A1A] border border-white/10 focus:border-[#00FF00] focus:ring-2 focus:ring-[#00FF00]/10 rounded focus:outline-none placeholder-white/20 text-base sm:text-lg transition-all"
                      />
                    </div>

                    {/* Team 2: Away Team Column */}
                    <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 flex-1 min-w-0 text-center">
                      <div className="w-8 h-5.5 sm:w-11 sm:h-7 shrink-0 relative overflow-hidden rounded bg-white/5 border border-white/10 flex items-center justify-center shadow-sm">
                        <img
                          src={getTeamFlagUrl(match.awayTeam)}
                          alt={match.awayTeam}
                          className="w-full h-full object-cover z-10"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.opacity = '0';
                          }}
                        />
                        <span className="absolute text-sm select-none pointer-events-none z-0">
                          {getTeamFlag(match.awayTeam)}
                        </span>
                      </div>
                      <span className="text-white text-xs sm:text-sm font-bold tracking-tight text-center leading-snug break-words max-w-full">
                        {match.awayTeam}
                      </span>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Footer Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 bg-white/2 p-4 sm:p-6 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <button
                id="btn-nav-prev-group-foot"
                disabled={activeGroupIndex === 0}
                onClick={() => {
                  setActiveGroupIndex((prev) => Math.max(0, prev - 1));
                  window.scrollTo({ top: 120, behavior: "smooth" });
                }}
                className={`px-4 py-2.5 bg-[#0A0A0A] border rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer text-xs uppercase tracking-tighter ${
                  activeGroupIndex === 0 
                    ? "border-white/5 text-white/30 opacity-40 cursor-not-allowed" 
                    : "border-white/10 text-white hover:bg-white/5"
                }`}
              >
                <ChevronLeft className="w-4 h-4" /> Grupo Anterior
              </button>

              <button
                id="btn-nav-next-group-foot"
                disabled={activeGroupIndex === groupsList.length - 1}
                onClick={() => {
                  setActiveGroupIndex((prev) => Math.min(groupsList.length - 1, prev + 1));
                  window.scrollTo({ top: 120, behavior: "smooth" });
                }}
                className={`px-4 py-2.5 bg-[#0A0A0A] border rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer text-xs uppercase tracking-tighter ${
                  activeGroupIndex === groupsList.length - 1 
                    ? "border-white/5 text-white/30 opacity-40 cursor-not-allowed" 
                    : "border-white/10 text-white hover:bg-white/5"
                }`}
              >
                Siguiente Grupo <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                id="btn-back-step-1"
                onClick={() => setStep(1)}
                className="px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white font-bold transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-tighter h-12 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Datos
              </button>

              <button
                id="btn-submit-quiniela"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className={`flex-1 sm:flex-initial bg-[#00FF00] hover:bg-white text-black font-black py-3.5 px-8 rounded-lg shadow-lg shadow-[#00FF00]/10 cursor-pointer text-xs uppercase tracking-tighter h-12 flex items-center justify-center gap-2 transition-all duration-200 ${
                  isSubmitting ? "opacity-55 cursor-not-allowed" : "active:scale-95"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" /> Sincronizando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4.5 h-4.5 text-black" /> Registrar Mis Marcadores
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM DIALOGS FOR EXCELLENT BULLETPROOF IFRAME COMPATIBILITY --- */}

      {/* 1. Clear predictions confirm */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in animate-duration-150 animate-once">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold font-serif italic text-white">¿Limpiar marcadores?</h3>
            <p className="text-xs text-white/60 leading-relaxed max-w-xs mx-auto">
              ¿Estás seguro de que deseas limpiar todas tus predicciones redactadas hasta el momento? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const reset: any = {};
                  MATCHES.forEach((m) => {
                    reset[m.id] = { homeScore: "", awayScore: "" };
                  });
                  setPredictions(reset);
                  setShowClearConfirm(false);
                }}
                className="flex-1 py-2.5 bg-red-650 hover:bg-red-600 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Sí, Limpiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Incomplete score board confirm */}
      {showIncompleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-full w-fit mx-auto text-amber-500">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-serif italic text-white text-center">¡Pronóstico Incompleto!</h3>
            <p className="text-xs text-white/50 text-center leading-relaxed max-w-xs mx-auto">
              Has pronosticado <span className="text-[#00FF00] font-bold">{totalPredicted}</span> de <span className="text-white font-bold">72</span> partidos obligatorios. ¿Deseas certificar y registrar tu quiniela con los marcadores restantes en blanco (se guardarán como 0-0)?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowIncompleteConfirm(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-all border border-white/10 cursor-pointer text-center"
              >
                Seguir Completando
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowIncompleteConfirm(false);
                  executeSubmit();
                }}
                className="flex-1 py-3 bg-[#00FF00] hover:bg-white text-black rounded-lg text-xs font-bold transition-colors cursor-pointer text-center uppercase tracking-tight"
              >
                Sí, Registrar Así
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Steps warning profile required */}
      {showValidationAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-full w-fit mx-auto text-red-400">
              <User className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold font-serif italic text-white">Perfil Requerido</h3>
            <p className="text-xs text-white/50 leading-relaxed max-w-xs mx-auto">
              Por favor, infórmanos tu Nombre y Correo en el Paso 1 para acreditar y certificar tus marcas deportivas de la quiniela.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowValidationAlert(false);
                  setStep(1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-full py-3 bg-[#00FF00] hover:bg-white text-black rounded-lg text-xs font-bold transition-colors cursor-pointer uppercase tracking-tight"
              >
                Ir a Datos de Registro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
