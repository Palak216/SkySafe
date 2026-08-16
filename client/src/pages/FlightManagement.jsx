import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";

import {
  getAllFlights,
  addFlight,
  updateFlight,
  deleteFlight,
} from "../services/adminService";

function FlightManagement() {
  const navigate = useNavigate();

  const [flights, setFlights] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    flightNumber: "",
    airline: "",
    source: "",
    destination: "",
    departureTime: "",
    arrivalTime: "",
    duration: "",
    price: "",
    totalSeats: "",
    availableSeats: "",
    aircraft: "",
    status: "Scheduled",
  });

  // ==============================
  // Fetch Flights
  // ==============================

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      setLoading(true);

      const data = await getAllFlights();

      console.log("FLIGHTS:", data.flights);

      setFlights(data.flights || []);
    } catch (error) {
      console.log("FETCH FLIGHTS ERROR:", error);

      alert(
        error.response?.data?.message ||
          "Unable to fetch flights"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // Handle Input
  // ==============================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // ==============================
  // Reset Form
  // ==============================

  const resetForm = () => {
    setFormData({
      flightNumber: "",
      airline: "",
      source: "",
      destination: "",
      departureTime: "",
      arrivalTime: "",
      duration: "",
      price: "",
      totalSeats: "",
      availableSeats: "",
      aircraft: "",
      status: "Scheduled",
    });

    setEditingId(null);
    setShowForm(false);
  };

  // ==============================
  // Submit Form
  // ==============================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const flightData = {
        ...formData,

        price: Number(formData.price),

        totalSeats: Number(formData.totalSeats),

        availableSeats: Number(
          formData.availableSeats
        ),
      };

      let data;

      // EDIT
      if (editingId) {
        data = await updateFlight(
          editingId,
          flightData
        );

        alert(data.message);
      }

      // ADD
      else {
        data = await addFlight(flightData);

        alert(data.message);
      }

      resetForm();

      await fetchFlights();

    } catch (error) {
      console.log("SAVE FLIGHT ERROR:", error);

      alert(
        error.response?.data?.message ||
          "Unable to save flight"
      );
    }
  };

  // ==============================
  // Edit Flight
  // ==============================

  const handleEdit = (flight) => {
    setEditingId(flight._id);

    setFormData({
      flightNumber: flight.flightNumber || "",
      airline: flight.airline || "",
      source: flight.source || "",
      destination: flight.destination || "",

      departureTime: flight.departureTime
        ? new Date(flight.departureTime)
            .toISOString()
            .slice(0, 16)
        : "",

      arrivalTime: flight.arrivalTime
        ? new Date(flight.arrivalTime)
            .toISOString()
            .slice(0, 16)
        : "",

      duration: flight.duration || "",

      price: flight.price || "",

      totalSeats: flight.totalSeats || "",

      availableSeats:
        flight.availableSeats || "",

      aircraft: flight.aircraft || "",

      status: flight.status || "Scheduled",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==============================
  // Delete Flight
  // ==============================

  const handleDelete = async (flightId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this flight?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const data = await deleteFlight(flightId);

      alert(data.message);

      await fetchFlights();

    } catch (error) {
      console.log("DELETE FLIGHT ERROR:", error);

      alert(
        error.response?.data?.message ||
          "Unable to delete flight"
      );
    }
  };

  // ==============================
  // Loading
  // ==============================

  if (loading) {
    return (
      <>
        <Navbar />

        <h1 className="text-center mt-20 text-3xl">
          Loading Flights...
        </h1>
      </>
    );
  }

  // ==============================
  // UI
  // ==============================

  return (
    <>
      <Navbar />

      <section className="min-h-screen bg-gray-100 py-10 px-5">

        <div className="max-w-7xl mx-auto">

          {/* Header */}

          <div className="flex justify-between items-center mb-8">

            <div>

              <h1 className="text-4xl font-bold text-blue-700">
                Flight Management
              </h1>

              <p className="text-gray-500 mt-2">
                Add, edit and manage SkySafe flights
              </p>

            </div>

            <button
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  setShowForm(true);
                }
              }}
              className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg"
            >
              {showForm
                ? "Close Form"
                : "+ Add Flight"}
            </button>

          </div>


          {/* ==============================
              Add / Edit Form
          ============================== */}

          {showForm && (

            <form
              onSubmit={handleSubmit}
              className="bg-white shadow-lg rounded-xl p-8 mb-10"
            >

              <h2 className="text-2xl font-bold text-blue-700 mb-6">
                {editingId
                  ? "Edit Flight"
                  : "Add New Flight"}
              </h2>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Flight Number */}

                <input
                  type="text"
                  name="flightNumber"
                  placeholder="Flight Number"
                  value={formData.flightNumber}
                  onChange={handleChange}
                  className="border rounded-lg p-3"
                  required
                />


                {/* Airline */}

                <input
                  type="text"
                  name="airline"
                  placeholder="Airline"
                  value={formData.airline}
                  onChange={handleChange}
                  className="border rounded-lg p-3"
                  required
                />


                {/* Source */}

                <input
                  type="text"
                  name="source"
                  placeholder="Source"
                  value={formData.source}
                  onChange={handleChange}
                  className="border rounded-lg p-3"
                  required
                />


                {/* Destination */}

                <input
                  type="text"
                  name="destination"
                  placeholder="Destination"
                  value={formData.destination}
                  onChange={handleChange}
                  className="border rounded-lg p-3"
                  required
                />


                {/* Departure */}

                <div>

                  <label className="block text-sm font-semibold mb-1">
                    Departure Time
                  </label>

                  <input
                    type="datetime-local"
                    name="departureTime"
                    value={formData.departureTime}
                    onChange={handleChange}
                    className="border rounded-lg p-3 w-full"
                    required
                  />

                </div>


                {/* Arrival */}

                <div>

                  <label className="block text-sm font-semibold mb-1">
                    Arrival Time
                  </label>

                  <input
                    type="datetime-local"
                    name="arrivalTime"
                    value={formData.arrivalTime}
                    onChange={handleChange}
                    className="border rounded-lg p-3 w-full"
                    required
                  />

                </div>


                {/* Duration */}

                <input
                  type="text"
                  name="duration"
                  placeholder="Duration (e.g. 2h 15m)"
                  value={formData.duration}
                  onChange={handleChange}
                  className="border rounded-lg p-3"
                  required
                />


                {/* Price */}

                <input
                  type="number"
                  name="price"
                  placeholder="Price"
                  value={formData.price}
                  onChange={handleChange}
                  className="border rounded-lg p-3"
                  min="0"
                  required
                />


                {/* Total Seats */}

                <input
                  type="number"
                  name="totalSeats"
                  placeholder="Total Seats"
                  value={formData.totalSeats}
                  onChange={handleChange}
                  className="border rounded-lg p-3"
                  min="1"
                  required
                />


                {/* Available Seats */}

                <input
                  type="number"
                  name="availableSeats"
                  placeholder="Available Seats"
                  value={formData.availableSeats}
                  onChange={handleChange}
                  className="border rounded-lg p-3"
                  min="0"
                  required
                />


                {/* Aircraft */}

                <input
                  type="text"
                  name="aircraft"
                  placeholder="Aircraft (e.g. Airbus A320)"
                  value={formData.aircraft}
                  onChange={handleChange}
                  className="border rounded-lg p-3"
                  required
                />


                {/* Status */}

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="border rounded-lg p-3"
                >

                  <option value="Scheduled">
                    Scheduled
                  </option>

                  <option value="Delayed">
                    Delayed
                  </option>

                  <option value="Cancelled">
                    Cancelled
                  </option>

                </select>

              </div>


              {/* Buttons */}

              <div className="flex gap-4 mt-7">

                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-7 py-3 rounded-lg"
                >
                  {editingId
                    ? "Update Flight"
                    : "Add Flight"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-7 py-3 rounded-lg"
                >
                  Cancel
                </button>

              </div>

            </form>

          )}


          {/* ==============================
              Flight List
          ============================== */}

          <div className="bg-white shadow-lg rounded-xl p-6">

            <h2 className="text-2xl font-bold mb-6">
              All Flights
            </h2>

            {flights.length === 0 ? (

              <p className="text-gray-500">
                No flights available.
              </p>

            ) : (

              <div className="space-y-5">

                {flights.map((flight) => (

                  <div
                    key={flight._id}
                    className="border rounded-xl p-6"
                  >

                    <div className="flex flex-col lg:flex-row lg:justify-between gap-5">

                      {/* Flight Information */}

                      <div>

                        <h3 className="text-2xl font-bold text-blue-700">
                          {flight.airline}
                        </h3>

                        <p className="font-semibold mt-1">
                          {flight.flightNumber}
                        </p>

                        <p className="mt-2">
                          {flight.source} →{" "}
                          {flight.destination}
                        </p>

                        <p className="text-gray-600 mt-1">
                          {new Date(
                            flight.departureTime
                          ).toLocaleString()}
                        </p>

                        <p className="text-gray-600">
                          Aircraft:{" "}
                          {flight.aircraft}
                        </p>

                      </div>


                      {/* Details */}

                      <div>

                        <p>
                          <strong>Duration:</strong>{" "}
                          {flight.duration}
                        </p>

                        <p>
                          <strong>Seats:</strong>{" "}
                          {flight.availableSeats} /{" "}
                          {flight.totalSeats}
                        </p>

                        <p className="text-green-600 text-xl font-bold mt-2">
                          ₹ {flight.price}
                        </p>

                        <p className="mt-2">
                          <strong>Status:</strong>{" "}

                          <span
                            className={
                              flight.status ===
                              "Scheduled"
                                ? "text-green-600"
                                : flight.status ===
                                  "Delayed"
                                ? "text-yellow-600"
                                : "text-red-600"
                            }
                          >
                            {flight.status}
                          </span>

                        </p>

                      </div>


                      {/* Actions */}

                      <div className="flex lg:flex-col gap-3">

                        <button
                          onClick={() =>
                            handleEdit(flight)
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(
                              flight._id
                            )
                          }
                          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

        </div>

      </section>
    </>
  );
}

export default FlightManagement;