import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Booking from "./pages/Booking";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <Routes>

      {/* Default Page */}
      <Route
        path="/"
        element={<Login />}
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

    </Routes>
  );
}

export default App;