import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useContext(AuthContext);

  // ==============================
  // Checking Login Status
  // ==============================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-3xl font-bold text-blue-700">
          Loading...
        </h1>
      </div>
    );
  }

  // ==============================
  // User Not Logged In
  // ==============================

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // ==============================
  // Admin Access Check
  // ==============================

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  // ==============================
  // Allow Access
  // ==============================

  return children;
}

export default ProtectedRoute;