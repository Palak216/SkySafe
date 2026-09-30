/**
 * Amadeus Self-Service Test API Provider
 *
 * Implements OAuth2 token negotiation with in-memory caching and
 * flight-offers search normalization.
 */

const { getAirportDetails } = require("../../utils/airportCodes");

class AmadeusProvider {
  constructor() {
    this.clientId = process.env.AMADEUS_CLIENT_ID || "";
    this.clientSecret = process.env.AMADEUS_CLIENT_SECRET || "";
    this.baseUrl = "https://test.api.amadeus.com";
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
  }

  /**
   * Checks whether Amadeus credentials have been configured
   */
  isConfigured() {
    return Boolean(
      this.clientId &&
      this.clientId.trim() !== "" &&
      this.clientSecret &&
      this.clientSecret.trim() !== ""
    );
  }

  /**
   * Fetches or reuses cached OAuth2 bearer token from Amadeus Test API
   */
  async getAccessToken() {
    if (!this.isConfigured()) {
      throw new Error("Amadeus credentials (AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET) are not configured.");
    }

    // Reuse token if still valid for at least 60 seconds
    const now = Date.now();
    if (this.cachedToken && now < this.tokenExpiresAt - 60000) {
      return this.cachedToken;
    }

    const tokenUrl = `${this.baseUrl}/v1/security/oauth2/token`;
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", this.clientId.trim());
    params.append("client_secret", this.clientSecret.trim());

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = `Amadeus auth failed (HTTP ${response.status})`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error_description) errorMsg += `: ${parsed.error_description}`;
      } catch (e) {
        errorMsg += `: ${errText}`;
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    this.cachedToken = data.access_token;
    // expires_in is in seconds
    this.tokenExpiresAt = Date.now() + (data.expires_in || 1799) * 1000;

    return this.cachedToken;
  }

  /**
   * Searches flight offers via Amadeus v2/shopping/flight-offers
   * @param {object} searchParams
   */
  async searchFlights(searchParams) {
    const token = await this.getAccessToken();

    const queryParams = new URLSearchParams({
      originLocationCode: searchParams.origin,
      destinationLocationCode: searchParams.destination,
      departureDate: searchParams.departureDate,
      adults: String(searchParams.adults || 1),
      currencyCode: searchParams.currency || "INR",
      max: "20",
    });

    if (searchParams.nonStop) {
      queryParams.append("nonStop", "true");
    }

    if (searchParams.returnDate) {
      queryParams.append("returnDate", searchParams.returnDate);
    }

    const searchUrl = `${this.baseUrl}/v2/shopping/flight-offers?${queryParams.toString()}`;

    const response = await fetch(searchUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(12000), // 12s timeout
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = `Amadeus search failed (HTTP ${response.status})`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.errors && parsed.errors.length > 0) {
          errorMsg = parsed.errors.map((e) => e.detail || e.title).join(", ");
        }
      } catch (e) {
        errorMsg += `: ${errText}`;
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const dictionaries = data.dictionaries || {};

    return this.normalizeFlightOffers(data.data || [], dictionaries, searchParams);
  }

  /**
   * Normalizes raw Amadeus flight offer objects into SkySafe standard format
   */
  normalizeFlightOffers(offers, dictionaries, searchParams) {
    const carriers = dictionaries.carriers || {};
    const aircraftMap = dictionaries.aircraft || {};

    return offers.map((offer, index) => {
      // First itinerary represents outbound flight
      const itinerary = offer.itineraries?.[0] || {};
      const segments = itinerary.segments || [];
      const firstSegment = segments[0] || {};
      const lastSegment = segments[segments.length - 1] || firstSegment;

      const carrierCode = firstSegment.carrierCode || "AI";
      const airlineName = carriers[carrierCode] || carrierCode;
      const flightNumber = `${carrierCode}-${firstSegment.number || "101"}`;

      const depTimeStr = firstSegment.departure?.at;
      const arrTimeStr = lastSegment.arrival?.at;

      const depDate = new Date(depTimeStr);
      const arrDate = new Date(arrTimeStr);

      // Duration: Amadeus format is PT2H35M
      const rawDuration = itinerary.duration || "PT2H00M";
      const { formattedDuration, durationMinutes } = this.parseDuration(rawDuration);

      const price = parseFloat(offer.price?.total || offer.price?.grandTotal || "5000");
      const currency = offer.price?.currency || "INR";
      const stops = Math.max(0, segments.length - 1);

      const originCode = firstSegment.departure?.iataCode || searchParams.origin;
      const destinationCode = lastSegment.arrival?.iataCode || searchParams.destination;

      const originDetails = getAirportDetails(originCode);
      const destinationDetails = getAirportDetails(destinationCode);

      const aircraftCode = firstSegment.aircraft?.code;
      const aircraft = aircraftMap[aircraftCode] || (aircraftCode ? `Aircraft ${aircraftCode}` : "Airbus A320");

      return {
        id: `amadeus_${offer.id || index + 1}`,
        rawOfferId: offer.id,
        flightNumber,
        airline: airlineName,
        airlineCode: carrierCode,
        source: originCode,
        sourceCity: originDetails?.city || originCode,
        sourceAirport: originDetails?.airport || `${originCode} Airport`,
        destination: destinationCode,
        destinationCity: destinationDetails?.city || destinationCode,
        destinationAirport: destinationDetails?.airport || `${destinationCode} Airport`,
        departureTime: depDate.toISOString(),
        arrivalTime: arrDate.toISOString(),
        duration: formattedDuration,
        durationMinutes,
        price: Math.round(price),
        currency,
        stops,
        aircraft,
        availableSeats: offer.numberOfBookableSeats || 9,
        totalSeats: 180,
        status: "Scheduled",
        sourceProvider: "amadeus",
      };
    });
  }

  /**
   * Converts ISO-8601 duration (e.g. PT2H30M or PT1H) to human readable and total minutes
   */
  parseDuration(durationStr) {
    if (!durationStr) return { formattedDuration: "2h 00m", durationMinutes: 120 };

    const hoursMatch = durationStr.match(/(\d+)H/);
    const minsMatch = durationStr.match(/(\d+)M/);

    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const mins = minsMatch ? parseInt(minsMatch[1], 10) : 0;
    const durationMinutes = hours * 60 + mins;

    const formattedDuration = `${hours}h ${String(mins).padStart(2, "0")}m`;
    return { formattedDuration, durationMinutes };
  }
}

module.exports = new AmadeusProvider();
