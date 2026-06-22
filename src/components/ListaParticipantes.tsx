/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
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
  Check,
  FileSpreadsheet,
  Upload
} from "lucide-react";
import { QuinielaSubmission } from "../types";
import { getAdminPin, saveAdminPin, saveSubmission } from "../storage";
import { MATCHES } from "../games";
import * as XLSX from "xlsx";

interface ListaParticipantesProps {
  submissions: QuinielaSubmission[];
  currentSubmission: QuinielaSubmission | null;
  onSelectSubmission: (submission: QuinielaSubmission) => void;
  isFirebaseConnected: boolean;
  onDeleteSubmission?: (id: string | undefined, email: string, submittedAt: string) => Promise<void>;
  onGenerateMockData?: () => Promise<void>;
  onUpdateSubmissionPin?: (id: string | undefined, email: string, submittedAt: string, newPin: string) => Promise<void>;
  isEditingLocked?: boolean;
  onToggleEditingLock?: (locked: boolean) => Promise<void> | void;
  isRegistrationLocked?: boolean;
  onToggleRegistrationLock?: (locked: boolean) => Promise<void> | void;
  isGroupPhaseLocked?: boolean;
  onToggleGroupPhaseLock?: (locked: boolean) => Promise<void> | void;
  isSecondPhaseLocked?: boolean;
  onToggleSecondPhaseLock?: (locked: boolean) => Promise<void> | void;
  onRefreshSubmissions?: () => Promise<void> | void;
}

function maskEmail(email: string): string {
  if (!email) return "";
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const username = parts[0];
  const domain = parts[1];
  if (username.length <= 2) {
    return `${username[0]}*@${domain}`;
  }
  return `${username[0]}***${username[username.length - 1]}@${domain}`;
}

function maskPhone(phone: string): string {
  if (!phone) return "";
  const clean = phone.trim();
  if (clean.length <= 5) {
    return "***";
  }
  return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
}

