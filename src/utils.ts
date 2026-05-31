/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Match } from "./games";

/**
 * Returns the country flag emoji for a given team name
 */
export function getTeamFlag(teamName: string): string {
  const flags: { [key: string]: string } = {
    "Mexico": "🇲🇽", "México": "🇲🇽",
    "Sudáfrica": "🇿🇦",
    "Corea del Sur": "🇰🇷",
    "Rep Checa": "🇨🇿",
    "Canadá": "🇨🇦",
    "Bosnia": "🇧🇦",
    "Qatar": "🇶🇦",
    "Suiza": "🇨🇭",
    "Brasil": "🇧🇷",
    "Marruecos": "🇲🇦",
    "Haití": "🇭🇹",
    "Escocia": "🏴\u200d󠁢󠁳󠁣󠁴󠁿",
    "Estados Unidos": "🇺🇸",
    "Paraguay": "🇵🇾",
    "Australia": "🇦🇺",
    "Turquia": "🇹🇷", "Turquía": "🇹🇷",
    "Alemania": "🇩🇪",
    "Curazao": "🇨🇼",
    "Costa de Marfil": "🇨🇮",
    "Ecuador": "🇪🇨",
    "Países Bajos": "🇳🇱",
    "Japón": "🇯🇵",
    "Suecia": "🇸🇪",
    "Túnez": "🇹🇳",
    "Bélgica": "🇧🇪",
    "Egipto": "🇪🇬",
    "Irán": "🇮🇷",
    "Nueva Zelanda": "🇳🇿",
    "España": "🇪🇸",
    "Cabo Verde": "🇨🇻",
    "Arabia saudita": "🇸🇦", "Arabia Saudita": "🇸🇦",
    "Uruguay": "🇺🇾",
    "Francia": "🇫🇷",
    "Senegal": "🇸🇳",
    "Irak": "🇮🇶",
    "Noruega": "🇳🇴",
    "Austria": "🇦🇹",
    "Jordania": "🇯🇴",
    "Argentina": "🇦🇷",
    "Argelia": "🇩🇿",
    "Portugal": "🇵🇹",
    "DR Congo": "🇨🇩",
    "Uzbekistán": "🇺🇿",
    "Colombia": "🇨🇴",
    "Inglaterra": "🏴\u200d󠁢󠁥󠁮󠁧󠁿",
    "Croacia": "🇭🇷",
    "Ghana": "🇬🇭",
    "Panamá": "🇵🇦"
  };
  const normalized = teamName.trim();
  return flags[normalized] || "🏳️";
}

/**
 * Returns a high-quality flag image URL from FlagCDN for a given team name
 */
export function getTeamFlagUrl(teamName: string): string {
  const codes: { [key: string]: string } = {
    "Mexico": "mx", "México": "mx",
    "Sudáfrica": "za",
    "Corea del Sur": "kr",
    "Rep Checa": "cz",
    "Canadá": "ca",
    "Bosnia": "ba",
    "Qatar": "qa",
    "Suiza": "ch",
    "Brasil": "br",
    "Marruecos": "ma",
    "Haití": "ht",
    "Escocia": "gb-sct",
    "Estados Unidos": "us",
    "Paraguay": "py",
    "Australia": "au",
    "Turquia": "tr", "Turquía": "tr",
    "Alemania": "de",
    "Curazao": "cw",
    "Costa de Marfil": "ci",
    "Ecuador": "ec",
    "Países Bajos": "nl",
    "Japón": "jp",
    "Suecia": "se",
    "Túnez": "tn",
    "Bélgica": "be",
    "Egipto": "eg",
    "Irán": "ir",
    "Nueva Zelanda": "nz",
    "España": "es",
    "Cabo Verde": "cv",
    "Arabia saudita": "sa", "Arabia Saudita": "sa",
    "Uruguay": "uy",
    "Francia": "fr",
    "Senegal": "sn",
    "Irak": "iq",
    "Noruega": "no",
    "Austria": "at",
    "Jordania": "jo",
    "Argentina": "ar",
    "Argelia": "dz",
    "Portugal": "pt",
    "DR Congo": "cd",
    "Uzbekistán": "uz",
    "Colombia": "co",
    "Inglaterra": "gb-eng",
    "Croacia": "hr",
    "Ghana": "gh",
    "Panamá": "pa"
  };
  const normalized = teamName.trim();
  const code = codes[normalized];
  if (code) {
    return `https://flagcdn.com/w80/${code}.png`;
  }
  return "";
}

/**
 * Generates a preformatted WhatsApp sharing message with a high-fidelity summarized view of the 72 games
 */
