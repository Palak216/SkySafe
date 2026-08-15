import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Booking from "./pages/Booking";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyBookings from "./pages/MyBookings";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <>
      {/* Navbar appears on every page */}
      <Navbar />

      <Routes>

        {/* =========================
            Login
        ========================= */}
        <Route
          path="/"
          element={<Login />}
        />

        {/* =========================
            Register
        ========================= */}
        <Route
          path="/register"
          element={<Register />}
        />

        {/* =========================
            Home
        ========================= */}
        <Route
          path="/home"
          element={<Home />}
        />

        {/* =========================
            Booking
        ========================= */}
        <Route
          path="/booking/:id"
          element={
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          }
        />

        {/* =========================
            My Bookings
        ========================= */}
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* =========================
            Admin
        ========================= */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

      </Routes>
    </>
  );
}import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Booking from "./pages/Booking";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyBookings from "./pages/MyBookings";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <>
      {/* Navbar appears on every page */}
      <Navbar />

      <Routes>

        {/* =========================
            Login
        ========================= */}
        <Route
          path="/"
          element={<Login />}
        />

        {/* =========================
            Register
        ========================= */}
        <Route
          path="/register"
          element={<Register />}
        />

        {/* =========================
            Home
        ========================= */}
        <Route
          path="/home"
          element={<Home />}
        />

        {/* =========================
            Booking
        ========================= */}
        <Route
          path="/booking/:id"
          element={
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          }
        />

        {/* =========================
            My Bookings
        ========================= */}
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* =========================
            Admin
        ========================= */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

      </Routes>
    </>
  );
}

export default App;

export default App;