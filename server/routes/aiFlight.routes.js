const express = require("express");
const { searchFlightsAI } = require("../controllers/aiFlight.controller");

const router = express.Router();

// Natural language flight search
router.post("/flights/search", searchFlightsAI);

module.exports = router;
