/** @typedef {"en" | "fr" | "es"} Locale */

export const LOCALE_KEY = "dogpark-locale";

/** @type {Record<Locale, Record<string, string>>} */
const MESSAGES = {
  en: {
    skipLink: "Skip to main content",
    metaDescription:
      "Searchable directory of dog parks mapped from OpenStreetMap across Canada, the United States, and Mexico.",
    docTitle: "Dog parks in North America",
    themeLight: "Light",
    themeDark: "Dark",
    themeGroupAria: "Color theme",
    langGroupAria: "Language",
    siteHeaderEyebrow: "Open map data · ODbL",
    siteTitle: "Dog parks across North America",
    ledeBefore: "Find off-leash and fenced parks from ",
    ledeAfter: ". Search, filter by region, or browse the map.",
    controlsAriaLabel: "Search and filters",
    labelSearch: "Search",
    searchPlaceholder: "Name, city, tags, or URL…",
    labelCountry: "Country",
    countryAll: "All countries",
    labelProvince: "State / province",
    regionAll: "All regions",
    labelSort: "Sort",
    sortNameAsc: "Name (A–Z)",
    sortNameDesc: "Name (Z–A)",
    sortDist: "Nearest first",
    tagFiltersLegend: "OpenStreetMap tags",
    filterWebsite: "Has website",
    filterLit: "Lit (lit=yes)",
    filterFenced: "Fenced",
    filterWheelchair: "Wheelchair (yes or limited)",
    filterFeefree: "Free (fee=no)",
    btnNearMe: "Near me",
    btnGeojson: "Download GeoJSON",
    loadingData: "Loading data…",
    dataHintStatic:
      "Community-maintained map data — tags may be incomplete. Always confirm hours, fees, and rules on site before visiting.",
    directoryHeading: "Directory",
    directoryDesc: "Select a park to move the map, or focus the list below and use arrow keys",
    listPanelAria: "Results",
    mapHeading: "Map",
    mapDesc: "Open markers for details",
    mapAria: "Map of dog parks",
    reviewsDialogTitle: "Visitor reviews",
    reviewsClose: "Close dialog",
    reviewsAddHeading: "Add your visit",
    reviewsRating: "Rating",
    reviewsStarsAria: "Rating 1 to 5 stars",
    reviewsName: "Your name (optional)",
    reviewsText: "Review",
    reviewsTextPh: "Fencing, water, shade, mud, how busy it was…",
    reviewsPhoto: "Photo link (optional)",
    reviewsPhotoPh: "https://…",
    reviewsHint:
      "Static site — reviews never upload anywhere. They are kept in this browser only (localStorage).",
    reviewsSubmit: "Post review",
    footerRefresh: "Refresh data with",
    footerResume: "interrupted?",
    footerDisclaimerA: "Always confirm hours and local leash rules on site.",
    footerDisclaimerB:
      "Fully static: visitor reviews use browser storage only (not shared between users).",
    footerDisclaimerC: "OSM tags can be incomplete — verify on site or",
    footerImproveMap: "improve the map",
    reviewsExport: "Export reviews backup",
    reviewsImport: "Import reviews…",
    loadError: "Could not load data/parks.json — run node scripts/fetch-parks.mjs",
    geoNoBrowser: "Geolocation is not available in this browser.",
    geoDenied: "Could not read your location. Check browser permissions.",
    geojsonEmpty: "No parks in the current filter to export.",
    geojsonCap: "Exporting first {{cap}} of {{n}} parks. Narrow filters to include fewer.",
    importSuccess: "Imported {{count}} review(s) for {{parks}} park(s).",
    importFail: "Import failed.",
    importMergeTitle:
      "Merge imported reviews with what you already have in this browser?\n\nOK = merge\nCancel = replace all reviews",
    chipHours: "Hours",
    chipFee: "Fee",
    chipAccess: "Access",
    chipSurface: "Surface",
    chipLit: "Lit",
    chipFence: "Fence",
    chipDog: "Dogs",
    chipWheelchair: "Wheelchair",
    chipOperator: "Operator",
    chipNameEn: "Also known as",
    chipsAria: "Tags from OpenStreetMap",
    mapsGroupAria: "Open this location in other maps",
    mapLinkOsm: "Map",
    mapLinkGoogle: "Google Maps",
    mapLinkApple: "Apple Maps",
    linkWebsite: "Website",
    placeFallback: "North America",
    reviewEmpty: "Please write a short review.",
    reviewSaveError: "Could not save review.",
    mapPreviewAlt: "Map preview near {{name}}",
    noReviewsYet: "No reviews yet in this browser. Add yours below.",
    photoLink: "Photo link",
    reviewStarsOutOf: "{{rating}} out of 5",
    reviewOne: "review",
    reviewMany: "reviews",
    reviewSee: "See reviews",
    reviewWrite: "Write a review",
    summaryAria: "Average {{avg}} of 5 from {{count}} reviews",
    noReviewsBrowser: "No reviews in this browser yet",
    popupWebsite: "Website",
    popupReviewsEmpty: "Reviews — write one",
    popupReviewsFmt: "Reviews ({{count}}) · {{avg}}★",
    metaMore: " Showing first 500 of {{n}} matches.",
    metaLine: "{{date}}{{n}} park{{plural}}{{more}} · {{total}} in dataset",
    northAmerica: "North America",
    starAriaOne: "{{n}} star",
    starAriaMany: "{{n}} stars",
  },
  fr: {
    skipLink: "Aller au contenu principal",
    metaDescription:
      "Répertoire consultable de parcs à chiens issus d’OpenStreetMap au Canada, aux États-Unis et au Mexique.",
    docTitle: "Parcs à chiens en Amérique du Nord",
    themeLight: "Clair",
    themeDark: "Sombre",
    themeGroupAria: "Thème de couleur",
    langGroupAria: "Langue",
    siteHeaderEyebrow: "Données cartographiques libres · ODbL",
    siteTitle: "Parcs à chiens en Amérique du Nord",
    ledeBefore: "Trouvez des parcs en liberté ou clôturés via ",
    ledeAfter: ". Recherchez, filtrez par région ou parcourez la carte.",
    controlsAriaLabel: "Recherche et filtres",
    labelSearch: "Recherche",
    searchPlaceholder: "Nom, ville, attributs ou URL…",
    labelCountry: "Pays",
    countryAll: "Tous les pays",
    labelProvince: "État / province",
    regionAll: "Toutes les régions",
    labelSort: "Trier",
    sortNameAsc: "Nom (A–Z)",
    sortNameDesc: "Nom (Z–A)",
    sortDist: "Les plus proches",
    tagFiltersLegend: "Attributs OpenStreetMap",
    filterWebsite: "Avec site web",
    filterLit: "Éclairé (lit=yes)",
    filterFenced: "Clôturé",
    filterWheelchair: "Fauteuil roulant (yes ou limited)",
    filterFeefree: "Gratuit (fee=no)",
    btnNearMe: "Près de moi",
    btnGeojson: "Télécharger GeoJSON",
    loadingData: "Chargement des données…",
    dataHintStatic:
      "Données communautaires — les attributs peuvent être incomplets. Vérifiez sur place horaires, frais et règles.",
    directoryHeading: "Répertoire",
    directoryDesc:
      "Choisissez un parc pour déplacer la carte, ou placez le focus sur la liste et utilisez les flèches",
    listPanelAria: "Résultats",
    mapHeading: "Carte",
    mapDesc: "Ouvrez les repères pour les détails",
    mapAria: "Carte des parcs à chiens",
    reviewsDialogTitle: "Avis des visiteurs",
    reviewsClose: "Fermer la fenêtre",
    reviewsAddHeading: "Ajouter votre visite",
    reviewsRating: "Note",
    reviewsStarsAria: "Note de 1 à 5 étoiles",
    reviewsName: "Votre nom (facultatif)",
    reviewsText: "Avis",
    reviewsTextPh: "Clôture, eau, ombre, boue, affluence…",
    reviewsPhoto: "Lien photo (facultatif)",
    reviewsPhotoPh: "https://…",
    reviewsHint:
      "Site statique — les avis ne sont jamais envoyés sur un serveur. Ils restent dans ce navigateur (localStorage).",
    reviewsSubmit: "Publier l’avis",
    footerRefresh: "Actualiser les données avec",
    footerResume: "interrompu ?",
    footerDisclaimerA: "Vérifiez toujours les heures et règles de laisse sur place.",
    footerDisclaimerB:
      "Entièrement statique : les avis sont stockés localement (non partagés entre utilisateurs).",
    footerDisclaimerC: "Les attributs OSM peuvent être incomplets — vérifiez sur place ou",
    footerImproveMap: "améliorez la carte",
    reviewsExport: "Exporter une sauvegarde des avis",
    reviewsImport: "Importer des avis…",
    loadError: "Impossible de charger data/parks.json — exécutez node scripts/fetch-parks.mjs",
    geoNoBrowser: "La géolocalisation n’est pas disponible dans ce navigateur.",
    geoDenied: "Impossible d’obtenir votre position. Vérifiez les permissions du navigateur.",
    geojsonEmpty: "Aucun parc dans les filtres actuels à exporter.",
    geojsonCap: "Export des {{cap}} premiers sur {{n}} parcs. Réduisez les filtres pour en inclure moins.",
    importSuccess: "{{count}} avis importé(s) pour {{parks}} parc(s).",
    importFail: "Échec de l’importation.",
    importMergeTitle:
      "Fusionner avec les avis déjà dans ce navigateur ?\n\nOK = fusionner\nAnnuler = tout remplacer",
    chipHours: "Heures",
    chipFee: "Tarif",
    chipAccess: "Accès",
    chipSurface: "Surface",
    chipLit: "Éclairage",
    chipFence: "Clôture",
    chipDog: "Chiens",
    chipWheelchair: "Fauteuil roulant",
    chipOperator: "Gestionnaire",
    chipNameEn: "Aussi connu comme",
    chipsAria: "Attributs OpenStreetMap",
    mapsGroupAria: "Ouvrir ce lieu dans d’autres cartes",
    mapLinkOsm: "Carte",
    mapLinkGoogle: "Google Maps",
    mapLinkApple: "Plans Apple",
    linkWebsite: "Site web",
    placeFallback: "Amérique du Nord",
    reviewEmpty: "Veuillez écrire un court avis.",
    reviewSaveError: "Impossible d’enregistrer l’avis.",
    mapPreviewAlt: "Aperçu carte près de {{name}}",
    noReviewsYet: "Pas encore d’avis dans ce navigateur. Ajoutez le vôtre ci-dessous.",
    photoLink: "Lien photo",
    reviewStarsOutOf: "{{rating}} sur 5",
    reviewOne: "avis",
    reviewMany: "avis",
    reviewSee: "Voir les avis",
    reviewWrite: "Écrire un avis",
    summaryAria: "Moyenne {{avg}} sur 5 pour {{count}} avis",
    noReviewsBrowser: "Pas encore d’avis dans ce navigateur",
    popupWebsite: "Site web",
    popupReviewsEmpty: "Avis — écrire",
    popupReviewsFmt: "Avis ({{count}}) · {{avg}}★",
    metaMore: " Affichage des 500 premiers sur {{n}} résultats.",
    metaLine: "{{date}}{{n}} parc{{plural}}{{more}} · {{total}} dans les données",
    northAmerica: "Amérique du Nord",
    starAriaOne: "{{n}} étoile",
    starAriaMany: "{{n}} étoiles",
  },
  es: {
    skipLink: "Saltar al contenido principal",
    metaDescription:
      "Directorio consultable de parques para perros de OpenStreetMap en Canadá, Estados Unidos y México.",
    docTitle: "Parques para perros en Norteamérica",
    themeLight: "Claro",
    themeDark: "Oscuro",
    themeGroupAria: "Tema de color",
    langGroupAria: "Idioma",
    siteHeaderEyebrow: "Datos cartográficos abiertos · ODbL",
    siteTitle: "Parques para perros en Norteamérica",
    ledeBefore: "Encuentra parques sin correa o cercados en ",
    ledeAfter: ". Busca, filtra por región o explora el mapa.",
    controlsAriaLabel: "Búsqueda y filtros",
    labelSearch: "Buscar",
    searchPlaceholder: "Nombre, ciudad, etiquetas o URL…",
    labelCountry: "País",
    countryAll: "Todos los países",
    labelProvince: "Estado / provincia",
    regionAll: "Todas las regiones",
    labelSort: "Orden",
    sortNameAsc: "Nombre (A–Z)",
    sortNameDesc: "Nombre (Z–A)",
    sortDist: "Más cercanos",
    tagFiltersLegend: "Etiquetas de OpenStreetMap",
    filterWebsite: "Con sitio web",
    filterLit: "Iluminado (lit=yes)",
    filterFenced: "Cercado",
    filterWheelchair: "Silla de ruedas (yes o limited)",
    filterFeefree: "Gratis (fee=no)",
    btnNearMe: "Cerca de mí",
    btnGeojson: "Descargar GeoJSON",
    loadingData: "Cargando datos…",
    dataHintStatic:
      "Datos mantenidos por la comunidad; las etiquetas pueden estar incompletas. Confirma horarios, tarifas y reglas en el lugar.",
    directoryHeading: "Directorio",
    directoryDesc:
      "Elige un parque para mover el mapa, o enfoca la lista abajo y usa las flechas",
    listPanelAria: "Resultados",
    mapHeading: "Mapa",
    mapDesc: "Abre los marcadores para ver detalles",
    mapAria: "Mapa de parques para perros",
    reviewsDialogTitle: "Opiniones de visitantes",
    reviewsClose: "Cerrar ventana",
    reviewsAddHeading: "Añade tu visita",
    reviewsRating: "Calificación",
    reviewsStarsAria: "Calificación de 1 a 5 estrellas",
    reviewsName: "Tu nombre (opcional)",
    reviewsText: "Reseña",
    reviewsTextPh: "Cerca, agua, sombra, lodo, aforo…",
    reviewsPhoto: "Enlace de foto (opcional)",
    reviewsPhotoPh: "https://…",
    reviewsHint:
      "Sitio estático: las reseñas nunca se suben a ningún servidor. Solo se guardan en este navegador (localStorage).",
    reviewsSubmit: "Publicar reseña",
    footerRefresh: "Actualizar datos con",
    footerResume: "¿interrumpido?",
    footerDisclaimerA: "Confirma siempre horarios y reglas de correa en el sitio.",
    footerDisclaimerB:
      "Totalmente estático: las opiniones solo usan el almacenamiento del navegador (no se comparten).",
    footerDisclaimerC: "Las etiquetas OSM pueden estar incompletas — verifica en el sitio o",
    footerImproveMap: "mejora el mapa",
    reviewsExport: "Exportar copia de reseñas",
    reviewsImport: "Importar reseñas…",
    loadError: "No se pudo cargar data/parks.json — ejecuta node scripts/fetch-parks.mjs",
    geoNoBrowser: "La geolocalización no está disponible en este navegador.",
    geoDenied: "No se pudo obtener tu ubicación. Revisa los permisos del navegador.",
    geojsonEmpty: "No hay parques en el filtro actual para exportar.",
    geojsonCap: "Exportando los primeros {{cap}} de {{n}} parques. Reduce los filtros para incluir menos.",
    importSuccess: "Se importaron {{count}} reseña(s) para {{parks}} parque(s).",
    importFail: "Error al importar.",
    importMergeTitle:
      "¿Fusionar con las reseñas que ya tienes en este navegador?\n\nOK = fusionar\nCancelar = reemplazar todo",
    chipHours: "Horario",
    chipFee: "Tarifa",
    chipAccess: "Acceso",
    chipSurface: "Superficie",
    chipLit: "Iluminación",
    chipFence: "Cerca",
    chipDog: "Perros",
    chipWheelchair: "Silla de ruedas",
    chipOperator: "Operador",
    chipNameEn: "También conocido como",
    chipsAria: "Etiquetas de OpenStreetMap",
    mapsGroupAria: "Abrir esta ubicación en otros mapas",
    mapLinkOsm: "Mapa",
    mapLinkGoogle: "Google Maps",
    mapLinkApple: "Apple Maps",
    linkWebsite: "Sitio web",
    placeFallback: "Norteamérica",
    reviewEmpty: "Escribe una reseña breve.",
    reviewSaveError: "No se pudo guardar la reseña.",
    mapPreviewAlt: "Vista del mapa cerca de {{name}}",
    noReviewsYet: "Aún no hay reseñas en este navegador. Añade la tuya abajo.",
    photoLink: "Enlace de foto",
    reviewStarsOutOf: "{{rating}} de 5",
    reviewOne: "reseña",
    reviewMany: "reseñas",
    reviewSee: "Ver reseñas",
    reviewWrite: "Escribir reseña",
    summaryAria: "Promedio {{avg}} de 5 con {{count}} reseñas",
    noReviewsBrowser: "Aún no hay reseñas en este navegador",
    popupWebsite: "Sitio web",
    popupReviewsEmpty: "Reseñas — escribe una",
    popupReviewsFmt: "Reseñas ({{count}}) · {{avg}}★",
    metaMore: " Mostrando los primeros 500 de {{n}} coincidencias.",
    metaLine: "{{date}}{{n}} parque{{plural}}{{more}} · {{total}} en el conjunto de datos",
    northAmerica: "Norteamérica",
    starAriaOne: "{{n}} estrella",
    starAriaMany: "{{n}} estrellas",
  },
};

