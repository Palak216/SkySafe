import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  console.log("PROTECTED ROUTE:");
  console.log("user:", user);
  console.log("loading:", loading);

  if (loading) {
    return (
      <h1 className="text-center mt-20 text-3xl">
        Loading...
      </h1>
    );
  }

  if (!user) {
    console.log("❌ NO USER → REDIRECTING TO LOGIN");
    return <Navigate to="/" replace />;
  }

  console.log("✅ USER EXISTS → ALLOWING PAGE");

  return children;
}

export default ProtectedRoute;