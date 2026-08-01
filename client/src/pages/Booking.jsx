import { useEffect, useState } from "react";
import { useParams,useNavigate } from "react-router-dom";
import {
  getFlightById,
  bookFlight,
} from "../services/flightService";

function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ==========================
  // State Variables
  // ==========================

  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);

  const [passengers, setPassengers] = useState([
    {
      name: "",
      age: "",
      gender: "M",
    },
  ]);

  // ==========================
  // Fetch Flight Details
  // ==========================

  useEffect(() => {
    fetchFlight();
  }, []);

  const fetchFlight = async () => {
    try {
      const data = await getFlightById(id);

      console.log(data);

      setFlight(data.flight);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // Passenger Input Handler
  // ==========================

  const handlePassengerChange = (index, field, value) => {
    const updatedPassengers = [...passengers];

    updatedPassengers[index][field] = value;

    setPassengers(updatedPassengers);
  };

  // ==========================
  // Add Passenger
  // ==========================

  const addPassenger = () => {
    setPassengers([
      ...passengers,
      {
        name: "",
        age: "",
        gender: "M",
      },
    ]);
  };

  // ==========================
  // Confirm Booking
  // ==========================

  const handleBooking = async () => {
    try {
      const data = await bookFlight({
        flightId: id,
        passengers,
      });

      alert(data.message);

      console.log(data);
        navigate("/my-bookings");

    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.message ||
          "Booking Failed"
      );
    }
  };

  // ==========================
  // Loading
  // ==========================

  if (loading) {
    return (
      <h1 className="text-center mt-20 text-3xl">
        Loading Flight...
      </h1>
    );
  }

  // ==========================
  // Flight Not Found
  // ==========================

  if (!flight) {
    return (
      <h1 className="text-center mt-20 text-red-600 text-3xl">
        Flight Not Found
      </h1>
    );
  }

  // ==========================
  // UI
  // ==========================

  return (
    <section className="max-w-5xl mx-auto py-16 px-5">

      <h1 className="text-4xl font-bold text-blue-700 mb-10">
        Booking Details
      </h1>

      <div className="bg-white shadow-xl rounded-xl p-8">

        <h2 className="text-3xl font-bold">
          {flight.airline}
        </h2>

        <p className="mt-4">
          <strong>Flight Number :</strong>{" "}
          {flight.flightNumber}
        </p>

        <p>
          <strong>Route :</strong>{" "}
          {flight.source} → {flight.destination}
        </p>

        <p>
          <strong>Departure :</strong>{" "}
          {new Date(
            flight.departureTime
          ).toLocaleString()}
        </p>

        <p>
          <strong>Arrival :</strong>{" "}
          {new Date(
            flight.arrivalTime
          ).toLocaleString()}
        </p>

        <p>
          <strong>Duration :</strong>{" "}
          {flight.duration}
        </p>

        <p>
          <strong>Available Seats :</strong>{" "}
          {flight.availableSeats}
        </p>

        <h2 className="text-4xl text-green-600 font-bold mt-8">
          ₹ {flight.price}
        </h2>

        <hr className="my-8" />

        <h2 className="text-3xl font-bold text-blue-700 mb-6">
          Passenger Details
        </h2>

        {passengers.map((passenger, index) => (
          <div
            key={index}
            className="border rounded-lg p-5 mb-5"
          >
            <h3 className="text-xl font-bold mb-4">
              Passenger {index + 1}
            </h3>

            <input
              type="text"
              placeholder="Full Name"
              value={passenger.name}
              onChange={(e) =>
                handlePassengerChange(
                  index,
                  "name",
                  e.target.value
                )
              }
              className="w-full border rounded-lg p-3 mb-3"
            />

            <input
              type="number"
              placeholder="Age"
              value={passenger.age}
              onChange={(e) =>
                handlePassengerChange(
                  index,
                  "age",
                  e.target.value
                )
              }
              className="w-full border rounded-lg p-3 mb-3"
            />

            <select
              value={passenger.gender}
              onChange={(e) =>
                handlePassengerChange(
                  index,
                  "gender",
                  e.target.value
                )
              }
              className="w-full border rounded-lg p-3"
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </div>
        ))}

        <button
          onClick={addPassenger}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
        >
          + Add Passenger
        </button>

        <div className="mt-8">
          <button
            onClick={handleBooking}
            className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-lg"
          >
            Confirm Booking
          </button>
        </div>

      </div>
    </section>
  );
}

export default Booking;