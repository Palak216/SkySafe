import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getFlightById } from "../services/flightService";

function Booking() {
  const { id } = useParams();

  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <h1 className="text-center mt-20 text-3xl">
        Loading Flight...
      </h1>
    );
  }

  if (!flight) {
    return (
      <h1 className="text-center mt-20 text-red-600 text-3xl">
        Flight Not Found
      </h1>
    );
  }

  return (
    <section className="max-w-5xl mx-auto py-16">

      <h1 className="text-4xl font-bold text-blue-700 mb-10">
        Booking Details
      </h1>

      <div className="bg-white shadow-xl rounded-xl p-8">

        <h2 className="text-3xl font-bold">
          {flight.airline}
        </h2>

        <p className="mt-4">
          <strong>Flight Number :</strong> {flight.flightNumber}
        </p>

        <p>
          <strong>Route :</strong>
          {" "}
          {flight.source}
          {" → "}
          {flight.destination}
        </p>

        <p>
          <strong>Departure :</strong>
          {" "}
          {new Date(flight.departureTime).toLocaleString()}
        </p>

        <p>
          <strong>Arrival :</strong>
          {" "}
          {new Date(flight.arrivalTime).toLocaleString()}
        </p>

        <p>
          <strong>Duration :</strong> {flight.duration}
        </p>

        <p>
          <strong>Available Seats :</strong> {flight.availableSeats}
        </p>

        <h2 className="text-4xl text-green-600 font-bold mt-8">
          ₹ {flight.price}
        </h2>

      </div>

    </section>
  );
}

export default Booking;