export function generateWhatsAppMessage(
  name: string,
  email: string,
  predictions: { [key: number]: { homeScore: number | ""; awayScore: number | "" } },
  matches: Match[]
): string {
  let text = `🏆 *QUINIELA MUNDIAL 2026* 🏆\n\n`;
  text += `👤 *Participante:* ${name}\n`;
  text += `📧 *Correo:* ${email}\n`;
  text += `📅 *Fecha:* ${new Date().toLocaleDateString()}\n\n`;
  text += `🔮 *PRONÓSTICOS DE FASE DE GRUPOS (${matches.length} juegos):*\n\n`;

  // Group matches by group name for beautiful scannability
  const matchesByGroup: { [group: string]: Match[] } = {};
  matches.forEach((m) => {
    if (!matchesByGroup[m.group]) {
      matchesByGroup[m.group] = [];
    }
    matchesByGroup[m.group].push(m);
  });

  Object.entries(matchesByGroup).forEach(([groupName, groupMatches]) => {
    text += `*${groupName.toUpperCase()}:*\n`;
    groupMatches.forEach((m) => {
      const pred = predictions[m.id];
      const hScore = pred !== undefined ? pred.homeScore : "-";
      const aScore = pred !== undefined ? pred.awayScore : "-";
      const hFlag = getTeamFlag(m.homeTeam);
      const aFlag = getTeamFlag(m.awayTeam);
      text += `• ${hFlag} ${m.homeTeam} *${hScore} - ${aScore}* ${m.awayTeam} ${aFlag}\n`;
    });
    text += `\n`;
  });

  text += `✍️ _Enviado desde el Gestor de Quiniela FWC 2026_`;
  return encodeURIComponent(text);
}

/**
 * Generates a clean tab-separated dataset that can be pasted directly into Excel or Google Sheets
 */
export function generateSpreadsheetPasteableText(
  predictions: { [key: number]: { homeScore: number | ""; awayScore: number | "" } },
  matches: Match[]
): string {
  let text = `ID_PARTIDO\tGRUPO\tEQUIPO_LOCAL\tGOLES_LOCAL\tGOLES_VISITANTE\tEQUIPO_VISITANTE\n`;
  let lastGroup: string | null = null;
  matches.forEach((m) => {
    if (lastGroup !== null && lastGroup !== m.group) {
      text += `\n`;
    }
    lastGroup = m.group;
    const pred = predictions[m.id];
    const hScore = pred !== undefined && pred.homeScore !== undefined ? pred.homeScore : 0;
    const aScore = pred !== undefined && pred.awayScore !== undefined ? pred.awayScore : 0;
    text += `${m.id}\t${m.group}\t${m.homeTeam}\t${hScore}\t${aScore}\t${m.awayTeam}\n`;
  });
  return text;
}

/**
 * Generates a compact raw string for copy-pasting or email bodies
 */
export function generateCompactSummaryText(
  name: string,
  email: string,
  predictions: { [key: number]: { homeScore: number | ""; awayScore: number | "" } },
  matches: Match[]
): string {
  let text = `🏆 QUINIELA MUNDIAL 2026 - QuinielasMRD 🏆\n`;
  text += `====================================\n`;
  text += `Participante: ${name}\n`;
  text += `Correo: ${email}\n`;
  text += `Fecha de Registro: ${new Date().toLocaleString()}\n`;
  text += `====================================\n\n`;
  
  const matchesByGroup: { [group: string]: Match[] } = {};
  matches.forEach((m) => {
    if (!matchesByGroup[m.group]) {
      matchesByGroup[m.group] = [];
    }
    matchesByGroup[m.group].push(m);
  });

  Object.entries(matchesByGroup).forEach(([groupName, groupMatches]) => {
    text += `[${groupName}]\n`;
    groupMatches.forEach((m) => {
      const pred = predictions[m.id];
      const hScore = pred !== undefined ? pred.homeScore : "?";
      const aScore = pred !== undefined ? pred.awayScore : "?";
      text += `  ${m.homeTeam} ${hScore} - ${aScore} ${m.awayTeam}\n`;
    });
    text += `\n`;
  });

  text += `====================================\n`;
  text += `📊 FORMATO EXCEL / GOOGLE SHEETS (TABULADO - COPIAR Y PEGAR COMPLETAMENTE)\n`;
  text += `====================================\n`;
  text += generateSpreadsheetPasteableText(predictions, matches);
  text += `\n====================================\n`;
  text += `✍️ Enviado desde el Gestor de QuinielasMRD FWC 2026\n`;

  return text;
}
