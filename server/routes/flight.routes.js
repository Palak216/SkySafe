const express = require("express");

const {
    addFlight,
    getAllFlights,
     getFlightById,
} = require("../controllers/flight.controller");

const router = express.Router();

router.post("/", addFlight);
router.get("/", getAllFlights);
router.get("/:id", getFlightById);

module.exports = router;