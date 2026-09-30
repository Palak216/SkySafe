/**
 * Flight Provider Abstraction Service
 *
 * Dispatches flight search requests to AmadeusProvider (primary live API)
 * or MockProvider (offline fallback / test). Gracefully fails over to Mock
 * if Amadeus experiences network timeouts, quota limits, or auth errors.
 */

const amadeusProvider = require("./amadeusProvider");
const mockProvider = require("./mockProvider");

class FlightProviderService {
  /**
   * Searches flights via configured provider with automatic graceful fallback
   * @param {object} searchParams - Sanitized search parameters
   * @returns {Promise<{ flights: Array, providerUsed: string, isFallback: boolean, fallbackReason?: string }>}
   */
  async searchFlights(searchParams) {
    const configuredProvider = (process.env.FLIGHT_PROVIDER || "amadeus").toLowerCase();

    // If explicitly set to mock or Amadeus credentials are not present
    if (configuredProvider === "mock" || !amadeusProvider.isConfigured()) {
      const flights = await mockProvider.searchFlights(searchParams);
      return {
        flights,
        providerUsed: "mock",
        isFallback: configuredProvider !== "mock",
        fallbackReason: configuredProvider !== "mock" ? "Amadeus credentials not configured; used mock provider." : null,
      };
    }

    // Attempt Amadeus Live Search
    try {
      const flights = await amadeusProvider.searchFlights(searchParams);

      // If Amadeus returns 0 flights (e.g. test environment has no flights for that route/date),
      // we can optionally fallback or return the empty list. If empty, mock provides demonstrable data.
      if (flights && flights.length > 0) {
        return {
          flights,
          providerUsed: "amadeus",
          isFallback: false,
        };
      } else {
        console.warn("Amadeus returned 0 flights for route; falling back to Mock Provider for demonstration.");
        const fallbackFlights = await mockProvider.searchFlights(searchParams);
        return {
          flights: fallbackFlights,
          providerUsed: "mock",
          isFallback: true,
          fallbackReason: "Amadeus test environment returned no offers for this route/date.",
        };
      }
    } catch (amadeusError) {
      console.warn(`Amadeus Provider Error: ${amadeusError.message}. Switching to Mock Provider fallback.`);

      const fallbackFlights = await mockProvider.searchFlights(searchParams);
      return {
        flights: fallbackFlights,
        providerUsed: "mock",
        isFallback: true,
        fallbackReason: amadeusError.message,
      };
    }
  }
}

module.exports = new FlightProviderService();
