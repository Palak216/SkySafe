/**
 * Deterministic Flight Ranking & Scoring Service
 *
 * Ranks flight results using explainable, deterministic scoring based on
 * user preferences (price, duration, stops, and departure time windows).
 */

// Default clock windows for broad slots (end time is exclusive)
const SLOT_WINDOWS = {
  morning: ["05:00", "12:00"],
  afternoon: ["12:00", "17:00"],
  evening: ["17:00", "21:00"],
  night: ["21:00", "05:00"], // crosses midnight
};

/** Minutes since midnight, read from the time as written in the ISO string (no timezone shift). */
function minutesOfDay(value) {
  const iso = value instanceof Date ? value.toISOString() : String(value);
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + (m || 0);
}

/**
 * True if the departure falls inside the window. Either bound may be missing.
 * The end time is exclusive, and a window that crosses midnight is handled.
 */
function isInTimeWindow(departure, afterTime, beforeTime) {
  const dep = minutesOfDay(departure);
  if (dep === null) return false;

  const start = afterTime ? toMinutes(afterTime) : null;
  const end = beforeTime ? toMinutes(beforeTime) : null;

  if (start !== null && end !== null) {
    return start <= end ? dep >= start && dep < end : dep >= start || dep < end;
  }
  if (start !== null) return dep >= start;
  if (end !== null) return dep < end;
  return true;
}

/** Works out the active window from explicit times or a broad slot. Returns null if none. */
function resolveTimeWindow({ timeSlot, afterTime, beforeTime }) {
  if (afterTime || beforeTime) {
    return { start: afterTime || null, end: beforeTime || null };
  }
  if (timeSlot && SLOT_WINDOWS[timeSlot]) {
    const [start, end] = SLOT_WINDOWS[timeSlot];
    return { start, end };
  }
  return null;
}

class RankingService {
  /**
   * Scores and sorts flights based on structured user preferences
   * @param {Array} flights - Normalized flight offers
   * @param {object} preferences - User preferences (sortBy, timeSlot, afterTime, beforeTime, nonStop)
   * @returns {Array} Ranked flights with match scores and highlights
   */
  rankFlights(flights, preferences = {}) {
    if (!flights || flights.length === 0) return [];

    const {
      sortBy = "price",
      timeSlot = null,
      afterTime = null,
      beforeTime = null,
      nonStop = false,
    } = preferences;

    const timeWindow = resolveTimeWindow({ timeSlot, afterTime, beforeTime });

    // Find price and duration boundaries for relative scoring
    const prices = flights.map((f) => f.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const durations = flights.map((f) => f.durationMinutes || 120);
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    // Score each flight
    const scoredFlights = flights.map((flight) => {
      let score = 0;
      const highlights = [];

      // 1. Time Preference Match (Max 35 points)
      let matchesTime = false;

      if (timeWindow) {
        matchesTime = isInTimeWindow(flight.departureTime, timeWindow.start, timeWindow.end);
        if (matchesTime) {
          score += 35;
          if (timeWindow.start && timeWindow.end) {
            highlights.push(`Departs ${timeWindow.start}-${timeWindow.end}`);
          } else if (timeWindow.start) {
            highlights.push(`Departs after ${timeWindow.start}`);
          } else {
            highlights.push(`Departs before ${timeWindow.end}`);
          }
        }
      } else {
        // No explicit time preference
        score += 20;
      }

      // 2. Stops / Non-stop Match (Max 30 points)
      if (flight.stops === 0) {
        score += 30;
        highlights.push("Non-stop");
      } else {
        if (!nonStop) {
          score += 15;
          highlights.push(`${flight.stops} Stop`);
        }
      }

      // 3. Price Competitiveness (Max 25 points)
      const priceSpread = maxPrice - minPrice || 1;
      const priceRatio = 1 - (flight.price - minPrice) / priceSpread;
      const pricePoints = Math.round(priceRatio * 25);
      score += pricePoints;

      if (flight.price === minPrice) {
        highlights.push("Cheapest Fare");
      }

      // 4. Duration Competitiveness (Max 10 points)
      const flightDuration = flight.durationMinutes || 120;
      const durationSpread = maxDuration - minDuration || 1;
      const durationRatio = 1 - (flightDuration - minDuration) / durationSpread;
      const durationPoints = Math.round(durationRatio * 10);
      score += durationPoints;

      if (flightDuration === minDuration) {
        highlights.push("Fastest Route");
      }

      return {
        ...flight,
        matchScore: Math.min(100, Math.max(0, score)),
        matchHighlights: highlights,
        matchesTimeWindow: matchesTime,
      };
    });

    // Sort flights based on requested criteria
    scoredFlights.sort((a, b) => {
      // If the user gave a time window or slot, flights inside it come first
      if (timeWindow && a.matchesTimeWindow !== b.matchesTimeWindow) {
        return a.matchesTimeWindow ? -1 : 1;
      }

      // If user asked for non-stop, prioritize non-stop
      if (nonStop && a.stops !== b.stops) {
        return a.stops - b.stops;
      }

      if (sortBy === "duration") {
        if (a.durationMinutes !== b.durationMinutes) {
          return a.durationMinutes - b.durationMinutes;
        }
        return a.price - b.price;
      }

      // Default: price ascending
      if (a.price !== b.price) {
        return a.price - b.price;
      }

      return b.matchScore - a.matchScore;
    });

    // Mark top ranked as best match
    if (scoredFlights.length > 0) {
      scoredFlights[0].isBestMatch = true;
    }

    return scoredFlights;
  }
}

const rankingService = new RankingService();
rankingService.isInTimeWindow = isInTimeWindow; // exposed for unit tests

module.exports = rankingService;