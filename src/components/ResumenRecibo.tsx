/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { 
  CheckCircle, 
  Share2, 
  Send, 
  Mail, 
  Copy, 
  Check, 
  Trophy, 
  Calendar,
  ChevronDown,
  ChevronUp,
  User,
  ExternalLink,
  ArrowRight
} from "lucide-react";
import { QuinielaSubmission } from "../types";
import { MATCHES } from "../games";
import { getTeamFlag, getTeamFlagUrl, generateWhatsAppMessage, generateCompactSummaryText, generateSpreadsheetPasteableText } from "../utils";

interface ResumenReciboProps {
  submission: QuinielaSubmission;
  onClose: () => void;
  matches?: typeof MATCHES;
}

export default function ResumenRecibo({ submission, onClose, matches }: ResumenReciboProps) {
  const [copied, setCopied] = useState(false);
  const [copiedExcel, setCopiedExcel] = useState(false);
  const [showFullReview, setShowFullReview] = useState(false);

  const activeMatches = matches || MATCHES;

  const whatsappUrl = `https://wa.me/?text=${generateWhatsAppMessage(
    submission.participant.name,
    submission.participant.email,
    submission.predictions,
    activeMatches
  )}`;

  const emailSubject = encodeURIComponent(`Mis Pronísticos - Quiniela Mundial 2026 - ${submission.participant.name}`);
  const emailBody = encodeURIComponent(
    generateCompactSummaryText(submission.participant.name, submission.participant.email, submission.predictions, activeMatches)
  );
  const emailUrl = `mailto:${submission.participant.email}?subject=${emailSubject}&body=${emailBody}`;

  const handleCopyToClipboard = () => {
    const rawText = generateCompactSummaryText(submission.participant.name, submission.participant.email, submission.predictions, activeMatches);
    navigator.clipboard.writeText(rawText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch((err) => {
        console.error("Failed to copy text", err);
      });
  };

  const handleCopyExcelToClipboard = () => {
    const rawText = generateSpreadsheetPasteableText(submission.predictions, activeMatches);
    navigator.clipboard.writeText(rawText)
      .then(() => {
        setCopiedExcel(true);
        setTimeout(() => setCopiedExcel(false), 2500);
      })
      .catch((err) => {
        console.error("Failed to copy excel text", err);
      });
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4 animate-fade-in space-y-6">
      {/* Visual Success Confirmation Banner */}
      <div className="bg-[#0A0A0A] border border-[#00FF00]/30 rounded-2xl p-6 sm:p-10 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FF00]/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="p-3 bg-[#00FF00]/10 border border-[#00FF00]/20 rounded-full w-fit mx-auto text-[#00FF00] shadow-md mb-4">
          <CheckCircle className="w-10 h-10" />
        </div>
        
        <span className="block text-[10px] uppercase tracking-[0.25em] font-mono text-[#00FF00] mb-2">
          Registro Completado Exitosamente
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold italic tracking-tight font-serif text-white">
          ¡Marcadores Certificados!
        </h2>
        
        <p className="text-white/60 text-xs sm:text-sm mt-3 max-w-md mx-auto leading-relaxed">
          Tus pronósticos oficiales de grupos han sido ingresados y sincronizados en tiempo real en la base de datos centralizada.
        </p>

        {/* Dynamic Trans ID */}
        <div className="mt-5 inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/50 text-[10px] font-mono">
          <Calendar className="w-3.5 h-3.5 text-[#00FF00]" /> {new Date(submission.submittedAt).toLocaleString()}
        </div>
      </div>

      {/* Profile Details summary card */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <span className="text-[10px] uppercase tracking-widest text-[#00FF00] block mb-1 font-mono">Resumen de Registro</span>
        <h3 className="text-2xl font-black italic tracking-tight font-serif text-white mb-6 border-b border-white/10 pb-3 flex items-center gap-2">
          <User className="w-5 h-5 text-white/50" /> Ficha del Participante
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm">
          <div className="border-b sm:border-b-0 border-white/5 pb-3 sm:pb-0">
            <span className="text-white/40 text-[10px] font-mono uppercase tracking-widest block">Nombre</span>
            <p className="text-base font-bold text-white mt-1">{submission.participant.name}</p>
          </div>
          <div className="border-b sm:border-b-0 border-white/5 pb-3 sm:pb-0">
            <span className="text-white/40 text-[10px] font-mono uppercase tracking-widest block">Correo Electrónico</span>
            <p className="text-base font-bold text-white mt-1 truncate">{submission.participant.email}</p>
          </div>
          {submission.participant.phone && (
            <div className="border-b sm:border-b-0 border-white/5 pb-3 sm:pb-0">
              <span className="text-white/40 text-[10px] font-mono uppercase tracking-widest block">Teléfono de Enlace</span>
              <p className="text-base font-bold text-white mt-1">{submission.participant.phone}</p>
            </div>
          )}
          <div>
            <span className="text-white/40 text-[10px] font-mono uppercase tracking-widest block">Eventos Pronosticados</span>
            <p className="text-base font-bold text-white mt-1 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-[#00FF00]" /> {submission.totalMatchesPredicted} / {activeMatches.length} Partidos
            </p>
          </div>
        </div>
      </div>

      {/* Integration Options */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2.5 mb-2">
          <Share2 className="w-5 h-5 text-[#00FF00]" />
          <h3 className="text-base font-bold uppercase tracking-tight text-white">
            Compartir Recibo de Juego
          </h3>
        </div>
        <p className="text-xs text-white/50 mb-6 leading-relaxed">
          Es fundamental enviar tu respaldo para que el administrador certifique tus pronósticos. Elige cualquiera de los siguientes canales directos:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* WhatsApp share */}
          <a
            id="link-share-whatsapp"
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-white text-black font-black py-3.5 px-4 rounded-lg shadow-md cursor-pointer transition-colors text-xs uppercase tracking-tighter"
          >
            <Send className="w-4 h-4" /> Enviar WhatsApp <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          {/* Email dispatch */}
          <a
            id="link-share-email"
            href={emailUrl}
            className="flex items-center justify-center gap-2 bg-[#EA4335] hover:bg-white text-white hover:text-black font-black py-3.5 px-4 rounded-lg shadow-md cursor-pointer transition-colors text-xs uppercase tracking-tighter"
          >
            <Mail className="w-4 h-4" /> Enviar Mail <ExternalLink className="w-3 h-3 opacity-60" />
          </a>

          {/* Copy Receipt text */}
          <button
            id="btn-copy-receipt"
            onClick={handleCopyToClipboard}
            className={`flex items-center justify-center gap-2 font-black py-3.5 px-4 rounded-lg shadow-sm cursor-pointer transition-colors text-xs uppercase tracking-tighter ${
              copied
                ? "bg-white text-black border-transparent"
                : "bg-white/5 border border-white/10 text-white hover:bg-white/15"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-black" /> ¡Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-white/60" /> Copiar Resumen
              </>
            )}
          </button>
        </div>

        {/* Dedicated Excel Integration Section */}
        <div className="mt-6 pt-5 border-t border-white/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="text-[#00FF00]">📊</span> Formato Excel / Google Sheets
              </p>
              <p className="text-[11px] text-white/50 leading-relaxed max-w-lg">
                Copia los marcadores en columnas tabuladas. Al pegarlos en Excel o Google Sheets, se acomodarán perfectamente en celdas separadas (ID - Grupo - Local - Goles Local - Goles Visitante - Visitante) para ahorrar tiempo al organizar tu quiniela.
              </p>
            </div>
            
            <button
              id="btn-copy-excel-columns"
              type="button"
              onClick={handleCopyExcelToClipboard}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 font-black py-3 px-5 rounded-lg shadow-md cursor-pointer transition-all text-xs uppercase tracking-tighter shrink-0 select-none ${
                copiedExcel
                  ? "bg-[#00FF00] text-black border-transparent scale-95"
                  : "bg-white/5 hover:bg-white text-white hover:text-black border border-white/15"
              }`}
            >
              {copiedExcel ? (
                <>
                  <Check className="w-4 h-4" /> ¡Tabla Copiada!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-white/60 group-hover:text-black" /> Copiar Columnas
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Predictions Review Accordion */}
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-md">
        <button
          id="btn-toggle-review"
          onClick={() => setShowFullReview(!showFullReview)}
          className="w-full flex items-center justify-between p-5 font-bold bg-white/2 hover:bg-white/5 transition-all text-white cursor-pointer"
        >
          <span className="flex items-center gap-2.5 text-xs uppercase tracking-wider font-bold">
            <Trophy className="w-4 h-4 text-[#00FF00]" /> Detalle de Marcadores Guardados
          </span>
          {showFullReview ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
        </button>

        {showFullReview && (
          <div className="p-5 max-h-[380px] overflow-y-auto divide-y divide-white/5 font-mono text-xs text-white/80">
            {activeMatches.map((m) => {
              const pred = submission.predictions[m.id];
              const hScore = pred !== undefined ? pred.homeScore : "-";
              const aScore = pred !== undefined ? pred.awayScore : "-";
              return (
                <div key={m.id} className="py-2.5 flex justify-between items-center">
                  <span className="text-white/30 font-bold w-10">#{String(m.id).padStart(2, "0")}</span>
                  <div className="flex-1 flex items-center justify-between px-2 gap-4">
                    <div className="flex flex-col items-center justify-center gap-1 w-[40%] text-center font-sans">
                      <div className="w-6 h-4 shrink-0 relative overflow-hidden rounded bg-white/5 border border-white/10 flex items-center justify-center">
                        <img
                          src={getTeamFlagUrl(m.homeTeam)}
                          alt={m.homeTeam}
                          className="w-full h-full object-cover z-10"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.opacity = '0';
                          }}
                        />
                        <span className="absolute text-[8px] select-none pointer-events-none z-0">
                          {getTeamFlag(m.homeTeam)}
                        </span>
                      </div>
                      <span className="text-white/95 text-[10px] sm:text-xs font-bold leading-none truncate max-w-full">{m.homeTeam}</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 font-bold text-[#00FF00] px-3.5 py-1.5 rounded text-center min-w-[55px] text-xs font-mono">
                      {hScore} - {aScore}
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1 w-[40%] text-center font-sans">
                      <div className="w-6 h-4 shrink-0 relative overflow-hidden rounded bg-white/5 border border-white/10 flex items-center justify-center">
                        <img
                          src={getTeamFlagUrl(m.awayTeam)}
                          alt={m.awayTeam}
                          className="w-full h-full object-cover z-10"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.opacity = '0';
                          }}
                        />
                        <span className="absolute text-[8px] select-none pointer-events-none z-0">
                          {getTeamFlag(m.awayTeam)}
                        </span>
                      </div>
                      <span className="text-white/95 text-[10px] sm:text-xs font-bold leading-none truncate max-w-full">{m.awayTeam}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Button to return back home */}
      <button
        id="btn-return-home"
        onClick={onClose}
        className="w-full bg-[#00FF00] hover:bg-white text-black font-black py-4 rounded-lg transition-colors flex items-center justify-center gap-2.5 uppercase tracking-tighter text-sm cursor-pointer shadow-lg shadow-[#00FF00]/10"
      >
        Volver al Inicio <ArrowRight className="w-4.5 h-4.5 stroke-[2.5]" />
      </button>
    </div>
  );
}
