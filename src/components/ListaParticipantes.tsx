/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Users, 
  Search, 
  Trophy, 
  Calendar, 
  ChevronRight, 
  Eye,
  Mail,
  ShieldCheck,
  Phone,
  Lock,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Share2,
  Link,
  Check
} from "lucide-react";
import { QuinielaSubmission } from "../types";

interface ListaParticipantesProps {
  submissions: QuinielaSubmission[];
  currentSubmission: QuinielaSubmission | null;
  onSelectSubmission: (submission: QuinielaSubmission) => void;
  isFirebaseConnected: boolean;
  onDeleteSubmission?: (id: string | undefined, email: string, submittedAt: string) => Promise<void>;
  onGenerateMockData?: () => Promise<void>;
}

export default function ListaParticipantes({ 
  submissions, 
  currentSubmission,
  onSelectSubmission,
  isFirebaseConnected,
  onDeleteSubmission,
  onGenerateMockData
}: ListaParticipantesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem("isAdmin") === "true");
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");
  const [adminError, setAdminError] = useState("");
  const [subToDelete, setSubToDelete] = useState<{ id: string | undefined; email: string; submittedAt: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingMock, setIsGeneratingMock] = useState(false);

  const handleGenerateTestParticipants = async () => {
    if (!onGenerateMockData) return;
    setIsGeneratingMock(true);
    try {
      await onGenerateMockData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingMock(false);
    }
  };

  const handleCopyDirectLink = () => {
    // Force clean origin and search parameters for absolute compatibility
    // Use the public pre-release URL if possible or fallback to current origin
    let currentOrigin = window.location.origin;
    if (currentOrigin.includes("ais-dev-")) {
      currentOrigin = currentOrigin.replace("ais-dev-", "ais-pre-");
    }
    const cleanUrl = `${currentOrigin}/?tab=list`;
    
    navigator.clipboard.writeText(cleanUrl)
      .then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      })
      .catch((err) => {
        console.error("Failed to copy link: ", err);
      });
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = sub.participant.name.toLowerCase().includes(term);
    const emailMatch = sub.participant.email.toLowerCase().includes(term);
    return nameMatch || emailMatch;
  });

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput === "2026") {
      setIsAdmin(true);
      sessionStorage.setItem("isAdmin", "true");
      setShowAdminModal(false);
      setAdminPinInput("");
      setAdminError("");
    } else {
      setAdminError("PIN de Control Incorrecto. Inténtalo de nuevo.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem("isAdmin");
  };

  const executeDelete = async () => {
    if (!subToDelete || !onDeleteSubmission) return;
    setIsDeleting(true);
    try {
      await onDeleteSubmission(subToDelete.id, subToDelete.email, subToDelete.submittedAt);
      setSubToDelete(null);
    } catch (err) {
      console.error("Failed to delete", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-[#0A0A0A] rounded-2xl border border-white/10 shadow-2xl p-5 sm:p-10 relative">
      {/* List Header stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/10 pb-6">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#00FF00] block mb-1 font-mono">
            Índice de Participantes
          </span>
          <h2 className="text-3xl font-extrabold italic font-serif text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#00FF00]" /> Jugadores Inscritos
          </h2>
          <p className="text-xs text-white/50 mt-1 max-w-sm">
            Revisa las planillas de predicciones cargadas en el sistema por orden de llegada.
          </p>
        </div>
        
        {/* Source connection badge & Admin controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          {/* Connection status */}
          <div>
            {isFirebaseConnected ? (
              <span className="px-3 py-1 text-[9px] font-mono font-bold text-[#00FF00] uppercase bg-[#00FF00]/10 border border-[#00FF00]/20 rounded-full flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00FF00]" /> BASE DE DATOS ONLINE
              </span>
            ) : (
              <span className="px-3 py-1 text-[9px] font-mono font-bold text-white/50 uppercase bg-white/5 border border-white/10 rounded-full flex items-center gap-1.5 shadow-sm">
                🟠 MODO DESCONECTADO (LOCAL)
              </span>
            )}
          </div>

          {/* Admin Unlock Trigger Button */}
          {isAdmin ? (
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 text-[9px] font-mono font-bold text-red-400 bg-red-400/10 border border-red-400/20 rounded-full flex items-center gap-1 shadow-sm uppercase">
                🛠️ Modo Administrador
              </span>
              <button
                id="btn-admin-logout"
                type="button"
                onClick={handleAdminLogout}
                className="text-[10px] font-mono font-black text-white/60 hover:text-[#00FF00] underline uppercase cursor-pointer"
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              id="btn-trigger-admin-login"
              type="button"
              onClick={() => {
                setAdminError("");
                setAdminPinInput("");
                setShowAdminModal(true);
              }}
              className="px-3.5 py-1.5 rounded-md font-mono bg-white/5 hover:bg-white/10 border border-white/15 text-white/95 text-[10px] font-bold tracking-tight transition-all flex items-center gap-1.5 cursor-pointer uppercase select-none"
            >
              <Lock className="w-3 h-3 text-[#00FF00]" /> Panel de Control
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search controls */}
      {/* Direct Link Sharing Section for Participants */}
      <div className="bg-[#00FF00]/5 border border-[#00FF00]/15 rounded-xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold text-[#00FF00] uppercase tracking-wider flex items-center gap-1.5">
            <Share2 className="w-4 h-4" /> Enlace de Acceso Directo de Participantes
          </p>
          <p className="text-[11px] text-white/50 leading-relaxed max-w-xl">
            Comparte este enlace directo con tus participantes o ábrelo en tu teléfono móvil para ingresar directamente a esta pestaña sin necesidad de redirecciones o menús.
          </p>
        </div>
        <button
          id="btn-copy-direct-participants-url"
          type="button"
          onClick={handleCopyDirectLink}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 font-black py-2.5 px-4 rounded-lg shadow-md transition-all text-xs uppercase tracking-tighter cursor-pointer ${
            copiedLink
              ? "bg-[#00FF00] text-black"
              : "bg-white/5 hover:bg-white text-white hover:text-black border border-white/10"
          }`}
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4" /> ¡Enlace Copiado!
            </>
          ) : (
            <>
              <Link className="w-4 h-4" /> Copiar Enlace Directo
            </>
          )}
        </button>
      </div>

      {isAdmin && onGenerateMockData && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
          <div className="space-y-1 text-left">
            <p className="text-xs font-bold text-red-100 uppercase tracking-wider flex items-center gap-1.5">
              🛠️ Panel de Diagnóstico & Pruebas
            </p>
            <p className="text-[11px] text-white/50 leading-relaxed max-w-xl">
              Como administrador, puedes registrar automáticamente <span className="text-[#00FF00] font-bold">5 participantes ficticios</span> con nombres y resultados 100% aleatorios para simular el tablero. ¡Úsalos para probar emails, resúmenes de WhatsApp y formato Excel!
            </p>
          </div>
          <button
            id="btn-admin-generate-mockups"
            type="button"
            disabled={isGeneratingMock}
            onClick={handleGenerateTestParticipants}
            className="w-full sm:w-auto flex items-center justify-center gap-2 font-black py-2.5 px-4 bg-red-650 hover:bg-white text-white hover:text-black border border-red-500/30 rounded-lg shadow-md transition-all text-xs uppercase tracking-tighter disabled:opacity-50 cursor-pointer"
          >
            {isGeneratingMock ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Generando...
              </>
            ) : (
              "Crear 5 Participantes"
            )}
          </button>
        </div>
      )}

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
          <Search className="w-4.5 h-4.5" />
        </div>
        <input
          id="txt-search-participants"
          type="text"
          placeholder="Buscar participante por nombre o correo electrónico..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 focus:border-[#00FF00] focus:ring-[#00FF00]/10 focus:outline-none focus:ring-4 rounded-lg text-sm font-medium text-white transition-all placeholder-white/20"
        />
      </div>

      {/* Participants Container */}
      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-16 bg-white/2 border border-dashed border-white/10 rounded-xl">
          <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm font-bold text-white">Ningún participante encontrado</p>
          <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto">
            {searchTerm ? "Intenta modificar el término de tu búsqueda." : "Sé el primero en certificar tus pronósticos haciendo clic en 'Registrar Pronósticos'."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5 max-h-[550px] overflow-y-auto pr-1">
          {filteredSubmissions.map((sub, idx) => {
            const formattedDate = new Date(sub.submittedAt).toLocaleDateString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <div
                key={sub.id || idx}
                id={`participant-item-${idx}`}
                className="bg-white/2 border border-white/10 hover:border-[#00FF00]/40 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/5 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[#00FF00] text-sm font-mono shadow-inner text-center shrink-0">
                    {sub.participant.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      {sub.participant.name}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 mt-1 text-xs text-white/50">
                      <span className="flex items-center gap-1.5 truncate max-w-[170px] sm:max-w-none">
                        <Mail className="w-3.5 h-3.5 text-white/30" /> {sub.participant.email}
                      </span>
                      {sub.participant.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-white/30" /> {sub.participant.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3.5 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-3.5 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider flex items-center gap-1 sm:justify-end">
                      <Calendar className="w-3.5 h-3.5 text-white/30" /> {formattedDate}
                    </p>
                    <div className="mt-1.5 flex flex-col items-start sm:items-end gap-1">
                      <p className="text-xs font-mono font-bold text-[#00FF00] flex items-center gap-1.5 sm:justify-end">
                        <Trophy className="w-3.5 h-3.5" /> {sub.totalMatchesPredicted} / 72 Partidos
                      </p>
                      {/* Percent Fill & Visual Meter */}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-mono shrink-0 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">
                          {Math.round((sub.totalMatchesPredicted / 72) * 100)}% Completado
                        </span>
                        <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden shrink-0 hidden sm:block">
                          <div 
                            className="bg-[#00FF00] h-full rounded-full" 
                            style={{ width: `${(sub.totalMatchesPredicted / 72) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(() => {
                      const canViewReceipt = isAdmin || (
                        currentSubmission && 
                        currentSubmission.participant.email.toLowerCase().trim() === sub.participant.email.toLowerCase().trim()
                      );

                      return canViewReceipt ? (
                        <button
                          id={`btn-view-participant-${idx}`}
                          onClick={() => onSelectSubmission(sub)}
                          className="px-4 py-2.5 bg-[#00FF00]/10 hover:bg-[#00FF00] text-[#00FF00] hover:text-black hover:border-transparent border border-[#00FF00]/20 rounded-lg font-black transition-all flex items-center gap-1.5 text-xs uppercase tracking-tighter cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver Recibo <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="px-3 py-2 border border-white/5 bg-white/2 rounded-lg text-[10px] font-bold text-white/40 uppercase tracking-tight flex items-center gap-1.5 font-mono select-none" title="Los pronósticos están ocultos para evitar copiado.">
                          <Lock className="w-3.5 h-3.5 text-white/20" /> Privado
                        </span>
                      );
                    })()}

                    {isAdmin && onDeleteSubmission && (
                      <button
                        id={`btn-delete-participant-${idx}`}
                        type="button"
                        onClick={() => setSubToDelete({
                          id: sub.id,
                          email: sub.participant.email,
                          submittedAt: sub.submittedAt,
                          name: sub.participant.name
                        })}
                        className="p-2.5 bg-red-500/10 hover:bg-red-650 text-red-400 hover:text-white border border-red-500/20 hover:border-transparent rounded-lg transition-all cursor-pointer flex items-center justify-center shrink-0"
                        title="Eliminar Quiniela"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL DIALOGS FOR EXCELLENT BUILD COMPATIBILITY --- */}

      {/* 1. Admin PIN Gate authentication modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="p-3 bg-[#00FF00]/10 border border-[#00FF00]/20 rounded-full w-fit mx-auto text-[#00FF00]">
              <Lock className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold font-serif italic text-white text-center">Ingreso de Operador</h3>
              <p className="text-[11px] text-white/50 leading-relaxed max-w-xs mx-auto text-center">
                Ingresa el PIN de seguridad asignado al gestor QuinielasMRD para habilitar la eliminación y depuración de registros.
              </p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <input
                  id="txt-admin-pin"
                  type="password"
                  placeholder="Introduce PIN (Ej. 2026)"
                  value={adminPinInput}
                  onChange={(e) => {
                    setAdminPinInput(e.target.value);
                    if (adminError) setAdminError("");
                  }}
                  className="block w-full px-4 py-3 bg-[#121212] border border-white/10 focus:border-[#00FF00] focus:ring-2 focus:ring-[#00FF00]/15 rounded-lg text-center text-lg font-mono font-bold text-white placeholder-white/20 focus:outline-none tracking-widest"
                  maxLength={10}
                  autoFocus
                />
                {adminError && (
                  <p className="text-red-400 text-[11px] font-mono text-center mt-2 flex items-center justify-center gap-1 font-bold">
                    <AlertCircle className="w-3.5 h-3.5" /> {adminError}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminModal(false);
                    setAdminPinInput("");
                    setAdminError("");
                  }}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#00FF00] hover:bg-white text-black rounded-lg text-xs font-black transition-colors cursor-pointer uppercase tracking-tight text-center"
                >
                  Confirmar PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Admin destructive deletion confirmation modal */}
      {subToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-full w-fit mx-auto text-red-500">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold font-serif italic text-white uppercase tracking-tight text-center">¿Eliminar Participante?</h3>
            <p className="text-xs text-white/50 leading-relaxed max-w-xs mx-auto text-center">
              Estás por eliminar la planilla deportiva certificada de <span className="text-white font-bold">{subToDelete.name}</span> ({subToDelete.email}). Esta acción depurará irremediablemente el registro de la base de datos de manera definitiva.
            </p>
            
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setSubToDelete(null)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDelete}
                className="flex-1 py-3 bg-red-650 hover:bg-red-600 disabled:bg-red-900/50 text-white font-black rounded-lg text-xs transition-colors cursor-pointer uppercase tracking-tight flex items-center justify-center gap-1"
              >
                {isDeleting ? (
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                ) : (
                  "Sí, Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
