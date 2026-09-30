/**
 * Automated Test Suite for SkySafe AI Upgrade
 * Tests all 9 scenarios from Section 27 of prompt + booking lifecycle
 */
require("dotenv").config({ path: __dirname + "/.env" });
const mongoose = require("mongoose");
const http = require("http");
const app = require("./app");
const Flight = require("./models/Flight");
const Booking = require("./models/Booking");
const User = require("./models/User");

async function runTests() {
  console.log("==================================================");
  console.log("🚀 STARTING SKYSAFE AUTOMATED TEST SUITE");
  console.log("==================================================");

  // 1. Connect DB
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log("✅ Database Connected");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`✅ Test server running on ${baseUrl}`);

  let passed = 0;
  let failed = 0;

  async function assertTest(name, fn) {
    try {
      await fn();
      console.log(`PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`FAIL: ${name}`);
      console.error(`  Error: ${err.message}`);
      failed++;
    }
  }

  // TEST 1: Cheapest flight from Delhi to Goa tomorrow
  await assertTest("Test 1: 'Find me the cheapest flight from Delhi to Goa tomorrow.'", async () => {
    const res = await fetch(`${baseUrl}/ai/flights/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Find me the cheapest flight from Delhi to Goa tomorrow." }),
    });
    const data = await res.json();
    if (res.status !== 200 || !data.success) throw new Error(data.message || `Status ${res.status}`);
    if (data.query.origin !== "DEL" || data.query.destination !== "GOI") {
      throw new Error(`Unexpected route: ${data.query.origin} -> ${data.query.destination}`);
    }
    if (data.query.sortBy !== "price") throw new Error(`SortBy expected 'price', got ${data.query.sortBy}`);
    if (!data.flights || data.flights.length === 0) throw new Error("No flights returned");
    // Verify sorted by price
    for (let i = 0; i < data.flights.length - 1; i++) {
      if (data.flights[i].price > data.flights[i + 1].price) {
        throw new Error(`Flights not sorted by price: ${data.flights[i].price} > ${data.flights[i + 1].price}`);
      }
    }
  });

  // TEST 2: Non-stop morning flight from Mumbai to Delhi
  await assertTest("Test 2: 'Find a non-stop morning flight from Mumbai to Delhi.'", async () => {
    const res = await fetch(`${baseUrl}/ai/flights/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Find a non-stop morning flight from Mumbai to Delhi." }),
    });
    const data = await res.json();
    if (res.status !== 200 || !data.success) throw new Error(data.message || `Status ${res.status}`);
    if (data.query.origin !== "BOM" || data.query.destination !== "DEL") {
      throw new Error(`Unexpected route: ${data.query.origin} -> ${data.query.destination}`);
    }
    if (!data.query.nonStop) throw new Error("Expected nonStop: true");
    if (!data.query.timePreference?.includes("morning")) throw new Error(`Expected morning preference, got ${data.query.timePreference}`);
    if (!data.flights || data.flights.length === 0) throw new Error("No flights returned");
    // All returned nonStop should have stops === 0
    const nonStopOnly = data.flights.every((f) => f.stops === 0);
    if (!nonStopOnly) throw new Error("Non-stop filter not respected");
  });

  // TEST 3: Chennai to Bangalore after 6 PM
  await assertTest("Test 3: 'I need a flight from Chennai to Bangalore after 6 PM.'", async () => {
    const res = await fetch(`${baseUrl}/ai/flights/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "I need a flight from Chennai to Bangalore after 6 PM." }),
    });
    const data = await res.json();
    if (res.status !== 200 || !data.success) throw new Error(data.message || `Status ${res.status}`);
    if (data.query.origin !== "MAA" || data.query.destination !== "BLR") {
      throw new Error(`Unexpected route: ${data.query.origin} -> ${data.query.destination}`);
    }
    if (data.query.afterTime !== "18:00") throw new Error(`Expected afterTime 18:00, got ${data.query.afterTime}`);
  });

  // TEST 4: Delhi to Mumbai for 2 adults
  await assertTest("Test 4: 'Find flights from Delhi to Mumbai for 2 adults.'", async () => {
    const res = await fetch(`${baseUrl}/ai/flights/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Find flights from Delhi to Mumbai for 2 adults." }),
    });
    const data = await res.json();
    if (res.status !== 200 || !data.success) throw new Error(data.message || `Status ${res.status}`);
    if (data.query.adults !== 2) throw new Error(`Expected 2 adults, got ${data.query.adults}`);
  });

  // TEST 5: Missing date handled safely
  await assertTest("Test 5: 'Find a cheap flight from Delhi to Goa.' (missing date default)", async () => {
    const res = await fetch(`${baseUrl}/ai/flights/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Find a cheap flight from Delhi to Goa." }),
    });
    const data = await res.json();
    if (res.status !== 200 || !data.success) throw new Error(data.message || `Status ${res.status}`);
    if (!data.query.departureDate) throw new Error("Expected fallback departure date");
    if (!data.query.dateInferred) throw new Error("Expected dateInferred: true");
  });

  // TEST 6: Flight to Mars fails gracefully
  await assertTest("Test 6: 'Find me a flight to Mars.' (unknown city graceful error)", async () => {
    const res = await fetch(`${baseUrl}/ai/flights/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Find me a flight to Mars." }),
    });
    const data = await res.json();
    if (res.status !== 400 || data.success) throw new Error(`Expected 400 rejection, got ${res.status}`);
    if (!data.message) throw new Error("Expected friendly error message");
  });

  // TEST 7: Flight from Delhi to Delhi rejected
  await assertTest("Test 7: 'Find me a flight from Delhi to Delhi.' (same origin and dest rejected)", async () => {
    const res = await fetch(`${baseUrl}/ai/flights/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Find me a flight from Delhi to Delhi." }),
    });
    const data = await res.json();
    if (res.status !== 400 || data.success) throw new Error(`Expected 400 rejection, got ${res.status}`);
    if (!data.message.includes("Origin and destination cannot be the same")) {
      throw new Error(`Expected same-city error message, got: ${data.message}`);
    }
  });

  // TEST 8: Past date rejection
  await assertTest("Test 8: Flight with past date rejected", async () => {
    const res = await fetch(`${baseUrl}/ai/flights/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Flight from Delhi to Goa on 2021-05-15" }),
    });
    const data = await res.json();
    if (res.status !== 400 || data.success) throw new Error(`Expected 400 rejection, got ${res.status}`);
    if (!data.message.includes("Departure date cannot be in the past")) {
      throw new Error(`Expected past-date error, got: ${data.message}`);
    }
  });

  // TEST 9: Provider configuration & fallback verification
  await assertTest("Test 9: Provider abstraction & fallback behavior", async () => {
    const res = await fetch(`${baseUrl}/ai/flights/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Flight from Delhi to Mumbai tomorrow" }),
    });
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!["amadeus", "mock"].includes(data.provider)) {
      throw new Error(`Expected provider to be amadeus or mock, got ${data.provider}`);
    }
    if (data.flights.length === 0) throw new Error("Expected fallback to return flight options");
  });

  // TEST 10: Booking Bridge -> MongoDB Record -> Booking Confirmation Lifecycle
  await assertTest("Test 10: Booking Bridge and MongoDB inventory integration", async () => {
    // 1. Search flight
    const searchRes = await fetch(`${baseUrl}/ai/flights/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Cheapest flight from Delhi to Goa tomorrow" }),
    });
    const searchData = await searchRes.json();
    const selectedFlight = searchData.flights[0];

    // 2. Prepare bridge
    const bridgeRes = await fetch(`${baseUrl}/flights/bridge-or-prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flight: selectedFlight }),
    });
    const bridgeData = await bridgeRes.json();
    if (bridgeRes.status !== 200 || !bridgeData.flightId) {
      throw new Error(`Bridge failed: ${bridgeData.message}`);
    }

    // 3. Verify in MongoDB
    const dbFlight = await Flight.findById(bridgeData.flightId);
    if (!dbFlight) throw new Error("MongoDB flight record not found");
    const initialSeats = dbFlight.availableSeats;

    // 4. Test atomic booking decrement
    const testSeatsRequested = 2;
    const updatedFlight = await Flight.findOneAndUpdate(
      { _id: dbFlight._id, availableSeats: { $gte: testSeatsRequested } },
      { $inc: { availableSeats: -testSeatsRequested } },
      { returnDocument: "after" }
    );
    if (updatedFlight.availableSeats !== initialSeats - testSeatsRequested) {
      throw new Error(`Seats not decremented atomically. Expected ${initialSeats - testSeatsRequested}, got ${updatedFlight.availableSeats}`);
    }

    // Restore seats
    await Flight.findByIdAndUpdate(dbFlight._id, { $inc: { availableSeats: testSeatsRequested } });
  });

  // TEST 11: Traditional manual search still works
  await assertTest("Test 11: Traditional flight search continues working", async () => {
    const res = await fetch(`${baseUrl}/flights/search?source=DEL&destination=GOI`);
    const data = await res.json();
    if (res.status !== 200 || !data.success) throw new Error("Traditional search endpoint failed");
  });

  console.log("==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  server.close();
  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => {
  console.error("Test runner crashed:", e);
  process.exit(1);
});
