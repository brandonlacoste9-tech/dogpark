/** Human-readable country and region names for the directory UI. */

export const COUNTRY_LABELS = {
  CA: "Canada",
  US: "United States",
  MX: "Mexico",
};

export const COUNTRY_LABELS_FR = {
  CA: "Canada",
  US: "États-Unis",
  MX: "Mexique",
};

export const COUNTRY_LABELS_ES = {
  CA: "Canadá",
  US: "Estados Unidos",
  MX: "México",
};

/**
 * @param {string | null | undefined} code
 * @param {"en" | "fr" | "es"} locale
 */
export function countryLabel(code, locale = "en") {
  if (!code) return "";
  if (locale === "fr") return COUNTRY_LABELS_FR[code] ?? COUNTRY_LABELS[code] ?? code;
  if (locale === "es") return COUNTRY_LABELS_ES[code] ?? COUNTRY_LABELS[code] ?? code;
  return COUNTRY_LABELS[code] ?? code;
}

export const REGION_LABELS = {
  CA: {
    AB: "Alberta",
    BC: "British Columbia",
    MB: "Manitoba",
    NB: "New Brunswick",
    NL: "Newfoundland and Labrador",
    NS: "Nova Scotia",
    NT: "Northwest Territories",
    NU: "Nunavut",
    ON: "Ontario",
    PE: "Prince Edward Island",
    QC: "Quebec",
    SK: "Saskatchewan",
    YT: "Yukon",
  },
  US: {
    AL: "Alabama",
    AK: "Alaska",
    AZ: "Arizona",
    AR: "Arkansas",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DE: "Delaware",
    DC: "District of Columbia",
    FL: "Florida",
    GA: "Georgia",
    HI: "Hawaii",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    IA: "Iowa",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    ME: "Maine",
    MD: "Maryland",
    MA: "Massachusetts",
    MI: "Michigan",
    MN: "Minnesota",
    MS: "Mississippi",
    MO: "Missouri",
    MT: "Montana",
    NE: "Nebraska",
    NV: "Nevada",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NY: "New York",
    NC: "North Carolina",
    ND: "North Dakota",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    RI: "Rhode Island",
    SC: "South Carolina",
    SD: "South Dakota",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VT: "Vermont",
    VA: "Virginia",
    WA: "Washington",
    WV: "West Virginia",
    WI: "Wisconsin",
    WY: "Wyoming",
    PR: "Puerto Rico",
  },
  MX: {
    AGS: "Aguascalientes",
    BCN: "Baja California",
    BCS: "Baja California Sur",
    CAM: "Campeche",
    CHP: "Chiapas",
    CHH: "Chihuahua",
    COA: "Coahuila",
    COL: "Colima",
    CMX: "Mexico City",
    DUR: "Durango",
    GTO: "Guanajuato",
    GRO: "Guerrero",
    HGO: "Hidalgo",
    JAL: "Jalisco",
    MEX: "México",
    MIC: "Michoacán",
    MOR: "Morelos",
    NAY: "Nayarit",
    NLE: "Nuevo León",
    OAX: "Oaxaca",
    PUE: "Puebla",
    QUE: "Querétaro",
    ROO: "Quintana Roo",
    SLP: "San Luis Potosí",
    SIN: "Sinaloa",
    SON: "Sonora",
    TAB: "Tabasco",
    TAM: "Tamaulipas",
    TLA: "Tlaxcala",
    VER: "Veracruz",
    YUC: "Yucatán",
    ZAC: "Zacatecas",
  },
};

/**
 * @param {string | null} country
 * @param {string | null} province
 */
export function regionLabel(country, province) {
  if (!country || !province) return "";
  const map = REGION_LABELS[country];
  return map?.[province] ?? province;
}
