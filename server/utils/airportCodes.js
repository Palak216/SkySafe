/**
 * Airport & City Code Normalization Utility
 * Maps natural-language city names and airport aliases to standard 3-letter IATA codes.
 */

const AIRPORT_DATABASE = {
  DEL: { code: "DEL", city: "Delhi", airport: "Indira Gandhi International Airport", country: "India" },
  BOM: { code: "BOM", city: "Mumbai", airport: "Chhatrapati Shivaji Maharaj International Airport", country: "India" },
  BLR: { code: "BLR", city: "Bangalore", airport: "Kempegowda International Airport", country: "India" },
  GOI: { code: "GOI", city: "Goa", airport: "Dabolim / Manohar International Airport", country: "India" },
  MAA: { code: "MAA", city: "Chennai", airport: "Chennai International Airport", country: "India" },
  CCU: { code: "CCU", city: "Kolkata", airport: "Netaji Subhash Chandra Bose International Airport", country: "India" },
  HYD: { code: "HYD", city: "Hyderabad", airport: "Rajiv Gandhi International Airport", country: "India" },
  AMD: { code: "AMD", city: "Ahmedabad", airport: "Sardar Vallabhbhai Patel International Airport", country: "India" },
  PNQ: { code: "PNQ", city: "Pune", airport: "Pune International Airport", country: "India" },
  JAI: { code: "JAI", city: "Jaipur", airport: "Jaipur International Airport", country: "India" },
  COK: { code: "COK", city: "Kochi", airport: "Cochin International Airport", country: "India" },
  LKO: { code: "LKO", city: "Lucknow", airport: "Chaudhary Charan Singh International Airport", country: "India" },
  IXC: { code: "IXC", city: "Chandigarh", airport: "Shaheed Bhagat Singh International Airport", country: "India" },
  VNS: { code: "VNS", city: "Varanasi", airport: "Lal Bahadur Shastri International Airport", country: "India" },
  ATQ: { code: "ATQ", city: "Amritsar", airport: "Sri Guru Ram Dass Jee International Airport", country: "India" },
  SXR: { code: "SXR", city: "Srinagar", airport: "Sheikh ul-Alam International Airport", country: "India" },
  GAU: { code: "GAU", city: "Guwahati", airport: "Lokpriya Gopinath Bordoloi International Airport", country: "India" },
  BBI: { code: "BBI", city: "Bhubaneswar", airport: "Biju Patnaik International Airport", country: "India" },
  IDR: { code: "IDR", city: "Indore", airport: "Devi Ahilya Bai Holkar Airport", country: "India" },
  PAT: { code: "PAT", city: "Patna", airport: "Jay Prakash Narayan Airport", country: "India" },
  TRV: { code: "TRV", city: "Thiruvananthapuram", airport: "Trivandrum International Airport", country: "India" },
  DXB: { code: "DXB", city: "Dubai", airport: "Dubai International Airport", country: "UAE" },
  SIN: { code: "SIN", city: "Singapore", airport: "Singapore Changi Airport", country: "Singapore" },
  LHR: { code: "LHR", city: "London", airport: "London Heathrow Airport", country: "United Kingdom" },
  JFK: { code: "JFK", city: "New York", airport: "John F. Kennedy International Airport", country: "United States" },
  BKK: { code: "BKK", city: "Bangkok", airport: "Suvarnabhumi Airport", country: "Thailand" },
  CDG: { code: "CDG", city: "Paris", airport: "Charles de Gaulle Airport", country: "France" },
};

// Aliases and natural language representations
const CITY_ALIASES = {
  // Delhi
  delhi: "DEL",
  "new delhi": "DEL",
  ndls: "DEL",
  del: "DEL",
  igi: "DEL",

  // Mumbai
  mumbai: "BOM",
  bombay: "BOM",
  bom: "BOM",
  csia: "BOM",

  // Bangalore
  bangalore: "BLR",
  bengaluru: "BLR",
  blr: "BLR",
  kia: "BLR",

  // Goa
  goa: "GOI",
  goi: "GOI",
  gox: "GOI",
  dabolim: "GOI",
  mopa: "GOI",
  northgoa: "GOI",
  southgoa: "GOI",

  // Chennai
  chennai: "MAA",
  madras: "MAA",
  maa: "MAA",

  // Kolkata
  kolkata: "CCU",
  calcutta: "CCU",
  ccu: "CCU",

  // Hyderabad
  hyderabad: "HYD",
  secunderabad: "HYD",
  hyd: "HYD",

  // Ahmedabad
  ahmedabad: "AMD",
  amd: "AMD",

  // Pune
  pune: "PNQ",
  pnq: "PNQ",

  // Jaipur
  jaipur: "JAI",
  jai: "JAI",

  // Kochi
  kochi: "COK",
  cochin: "COK",
  cok: "COK",

  // Lucknow
  lucknow: "LKO",
  lko: "LKO",

  // Chandigarh
  chandigarh: "IXC",
  ixc: "IXC",

  // Varanasi
  varanasi: "VNS",
  banaras: "VNS",
  kashi: "VNS",
  vns: "VNS",

  // Amritsar
  amritsar: "ATQ",
  atq: "ATQ",

  // Srinagar
  srinagar: "SXR",
  sxr: "SXR",

  // Guwahati
  guwahati: "GAU",
  gau: "GAU",

  // Bhubaneswar
  bhubaneswar: "BBI",
  bbi: "BBI",

  // Indore
  indore: "IDR",
  idr: "IDR",

  // Patna
  patna: "PAT",
  pat: "PAT",

  // Thiruvananthapuram
  thiruvananthapuram: "TRV",
  trivandrum: "TRV",
  trv: "TRV",

  // International
  dubai: "DXB",
  dxb: "DXB",
  singapore: "SIN",
  sin: "SIN",
  changi: "SIN",
  london: "LHR",
  heathrow: "LHR",
  lhr: "LHR",
  newyork: "JFK",
  "new york": "JFK",
  nyc: "JFK",
  jfk: "JFK",
  bangkok: "BKK",
  bkk: "BKK",
  paris: "CDG",
  cdg: "CDG",
};

/**
 * Resolves a city name, alias, or 3-letter IATA code to a standardized IATA code.
 * @param {string} input - City name or IATA code.
 * @returns {string|null} Standard 3-letter IATA code or null if unresolved.
 */
function resolveAirportCode(input) {
  if (!input || typeof input !== "string") return null;

  const sanitized = input.trim().toLowerCase();

  // Direct alias / city match
  if (CITY_ALIASES[sanitized]) {
    return CITY_ALIASES[sanitized];
  }

  // Exact 3-letter uppercase match in database
  const upper = input.trim().toUpperCase();
  if (AIRPORT_DATABASE[upper]) {
    return upper;
  }

  // Check if string contains any known city name
  for (const [alias, code] of Object.entries(CITY_ALIASES)) {
    if (alias.length > 2 && sanitized.includes(alias)) {
      return code;
    }
  }

  // If 3 letters and purely alpha, consider it a possible valid IATA code
  if (/^[A-Za-z]{3}$/.test(input.trim())) {
    return upper;
  }

  return null;
}

/**
 * Gets airport metadata for an IATA code.
 * @param {string} code - 3-letter IATA code.
 * @returns {object} Airport details including city, airport name, and country.
 */
function getAirportDetails(code) {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  return (
    AIRPORT_DATABASE[upper] || {
      code: upper,
      city: upper,
      airport: `${upper} Airport`,
      country: "Unknown",
    }
  );
}

module.exports = {
  resolveAirportCode,
  getAirportDetails,
  AIRPORT_DATABASE,
  CITY_ALIASES,
};
