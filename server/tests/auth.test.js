const request = require("supertest");
const app = require("../app");
const User = require("../models/User");

describe("Authentication & Authorization Suite", () => {
  it("should register a user with default role 'user' and ignore any role passed in body", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test Traveler",
        email: "traveler@test.com",
        password: "Password123!",
        role: "admin", // attempt privilege escalation
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe("user"); // Strictly overridden to user

    const dbUser = await User.findOne({ email: "traveler@test.com" }).select("+password");
    expect(dbUser.role).toBe("user");
    // Password must be hashed with bcrypt
    expect(dbUser.password).not.toBe("Password123!");
    expect(dbUser.password.startsWith("$2")).toBe(true);

    // Verify auth cookie is set once
    const setCookie = res.headers["set-cookie"];
    expect(setCookie).toBeDefined();
    expect(setCookie[0]).toContain("token=");
    expect(setCookie[0]).toContain("HttpOnly");
  });

  it("should not return password in user responses", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        name: "No Pass",
        email: "nopass@test.com",
        password: "SecretPassword123",
      });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "nopass@test.com",
        password: "SecretPassword123",
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.password).toBeUndefined();

    const profileRes = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", `Bearer ${loginRes.body.data.token}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.user.password).toBeUndefined();
  });

  it("should enforce requireAuth and requireRole middleware correctly", async () => {
    // 1. Unauthenticated request
    const unauthRes = await request(app).get("/api/admin/dashboard");
    expect(unauthRes.status).toBe(401);

    // 2. Regular user trying admin endpoint
    const user = await User.create({
      name: "Normal User",
      email: "user@test.com",
      password: "Password123!",
      role: "user",
    });

    const userLogin = await request(app).post("/api/auth/login").send({
      email: "user@test.com",
      password: "Password123!",
    });

    const forbiddenRes = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${userLogin.body.data.token}`);
    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.message).toContain("Forbidden");

    // 3. Admin user trying admin endpoint
    const admin = await User.create({
      name: "Admin User",
      email: "admin@test.com",
      password: "Password123!",
      role: "admin",
    });

    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "Password123!",
    });

    const adminRes = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${adminLogin.body.data.token}`);
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.success).toBe(true);
  });
});
