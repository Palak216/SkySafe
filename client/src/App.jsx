import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Booking from "./pages/Booking";
import Register from "./pages/Register";
import Login from "./pages/Login";

function App() {
  return (
    <Routes>

      {/* Home Page */}
      <Route
        path="/"
        element={<Home />}
      />

      {/* Register Page */}
      <Route
        path="/register"
        element={<Register />}
      />

      {/* Login Page */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* Booking Page */}
      <Route
        path="/booking/:id"
        element={<Booking />}
      />

    </Routes>
  );
}

export default App;