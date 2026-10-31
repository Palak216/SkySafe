const mongoose = require("mongoose");
const env = require("../config/env");
const User = require("../models/User");
const Flight = require("../models/Flight");

async function seedDatabase() {
  try {
    console.log("🌱 Starting SkySafe Database Seeding...");
    const mongoUri = env.MONGO_URI || process.env.MONGO_URI || process.env.MONGODB_URI;

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log("✅ Connected to MongoDB");

    // 1. Seed Admin User
    const adminEmail = (env.ADMIN_EMAIL || "admin@skysafe.com").toLowerCase();
    const adminPassword = env.ADMIN_PASSWORD || "Admin@123456";

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: "SkySafe Admin",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
      });
      console.log(`✅ Admin user created: ${adminEmail}`);
    } else {
      admin.role = "admin";
      admin.password = adminPassword;
      await admin.save();
      console.log(`✅ Admin user updated: ${adminEmail}`);
    }

    // Also seed a test regular user for convenience
    const demoUserEmail = "user@skysafe.com";
    let demoUser = await User.findOne({ email: demoUserEmail });
    if (!demoUser) {
      demoUser = await User.create({
        name: "Demo Traveler",
        email: demoUserEmail,
        password: "User@123456",
        role: "user",
      });
      console.log(`✅ Demo regular user created: ${demoUserEmail}`);
    }

    // 2. Generate ~30 Sample Flights
    console.log("🛫 Seeding sample flights...");
    await Flight.deleteMany({}); // Fresh start for clean seed

    const airlines = [
      { name: "IndiGo", code: "6E", aircraft: "Airbus A320neo" },
      { name: "Air India", code: "AI", aircraft: "Boeing 787 Dreamliner" },
      { name: "Vistara", code: "UK", aircraft: "Airbus A321neo" },
      { name: "SpiceJet", code: "SG", aircraft: "Boeing 737-800" },
      { name: "Akasa Air", code: "QP", aircraft: "Boeing 737 MAX" },
    ];

    const routes = [
      { from: "DEL", to: "BOM", durationMin: 130, basePrice: 4800 },
      { from: "BOM", to: "DEL", durationMin: 125, basePrice: 4700 },
      { from: "DEL", to: "BLR", durationMin: 165, basePrice: 5600 },
      { from: "BLR", to: "DEL", durationMin: 160, basePrice: 5500 },
      { from: "DEL", to: "GOI", durationMin: 155, basePrice: 5200 },
      { from: "BOM", to: "GOI", durationMin: 75, basePrice: 3200 },
      { from: "BLR", to: "GOI", durationMin: 70, basePrice: 2900 },
      { from: "BOM", to: "BLR", durationMin: 100, basePrice: 3900 },
      { from: "BLR", to: "BOM", durationMin: 105, basePrice: 3950 },
      { from: "MAA", to: "DEL", durationMin: 170, basePrice: 5800 },
      { from: "DEL", to: "MAA", durationMin: 165, basePrice: 5900 },
      { from: "MAA", to: "BLR", durationMin: 60, basePrice: 2400 },
      { from: "HYD", to: "DEL", durationMin: 135, basePrice: 4600 },
      { from: "DEL", to: "HYD", durationMin: 130, basePrice: 4500 },
      { from: "CCU", to: "DEL", durationMin: 140, basePrice: 4900 },
      { from: "DEL", to: "CCU", durationMin: 135, basePrice: 5100 },
    ];

    const flightsToInsert = [];
    const now = new Date();

    // Spread flights across today, tomorrow, and the next 4 days
    for (let dayOffset = 0; dayOffset <= 4; dayOffset++) {
      for (let i = 0; i < routes.length; i++) {
        // Create 2 flights per route per day or selective slots
        const route = routes[i];
        const airline = airlines[(i + dayOffset) % airlines.length];
        const flightNum = `${airline.code}-${100 + i * 10 + dayOffset}`;

        // Slots: Morning (08:00), Afternoon (14:30), Evening (19:00)
        const hour = (8 + (i * 3) % 14);
        const depDate = new Date(now);
        depDate.setDate(now.getDate() + dayOffset);
        depDate.setHours(hour, (i * 15) % 60, 0, 0);

        const arrDate = new Date(depDate.getTime() + route.durationMin * 60 * 1000);
        const hours = Math.floor(route.durationMin / 60);
        const mins = route.durationMin % 60;

        flightsToInsert.push({
          flightNumber: flightNum,
          airline: airline.name,
          origin: route.from,
          destination: route.to,
          departureTime: depDate,
          arrivalTime: arrDate,
          duration: `${hours}h ${mins}m`,
          price: route.basePrice + (dayOffset * 150) + (i % 3) * 200,
          totalSeats: 180,
          availableSeats: 180,
          aircraft: airline.aircraft,
          status: "SCHEDULED",
        });

        if (flightsToInsert.length >= 32) break;
      }
      if (flightsToInsert.length >= 32) break;
    }

    const inserted = await Flight.insertMany(flightsToInsert);
    console.log(`✅ Successfully seeded ${inserted.length} sample flights.`);

    console.log("\n=======================================================");
    console.log("🎉 DATABASE SEEDING COMPLETED");
    console.log(`Admin Email: ${adminEmail}`);
    console.log(`Admin Password: ${adminPassword}`);
    console.log(`Sample Flights: ${inserted.length} scheduled`);
    console.log("=======================================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding Error:", err.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
