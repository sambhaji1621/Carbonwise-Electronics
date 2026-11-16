import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Lock } from "lucide-react";
import api from "../api/axiosConfig";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone.trim())) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      // Sends POST request to Spring Boot AuthController
      const response = await api.post("/auth/login", { phone: phone.trim(), password });

      // Save the JWT Token to Local Storage for future requests
      const token = response.data.token;
      localStorage.setItem("jwtToken", token);

      // Route based on role: Admin to /admin, Recycler to /recycler-dashboard, Users to /
      let targetPath = "/";
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const role = payload?.role;
        if (role === "ROLE_ADMIN" || role === "ADMIN") {
          targetPath = "/admin";
        } else if (role === "ROLE_RECYCLER" || role === "RECYCLER") {
          targetPath = "/recycler-dashboard";
        }
      } catch (err) {}

      navigate(targetPath);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200 mt-10">
      <h2 className="text-2xl font-bold text-carbon-dark mb-6 text-center">
        Welcome Back
      </h2>
      {error && (
        <p className="text-red-500 mb-4 text-sm text-center">{error}</p>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-carbon-primary"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit phone number"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="password"
              className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-carbon-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-carbon-primary text-white font-bold py-2 px-4 rounded hover:bg-carbon-secondary transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}
