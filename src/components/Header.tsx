/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sparkles, Trophy, Users } from "lucide-react";

interface HeaderProps {
  totalParticipants: number;
}

export default function Header({ totalParticipants }: HeaderProps) {
  return (
    <header className="relative bg-[#0A0A0A] border-b border-white/10 text-white px-6 py-8 sm:px-12">
      {/* Decorative background logo track */}
      <div className="absolute right-10 bottom-0 pointer-events-none select-none overflow-hidden h-full flex items-end">
        <span className="text-[120px] font-black opacity-[0.02] tracking-tighter italic leading-none translate-y-10">
          MEX CAN USA
        </span>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
        <div>
          <span className="text-[10px] tracking-[0.25em] uppercase opacity-60 font-mono text-[#00FF00] block mb-1">
            Plataforma Oficial de Pronósticos
          </span>
          <div className="flex flex-col items-start mb-0.5">
            <div className="flex items-baseline gap-2.5">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter italic font-sans flex items-center">
                Quinielas<span className="text-[#00FF00] font-black non-italic">MRD</span>
              </h1>
              <span className="bg-[#00FF00]/10 border border-[#00FF00]/20 text-[#00FF00] px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold tracking-wider align-middle">
                Fase 1
              </span>
            </div>
            <span className="text-xs font-mono font-bold tracking-[0.2em] text-[#EF4444] uppercase mt-1 ml-0.5">
              By Augusto 2026
            </span>
          </div>
          <p className="mt-2 text-xs text-white/55 max-w-xl font-sans font-light leading-relaxed">
            Registra tus predicciones deportivas oficiales para los <span className="text-white font-bold pb-0.5 border-b border-[#00FF00]/40">72 encuentros de la fase de grupos</span>. Sincronizado en tiempo real con Google Sheets.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-center sm:self-end">
          {/* Active stats indicator */}
          <div className="flex flex-col text-left sm:text-right font-mono border-l sm:border-l-0 sm:border-r border-white/10 pl-4 sm:pl-0 sm:pr-4">
            <span className="text-[9px] uppercase opacity-40 tracking-wider">Sistema de Registro</span>
            <span className="text-xs font-bold text-[#00FF00]">ACTIVE / SHEETS CONNECTED</span>
          </div>

          <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg flex items-center gap-3 backdrop-blur-md">
            <div className="h-2.5 w-2.5 bg-[#00FF00] rounded-full animate-ping" />
            <div>
              <p className="text-[9px] uppercase tracking-widest opacity-40 font-mono">Participantes Activos</p>
              <p className="text-xl font-bold font-mono tracking-tight text-white flex items-baseline gap-1">
                {totalParticipants}{" "}
                <span className="text-[10px] font-sans font-light italic text-white/50">inscritos</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
