const express = require("express");

const {
    addFlight,
    getAllFlights,
    getFlightById,
    updateFlight,
    deleteFlight,
} = require("../controllers/flight.controller");

const router = express.Router();

router.post("/", addFlight);

router.get("/", getAllFlights);

router.get("/:id", getFlightById);

router.put("/:id", updateFlight);
router.delete("/:id", deleteFlight);

module.exports = router;