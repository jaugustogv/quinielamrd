/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const APP_VERSION = "2.7.2";
export const VERSION_DATE = "10 de Junio, 2026";

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  type: "major" | "minor" | "patch";
}

export const APP_CHANGELOG: ChangelogEntry[] = [
  {
    version: "2.7.2",
    date: "10 Junio 2026",
    title: "Sanidad de Calendario Escalonada (Julio/Agosto a Junio)",
    description: "Ampliación de la utilidad curativa de base de datos para interceptar y corregir de manera proactiva registros desfasados con fechas en Julio o Agosto, reasignándolos correctamente a Junio (preservando el día original de registro e historial).",
    type: "patch"
  },
  {
    version: "2.7.1",
    date: "10 Junio 2026",
    title: "Parche Automatizado de Fecha para Agosto a Junio",
    description: "Implementación de una utilidad de curación estática en el cargador principal de datos para corregir automáticamente los registros catalogados erróneamente en Agosto (8 de agosto) y reasignarlos con precisión a Junio (8 de junio) tanto en LocalStorage como en Cloud Firestore.",
    type: "patch"
  },
  {
    version: "2.7.0",
    date: "10 Junio 2026",
    title: "Filtro de Duplicados de Jugadores y Ordenamiento Inteligente",
    description: "Incorporación de un filtro estricto anti-duplicados por nombre (case-insensitive y tolerante a espacios adosados) y correo electrónico en el registro de quinielas. Además, se reordenaron de manera predeterminada los participantes por su fecha de última actualización ('último actualizado primero') en todas las vistas y se instaló un parche de autoreparación automático que corrige las planillas con fechas desfasadas del 7 de junio en la base de datos.",
    type: "minor"
  },
  {
    version: "2.6.1",
    date: "09 Junio 2026",
    title: "Corrección de Persistencia en Firestore para Campos Indefinidos",
    description: "Parche de estabilidad que sanitiza y elimina de forma automática atributos con valor 'undefined' (como teléfonos no provistos) antes de registrar o fusionar los datos en Google Cloud Firestore, previniendo fallos de tipo en la restauración o edición de participantes.",
    type: "patch"
  },
  {
    version: "2.6.0",
    date: "09 Junio 2026",
    title: "Herramienta de Restauración y Recuperación desde Excel backing",
    description: "Incorporación de un recuperador inteligente en el panel administrativo para importar y reconstituir la base de datos de usuarios y pronósticos desde un archivo Excel oficial de respaldo. Incluye un asistente interactivo para mitigar el enmascaramiento de privacidad, permitiendo asociar correos y claves personalizadas antes de la persistencia simultánea local y en la nube (Firestore).",
    type: "minor"
  },
  {
    version: "2.5.0",
    date: "08 Junio 2026",
    title: "Bloqueo Global de Edición / Cierre de Fecha Límite",
    description: "Implementación de un botón en el Panel de Administrador para bloquear e impedir que los participantes editen o registren nuevas quinielas una vez alcanzada la fecha límite. Se ofrece un modo de visualización de Solo Lectura para participantes registrados mediante PIN.",
    type: "minor"
  },
  {
    version: "2.4.3",
    date: "07 Junio 2026",
    title: "Protección de PIN de Acceso en Reporte Excel",
    description: "Eliminación del PIN de Acceso de los jugadores en el reporte de exportación consolidado de Excel para garantizar una total privacidad al compartir la planilla públicamente.",
    type: "patch"
  },
  {
    version: "2.4.2",
    date: "07 Junio 2026",
    title: "Optimización de Formato Excel Administrativo",
    description: "Eliminación de la columna con el guion o conector '-' en el reporte consolidado de planillas para permitir una tabulación limpia y directa al compartir.",
    type: "patch"
  },
  {
    version: "2.4.1",
    date: "07 Junio 2026",
    title: "Privacidad de Exportación Excel y Estructura Organizativa",
    description: "Aplicación de máscaras de privacidad para correos y teléfonos también en los archivos Excel exportados a fin de proteger los datos al compartirse públicamente. Asimismo, se incorporaron separaciones en blanco entre grupos de partidos para mayor legibilidad.",
    type: "patch"
  },
  {
    version: "2.4.0",
    date: "07 Junio 2026",
    title: "Exportación Multihoja a Excel y Actualización de Tiempos",
    description: "Incorporación de exportación total de planillas en un único archivo Excel con una pestaña por participante. Además, al editar predicciones, se actualiza el registro a la hora exacta del envío.",
    type: "minor"
  },
  {
    version: "2.3.1",
    date: "06 Junio 2026",
    title: "Personalización de Pestaña Oficial",
    description: "Actualización de la etiqueta e identidad del sitio en la pestaña del navegador para configurarse únicamente como QuinielasMRD.",
    type: "patch"
  },
  {
    version: "2.3.0",
    date: "06 Junio 2026",
    title: "Medidas de Seguridad y Privacidad",
    description: "Actualización crítica de seguridad: Se cambió el PIN predeterminado del administrador para evitar accesos no autorizados y se eliminaron ejemplos numéricos explícitos en los formularios. En cuanto a privacidad, ahora se ocultan (enmascaran) los caracteres de correos electrónicos y teléfonos de todos los participantes en el listado público.",
    type: "minor"
  },
  {
    version: "2.2.1",
    date: "31 Mayo 2026",
    title: "Sincronización de PIN Operador & Reanudación Implícita",
    description: "Guardado del PIN de Operador en la nube (Firestore) para persistencia instantánea en pestañas de incógnito o dispositivos móviles. Rediseño del flujo de reanudación: al ingresar tu correo te pide únicamente el PIN de seguridad y te envía directo a pronosticar sin rellenar datos redundantes.",
    type: "minor"
  },
  {
    version: "2.1.2",
    date: "31 Mayo 2026",
    title: "Indicador de Versiones & Limpiador de Caché",
    description: "Se agregó un rastreador visual de versiones para comprobar actualizaciones en tiempo real y una utilidad de vaciado de caché para evitar conflictos de almacenamiento en navegadores móviles y de escritorio.",
    type: "patch"
  },
  {
    version: "2.1.0",
    date: "31 Mayo 2026",
    title: "Sincronización por Email unificada",
    description: "Mejora del algoritmo de vinculación en la nube para consolidar registros usando el correo electrónico del participante de forma única, previniendo duplicados de usuario al migrar entre dispositivos o navegadores.",
    type: "minor"
  },
  {
    version: "2.0.4",
    date: "31 Mayo 2026",
    title: "Sincronización Silenciosa y Eficiente",
    description: "Eliminación de la advertencia gigante de error. Ahora la sincronización se realiza en segundo plano de manera automática al abrir la pestaña, enfocar la ventana o cada 15 segundos sin interrumpir el juego.",
    type: "patch"
  },
  {
    version: "2.0.0",
    date: "30 Mayo 2026",
    title: "Soporte de Nube con Firebase",
    description: "Integración de almacenamiento persistente centralizado mediante Google Cloud Firestore database para ver y administrar participantes desde cualquier lugar.",
    type: "major"
  },
  {
    version: "1.0.0",
    date: "25 Mayo 2026",
    title: "Lanzamiento Inicial",
    description: "Plataforma local con almacenamiento persistente del navegador y validación de 72 predicciones por participante.",
    type: "major"
  }
];

/**
 * Force clear standard client-side caches (localStorage specific to metadata, service workers, and reloads page)
 */
export function forceBustCacheAndReload() {
  console.log("Iniciando de buster de caché...");
  
  // Keep predictions from localStorage so they don't lose their data!
  // BUT we can clear style flags/temporary keys if any, and unregister Service Workers
  
  // Unregister service workers
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    }).catch(err => {
      console.error("Error al desregistrar service worker:", err);
    });
  }

  // Clear cache storage api if supported
  if ("caches" in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
      }
    }).catch(err => {
      console.error("Error al borrar caches API:", err);
    });
  }

  // Add a query modifier to the URL to force index.html fresh fetch from server
  const url = new URL(window.location.href);
  url.searchParams.set("v", APP_VERSION);
  url.searchParams.set("t", Date.now().toString());
  
  window.location.href = url.toString();
}
