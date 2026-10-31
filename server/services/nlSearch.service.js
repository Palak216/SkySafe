const { z } = require("zod");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const flightService = require("./flight.service");
const { parseFlightQuery } = require("./aiFlightHelper");
const { resolveAirportCode } = require("../utils/airportCodes");

// Zod schema for validated NL search extraction
const nlExtractionSchema = z.object({
  from: z.string().length(3).toUpperCase(),
  to: z.string().length(3).toUpperCase(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  timeOfDay: z.enum(["morning", "afternoon", "evening", "night"]).optional().nullable(),
  maxPrice: z.number().positive().optional().nullable(),
  sortBy: z.enum(["price", "departureTime", "duration"]).optional().default("price"),
});

/**
 * Call external LLM (Gemini or OpenAI-compatible) with strict JSON-only instructions
 * @param {string} userQuery
 * @returns {Promise<Object|null>}
 */
async function callLLM(userQuery) {
  const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const llmKey = env.LLM_API_KEY || process.env.LLM_API_KEY;

  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const prompt = `
Extract flight search criteria from this user travel query: "${userQuery}".
Today's reference date is: ${new Date().toISOString().split("T")[0]}.
Convert city names to 3-letter IATA airport codes (e.g. Delhi -> DEL, Mumbai -> BOM, Bangalore -> BLR, Goa -> GOI).
Return strictly valid raw JSON without any markdown formatting, backticks, or extra commentary.
Expected JSON Schema:
{
  "from": "3-letter origin IATA uppercase",
  "to": "3-letter destination IATA uppercase",
  "date": "YYYY-MM-DD or null",
  "timeOfDay": "morning" | "afternoon" | "evening" | "night" | null,
  "maxPrice": number or null,
  "sortBy": "price" | "departureTime" | "duration"
}
`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) return null;
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;
      return JSON.parse(rawText.trim());
    } catch (err) {
      console.warn("External LLM API call failed, using deterministic fallback:", err.message);
      return null;
    }
  }

  return null;
}

/**
 * Natural language flight search orchestrator
 * @param {string} textQuery
 * @returns {Promise<{ extracted: Object, flights: Array, pagination: Object }>}
 */
async function searchFlightsNaturalLanguage(textQuery) {
  if (!textQuery || typeof textQuery !== "string" || textQuery.trim().length === 0) {
    throw new AppError("Search query text is required", 400);
  }

  let extracted = null;

  // 1. Try LLM if configured
  try {
    const llmResult = await callLLM(textQuery);
    if (llmResult) {
      extracted = llmResult;
    }
  } catch (e) {
    // LLM parsing failed; proceed to semantic rule-based fallback
    extracted = null;
  }

  // 2. Fallback to resilient built-in semantic NLP parser
  if (!extracted || !extracted.from || !extracted.to) {
    try {
      const parsed = await parseFlightQuery(textQuery);
      if (parsed && parsed.origin && parsed.destination) {
        extracted = {
          from: parsed.origin,
          to: parsed.destination,
          date: parsed.departureDate || null,
          timeOfDay: parsed.timePreference || null,
          maxPrice: parsed.maxPrice || null,
          sortBy: parsed.sortBy || "price",
        };
      }
    } catch (fallbackError) {
      console.warn("Fallback semantic parsing failed:", fallbackError.message);
    }
  }

  if (!extracted) {
    throw new AppError(
      "Could not understand flight search parameters. Please mention origin and destination (e.g. 'Flights from Delhi to Mumbai tomorrow').",
      400
    );
  }

  // Ensure origin and destination are valid 3-letter IATA codes
  if (extracted.from && extracted.from.length > 3) {
    extracted.from = resolveAirportCode(extracted.from) || extracted.from.slice(0, 3).toUpperCase();
  }
  if (extracted.to && extracted.to.length > 3) {
    extracted.to = resolveAirportCode(extracted.to) || extracted.to.slice(0, 3).toUpperCase();
  }

  // 3. Strict Zod Validation of Extracted Output
  const parsedOutput = nlExtractionSchema.safeParse(extracted);
  if (!parsedOutput.success) {
    const errorMsg = parsedOutput.error.errors.map((e) => e.message).join(", ");
    throw new AppError(`Invalid search parameters extracted: ${errorMsg}`, 400);
  }

  const validParams = parsedOutput.data;

  if (validParams.from === validParams.to) {
    throw new AppError("Origin and destination cannot be the same city", 400);
  }

  // 4. Run the normal flight query (The LLM never touches booking or payment logic!)
  const searchFilter = {
    from: validParams.from,
    to: validParams.to,
    date: validParams.date || undefined,
    maxPrice: validParams.maxPrice || undefined,
    sortBy: validParams.sortBy || "price",
    order: "asc",
    page: 1,
    limit: 20,
  };

  const results = await flightService.searchFlights(searchFilter);

  return {
    extracted: validParams,
    flights: results.flights,
    pagination: results.pagination,
  };
}

module.exports = {
  searchFlightsNaturalLanguage,
  callLLM,
};
