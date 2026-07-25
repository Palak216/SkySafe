const express = require("express");

const { addFlight } = require("../controllers/flight.controller");

const router = express.Router();

// Temporary (No Authentication)
router.post("/", addFlight);

module.exports = router;