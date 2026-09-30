/**
 * Flight Query Validation Service
 *
 * Enforces business rules and data integrity on AI/NLP-parsed queries
 * before passing them to flight providers (Amadeus / Mock).
 */

const { AIRPORT_DATABASE, getAirportDetails, resolveAirportCode } = require("../utils/airportCodes");

/**
 * Validates and normalizes structured flight search parameters.
 * @param {object} query - Structured flight search query.
 * @returns {{ valid: boolean, error?: string, sanitizedQuery?: object }}
 */
function validateParsedQuery(query) {
  if (!query || typeof query !== "object") {
    return {
      valid: false,
      error: "Invalid query payload provided.",
    };
  }

  // 1. Origin validation
  let origin = query.origin ? String(query.origin).trim().toUpperCase() : null;
  if (!origin && query.originRaw) {
    origin = resolveAirportCode(query.originRaw);
  }

  if (!origin) {
    return {
      valid: false,
      error: query.originRaw
        ? `Could not find a supported airport for origin "${query.originRaw}". Please specify a known airport or city.`
        : "Departure city (origin) is missing. Please specify where you are flying from (e.g. 'from Delhi').",
    };
  }

  if (!/^[A-Z]{3}$/.test(origin)) {
    return {
      valid: false,
      error: `Invalid origin IATA code "${origin}". Must be a 3-letter code.`,
    };
  }

  // 2. Destination validation
  let destination = query.destination ? String(query.destination).trim().toUpperCase() : null;
  if (!destination && query.destinationRaw) {
    destination = resolveAirportCode(query.destinationRaw);
  }

  if (!destination) {
    return {
      valid: false,
      error: query.destinationRaw
        ? `Could not find a supported airport for destination "${query.destinationRaw}". Please specify a known airport or city.`
        : "Destination city is missing. Please specify where you are flying to (e.g. 'to Goa').",
    };
  }

  if (!/^[A-Z]{3}$/.test(destination)) {
    return {
      valid: false,
      error: `Invalid destination IATA code "${destination}". Must be a 3-letter code.`,
    };
  }

  // 3. Origin vs Destination conflict
  if (origin === destination) {
    const cityName = query.originCity || origin;
    return {
      valid: false,
      error: `Origin and destination cannot be the same airport (${cityName} - ${origin}).`,
    };
  }

  // 4. Departure Date validation
  if (!query.departureDate) {
    return {
      valid: false,
      error: "Departure date is required.",
    };
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(query.departureDate)) {
    return {
      valid: false,
      error: `Invalid date format for departure date: "${query.departureDate}". Expected YYYY-MM-DD.`,
    };
  }

  const [year, month, day] = query.departureDate.split("-").map(Number);
  const departureDateObj = new Date(year, month - 1, day);

  if (
    departureDateObj.getFullYear() !== year ||
    departureDateObj.getMonth() !== month - 1 ||
    departureDateObj.getDate() !== day
  ) {
    return {
      valid: false,
      error: `The specified departure date "${query.departureDate}" does not exist on the calendar.`,
    };
  }

  // Check for past dates
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (departureDateObj < startOfToday) {
    return {
      valid: false,
      error: `Departure date cannot be in the past (${query.departureDate}). Please select today or a future date.`,
    };
  }

  // Max 1 year in advance
  const oneYearFromNow = new Date(startOfToday);
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  if (departureDateObj > oneYearFromNow) {
    return {
      valid: false,
      error: "Flight searches cannot be scheduled more than 1 year in advance.",
    };
  }

  // 5. Return Date validation (if provided)
  let returnDate = query.returnDate || null;
  if (returnDate) {
    if (!dateRegex.test(returnDate)) {
      return {
        valid: false,
        error: `Invalid return date format "${returnDate}". Expected YYYY-MM-DD.`,
      };
    }
    const [rYear, rMonth, rDay] = returnDate.split("-").map(Number);
    const returnDateObj = new Date(rYear, rMonth - 1, rDay);
    if (returnDateObj < departureDateObj) {
      return {
        valid: false,
        error: "Return date cannot be earlier than the departure date.",
      };
    }
  }

  // 6. Passenger count validation
  let adults = parseInt(query.adults, 10);
  if (isNaN(adults) || adults < 1) {
    adults = 1;
  } else if (adults > 9) {
    return {
      valid: false,
      error: "Maximum 9 adult passengers allowed per booking query.",
    };
  }

  // 7. Sort and preferences sanitization
  const allowedSorts = ["price", "duration"];
  const sortBy = allowedSorts.includes(query.sortBy) ? query.sortBy : "price";

  const originDetails = getAirportDetails(origin);
  const destinationDetails = getAirportDetails(destination);

  const sanitizedQuery = {
    origin,
    originCity: originDetails?.city || origin,
    originAirport: originDetails?.airport || `${origin} Airport`,
    destination,
    destinationCity: destinationDetails?.city || destination,
    destinationAirport: destinationDetails?.airport || `${destination} Airport`,
    departureDate: query.departureDate,
    returnDate,
    adults,
    nonStop: Boolean(query.nonStop),
    timePreference: query.timePreference || null,
    timeSlot: query.timeSlot || null,
    afterTime: query.afterTime || null,
    beforeTime: query.beforeTime || null,
    sortBy,
    currency: "INR",
    dateInferred: Boolean(query.dateInferred),
    rawMessage: query.rawMessage || "",
  };

  return {
    valid: true,
    sanitizedQuery,
  };
}

module.exports = {
  validateParsedQuery,
};
