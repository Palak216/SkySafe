const request = require("supertest");
const app = require("../app");
const Flight = require("../models/Flight");
const User = require("../models/User");

describe("Flight CRUD & Search Suite", () => {
  let adminToken;
  let userToken;

  beforeEach(async () => {
    await User.create({
      name: "Admin User",
      email: "flightadmin@test.com",
      password: "Password123!",
      role: "admin",
    });
    const adminRes = await request(app).post("/api/auth/login").send({
      email: "flightadmin@test.com",
      password: "Password123!",
    });
    adminToken = adminRes.body.data.token;

    await User.create({
      name: "Regular User",
      email: "flightuser@test.com",
      password: "Password123!",
      role: "user",
    });
    const userRes = await request(app).post("/api/auth/login").send({
      email: "flightuser@test.com",
      password: "Password123!",
    });
    userToken = userRes.body.data.token;
  });

  it("should allow public search with pagination metadata and filters", async () => {
    const dep1 = new Date(Date.now() + 86400000);
    const arr1 = new Date(dep1.getTime() + 7200000);

    await Flight.create([
      {
        flightNumber: "6E-101",
        airline: "IndiGo",
        origin: "DEL",
        destination: "BOM",
        departureTime: dep1,
        arrivalTime: arr1,
        price: 4500,
        totalSeats: 180,
        availableSeats: 180,
        status: "SCHEDULED",
      },
      {
        flightNumber: "AI-202",
        airline: "Air India",
        origin: "DEL",
        destination: "BOM",
        departureTime: dep1,
        arrivalTime: arr1,
        price: 5500,
        totalSeats: 180,
        availableSeats: 180,
        status: "SCHEDULED",
      },
      {
        flightNumber: "UK-303",
        airline: "Vistara",
        origin: "BOM",
        destination: "BLR",
        departureTime: dep1,
        arrivalTime: arr1,
        price: 3800,
        totalSeats: 180,
        availableSeats: 180,
        status: "SCHEDULED",
      },
    ]);

    const res = await request(app).get("/api/flights?from=DEL&to=BOM&page=1&limit=1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.flights.length).toBe(1);
    expect(res.body.pagination.total).toBe(2);
    expect(res.body.pagination.totalPages).toBe(2);
    expect(res.body.pagination.hasNextPage).toBe(true);
  });

  it("should enforce admin-only authorization for flight create, update, delete", async () => {
    const dep = new Date(Date.now() + 86400000);
    const arr = new Date(dep.getTime() + 7200000);
    const flightPayload = {
      flightNumber: "TEST-888",
      airline: "IndiGo",
      origin: "DEL",
      destination: "GOI",
      departureTime: dep.toISOString(),
      arrivalTime: arr.toISOString(),
      price: 5200,
      totalSeats: 180,
      availableSeats: 180,
      aircraft: "Airbus A320",
    };

    // 1. Unauthenticated -> 401
    const unauth = await request(app).post("/api/flights").send(flightPayload);
    expect(unauth.status).toBe(401);

    // 2. Regular user -> 403
    const userAttempt = await request(app)
      .post("/api/flights")
      .set("Authorization", `Bearer ${userToken}`)
      .send(flightPayload);
    expect(userAttempt.status).toBe(403);

    // 3. Admin user -> 201 Created
    const adminCreate = await request(app)
      .post("/api/flights")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(flightPayload);
    expect(adminCreate.status).toBe(201);
    const createdId = adminCreate.body.data._id;

    // 4. Admin update -> 200
    const adminUpdate = await request(app)
      .put(`/api/flights/${createdId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 4999 });
    expect(adminUpdate.status).toBe(200);
    expect(adminUpdate.body.data.price).toBe(4999);

    // 5. Admin delete -> 200
    const adminDelete = await request(app)
      .delete(`/api/flights/${createdId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminDelete.status).toBe(200);

    const checkDeleted = await Flight.findById(createdId);
    expect(checkDeleted).toBeNull();
  });

  it("should reject flight creation with invalid dates or seat counts", async () => {
    const dep = new Date(Date.now() + 86400000);
    const arrBeforeDep = new Date(dep.getTime() - 3600000); // 1 hour prior to departure

    const invalidPayload = {
      flightNumber: "BAD-999",
      airline: "SpiceJet",
      origin: "DEL",
      destination: "BOM",
      departureTime: dep.toISOString(),
      arrivalTime: arrBeforeDep.toISOString(), // Invalid: arrival before departure
      price: 4000,
      totalSeats: 100,
      availableSeats: 150, // Invalid: available > total
    };

    const res = await request(app)
      .post("/api/flights")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(invalidPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
