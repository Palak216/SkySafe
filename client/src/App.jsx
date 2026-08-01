import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Booking from "./pages/Booking";

import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <Navbar />

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/booking/:flightId"
          element={<Booking />}
        />

      </Routes>
    </>
  );
}

export default App;
