/**
 * AI & NLP Flight Query Parser Service
 *
 * Transforms natural-language travel requests into structured JSON parameters.
 * Supports external LLM (e.g. Gemini) if GEMINI_API_KEY is configured,
 * with a deterministic, resilient built-in NLP semantic engine as fallback/primary.
 */

const { resolveAirportCode, getAirportDetails, CITY_ALIASES } = require("../utils/airportCodes");

/**
 * Format a Date object as YYYY-MM-DD in local time
 */
function formatDateYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates a date relative to today (e.g. tomorrow, specific weekday, or parsed string)
 */
function parseRelativeDate(text, referenceDate = new Date()) {
  const lower = text.toLowerCase();

  // "today"
  if (/\btoday\b/.test(lower)) {
    return { date: formatDateYYYYMMDD(referenceDate), inferred: false };
  }

  // "day after tomorrow"
  if (/\bday after tomorrow\b/.test(lower)) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() + 2);
    return { date: formatDateYYYYMMDD(d), inferred: false };
  }

  // "tomorrow"
  if (/\btomorrow\b/.test(lower)) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() + 1);
    return { date: formatDateYYYYMMDD(d), inferred: false };
  }

  // Days of week: "next monday", "this friday", "on sunday"
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayMatch = lower.match(/\b(?:next|this|on)?\s*(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
  if (dayMatch && dayMatch[1]) {
    const targetDayIndex = daysOfWeek.indexOf(dayMatch[1]);
    const currentDayIndex = referenceDate.getDay();
    let daysToAdd = targetDayIndex - currentDayIndex;
    if (daysToAdd <= 0) daysToAdd += 7; // move to next occurrence
    const d = new Date(referenceDate);
    d.setDate(d.getDate() + daysToAdd);
    return { date: formatDateYYYYMMDD(d), inferred: false };
  }

  // ISO format YYYY-MM-DD
  const isoMatch = lower.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    return { date: `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`, inferred: false };
  }

  // Month names e.g. "October 5", "5th of October", "5 Oct", "Oct 5"
  const months = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
    may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, september: 9,
    oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
  };

  const monthRegex = /\b(?:on\s+)?(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?|(\d{1,2})(?:st|nd|rd|th)?(?:\s+(?:of\s+)?)(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?))\b/i;
  const monthMatch = text.match(monthRegex);

  if (monthMatch) {
    const monthStr = (monthMatch[1] || monthMatch[4]).toLowerCase();
    const dayNum = parseInt(monthMatch[2] || monthMatch[3], 10);
    const monthNum = months[monthStr];
    let year = referenceDate.getFullYear();

    // If month/day already passed this year, schedule for next year
    const tentativeDate = new Date(year, monthNum - 1, dayNum);
    const startOfToday = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
    if (tentativeDate < startOfToday) {
      year += 1;
    }

    const mm = String(monthNum).padStart(2, "0");
    const dd = String(dayNum).padStart(2, "0");
    return { date: `${year}-${mm}-${dd}`, inferred: false };
  }

  // Default: tomorrow if no date mentioned
  const tomorrow = new Date(referenceDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { date: formatDateYYYYMMDD(tomorrow), inferred: true };
}

/**
 * Extracts origin and destination using regex patterns and city dictionary matching
 */