export default function ListaParticipantes({ 
  submissions, 
  currentSubmission,
  onSelectSubmission,
  isFirebaseConnected,
  onDeleteSubmission,
  onGenerateMockData,
  onUpdateSubmissionPin,
  isEditingLocked = false,
  onToggleEditingLock,
  isRegistrationLocked = false,
  onToggleRegistrationLock,
  isGroupPhaseLocked = true,
  onToggleGroupPhaseLock,
  isSecondPhaseLocked = false,
  onToggleSecondPhaseLock,
  onRefreshSubmissions
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

  // States for Database Excel Restore Utility
  const [restoringSubmissions, setRestoringSubmissions] = useState<any[]>([]);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [restoreError, setRestoreError] = useState("");
  const [restoreSuccess, setRestoreSuccess] = useState("");
  const [isSavingRestore, setIsSavingRestore] = useState(false);

  // Admin PIN configuration states
  const [adminPin, setAdminPin] = useState(() => localStorage.getItem("admin_pin_key") || "1397");
  const [showChangeAdminPinModal, setShowChangeAdminPinModal] = useState(false);
  const [newAdminPinInput, setNewAdminPinInput] = useState("");
  const [adminChangeError, setAdminChangeError] = useState("");

  // Sync admin PIN with Cloud Firestore on mount if available
  useEffect(() => {
    let active = true;
    const fetchAdminPin = async () => {
      try {
        const pin = await getAdminPin();
        if (active) {
          setAdminPin(pin);
        }
      } catch (err) {
        console.warn("Could not sync admin PIN on mount:", err);
      }
    };
    fetchAdminPin();
    return () => {
      active = false;
    };
  }, []);

  // Edit Player PIN states
  const [editingPlayerPin, setEditingPlayerPin] = useState<{
    id: string | undefined;
    email: string;
    submittedAt: string;
    name: string;
    currentPin: string;
  } | null>(null);
  const [newPlayerPinInput, setNewPlayerPinInput] = useState("");
  const [playerPinError, setPlayerPinError] = useState("");
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

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
    if (adminPinInput === adminPin) {
      setIsAdmin(true);
      sessionStorage.setItem("isAdmin", "true");
      setShowAdminModal(false);
      setAdminPinInput("");
      setAdminError("");
    } else {
      setAdminError("PIN de Control Incorrecto. Inténtalo de nuevo.");
    }
  };

  const handleSaveAdminPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const pin = newAdminPinInput.trim();
    if (!pin) {
      setAdminChangeError("El PIN no puede estar vacío.");
      return;
    }
    if (pin.length < 4) {
      setAdminChangeError("El nuevo PIN debe tener al menos 4 caracteres.");
      return;
    }
    await saveAdminPin(pin);
    setAdminPin(pin);
    setShowChangeAdminPinModal(false);
  };

  const handleUpdatePlayerPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayerPin || !onUpdateSubmissionPin) return;

    const pin = newPlayerPinInput.trim();
    if (!pin) {
      setPlayerPinError("El PIN no puede estar vacío.");
      return;
    }
    if (pin.length < 4) {
      setPlayerPinError("El PIN debe tener al menos 4 caracteres.");
      return;
    }

    setIsUpdatingPin(true);
    try {
      await onUpdateSubmissionPin(
        editingPlayerPin.id,
        editingPlayerPin.email,
        editingPlayerPin.submittedAt,
        pin
      );
      setEditingPlayerPin(null);
    } catch (err) {
      setPlayerPinError("Error al actualizar el PIN.");
      console.error(err);
    } finally {
      setIsUpdatingPin(false);
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem("isAdmin");
  };

  const handleDownloadAllExcel = () => {
    try {
      if (submissions.length === 0) {
        alert("No hay quinielas registradas para descargar.");
        return;
      }

      // Create a workbook
      const wb = XLSX.utils.book_new();

      submissions.forEach((sub) => {
        // Build the sheet header structure
        const sheetData: (string | number)[][] = [
          ["PERFIL DEL JUGADOR - QUINIELA MUNDIAL 2026"],
          ["Nombre Completo", sub.participant.name],
          ["Correo Electrónico", maskEmail(sub.participant.email)],
          ["Teléfono de Contacto", sub.participant.phone ? maskPhone(sub.participant.phone) : "No registrado"],
          ["Fecha y Hora del Último Registro", new Date(sub.submittedAt).toLocaleString("es-ES")],
          ["Partidos Pronosticados", `${sub.totalMatchesPredicted} / ${MATCHES.length}`],
          [], // Empty spacer row
          ["ESTRUCTURA DE PARTIDOS & PRONÓSTICOS"],
          ["Partido ID", "Grupo", "Equipo Local", "Pronóstico Local", "Pronóstico Visitante", "Equipo Visitante"]
        ];

        // Populate match predictions in standard rows
        let lastGroup = "";
        MATCHES.forEach((match) => {
          if (lastGroup && match.group !== lastGroup) {
            // Include a blank row as space between different groups
            sheetData.push([]);
          }
          lastGroup = match.group;

          const pred = sub.predictions[match.id] || { homeScore: "", awayScore: "" };
          sheetData.push([
            match.id,
            match.group,
            match.homeTeam,
            pred.homeScore !== undefined && pred.homeScore !== "" ? pred.homeScore : "",
            pred.awayScore !== undefined && pred.awayScore !== "" ? pred.awayScore : "",
            match.awayTeam
          ]);
        });

        // Convert array of arrays to a sheet
        const ws = XLSX.utils.aoa_to_sheet(sheetData);

        // Sanitize player name for sheet title (max 25 chars, remove special characters)
        let cleanedName = sub.participant.name.trim().replace(/[\\/?*:\[\]]/g, "");
        if (cleanedName.length > 25) {
          cleanedName = cleanedName.slice(0, 25);
        }
        let uniqueSheetName = cleanedName || "Jugador";
        
        let counter = 1;
        while (wb.SheetNames.includes(uniqueSheetName)) {
          uniqueSheetName = `${cleanedName.slice(0, 20)}_${counter++}`;
        }

        XLSX.utils.book_append_sheet(wb, ws, uniqueSheetName);
      });

      // Triggers download in the client browser
      XLSX.writeFile(wb, "Planillas_QuinielasMRD.xlsx");
    } catch (error) {
      console.error("Error al exportar archivo Excel:", error);
      alert("Hubo un error al generar el archivo Excel.");
    }
  };

  const handleRestoreExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    setRestoreError("");
    setRestoreSuccess("");
    setRestoringSubmissions([]);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) {
          throw new Error("No se pudo leer el archivo.");
        }
        
        const workbook = XLSX.read(data, { type: "array" });
        const parsedList: any[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const ws = workbook.Sheets[sheetName];
          const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

          if (rawRows.length < 5) return; // Not enough data for a user sheet

          let name = "";
          let email = "";
          let phone = "";
          let submittedAt = new Date().toISOString();

          // Robust check on rows
          rawRows.forEach((row) => {
            if (!row || row.length < 2) return;
            const label = String(row[0]).trim().toLowerCase();
            const val = String(row[1]).trim();
            if (label.includes("nombre completo")) {
              name = val;
            } else if (label.includes("correo electrónico") || label.includes("correo electronico")) {
              email = val;
            } else if (label.includes("teléfono") || label.includes("telefono")) {
              phone = (val && val !== "No registrado") ? val : "";
            } else if (label.includes("fecha y hora") || label.includes("registro")) {
              try {
                const parsedDate = new Date(val);
                if (!isNaN(parsedDate.getTime())) {
                  submittedAt = parsedDate.toISOString();
                } else {
                  const parts = val.split(/[,\s]+/);
                  if (parts[0]) {
                    const dateParts = parts[0].split("/");
                    if (dateParts.length === 3) {
                      const day = parseInt(dateParts[0]);
                      const month = parseInt(dateParts[1]) - 1;
                      const year = parseInt(dateParts[2]);
                      let hour = 12, min = 0, sec = 0;
                      if (parts[1]) {
                        const timeParts = parts[1].split(":");
                        if (timeParts.length >= 2) {
                          hour = parseInt(timeParts[0]);
                          min = parseInt(timeParts[1]);
                          if (timeParts[2]) sec = parseInt(timeParts[2]);
                        }
                      }
                      const d = new Date(year, month, day, hour, min, sec);
                      if (!isNaN(d.getTime())) {
                        submittedAt = d.toISOString();
                      }
                    }
                  }
                }
              } catch (err) {
                console.warn("Date parse error during restore:", err);
              }
            }
          });

          if (!name) return; // Skip invalid sheets

          // Locate match predicitions
          let tableHeaderIdx = -1;
          for (let i = 0; i < rawRows.length; i++) {
            const r = rawRows[i];
            if (r && r.length > 0 && String(r[0]).trim().toLowerCase().includes("partido id")) {
              tableHeaderIdx = i;
              break;
            }
          }

          const predictions: { [matchId: number]: { homeScore: number | ""; awayScore: number | "" } } = {};
          let totalMatchesPredicted = 0;

          if (tableHeaderIdx !== -1) {
            for (let j = tableHeaderIdx + 1; j < rawRows.length; j++) {
              const row = rawRows[j];
              if (!row || row.length < 5) continue;
              
              const matchId = parseInt(row[0]);
              if (isNaN(matchId)) continue;

              const homeScoreRaw = row[3];
              const awayScoreRaw = row[4];

              let homeScore: number | "" = "";
              let awayScore: number | "" = "";

              if (homeScoreRaw !== undefined && homeScoreRaw !== null && homeScoreRaw !== "") {
                const parsed = parseInt(homeScoreRaw);
                if (!isNaN(parsed)) {
                  homeScore = parsed;
                }
              }

              if (awayScoreRaw !== undefined && awayScoreRaw !== null && awayScoreRaw !== "") {
                const parsed = parseInt(awayScoreRaw);
                if (!isNaN(parsed)) {
                  awayScore = parsed;
                }
              }

              predictions[matchId] = { homeScore, awayScore };
              if (homeScore !== "" && awayScore !== "") {
                totalMatchesPredicted++;
              }
            }
          }

          const isEmailMasked = email.includes("***") || email.includes("*@");
          const randomPin = Math.floor(1000 + Math.random() * 9000).toString();

          parsedList.push({
            name,
            originalEmail: email,
            emailInput: isEmailMasked ? "" : email,
            phone: phone,
            pin: randomPin,
            predictions,
            submittedAt,
            totalMatchesPredicted,
            isEmailMasked
          });
        });

        if (parsedList.length === 0) {
          throw new Error("No se encontraron planillas válidas o con estructura compatible para restaurar.");
        }

        setRestoringSubmissions(parsedList);
        setRestoreSuccess(`Se leyeron correctamente ${parsedList.length} registros del archivo. Completa o verifica la grilla de abajo.`);
      } catch (err: any) {
        setRestoreError(err?.message || "Hubo un problema al procesar y leer el Excel.");
        console.error(err);
      } finally {
        setIsParsingExcel(false);
        e.target.value = "";
      }
    };

    reader.onerror = () => {
      setRestoreError("Error crítico de lectura física del archivo.");
      setIsParsingExcel(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSaveRestore = async () => {
    const hasEmptyEmail = restoringSubmissions.some((sub) => !sub.emailInput.trim());
    if (hasEmptyEmail) {
      setRestoreError("Por favor, asocia y completa una dirección de correo válida para cada quiniela.");
      return;
    }

    setIsSavingRestore(true);
    setRestoreError("");
    setRestoreSuccess("");

    try {
      let restoredCount = 0;
      for (const item of restoringSubmissions) {
        const emailToSave = item.emailInput.trim().toLowerCase();
        
        const submissionBlob: QuinielaSubmission = {
          participant: {
            name: item.name,
            email: emailToSave,
            phone: item.phone ? item.phone.trim() : undefined,
            pin: item.pin.trim(),
            registeredAt: item.submittedAt
          },
          predictions: item.predictions,
          submittedAt: item.submittedAt,
          totalMatchesPredicted: item.totalMatchesPredicted
        };

        await saveSubmission(submissionBlob);
        restoredCount++;
      }

      setRestoreSuccess(`¡Restauración Completa! Se importaron con éxito ${restoredCount} quinielas a la base de datos.`);
      setRestoringSubmissions([]);

      if (onRefreshSubmissions) {
        await onRefreshSubmissions();
      }
    } catch (e: any) {
      console.error(e);
      setRestoreError("Fallo al escribir registros en la base de datos: " + (e?.message || String(e)));
    } finally {
      setIsSavingRestore(false);
    }
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <span className="px-3 py-1 text-[9px] font-mono font-bold text-red-400 bg-red-400/10 border border-red-400/20 rounded-full flex items-center gap-1 shadow-sm uppercase">
                🛠️ Modo Administrador
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  id="btn-admin-change-pin"
                  type="button"
                  onClick={() => {
                    setNewAdminPinInput(adminPin);
                    setAdminChangeError("");
                    setShowChangeAdminPinModal(true);
                  }}
                  className="text-[10px] font-mono font-black text-white/60 hover:text-[#00FF00] underline uppercase cursor-pointer"
                  title="Cambiar PIN del Administrador"
                >
                  Cambiar PIN Admin
                </button>
                <button
                  id="btn-admin-logout"
                  type="button"
                  onClick={handleAdminLogout}
                  className="text-[10px] font-mono font-black text-white/40 hover:text-[#00FF00] underline uppercase cursor-pointer"
                >
                  Salir
                </button>
              </div>
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

      {isAdmin && (
        <div className="bg-[#00FF00]/5 border border-[#00FF00]/15 rounded-xl p-5 mb-6 animate-fade-in text-left">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#00FF00] uppercase tracking-wider flex items-center gap-1.5">
                🛠️ Panel de Herramientas de Administrador
              </p>
              <p className="text-[11px] text-white/60 leading-relaxed max-w-xl">
                Accede a utilidades de exportación, diagnóstico y control de cierres. Puedes descargar las planillas de todos los participantes inscritos en un único archivo Excel, restaurar la base de datos o bloquear la inscripción de nuevos participantes en el sistema.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
              <button
                id="btn-admin-download-excel"
                type="button"
                onClick={handleDownloadAllExcel}
                className="w-full sm:w-auto flex items-center justify-center gap-2 font-black py-2.5 px-4 bg-[#00FF00] hover:bg-white text-black font-extrabold rounded-lg shadow-md transition-all text-xs uppercase tracking-tighter cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Descargar Todo (Excel)
              </button>

              <button
                id="btn-admin-restore-excel"
                type="button"
                onClick={() => document.getElementById("restore-xlsx-file")?.click()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 font-extrabold py-2.5 px-4 bg-purple-950/45 hover:bg-purple-900 border border-purple-500/30 hover:border-purple-400 text-purple-300 hover:text-white rounded-lg shadow-md transition-all text-xs uppercase tracking-tighter cursor-pointer"
              >
                <Upload className="w-4 h-4 shrink-0" />
                {isParsingExcel ? "Cargando..." : "Restaurar (Excel)"}
              </button>
              <input
                id="restore-xlsx-file"
                type="file"
                accept=".xlsx"
                onChange={handleRestoreExcelUpload}
                className="hidden"
              />

              <button
                id="btn-admin-toggle-edit-lock"
                type="button"
                onClick={() => onToggleEditingLock && onToggleEditingLock(!isEditingLocked)}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 font-bold py-2.5 px-4 rounded-lg border shadow-md transition-all text-xs uppercase tracking-tighter cursor-pointer ${
                  isEditingLocked
                    ? "bg-red-950/45 border-red-500/30 text-red-300 hover:bg-red-500 hover:text-black"
                    : "bg-amber-950/45 border-amber-500/30 text-amber-300 hover:bg-amber-500 hover:text-black"
                }`}
              >
                {isEditingLocked ? (
                  <>
                    <Lock className="w-4 h-4 text-red-400 shrink-0" />
                    Edición: Bloqueada
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-amber-400 shrink-0 opacity-70" />
                    Edición: Permitida
                  </>
                )}
              </button>

              <button
                id="btn-admin-toggle-reg-lock"
                type="button"
                onClick={() => onToggleRegistrationLock && onToggleRegistrationLock(!isRegistrationLocked)}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 font-bold py-2.5 px-4 rounded-lg border shadow-md transition-all text-xs uppercase tracking-tighter cursor-pointer ${
                  isRegistrationLocked
                    ? "bg-red-950/45 border-red-500/30 text-red-300 hover:bg-red-500 hover:text-black"
                    : "bg-[#00FF00]/10 border-[#00FF00]/20 text-[#00FF00] hover:bg-[#00FF00] hover:text-black"
                }`}
              >
                {isRegistrationLocked ? (
                  <>
                    <Lock className="w-4 h-4 text-red-400 shrink-0" />
                    Registros: Bloqueados
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#00FF00] shrink-0" />
                    Registros: Abiertos
                  </>
                )}
              </button>

              <button
                id="btn-admin-toggle-group-lock"
                type="button"
                onClick={() => onToggleGroupPhaseLock && onToggleGroupPhaseLock(!isGroupPhaseLocked)}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 font-bold py-2.5 px-4 rounded-lg border shadow-md transition-all text-xs uppercase tracking-tighter cursor-pointer ${
                  isGroupPhaseLocked
                    ? "bg-red-950/45 border-red-500/30 text-red-300 hover:bg-red-500 hover:text-black"
                    : "bg-[#00FF00]/10 border-[#00FF00]/20 text-[#00FF00] hover:bg-[#00FF00] hover:text-black"
                }`}
              >
                {isGroupPhaseLocked ? (
                  <>
                    <Lock className="w-4 h-4 text-red-400 shrink-0" />
                    Grupo (1-72): Cerrado
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#00FF00] shrink-0" />
                    Grupo (1-72): Abierto
                  </>
                )}
              </button>

              <button
                id="btn-admin-toggle-second-lock"
                type="button"
                onClick={() => onToggleSecondPhaseLock && onToggleSecondPhaseLock(!isSecondPhaseLocked)}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 font-bold py-2.5 px-4 rounded-lg border shadow-md transition-all text-xs uppercase tracking-tighter cursor-pointer ${
                  isSecondPhaseLocked
                    ? "bg-red-950/45 border-red-500/30 text-red-300 hover:bg-red-500 hover:text-black"
                    : "bg-[#00FF00]/10 border-[#00FF00]/20 text-[#00FF00] hover:bg-[#00FF00] hover:text-black"
                }`}
              >
                {isSecondPhaseLocked ? (
                  <>
                    <Lock className="w-4 h-4 text-red-400 shrink-0" />
                    16avos (73-88): Cerrado
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#00FF00] shrink-0" />
                    16avos (73-88): Abierto
                  </>
                )}
              </button>

              {onGenerateMockData && (
                <button
                  id="btn-admin-generate-mockups"
                  type="button"
                  disabled={isGeneratingMock}
                  onClick={handleGenerateTestParticipants}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 font-bold py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg shadow-md transition-all text-xs uppercase tracking-tighter disabled:opacity-50 cursor-pointer"
                >
                  {isGeneratingMock ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Generando...
                    </>
                  ) : (
                    "Crear 5 Participantes"
                  )}
                </button>
              )}
            </div>
          </div>

          {/* ASISTENTE INTERACTIVO DE RESTAURACIÓN DE EXCEL */}
          {restoringSubmissions.length > 0 && (
            <div id="box-admin-excel-restore" className="mt-6 border-t border-white/10 pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-serif italic">
                    📦 Asistente de Recuperación de Datos
                  </h4>
                  <p className="text-[11px] text-white/50 leading-relaxed max-w-xl mt-0.5">
                    Se detectaron <strong>{restoringSubmissions.length}</strong> quinielas en tu Excel de respaldo. Al descargarlos del reporte oficial, los correos y teléfonos estaban enmascarados por privacidad: puedes editarlos abajo o recuperarlos tal cual.
                  </p>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setRestoringSubmissions([]);
                      setRestoreError("");
                      setRestoreSuccess("");
                    }}
                    className="flex-1 sm:flex-none py-2 px-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap cursor-pointer text-center"
                  >
                    Borrar
                  </button>
                  <button
                    type="button"
                    disabled={isSavingRestore}
                    onClick={handleSaveRestore}
                    className="flex-1 sm:flex-none py-2 px-4 bg-[#00FF00] hover:bg-white text-black rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {isSavingRestore ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin inline-block mr-1"></span>
                        Restaurando...
                      </>
                    ) : (
                      "Confirmar Importación"
                    )}
                  </button>
                </div>
              </div>

              {restoreError && (
                <div className="text-red-400 text-xs font-mono bg-red-950/35 border border-red-500/20 rounded-lg p-3 flex items-start gap-2 leading-relaxed">
                  <span className="font-extrabold select-none">⚠️ ERROR:</span>
                  <span>{restoreError}</span>
                </div>
              )}

              {restoreSuccess && (
                <div className="text-[#00FF00] text-xs font-mono bg-[#00FF00]/10 border border-[#00FF00]/20 rounded-lg p-3 flex items-start gap-2 leading-relaxed">
                  <span className="font-extrabold select-none">✅ ÉXITO:</span>
                  <span>{restoreSuccess}</span>
                </div>
              )}

              <div className="bg-[#0c0c0c] border border-white/5 rounded-xl max-h-[340px] overflow-y-auto divide-y divide-white/5">
                {restoringSubmissions.map((item, index) => {
                  const isEmailMissingOrMasked = !item.emailInput.trim() || item.emailInput.includes("***");
                  
                  return (
                    <div key={index} className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 hover:bg-white/[0.01] transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="font-bold text-white text-sm">{item.name}</strong>
                          <span className="text-[10px] font-mono font-bold bg-[#00FF00]/10 text-[#00FF00] px-1.5 py-0.5 rounded border border-[#00FF00]/10">
                            {item.totalMatchesPredicted} partidos
                          </span>
                        </div>
                        <p className="text-[10px] text-white/40 mt-1 font-mono tracking-tight">
                          Excel: <span className="text-amber-500/70">{item.originalEmail}</span> {item.phone ? `| Tlf: ${item.phone}` : ""}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-[60%] shrink-0">
                        {/* Correo */}
                        <div>
                          <label className="block text-[9px] uppercase font-bold tracking-wider text-white/40 mb-1 font-mono">Correo Real de Acceso</label>
                          <input
                            type="email"
                            placeholder="Usuario@correo.com"
                            value={item.emailInput}
                            onChange={(e) => {
                              const updated = [...restoringSubmissions];
                              updated[index].emailInput = e.target.value;
                              setRestoringSubmissions(updated);
                            }}
                            className={`w-full px-2.5 py-2 bg-[#121212] border text-xs font-mono text-white rounded focus:border-[#00FF00] focus:outline-none focus:ring-1 focus:ring-[#00FF00]/20 transition-all ${
                              isEmailMissingOrMasked ? "border-amber-500/40" : "border-white/10"
                            }`}
                          />
                          {isEmailMissingOrMasked && (
                            <span className="text-[8px] text-amber-400 font-medium tracking-tight block mt-1 leading-none">
                              ⚠️ Completar si es posible
                            </span>
                          )}
                        </div>

                        {/* PIN */}
                        <div>
                          <label className="block text-[9px] uppercase font-bold tracking-wider text-white/40 mb-1 font-mono">PIN de Seguridad asignado</label>
                          <input
                            type="text"
                            placeholder="PIN de 4 números"
                            value={item.pin}
                            maxLength={10}
                            onChange={(e) => {
                              const updated = [...restoringSubmissions];
                              updated[index].pin = e.target.value;
                              setRestoringSubmissions(updated);
                            }}
                            className="w-full px-2.5 py-2 bg-[#121212] border border-white/10 focus:border-[#00FF00] focus:outline-none text-center text-xs font-mono font-bold text-white rounded"
                          />
                        </div>

                        {/* Teléfono */}
                        <div>
                          <label className="block text-[9px] uppercase font-bold tracking-wider text-white/40 mb-1 font-mono">Teléfono de contacto</label>
                          <input
                            type="text"
                            placeholder="+51999888777"
                            value={item.phone || ""}
                            onChange={(e) => {
                              const updated = [...restoringSubmissions];
                              updated[index].phone = e.target.value;
                              setRestoringSubmissions(updated);
                            }}
                            className="w-full px-2.5 py-2 bg-[#121212] border border-white/10 focus:border-[#00FF00] focus:outline-none text-xs font-mono text-white rounded"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2 mt-1.5 text-xs text-white/50 flex-wrap">
                      <span className="flex items-center gap-1.5 truncate max-w-[170px] sm:max-w-none">
                        <Mail className="w-3.5 h-3.5 text-white/30" /> {isAdmin ? sub.participant.email : maskEmail(sub.participant.email)}
                      </span>
                      {sub.participant.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-white/30" /> {isAdmin ? sub.participant.phone : maskPhone(sub.participant.phone)}
                        </span>
                      )}
                      {isAdmin && (
                        <span className="flex items-center gap-1.5 text-[#00FF00] font-mono bg-[#00FF00]/5 px-2 py-0.5 rounded border border-[#00FF00]/10">
                          <Lock className="w-3 h-3 text-[#00FF00]/60" /> PIN: <strong className="text-white font-black">{sub.participant.pin || "Sin PIN"}</strong>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPlayerPin({
                                id: sub.id,
                                email: sub.participant.email,
                                submittedAt: sub.submittedAt,
                                name: sub.participant.name,
                                currentPin: sub.participant.pin || ""
                              });
                              setNewPlayerPinInput(sub.participant.pin || "");
                              setPlayerPinError("");
                            }}
                            className="ml-1 text-[10px] font-mono font-black text-[#00FF00]/80 hover:text-white underline uppercase cursor-pointer"
                          >
                            Editar
                          </button>
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
                        <Trophy className="w-3.5 h-3.5" /> {sub.totalMatchesPredicted} / {MATCHES.length} Partidos
                      </p>
                      {/* Percent Fill & Visual Meter */}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-mono shrink-0 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">
                          {Math.round((sub.totalMatchesPredicted / MATCHES.length) * 100)}% Completado
                        </span>
                        <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden shrink-0 hidden sm:block">
                          <div 
                            className="bg-[#00FF00] h-full rounded-full" 
                            style={{ width: `${(sub.totalMatchesPredicted / MATCHES.length) * 100}%` }}
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
                  placeholder="Introduce PIN de seguridad"
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

      {/* 3. Change Administrator PIN modal */}
      {showChangeAdminPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-left">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-full w-fit mx-auto text-yellow-400">
              <Lock className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold font-serif italic text-white">Cambiar PIN Administrador</h3>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Define un nuevo PIN de seguridad para acceder al Panel de Control de Administrador.
              </p>
            </div>

            <form onSubmit={handleSaveAdminPin} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1.5 font-mono">Nuevo PIN de Seguridad</label>
                <input
                  type="text"
                  placeholder="PIN de 4 números"
                  value={newAdminPinInput}
                  onChange={(e) => {
                    setNewAdminPinInput(e.target.value.slice(0, 10));
                    if (adminChangeError) setAdminChangeError("");
                  }}
                  className="block w-full px-4 py-2.5 bg-[#121212] border border-white/10 focus:border-[#00FF00] focus:ring-2 focus:ring-[#00FF00]/15 rounded-lg text-center text-lg font-mono font-bold text-white placeholder-white/20 focus:outline-none"
                  maxLength={10}
                  autoFocus
                />
                {adminChangeError && (
                  <p className="text-red-400 text-[11px] font-mono text-center mt-2 flex items-center justify-center gap-1 font-bold">
                    <AlertCircle className="w-3.5 h-3.5" /> {adminChangeError}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowChangeAdminPinModal(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#00FF00] hover:bg-white text-black rounded-lg text-xs font-black transition-colors cursor-pointer uppercase tracking-tight text-center"
                >
                  Guardar PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Edit Player PIN modal */}
      {editingPlayerPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-left">
            <div className="p-3 bg-[#00FF00]/10 border border-[#00FF00]/20 rounded-full w-fit mx-auto text-[#00FF00]">
              <Lock className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold font-serif italic text-white">Editar PIN de Jugador</h3>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Modifica la clave de seguridad de <strong className="text-white">{editingPlayerPin.name}</strong> para que pueda reanudar o editar su quiniela.
              </p>
            </div>

            <form onSubmit={handleUpdatePlayerPin} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-white/40 mb-1.5 font-mono">Nuevo PIN (Mínimo 4 dígitos)</label>
                <input
                  type="text"
                  placeholder="PIN de 4 números"
                  value={newPlayerPinInput}
                  onChange={(e) => {
                    setNewPlayerPinInput(e.target.value.slice(0, 10));
                    if (playerPinError) setPlayerPinError("");
                  }}
                  className="block w-full px-4 py-2.5 bg-[#121212] border border-white/10 focus:border-[#00FF00] focus:ring-2 focus:ring-[#00FF00]/15 rounded-lg text-center text-lg font-mono font-bold text-white placeholder-white/20 focus:outline-none"
                  maxLength={10}
                  autoFocus
                />
                {playerPinError && (
                  <p className="text-red-400 text-[11px] font-mono text-center mt-2 flex items-center justify-center gap-1 font-bold">
                    <AlertCircle className="w-3.5 h-3.5" /> {playerPinError}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  disabled={isUpdatingPin}
                  onClick={() => setEditingPlayerPin(null)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPin}
                  className="flex-1 py-2.5 bg-[#00FF00] hover:bg-white text-black rounded-lg text-xs font-black transition-colors cursor-pointer uppercase tracking-tight text-center flex items-center justify-center gap-1"
                >
                  {isUpdatingPin ? (
                    <span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin"></span>
                  ) : (
                    "Confirmar PIN"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
