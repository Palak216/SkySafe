import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      const data = await loginUser({ email, password });
      const user = data.data?.user || data.user;
      const token = data.data?.token || data.token;

      login(user, token);
      navigate("/");
    } catch (error) {
      setErrorMsg(
        error.response?.data?.message ||
        "Invalid email or password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-black text-blue-700 tracking-tight">
            SkySafe ✈️
          </Link>
          <h2 className="text-xl font-bold text-gray-900 mt-3">Welcome Back</h2>
          <p className="text-xs text-gray-500 mt-1">Log in to manage bookings and checkout faster.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          Demo Admin: <span className="font-mono text-gray-800">admin@skysafe.com / Admin@123456</span>
        </div>

        <p className="text-center mt-6 text-xs text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-700 font-bold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}

export default Login;
