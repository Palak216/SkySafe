require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

// Connect to MongoDB
connectDB();

// Server Port
const PORT = process.env.PORT || 5000;

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});