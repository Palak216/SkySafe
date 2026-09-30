/**
 * Mock Flight Provider
 *
 * Provides realistic flight offers when Amadeus credentials are absent,
 * offline during demos, or when API quota is reached.
 */

const { getAirportDetails } = require("../../utils/airportCodes");

const AIRLINES = [
  { name: "IndiGo", code: "6E", aircraft: "Airbus A320neo", basePrice: 4200 },
  { name: "Air India", code: "AI", aircraft: "Boeing 787-8 Dreamliner", basePrice: 5400 },
  { name: "Vistara", code: "UK", aircraft: "Airbus A321neo", basePrice: 5800 },
  { name: "SpiceJet", code: "SG", aircraft: "Boeing 737 MAX 8", basePrice: 3900 },
  { name: "Akasa Air", code: "QP", aircraft: "Boeing 737 MAX", basePrice: 4100 },
];

// Schedule templates across distinct times of the day
const SCHEDULE_TEMPLATES = [
  { depHour: 6, depMin: 15, durationMins: 135, stops: 0, priceMultiplier: 0.95, airlineIdx: 0, num: "205" },
  { depHour: 8, depMin: 30, durationMins: 140, stops: 0, priceMultiplier: 1.15, airlineIdx: 2, num: "815" },
  { depHour: 10, depMin: 45, durationMins: 270, stops: 1, priceMultiplier: 0.88, airlineIdx: 3, num: "302" },
  { depHour: 13, depMin: 20, durationMins: 145, stops: 0, priceMultiplier: 1.05, airlineIdx: 1, num: "604" },
  { depHour: 15, depMin: 50, durationMins: 310, stops: 1, priceMultiplier: 0.92, airlineIdx: 0, num: "512" },
  { depHour: 18, depMin: 30, durationMins: 130, stops: 0, priceMultiplier: 1.25, airlineIdx: 2, num: "920" },
  { depHour: 19, depMin: 45, durationMins: 140, stops: 0, priceMultiplier: 1.10, airlineIdx: 4, num: "114" },
  { depHour: 22, depMin: 15, durationMins: 125, stops: 0, priceMultiplier: 0.85, airlineIdx: 0, num: "718" },
];

class MockProvider {
  /**
   * Generates realistic flight offers between any origin and destination pair
   * @param {object} searchParams
   */
  async searchFlights(searchParams) {
    const { origin, destination, departureDate, adults = 1 } = searchParams;

    const originDetails = getAirportDetails(origin);
    const destinationDetails = getAirportDetails(destination);

    // Seed-like deterministic variation based on route and date
    const dateSeed = departureDate ? departureDate.split("-").reduce((acc, v) => acc + parseInt(v, 10), 0) : 42;

    const flights = SCHEDULE_TEMPLATES.map((tmpl, index) => {
      const airline = AIRLINES[tmpl.airlineIdx % AIRLINES.length];
      const flightNumber = `${airline.code}-${tmpl.num}`;

      // Build departure Date
      const depDate = new Date(`${departureDate}T00:00:00.000Z`);
      depDate.setUTCHours(tmpl.depHour, tmpl.depMin, 0, 0);

      // Build arrival Date
      const arrDate = new Date(depDate.getTime() + tmpl.durationMins * 60000);

      const hours = Math.floor(tmpl.durationMins / 60);
      const minutes = tmpl.durationMins % 60;
      const formattedDuration = `${hours}h ${String(minutes).padStart(2, "0")}m`;

      // Calculate price per passenger
      const priceVariation = ((index * 137 + dateSeed) % 500) - 250;
      const singlePrice = Math.round((airline.basePrice * tmpl.priceMultiplier) + priceVariation);
      const totalPrice = singlePrice * adults;

      const availableSeats = 4 + ((index * 3 + dateSeed) % 18);

      return {
        id: `mock_${origin}_${destination}_${index + 1}`,
        rawOfferId: `mock_offer_${index + 1}`,
        flightNumber,
        airline: airline.name,
        airlineCode: airline.code,
        source: origin,
        sourceCity: originDetails?.city || origin,
        sourceAirport: originDetails?.airport || `${origin} Airport`,
        destination: destination,
        destinationCity: destinationDetails?.city || destination,
        destinationAirport: destinationDetails?.airport || `${destination} Airport`,
        departureTime: depDate.toISOString(),
        arrivalTime: arrDate.toISOString(),
        duration: formattedDuration,
        durationMinutes: tmpl.durationMins,
        price: totalPrice,
        currency: "INR",
        stops: tmpl.stops,
        aircraft: airline.aircraft,
        availableSeats,
        totalSeats: 180,
        status: "Scheduled",
        sourceProvider: "mock",
      };
    });

    // If non-stop explicitly requested, filter only non-stop flights
    if (searchParams.nonStop) {
      return flights.filter((f) => f.stops === 0);
    }

    return flights;
  }
}

module.exports = new MockProvider();
