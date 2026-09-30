import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/authService";

function Register() {
  const navigate = useNavigate();

  // ==============================
  // Form State
  // ==============================
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  // ==============================
  // Handle Input Changes
  // ==============================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ==============================
  // Handle Registration
  // ==============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check password match
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      // Send registration data to backend
      const data = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      // Show backend message
      alert(data.message);

      // Go to Login page
      navigate("/");
    } catch (error) {
      console.error("Registration Error:", error);

      alert(
        error.response?.data?.message ||
          "Registration Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // UI
  // ==============================
  return (
    <div className="min-h-screen flex justify-center items-center bg-sky-100 px-4">

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-[400px]"
      >

        {/* Heading */}
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">
          Create Account
        </h2>

        {/* Name */}
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full border p-3 rounded-lg mb-4"
          required
        />

        {/* Email */}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border p-3 rounded-lg mb-4"
          required
        />

        {/* Password */}
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full border p-3 rounded-lg mb-4"
          minLength={6}
          required
        />

        {/* Confirm Password */}
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full border p-3 rounded-lg mb-6"
          minLength={6}
          required
        />

        {/* Register Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full text-white py-3 rounded-lg ${
            loading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-blue-700 hover:bg-blue-800"
          }`}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        {/* Login Link */}
        <p className="text-center mt-5">
          Already have an account?{" "}
          <Link
            to="/"
            className="text-blue-700 font-semibold hover:underline"
          >
            Login
          </Link>
        </p>

      </form>
    </div>
  );
}

export default Register;