import { Routes, Route } from "react-router-dom";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import Booking from "./pages/Booking";
import Checkout from "./pages/Checkout";
import BookingConfirmation from "./pages/BookingConfirmation";
import MyBookings from "./pages/MyBookings";
import AdminDashboard from "./pages/AdminDashboard";
import FlightManagement from "./pages/FlightManagement";

function App() {
  return (
    <Routes>
      {/* ==========================
          PUBLIC ROUTES
      ========================== */}
      {/* Home / Search */}
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/search" element={<SearchResults />} />

      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ==========================
          USER PROTECTED ROUTES
      ========================== */}
      {/* Flight Details & Passenger Form */}
      <Route
        path="/booking/:id"
        element={
          <ProtectedRoute>
            <Booking />
          </ProtectedRoute>
        }
      />

      {/* Razorpay Checkout & 10-Min Timer */}
      <Route
        path="/checkout/:id"
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        }
      />

      {/* Booking Confirmation & E-Ticket */}
      <Route
        path="/confirmation/:id"
        element={
          <ProtectedRoute>
            <BookingConfirmation />
          </ProtectedRoute>
        }
      />

      {/* My Bookings History */}
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute>
            <MyBookings />
          </ProtectedRoute>
        }
      />

      {/* ==========================
          ADMIN PROTECTED ROUTES
      ========================== */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/flights"
        element={
          <ProtectedRoute adminOnly>
            <FlightManagement />
          </ProtectedRoute>
        }
      />

      {/* ==========================
          FALLBACK ROUTE
      ========================== */}
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default App;
