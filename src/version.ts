/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const APP_VERSION = "2.18.0";
export const VERSION_DATE = "28 de Junio, 2026";

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  type: "major" | "minor" | "patch";
}

export const APP_CHANGELOG: ChangelogEntry[] = [
  {
    version: "2.18.0",
    date: "28 Junio 2026",
    title: "Equipos de 16avos de Final Definidos de Forma 100% Fija para Todos",
    description: "Se definieron y grabaron de forma fija (hardcoded) el 100% de los 16 partidos oficiales correspondientes a los 16avos de Final (partidos 73 al 88) una vez concluidos todos los partidos de los grupos I, J, K y L. Esto permite que todos los usuarios, sin importar su caché, visualicen los países clasificados correctos en tiempo real de forma fija y homogénea.",
    type: "minor"
  },
  {
    version: "2.17.0",
    date: "27 Junio 2026",
    title: "Corrección de Calendario de 16avos de Final Definidos y Comodines",
    description: "Se corrigió el listado de partidos de 16avos de Final (partidos 73 al 88) para reflejar fielmente solo los cotejos que están 100% definidos a la fecha de hoy (June 27, 2026). Los partidos que dependen de los Grupos I, J, K y L (que se disputan hoy mismo) fueron restaurados a sus comodines de clasificación correspondientes (ej. '1I', '2E', '2I', '3BEFIJ', etc.). Esto permite que el sistema de alias/overrides dinámicos del administrador se aplique de forma correcta y transparente en todos los dispositivos.",
    type: "minor"
  },
  {
    version: "2.16.0",
    date: "27 Junio 2026",
    title: "Equipos de 16avos de Final Definidos de Forma Fija",
    description: "Se definieron y grabaron de forma fija (hardcoded) todos los equipos clasificados reales para la fase de 16avos de Final (partidos 73 al 88) en la estructura de datos principal del torneo, garantizando que todos los usuarios y teléfonos visualicen la fase actualizada correctamente sin depender de la caché local del administrador ni de restricciones de permisos en la nube.",
    type: "minor"
  },
  {
    version: "2.15.5",
    date: "27 Junio 2026",
    title: "Verificación de Flexibilidad Dinámica de Equipos",
    description: "Se confirmó y garantizó que los nombres de los equipos de fases eliminatorias siguen siendo completamente dinámicos, editables por el administrador y sincronizables en la nube en tiempo real, manteniendo la lista inicial para evitar cualquier bloqueo estático o rígido.",
    type: "patch"
  },
  {
    version: "2.15.4",
    date: "27 Junio 2026",
    title: "Sincronización de Equipos y Bloqueos en la Nube",
    description: "Se corrigió un problema de permisos en las reglas de seguridad de Firestore (firestore.rules) que bloqueaba el acceso de lectura y escritura a la colección 'config' para usuarios no administradores. Esto impedía que otros dispositivos y teléfonos cargaran los equipos clasificados actualizados de 16avos de Final y los estados de bloqueo de fase, provocando que solo fuesen visibles en la computadora del administrador por caché local.",
    type: "patch"
  },
  {
    version: "2.15.3",
    date: "23 Junio 2026",
    title: "Corrección de Error de Ciclo de React Hooks en Modal de Alias",
    description: "Se corrigió un error de violación de ciclo de React Hooks (llamado condicional de React.useMemo dentro del render JSX), el cual causaba un crash del renderizador del navegador y pantalla en negro al intentar abrir el editor de equipos de 16avos de Final.",
    type: "patch"
  },
  {
    version: "2.15.2",
    date: "23 Junio 2026",
    title: "Soporte Multiplataforma para Edición de Alias",
    description: "Se simplificó la lógica interna de ordenamiento numérico al interior del modal de definición de equipos, mitigando el uso de localeCompare parametrizado avanzado con el objeto de blindarlo contra RangeError típicos de navegadores antiguos, empotrados o sandboxed en iframes.",
    type: "patch"
  },
  {
    version: "2.15.1",
    date: "23 Junio 2026",
    title: "Corrección en Generación de Lista de Alias de Torneo",
    description: "Se corrige un bug crítico en la renderización del modal de alias donde la lista de comodines quedaba vacía (apareciendo en negro) una vez ingresados los primeros nombres. Al mapear sobre la estructura de torneo estática en vez de los partidos dinámicamente resueltos, las opciones de edición para todas las fases permanecen siempre visibles y editables.",
    type: "patch"
  },
  {
    version: "2.15.0",
    date: "23 Junio 2026",
    title: "Administración Completa de Alias para Todas las Fases Eliminatorias",
    description: "Se expande la utilidad de alias de equipos para abarcar la totalidad de las fases finales. El panel 'Fases' del administrador ahora contiene selectores interactivos independientes para asignar nombres reales a clasificados y comodines de 16avos de Final, Octavos de Final, Cuartos de Final, Semifinales, Tercer Puesto, y la Gran Final.",
    type: "minor"
  },
  {
    version: "2.14.0",
    date: "23 Junio 2026",
    title: "Reorganización de Panel de Control y Remoción de Datos de Prueba",
    description: "Reestructuración integral del panel de control de administrador en base a secciones y componentes agrupados de forma lógica (Datos, Accesos, Fases, Alias). Adicionalmente, se removió la opción redundante de generar 5 participantes falsos a fin de resguardar la consistencia física de la base de datos de producción.",
    type: "minor"
  },
  {
    version: "2.13.0",
    date: "23 Junio 2026",
    title: "Alineación de Interfaz y Retiro de Badge Fase 1",
    description: "Se remueve el cuadro indicador redundante de 'Fase 1' debajo del título principal en el encabezado para mantener una interfaz limpia y libre de elementos inactivos.",
    type: "patch"
  },
  {
    version: "2.12.0",
    date: "22 Junio 2026",
    title: "Edición Segura de Correo de Participante",
    description: "Permite a los administradores corregir y actualizar las direcciones de correo electrónico de los participantes registrados desde la lista de inscritos. Incluye validaciones contra duplicados, sincronización con LocalStorage y bases de datos en la nube sin pérdida de información de apuestas o tokens de acceso.",
    type: "minor"
  },
  {
    version: "2.11.0",
    date: "22 Junio 2026",
    title: "Rediseño Responsivo del Panel de Administrador",
    description: "Reorganización completa del contenedor de herramientas de administración para utilizar una rejilla CSS moderna y responsiva. Se solventan desbordamientos o solapamientos visuales de botones de control y utilidades Excel en todo tipo de pantallas.",
    type: "minor"
  },
  {
    version: "2.10.0",
    date: "22 Junio 2026",
    title: "Bloqueo y Apertura Independiente de Fases de Juego",
    description: "Implementación en el Panel de Administración de botones interactivos de bloqueo seguro para habilitar o cerrar de forma independiente la Fase de Grupos (partidos 1-72) y la Segunda Fase/16avos de Final (partidos 73-88). Los formularios, limpiadores y algoritmos de autocompletado respetan y se adaptan a estas reglas automáticamente en tiempo real.",
    type: "minor"
  },
  {
    version: "2.9.1",
    date: "22 Junio 2026",
    title: "Bloqueo de Nuevos Registros en Panel de Control",
    description: "Incorporación de un control en el Panel de Administración para bloquear exclusivamente la creación de nuevos participantes en el sistema, mientras los usuarios previamente registrados conservan la posibilidad de acceder de manera segura con su correo + PIN y actualizar sus pronósticos pendientes para los 16avos de Final.",
    type: "patch"
  },
  {
    version: "2.9.0",
    date: "22 Junio 2026",
    title: "Bloqueo de Primera Fase (Fase de Grupos) y Solo Edición de 16avos de Final",
    description: "Cierre definitivo y de carácter general para la edición de pronósticos de la Primera Fase (Fase de Grupos, partidos 1 al 72). Ahora se habilitan y permiten de manera exclusiva los aportes/modificaciones de pronósticos para la Segunda Fase (16avos de Final, partidos 73 al 88) para todos los usuarios, con retroalimentación visual de bloqueos y candados en tiempo real.",
    type: "minor"
  },
  {
    version: "2.8.0",
    date: "11 Junio 2026",
    title: "Módulo de Segunda Fase (16avos de Final) y Ampliación de Quinielas",
    description: "Ampliación de la plataforma de quinielas a 88 partidos oficiales incorporando la segunda fase clasificatoria (16avos de Final) del Mundial con el orden estricto de siembras definido por el usuario. Implementación de una interfaz fluida con controles segmentados para navegar entre la Fase de Grupos y los 16avos de Final.",
    type: "minor"
  },
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
