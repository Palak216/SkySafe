import { useState } from "react";
import { loginUser } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await loginUser(formData);

      alert(data.message);

      navigate("/");
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Login Failed"
      );
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-sky-100">

      <div className="bg-white shadow-xl rounded-xl p-10 w-[420px]">

        <h1 className="text-3xl font-bold text-center text-blue-700 mb-8">
          Login
        </h1>

        <form onSubmit={handleSubmit}>

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg mb-5"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border p-3 rounded-lg mb-5"
          />

          <button
            className="w-full bg-blue-700 text-white py-3 rounded-lg"
          >
            Login
          </button>

        </form>

        <p className="text-center mt-5">
          Don't have an account?

          <Link
            to="/register"
            className="text-blue-700 font-bold ml-2"
          >
            Register
          </Link>
        </p>

      </div>

    </div>
  );
}

export default Login;