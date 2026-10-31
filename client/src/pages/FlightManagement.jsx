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
    origin: "",
    destination: "",
    departureTime: "",
    arrivalTime: "",
    price: "",
    totalSeats: "180",
    availableSeats: "180",
    aircraft: "Airbus A320",
    status: "SCHEDULED",
  });

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      setLoading(true);
      const data = await getAllFlights();
      setFlights(data.flights || []);
    } catch (error) {
      console.error("FETCH FLIGHTS ERROR:", error);
      alert(error.response?.data?.message || "Unable to fetch flights");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      flightNumber: "",
      airline: "",
      origin: "",
      destination: "",
      departureTime: "",
      arrivalTime: "",
      price: "",
      totalSeats: "180",
      availableSeats: "180",
      aircraft: "Airbus A320",
      status: "SCHEDULED",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const flightPayload = {
        flightNumber: formData.flightNumber.trim().toUpperCase(),
        airline: formData.airline.trim(),
        origin: (formData.origin || formData.source || "").trim().toUpperCase(),
        destination: formData.destination.trim().toUpperCase(),
        departureTime: new Date(formData.departureTime).toISOString(),
        arrivalTime: new Date(formData.arrivalTime).toISOString(),
        price: Number(formData.price),
        totalSeats: Number(formData.totalSeats),
        availableSeats: Number(formData.availableSeats || formData.totalSeats),
        aircraft: formData.aircraft.trim() || "Airbus A320",
        status: (formData.status || "SCHEDULED").toUpperCase(),
      };

      if (editingId) {
        const data = await updateFlight(editingId, flightPayload);
        alert(data.message || "Flight updated successfully");
      } else {
        const data = await addFlight(flightPayload);
        alert(data.message || "Flight created successfully");
      }

      resetForm();
      await fetchFlights();
    } catch (error) {
      console.error("SAVE FLIGHT ERROR:", error);
      alert(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Unable to save flight"
      );
    }
  };

  const handleEdit = (flight) => {
    setEditingId(flight._id);
    setFormData({
      flightNumber: flight.flightNumber || "",
      airline: flight.airline || "",
      origin: flight.origin || flight.source || "",
      destination: flight.destination || "",
      departureTime: flight.departureTime
        ? new Date(flight.departureTime).toISOString().slice(0, 16)
        : "",
      arrivalTime: flight.arrivalTime
        ? new Date(flight.arrivalTime).toISOString().slice(0, 16)
        : "",
      price: flight.price || "",
      totalSeats: flight.totalSeats || "180",
      availableSeats: flight.availableSeats || "180",
      aircraft: flight.aircraft || "Airbus A320",
      status: flight.status || "SCHEDULED",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this flight?")) return;

    try {
      await deleteFlight(id);
      alert("Flight deleted successfully");
      await fetchFlights();
    } catch (error) {
      alert(error.response?.data?.message || "Unable to delete flight");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 mb-8 border-b gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Flight Inventory Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Add, update, and manage scheduled flights across domestic & international routes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition"
            >
              Dashboard Stats
            </button>
            <button
              onClick={() => {
                if (showForm) resetForm();
                else setShowForm(true);
              }}
              className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition"
            >
              {showForm ? "Cancel" : "+ Add New Flight"}
            </button>
          </div>
        </div>

        {/* Modal / Inline Flight Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 sm:p-8 mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b">
              {editingId ? "Edit Flight Schedule" : "Create New Flight Schedule"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Flight Number
                  </label>
                  <input
                    type="text"
                    name="flightNumber"
                    required
                    placeholder="e.g. 6E-204"
                    value={formData.flightNumber}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2.5 text-sm uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Airline
                  </label>
                  <input
                    type="text"
                    name="airline"
                    required
                    placeholder="e.g. IndiGo"
                    value={formData.airline}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Aircraft
                  </label>
                  <input
                    type="text"
                    name="aircraft"
                    placeholder="e.g. Airbus A320neo"
                    value={formData.aircraft}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Origin (3-Letter IATA)
                  </label>
                  <input
                    type="text"
                    name="origin"
                    required
                    maxLength={3}
                    placeholder="DEL"
                    value={formData.origin}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2.5 text-sm uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Destination (3-Letter IATA)
                  </label>
                  <input
                    type="text"
                    name="destination"
                    required
                    maxLength={3}
                    placeholder="BOM"
                    value={formData.destination}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2.5 text-sm uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Departure Time (IST)
                  </label>
                  <input
                    type="datetime-local"
                    name="departureTime"
                    required
                    value={formData.departureTime}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Arrival Time (IST)
                  </label>
                  <input
                    type="datetime-local"
                    name="arrivalTime"
                    required
                    value={formData.arrivalTime}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Price (INR)
                  </label>
                  <input
                    type="number"
                    name="price"
                    required
                    min={0}
                    placeholder="4500"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Total Seats
                  </label>
                  <input
                    type="number"
                    name="totalSeats"
                    required
                    min={1}
                    value={formData.totalSeats}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Available Seats
                  </label>
                  <input
                    type="number"
                    name="availableSeats"
                    required
                    min={0}
                    value={formData.availableSeats}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2.5 text-sm bg-white"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="DELAYED">DELAYED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-2.5 rounded-lg text-sm shadow-md transition"
                >
                  {editingId ? "Update Flight" : "Save Flight"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Flights Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b flex justify-between items-center">
            <h2 className="font-bold text-gray-800 text-base">Active Flight Inventory ({flights.length})</h2>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-500 text-sm">Loading flights...</p>
            </div>
          ) : flights.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
              No flights found. Click "+ Add New Flight" or run database seed.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b">
                    <th className="py-3 px-4">Flight</th>
                    <th className="py-3 px-4">Route</th>
                    <th className="py-3 px-4">Departure</th>
                    <th className="py-3 px-4">Seats</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {flights.map((f) => (
                    <tr key={f._id} className="hover:bg-gray-50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        {f.flightNumber}
                        <div className="text-xs font-normal text-gray-500">{f.airline}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-700">
                        {(f.origin || f.source)} &rarr; {f.destination}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {f.departureTime &&
                          new Date(f.departureTime).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-semibold text-green-700">{f.availableSeats}</span> / {f.totalSeats}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-gray-900">₹{f.price}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            f.status === "SCHEDULED"
                              ? "bg-green-100 text-green-700"
                              : f.status === "DELAYED"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(f)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(f._id)}
                          className="text-xs text-red-600 hover:text-red-800 font-bold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default FlightManagement;
