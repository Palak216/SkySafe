import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import { getBookingById } from "../services/bookingService";
import { loadRazorpayScript, createPaymentOrder, verifyPayment, createMockPayment } from "../services/paymentService";
function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds default
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const res = await getBookingById(id);
      const bkg = res.booking || res.data;
      setBooking(bkg);

      // Check if already confirmed
      if (bkg.status === "CONFIRMED") {
        navigate(`/confirmation/${bkg._id}`);
        return;
      }

      // Calculate initial countdown from expiresAt
      if (bkg.expiresAt) {
        const remaining = Math.max(0, Math.floor((new Date(bkg.expiresAt) - new Date()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0 || bkg.status === "EXPIRED") {
          setIsExpired(true);
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to load checkout details");
    } finally {
      setLoading(false);
    }
  };

  // 10-Minute Live Countdown Timer tied to expiresAt
  useEffect(() => {
    if (isExpired || !booking || booking.status !== "PENDING_PAYMENT") return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [booking, isExpired]);

  // Format MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Handle Razorpay Payment flow
    const confirmPayment = async (response) => {
    try {
      const verifyRes = await verifyPayment({
        bookingId: booking._id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });

      if (verifyRes.data?.autoRefunded) {
        alert(verifyRes.message || "Payment completed after reservation expired. A refund has been issued.");
        navigate("/my-bookings");
      } else {
        navigate(`/confirmation/${booking._id}`);
      }
    } catch (verifyErr) {
      setErrorMsg(
        verifyErr.response?.data?.message ||
          "Payment verification failed. If your account was charged, your reservation will update automatically or be refunded."
      );
      setPaying(false);
    }
  };

  const handlePayment = async () => {
    if (isExpired) {
      alert("This reservation has expired. Please select a flight again.");
      return;
    }

    try {
      setPaying(true);
      setErrorMsg("");

      // 1. Create order on backend (amount computed strictly on server)
      const orderRes = await createPaymentOrder(booking._id);
      const { orderId, amount, currency, keyId, mock } = orderRes.data || orderRes;

      // 2. Simulated payment (PAYMENT_MODE=mock): no Razorpay popup
      if (mock) {
        const sim = await createMockPayment(booking._id);
        await confirmPayment(sim.data || sim);
        return;
      }

      // 3. Real Razorpay Checkout
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to connect to Razorpay payment gateway. Please check your network.");
      }

      const options = {
        key: keyId,
        amount,
        currency: currency || "INR",
        name: "SkySafe Flights",
        description: `Booking PNR: ${booking.pnr} (${booking.flight?.origin} → ${booking.flight?.destination})`,
        image: "https://cdn-icons-png.flaticon.com/512/3125/3125713.png",
        order_id: orderId,
        prefill: {
          name: user?.name || booking.passengers?.[0]?.name || "Traveler",
          email: user?.email || "traveler@skysafe.com",
        },
        theme: { color: "#1d4ed8" },
        modal: { ondismiss: () => setPaying(false) },
        handler: confirmPayment,
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", (failedRes) => {
        console.error("Payment Failed Event:", failedRes.error);
        setErrorMsg(`Payment failed: ${failedRes.error.description || "Transaction declined"}`);
        setPaying(false);
      });

      razorpayInstance.open();
    } catch (err) {
      console.error("Checkout initiation error:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Payment initiation failed");
      setPaying(false);
    }
  };
  

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Preparing secure checkout...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto py-20 px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">Booking Not Found</h2>
          <button
            onClick={() => navigate("/home")}
            className="mt-6 bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-800"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const flight = booking.flight || {};

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-10 flex-1 w-full">
        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center gap-4 text-sm font-semibold">
          <span className="flex items-center gap-2 text-green-600">
            <span className="w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs">✓</span>
            Passenger Info
          </span>
          <span className="w-12 h-0.5 bg-blue-600"></span>
          <span className="flex items-center gap-2 text-blue-700">
            <span className="w-7 h-7 bg-blue-700 text-white rounded-full flex items-center justify-center text-xs">2</span>
            Payment & Confirmation
          </span>
        </div>

        {/* 10-Minute Live Reservation Countdown Timer */}
        <div
          className={`p-5 rounded-2xl mb-8 flex items-center justify-between shadow-sm border transition ${
            isExpired
              ? "bg-red-50 border-red-300 text-red-800"
              : timeLeft < 180
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-blue-50 border-blue-200 text-blue-900"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">⏱️</span>
            <div>
              <h4 className="font-bold text-base">
                {isExpired ? "Reservation Expired" : "Seats Held Temporarily"}
              </h4>
              <p className="text-xs opacity-80">
                {isExpired
                  ? "Your 10-minute hold window has lapsed. Reserved seats were returned to inventory."
                  : "Complete payment before the timer expires to confirm your reservation."}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`font-mono text-2xl font-black ${
                isExpired ? "text-red-600" : timeLeft < 180 ? "text-amber-600" : "text-blue-700"
              }`}
            >
              {isExpired ? "00:00" : formatTime(timeLeft)}
            </span>
            <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">
              {isExpired ? "EXPIRED" : "TIME REMAINING"}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
            {errorMsg}
          </div>
        )}

        {/* Order Details Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white flex justify-between items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                Reservation Reference
              </span>
              <h2 className="text-2xl font-black font-mono tracking-widest">{booking.pnr}</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-blue-200">Total Amount</span>
              <p className="text-3xl font-black">₹{booking.totalAmount.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Flight info */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Flight Details</h3>
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <p className="font-extrabold text-gray-900 text-base">{flight.airline}</p>
                  <p className="text-xs text-gray-500 font-mono">{flight.flightNumber} • {flight.aircraft}</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-blue-700 text-lg">
                    {flight.origin} &rarr; {flight.destination}
                  </p>
                  <p className="text-xs text-gray-500">
                    {flight.departureTime && new Date(flight.departureTime).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            </div>

            {/* Passenger Manifest */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                Passengers ({booking.passengers?.length || 0})
              </h3>
              <div className="divide-y divide-gray-100 border rounded-xl overflow-hidden">
                {booking.passengers?.map((p, idx) => (
                  <div key={idx} className="p-3.5 flex justify-between items-center text-sm bg-white">
                    <span className="font-medium text-gray-800">
                      {idx + 1}. {p.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {p.age} yrs • {p.gender === "M" ? "Male" : p.gender === "F" ? "Female" : "Other"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Base Fare</span>
                <span>₹{booking.totalAmount.toLocaleString("en-IN")}</span>
              </div>
                            <div className="flex justify-between">
                <span>Payment Mode</span>
                <span className="font-semibold text-gray-800">
                  {import.meta.env.VITE_DEMO_PAYMENTS === "true"
                    ? "Demo payment (no real money)"
                    : "Razorpay (Cards, UPI, NetBanking)"}
                </span>
              </div>
              {import.meta.env.VITE_DEMO_PAYMENTS === "true" && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  This is a portfolio demo. Clicking Pay simulates a payment and no money is charged.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            {isExpired ? (
              <button
                onClick={() => navigate("/home")}
                className="w-full bg-gray-800 hover:bg-black text-white font-bold py-4 rounded-xl shadow-md transition"
              >
                Search Flights Again
              </button>
            ) : (
              <button
                disabled={paying}
                onClick={handlePayment}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-lg py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-3"
              >
                {paying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Pay with Razorpay (₹{booking.totalAmount.toLocaleString("en-IN")})</span>
                    <span>💳</span>
                  </>
                )}
              </button>
            )}

            <p className="text-center text-xs text-gray-400">
              🔒 256-bit SSL encrypted. Test-mode payment integration via Razorpay.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Checkout;