function extractOriginDestination(text) {
  const clean = text.trim();

  // Pattern 1: "from <origin> to <destination>"
  const fromToMatch = clean.match(/\b(?:from|departing\s+from|leaving)\s+([a-zA-Z\s]+?)\s+(?:to|towards|for)\s+([a-zA-Z\s]+?)(?:\s+(?:on|tomorrow|today|this|next|after|before|around|morning|afternoon|evening|night|for\s+\d|\d{1,2}\s+[a-z]+|\d{4}-\d{2}-\d{2}|$)|[.,?!]|$)/i);
  if (fromToMatch) {
    const originRaw = fromToMatch[1].trim();
    const destRaw = fromToMatch[2].trim();
    const originCode = resolveAirportCode(originRaw);
    const destCode = resolveAirportCode(destRaw);
    return {
      originRaw,
      origin: originCode,
      destinationRaw: destRaw,
      destination: destCode,
    };
  }

  // Pattern 2: "<origin> to <destination>" (e.g. "Delhi to Goa", "Mumbai - Delhi")
  const toMatch = clean.match(/\b([a-zA-Z\s]+?)\s*(?:to|-|->)\s*([a-zA-Z\s]+?)(?:\s+(?:on|tomorrow|today|this|next|after|before|around|morning|afternoon|evening|night|for\s+\d|\d{1,2}\s+[a-z]+|\d{4}-\d{2}-\d{2}|$)|[.,?!]|$)/i);
  if (toMatch) {
    const originRaw = toMatch[1].replace(/^(?:find|search|book|show|get|want|need|give)\s+(?:me\s+)?(?:a\s+|an\s+)?(?:cheap|cheapest|affordable|non-?stop|morning|evening|flight|flights)*\s*/i, "").trim();
    const destRaw = toMatch[2].trim();
    const originCode = resolveAirportCode(originRaw);
    const destCode = resolveAirportCode(destRaw);
    if (originCode || destCode) {
      return {
        originRaw,
        origin: originCode,
        destinationRaw: destRaw,
        destination: destCode,
      };
    }
  }

  // Pattern 3: City dictionary scanning
  const words = clean.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/);
  const foundCities = [];

  // Check multi-word aliases first
  const sortedAliases = Object.keys(CITY_ALIASES).sort((a, b) => b.length - a.length);
  let scanText = ` ${clean.toLowerCase()} `;
  for (const alias of sortedAliases) {
    const pattern = new RegExp(`\\b${alias}\\b`, "i");
    const match = scanText.match(pattern);
    if (match) {
      foundCities.push({ name: alias, code: CITY_ALIASES[alias], index: match.index });
      scanText = scanText.replace(pattern, " ".repeat(alias.length));
    }
  }

  // Sort by appearance in sentence
  foundCities.sort((a, b) => a.index - b.index);

  if (foundCities.length >= 2) {
    return {
      originRaw: foundCities[0].name,
      origin: foundCities[0].code,
      destinationRaw: foundCities[1].name,
      destination: foundCities[1].code,
    };
  } else if (foundCities.length === 1) {
    // If only one city found, check if it was preceded by "to" or "from"
    const hasFrom = new RegExp(`from\\s+${foundCities[0].name}`, "i").test(clean);
    if (hasFrom) {
      return {
        originRaw: foundCities[0].name,
        origin: foundCities[0].code,
        destinationRaw: null,
        destination: null,
      };
    }
    return {
      originRaw: null,
      origin: null,
      destinationRaw: foundCities[0].name,
      destination: foundCities[0].code,
    };
  }

  return { originRaw: null, origin: null, destinationRaw: null, destination: null };
}

/**
 * Extracts time preferences (morning, afternoon, evening, night, after 6 PM, etc.)
 */
