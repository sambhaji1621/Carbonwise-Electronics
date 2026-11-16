import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, Lock, MapPin } from "lucide-react";
import api from "../api/axiosConfig";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    city: "",
    pinCode: "",
    role: "USER",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError("Please enter a valid full name (at least 2 characters).");
      return;
    }
    if (!/^\d{10}$/.test(formData.phone.trim())) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!formData.city.trim() || formData.city.trim().length < 2) {
      setError("Please enter your city.");
      return;
    }
    if (!/^\d{6}$/.test(formData.pinCode.trim())) {
      setError("Please enter a valid 6-digit postal pin code.");
      return;
    }

    try {
      const response = await api.post("/auth/register", {
        ...formData,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        city: formData.city.trim(),
        pinCode: formData.pinCode.trim(),
      });
      localStorage.setItem("jwtToken", response.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200 mt-10">
      <h2 className="text-2xl font-bold text-carbon-dark mb-6 text-center">
        Join Carbonwise
      </h2>
      {error && (
        <p className="text-red-500 mb-4 text-sm text-center">{error}</p>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="relative">
          <User className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            name="name"
            type="text"
            onChange={handleChange}
            placeholder="Full Name"
            required
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-carbon-primary"
          />
        </div>

        <div className="relative">
          <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            name="phone"
            type="text"
            onChange={handleChange}
            placeholder="10-digit Phone"
            required
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-carbon-primary"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            name="password"
            type="password"
            onChange={handleChange}
            placeholder="Password (min 6 chars)"
            required
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-carbon-primary"
          />
        </div>

        <div className="flex space-x-4">
          <div className="relative w-1/2">
            <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              name="city"
              type="text"
              onChange={handleChange}
              placeholder="Area, City (e.g. Baner, Pune)"
              required
              className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-carbon-primary text-xs"
            />
          </div>
          <input
            name="pinCode"
            type="text"
            onChange={handleChange}
            placeholder="6-digit PIN (e.g. 411045)"
            required
            maxLength={6}
            className="w-1/2 px-3 py-2 border rounded-md focus:ring-2 focus:ring-carbon-primary text-xs"
          />
        </div>

        <div>
          <select
            name="role"
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-carbon-primary text-gray-700"
          >
            <option value="USER">Standard User (Buy & Sell)</option>
            <option value="RECYCLER">Recycler (B2B E-Waste)</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-carbon-dark text-white font-bold py-2 px-4 rounded hover:bg-gray-800 transition"
        >
          Create Account
        </button>
      </form>
    </div>
  );
}
