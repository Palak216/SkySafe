import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Booking from "./pages/Booking";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyBookings from "./pages/MyBookings";
import AdminDashboard from "./pages/AdminDashboard";
function App() {
  return (
    <Routes>

      {/* Default Page */}
      <Route
        path="/"
        element={<Login />}
      />
      <Route
  path="/admin"
  element={
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>

      {/* Register */}
      <Route
        path="/register"
        element={<Register />}
      />

      {/* Home */}
      <Route
        path="/home"
        element={<Home />}
      />

      {/* Booking */}
      <Route
        path="/booking/:id"
        element={<Booking />}
      />
      <Route
  path="/my-bookings"
  element={
    <ProtectedRoute>
      <MyBookings />
    </ProtectedRoute>
  }
/>

    </Routes>
  );
}

export default App;