/** @returns {Locale} */
export function getLocale() {
  try {
    const s = localStorage.getItem(LOCALE_KEY);
    if (s === "fr" || s === "es" || s === "en") return s;
  } catch {
    /* ignore */
  }
  return "en";
}

/** @param {Locale} loc */
export function setLocale(loc) {
  try {
    localStorage.setItem(LOCALE_KEY, loc);
  } catch {
    /* private mode */
  }
}

/** @param {string} key @param {Record<string, string | number>=} vars */
export function t(key, vars) {
  const loc = getLocale();
  let s = MESSAGES[loc]?.[key] ?? MESSAGES.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replaceAll(`{{${k}}}`, String(v));
    }
  }
  return s;
}

/** @param {Locale} loc */
export function htmlLang(loc) {
  if (loc === "fr") return "fr-CA";
  if (loc === "es") return "es-MX";
  return "en-CA";
}

export function applyDomI18n() {
  document.documentElement.lang = htmlLang(getLocale());
  document.title = t("docTitle");
  const md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute("content", t("metaDescription"));

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    el.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (!key || !(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
    el.placeholder = t(key);
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (!key) return;
    el.setAttribute("aria-label", t(key));
  });

  const sortSel = /** @type {HTMLSelectElement | null} */ (document.getElementById("sort"));
  if (sortSel) {
    const o0 = sortSel.querySelector('option[value="name-asc"]');
    const o1 = sortSel.querySelector('option[value="name-desc"]');
    const o2 = sortSel.querySelector('option[value="dist"]');
    if (o0) o0.textContent = t("sortNameAsc");
    if (o1) o1.textContent = t("sortNameDesc");
    if (o2) o2.textContent = t("sortDist");
  }
}

