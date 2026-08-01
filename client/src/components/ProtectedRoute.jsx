import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
function ProtectedRoute({ children }) {

  const { user, loading } = useContext(AuthContext);

  // Wait until profile is loaded
  if (loading) {
    return (
      <h1 className="text-center mt-20 text-3xl">
        Loading...
      </h1>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Logged in
  return children;
}

export default ProtectedRoute;