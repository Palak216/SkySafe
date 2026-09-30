/**
 * Deterministic Flight Ranking & Scoring Service
 *
 * Ranks flight results using explainable, deterministic scoring based on
 * user preferences (price, duration, stops, and departure time windows).
 */

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

      const depDate = new Date(flight.departureTime);
      const depHour = depDate.getUTCHours();
      const depMin = depDate.getUTCMinutes();
      const depTimeMinutes = depHour * 60 + depMin;

      // 1. Time Preference Match (Max 35 points)
      let matchesTime = false;

      if (afterTime) {
        const [aHour, aMin] = afterTime.split(":").map(Number);
        const afterMinutes = aHour * 60 + (aMin || 0);
        if (depTimeMinutes >= afterMinutes) {
          matchesTime = true;
          score += 35;
          highlights.push(`Departs after ${afterTime}`);
        }
      } else if (beforeTime) {
        const [bHour, bMin] = beforeTime.split(":").map(Number);
        const beforeMinutes = bHour * 60 + (bMin || 0);
        if (depTimeMinutes <= beforeMinutes) {
          matchesTime = true;
          score += 35;
          highlights.push(`Departs before ${beforeTime}`);
        }
      } else if (timeSlot) {
        if (timeSlot === "morning" && depHour >= 5 && depHour < 12) {
          matchesTime = true;
          score += 35;
          highlights.push("Morning Flight");
        } else if (timeSlot === "afternoon" && depHour >= 12 && depHour < 17) {
          matchesTime = true;
          score += 35;
          highlights.push("Afternoon Flight");
        } else if (timeSlot === "evening" && depHour >= 17 && depHour < 21) {
          matchesTime = true;
          score += 35;
          highlights.push("Evening Flight");
        } else if (timeSlot === "night" && (depHour >= 21 || depHour < 5)) {
          matchesTime = true;
          score += 35;
          highlights.push("Night Flight");
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
      const durationSpread = maxDuration - minDuration || 1;
      const durationRatio = 1 - (flight.durationMinutes - minDuration) / durationSpread;
      const durationPoints = Math.round(durationRatio * 10);
      score += durationPoints;

      if (flight.durationMinutes === minDuration) {
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
      // If user had an explicit time window or slot, prioritize flights that meet the time preference
      if ((timeSlot || afterTime || beforeTime) && a.matchesTimeWindow !== b.matchesTimeWindow) {
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

module.exports = new RankingService();
