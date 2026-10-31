const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongod = null;

// Mock external LLM call globally in tests
jest.mock("../services/nlSearch.service", () => {
  const actual = jest.requireActual("../services/nlSearch.service");
  return {
    ...actual,
    callLLM: jest.fn().mockImplementation(async (query) => {
      // Mocked deterministic LLM extraction
      if (query.toLowerCase().includes("delhi") && query.toLowerCase().includes("mumbai")) {
        return {
          from: "DEL",
          to: "BOM",
          date: null,
          timeOfDay: "morning",
          maxPrice: 6000,
          sortBy: "price",
        };
      }
      return null;
    }),
  };
});

// Mock Razorpay SDK globally in tests
jest.mock("razorpay", () => {
  return jest.fn().mockImplementation(() => ({
    orders: {
      create: jest.fn().mockImplementation(async (params) => ({
        id: `order_mock_${Date.now()}`,
        amount: params.amount,
        currency: params.currency || "INR",
        receipt: params.receipt,
        status: "created",
      })),
    },
    payments: {
      refund: jest.fn().mockImplementation(async (paymentId, params) => ({
        id: `rfnd_mock_${Date.now()}`,
        payment_id: paymentId,
        amount: params.amount,
        status: "processed",
      })),
    },
  }));
});

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test_super_secret_jwt_key_at_least_32_chars";
  process.env.RAZORPAY_KEY_ID = "rzp_test_mock_id";
  process.env.RAZORPAY_KEY_SECRET = "rzp_test_mock_secret_key";
  process.env.RAZORPAY_WEBHOOK_SECRET = "rzp_test_mock_webhook_secret";
  process.env.CLIENT_URL = "http://localhost:5173";

  // First try local running MongoDB (instant, no 600MB binary download required)
  const localUri = process.env.TEST_MONGO_URI || "mongodb://127.0.0.1:27017/skysafe_test";
  try {
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
    console.log("✅ Tests connected to local MongoDB at", localUri);
  } catch (localErr) {
    console.log("Local MongoDB not available, falling back to MongoMemoryServer...");
    mongod = await MongoMemoryServer.create({
      instance: {
        dbName: "skysafe_test",
      },
    });
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  }
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
  }
});