/**
 * @param {() => void} onLocaleChange
 */
export function initLocaleToolbar(onLocaleChange) {
  document.querySelectorAll("[data-locale]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const loc = /** @type {string} */ (btn.getAttribute("data-locale"));
      if (loc !== "en" && loc !== "fr" && loc !== "es") return;
      setLocale(/** @type {Locale} */ (loc));
      applyDomI18n();
      syncLocaleButtons();
      onLocaleChange?.();
    });
  });
  syncLocaleButtons();
}

export function syncLocaleButtons() {
  const loc = getLocale();
  document.querySelectorAll("[data-locale]").forEach((btn) => {
    const on = btn.getAttribute("data-locale") === loc;
    btn.setAttribute("aria-pressed", String(on));
    btn.classList.toggle("pref-btn--active", on);
  });
}

export function syncThemeLabels() {
  const light = document.getElementById("theme-light");
  const dark = document.getElementById("theme-dark");
  if (light) {
    light.textContent = t("themeLight");
    light.setAttribute("aria-label", t("themeLight"));
  }
  if (dark) {
    dark.textContent = t("themeDark");
    dark.setAttribute("aria-label", t("themeDark"));
  }
  const g = document.getElementById("theme-group");
  if (g) g.setAttribute("aria-label", t("themeGroupAria"));
  const lg = document.getElementById("lang-group");
  if (lg) lg.setAttribute("aria-label", t("langGroupAria"));
}
