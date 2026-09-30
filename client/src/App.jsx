import { Routes, Route } from "react-router-dom";

// ==============================
// Components
// ==============================
import ProtectedRoute from "./components/ProtectedRoute";

// ==============================
// Pages
// ==============================
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import AdminDashboard from "./pages/AdminDashboard";
import FlightManagement from "./pages/FlightManagement";

function App() {
  return (
    <Routes>

      {/* ==========================
          PUBLIC ROUTES
      ========================== */}

      {/* Login */}
      <Route
        path="/"
        element={<Login />}
      />

      {/* Register */}
      <Route
        path="/register"
        element={<Register />}
      />


      {/* ==========================
          USER ROUTES
      ========================== */}

      {/* Home */}
      <Route
        path="/home"
        element={<Home />}
      />

      {/* Booking */}
      <Route
        path="/booking/:id"
        element={
          <ProtectedRoute>
            <Booking />
          </ProtectedRoute>
        }
      />

      {/* My Bookings */}
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute>
            <MyBookings />
          </ProtectedRoute>
        }
      />


      {/* ==========================
          ADMIN ROUTES
      ========================== */}

      {/* Admin Dashboard */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin Flight Management */}
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

      <Route
        path="*"
        element={<Login />}
      />

    </Routes>
  );
}

export default App;