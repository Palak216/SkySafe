const env = require("./config/env");
const app = require("./app");
const connectDB = require("./config/db");
const { startExpiryJob } = require("./jobs/bookingExpiry.job");

const PORT = env.PORT || process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Start background cron job for auto-expiring unpaid reservations
    startExpiryJob();

    app.listen(PORT, () => {
      console.log(`🚀 SkySafe Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Server startup error:", err);
    process.exit(1);
  }
};

startServer();