function extractTimePreference(text) {
  const lower = text.toLowerCase();

  // Explicit hour restrictions
  const afterMatch = lower.match(/\bafter\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (afterMatch) {
    let hour = parseInt(afterMatch[1], 10);
    const minute = afterMatch[2] ? parseInt(afterMatch[2], 10) : 0;
    const meridian = afterMatch[3] ? afterMatch[3].toLowerCase() : null;

    if (meridian === "pm" && hour < 12) hour += 12;
    if (meridian === "am" && hour === 12) hour = 0;
    // Default PM if unspecified and hour between 1 and 11 in flight context like "after 6"
    if (!meridian && hour >= 1 && hour <= 11) hour += 12;

    const formattedTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    return {
      preference: `after ${afterMatch[1]} ${afterMatch[3] || "PM"}`.trim(),
      afterTime: formattedTime,
      slot: hour >= 18 ? "evening" : hour >= 12 ? "afternoon" : "morning",
    };
  }

  const beforeMatch = lower.match(/\bbefore\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (beforeMatch) {
    let hour = parseInt(beforeMatch[1], 10);
    const minute = beforeMatch[2] ? parseInt(beforeMatch[2], 10) : 0;
    const meridian = beforeMatch[3] ? beforeMatch[3].toLowerCase() : null;

    if (meridian === "pm" && hour < 12) hour += 12;
    if (meridian === "am" && hour === 12) hour = 0;

    const formattedTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    return {
      preference: `before ${beforeMatch[1]} ${beforeMatch[3] || "AM"}`.trim(),
      beforeTime: formattedTime,
      slot: hour <= 12 ? "morning" : hour <= 18 ? "afternoon" : "evening",
    };
  }

  // Broad slots
  if (/\b(?:early\s+)?morning\b/.test(lower)) {
    return { preference: "morning", slot: "morning", afterTime: "05:00", beforeTime: "12:00" };
  }
  if (/\bafternoon\b/.test(lower)) {
    return { preference: "afternoon", slot: "afternoon", afterTime: "12:00", beforeTime: "17:00" };
  }
  if (/\bevening\b/.test(lower)) {
    return { preference: "evening", slot: "evening", afterTime: "17:00", beforeTime: "21:00" };
  }
  if (/\b(?:late\s+)?night\b/.test(lower)) {
    return { preference: "night", slot: "night", afterTime: "21:00", beforeTime: "05:00" };
  }

  return { preference: null, slot: null };
}

/**
 * Built-in NLP query parser
 */
function parseFlightQueryWithNLP(message) {
  if (!message || typeof message !== "string") {
    throw new Error("Query message is required");
  }

  const rawMessage = message.trim();
  const lower = rawMessage.toLowerCase();

  // 1. Origin & Destination
  const { origin, originRaw, destination, destinationRaw } = extractOriginDestination(rawMessage);

  // 2. Date
  const { date: departureDate, inferred: dateInferred } = parseRelativeDate(rawMessage);

  // 3. Time preference
  const timeInfo = extractTimePreference(rawMessage);

  // 4. Non-stop preference
  const nonStop = /\b(?:non-?stop|direct|zero\s+stops?|without\s+stops?)\b/i.test(lower);

  // 5. Sorting / Price
  let sortBy = "price"; // default preference
  if (/\b(?:fastest|quickest|shortest|least\s+time)\b/i.test(lower)) {
    sortBy = "duration";
  } else if (/\b(?:cheapest|cheap|affordable|budget|lowest\s+price|lowest\s+fare)\b/i.test(lower)) {
    sortBy = "price";
  }

  // 6. Passenger count
  let adults = 1;
  const adultsMatch = lower.match(/\b(?:for\s+)?(\d+)\s*(?:adults?|passengers?|people|persons?|seats?)\b/i);
  if (adultsMatch) {
    const parsed = parseInt(adultsMatch[1], 10);
    if (parsed >= 1 && parsed <= 9) {
      adults = parsed;
    }
  }

  const originDetails = origin ? getAirportDetails(origin) : null;
  const destDetails = destination ? getAirportDetails(destination) : null;

  return {
    rawMessage,
    origin,
    originRaw,
    originCity: originDetails ? originDetails.city : originRaw,
    destination,
    destinationRaw,
    destinationCity: destDetails ? destDetails.city : destinationRaw,
    departureDate,
    dateInferred,
    returnDate: null,
    adults,
    nonStop,
    timePreference: timeInfo.preference,
    timeSlot: timeInfo.slot,
    afterTime: timeInfo.afterTime || null,
    beforeTime: timeInfo.beforeTime || null,
    sortBy,
    currency: "INR",
    parser: "nlp-engine",
  };
}

/**
 * Optional Gemini LLM parsing wrapper.
 * If GEMINI_API_KEY is available in environment, calls Google Gemini.
 * If anything fails or key is absent, gracefully falls back to NLP parser.
 */
async function parseFlightQuery(message) {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey && geminiKey.trim() !== "") {
    try {
      const todayISO = formatDateYYYYMMDD(new Date());
      const prompt = `You are a travel flight search assistant. Extract structured flight search parameters from the following user query:
"${message}"

Today's date is: ${todayISO}.
Return ONLY a valid JSON object with the following fields:
{
  "origin": string (3-letter IATA code if known, e.g. "DEL", or city name),
  "destination": string (3-letter IATA code if known, e.g. "GOI", or city name),
  "departureDate": string (YYYY-MM-DD format based on user request; if not specified or relative, calculate from today ${todayISO}),
  "adults": number (integer 1-9, default 1),
  "nonStop": boolean (true if user asked for non-stop or direct, else false),
  "timePreference": string or null (e.g. "morning", "afternoon", "evening", "night", "after 6 PM"),
  "sortBy": string ("price" or "duration")
}`;

      // Call Gemini 2.5 Flash / 1.5 Flash endpoint via native fetch
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsedLLM = JSON.parse(text);
          // Resolve airport codes
          const resolvedOrigin = resolveAirportCode(parsedLLM.origin);
          const resolvedDest = resolveAirportCode(parsedLLM.destination);

          return {
            rawMessage: message,
            origin: resolvedOrigin || parsedLLM.origin,
            originCity: resolvedOrigin ? getAirportDetails(resolvedOrigin).city : parsedLLM.origin,
            destination: resolvedDest || parsedLLM.destination,
            destinationCity: resolvedDest ? getAirportDetails(resolvedDest).city : parsedLLM.destination,
            departureDate: parsedLLM.departureDate || parseRelativeDate(message).date,
            dateInferred: !parsedLLM.departureDate,
            adults: Math.max(1, Math.min(9, parseInt(parsedLLM.adults, 10) || 1)),
            nonStop: Boolean(parsedLLM.nonStop),
            timePreference: parsedLLM.timePreference || null,
            sortBy: parsedLLM.sortBy === "duration" ? "duration" : "price",
            currency: "INR",
            parser: "gemini-llm",
          };
        }
      }
    } catch (llmError) {
      console.warn("Gemini LLM parsing failed or timed out. Falling back to built-in NLP engine:", llmError.message);
    }
  }

  // Primary / Fallback: deterministic NLP parser
  return parseFlightQueryWithNLP(message);
}

module.exports = {
  parseFlightQuery,
  parseFlightQueryWithNLP,
  formatDateYYYYMMDD,
  parseRelativeDate,
  extractOriginDestination,
};
