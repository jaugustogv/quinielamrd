/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const APP_VERSION = "2.3.1";
export const VERSION_DATE = "6 de Junio, 2026";

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  type: "major" | "minor" | "patch";
}

export const APP_CHANGELOG: ChangelogEntry[] = [
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
