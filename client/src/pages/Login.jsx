import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import { AuthContext } from "../context/AuthContext";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const { setUser } = useContext(AuthContext);

  const handleLogin = async (e) => {

    e.preventDefault();

    try {

      const data = await loginUser({
        email,
        password,
      });

      console.log("LOGIN RESPONSE:", data);

      // VERY IMPORTANT
      setUser(data.user);

      alert(data.message);

      navigate("/home");

    } catch (error) {

      console.log(error);

      alert(
        error.response?.data?.message ||
        "Login failed"
      );
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-blue-100">

      <div className="bg-white p-8 rounded-xl shadow-lg w-80">

        <h1 className="text-2xl font-bold text-blue-700 text-center mb-6">
          Login
        </h1>

        <form onSubmit={handleLogin}>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg p-3 mb-3"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg p-3 mb-4"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg"
          >
            Login
          </button>

        </form>

        <p className="text-center mt-4 text-sm">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-blue-700"
          >
            Register
          </Link>
        </p>

      </div>

    </section>
  );
}

export default Login;