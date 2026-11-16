import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { Leaf, User, LogOut } from "lucide-react";
import api from "./api/axiosConfig";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Sell from "./pages/Sell";
import Dashboard from "./pages/Dashboard";
import ProductDetail from "./pages/ProductDetail";
import Orders from "./pages/Orders";
import RecyclerDashboard from "./pages/RecyclerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import UserRecycleRequest from "./pages/UserRecycleRequest";
import HowItWorks from "./pages/HowItWorks";
import ProtectedRoute from "./components/ProtectedRoute";

function Layout({ children }) {
  const location = useLocation();
  const [token, setToken] = useState(localStorage.getItem("jwtToken"));
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentToken = localStorage.getItem("jwtToken");
    setToken(currentToken);

    if (currentToken) {
      // Immediate role-based redirect check from JWT
      try {
        const payload = JSON.parse(atob(currentToken.split(".")[1]));
        const role = payload?.role;
        if (role === "ROLE_ADMIN" || role === "ADMIN") {
          navigate("/admin", { replace: true });
          return;
        } else if (role === "ROLE_RECYCLER" || role === "RECYCLER") {
          navigate("/recycler-dashboard", { replace: true });
          return;
        }
      } catch (err) {}

      // Fetch dynamic user profile
      api
        .get("/users/me")
        .then((res) => {
          const user = res.data;
          setUserData(user);
          if (user?.role === "ROLE_ADMIN" || user?.role === "ADMIN") {
            navigate("/admin", { replace: true });
          } else if (user?.role === "ROLE_RECYCLER" || user?.role === "RECYCLER") {
            navigate("/recycler-dashboard", { replace: true });
          }
        })
        .catch((err) => console.error("Could not fetch user data"));
    } else {
      setUserData(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    setToken(null);
    setUserData(null);
    navigate("/login");
  };

  // If logged in user is Admin or Recycler, do not show marketplace layout
  const isAdminOrRecycler = (() => {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const role = payload?.role;
      if (
        role === "ROLE_ADMIN" ||
        role === "ADMIN" ||
        role === "ROLE_RECYCLER" ||
        role === "RECYCLER"
      ) {
        return true;
      }
    } catch (err) {}
    if (
      userData?.role === "ROLE_ADMIN" ||
      userData?.role === "ADMIN" ||
      userData?.role === "ROLE_RECYCLER" ||
      userData?.role === "RECYCLER"
    ) {
      return true;
    }
    return false;
  })();

  if (isAdminOrRecycler) {
    return null;
  }

  return (
    <div className="min-h-screen font-sans text-carbon-dark bg-[#f8fafc]">
      <nav className="bg-white border-b-4 border-carbon-dark px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-carbon-primary text-white p-1.5 rounded-md">
                <Leaf size={24} />
              </div>
              <span className="text-2xl font-extrabold tracking-tight">
                Carbonwise
              </span>
            </Link>
            <div className="hidden md:flex space-x-6 font-semibold text-sm">
              <Link to="/" className="hover:text-carbon-primary transition">
                Marketplace
              </Link>
              <Link
                to="/how-it-works"
                className="hover:text-carbon-primary transition"
              >
                How it works
              </Link>
              {/* Standard marketplace user routes */}
              <Link
                to="/recycle"
                className="text-carbon-secondary hover:text-carbon-primary"
              >
                Recycle
              </Link>
              {token && (
                <Link
                  to="/orders"
                  className="hover:text-carbon-primary transition"
                >
                  Orders & Escrow
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {token ? (
              <>
                <Link
                  to="/sell"
                  className="bg-carbon-dark text-white font-bold text-sm px-5 py-2.5 rounded hover:bg-gray-800 transition"
                >
                  Sell Item
                </Link>

                {/* Dynamic Carbon Credits */}
                <div className="hidden md:flex items-center space-x-2 border-2 border-carbon-primary text-carbon-secondary font-bold text-sm px-4 py-2 rounded-full bg-green-50">
                  <Leaf size={16} />
                  <span>
                    Green Credit Wallet: {userData ? userData.carbonCredits : 0}{" "}
                    kg CO2e
                  </span>
                </div>

                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-full border-2 border-carbon-dark hover:bg-gray-200 transition"
                >
                  <User size={18} />
                  <span className="font-bold text-sm">
                    {userData ? userData.name : "Profile"}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-500 transition p-2"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <div className="space-x-3 text-sm font-bold">
                <Link to="/login" className="hover:text-carbon-primary">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="border-2 border-carbon-dark px-4 py-2 rounded hover:bg-gray-50"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8 flex-grow">{children}</main>

      {/* Global Footer */}
      <footer className="border-t-4 border-carbon-dark bg-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="bg-carbon-primary text-white p-1 rounded-sm">
              <Leaf size={16} />
            </div>
            <span className="font-extrabold text-carbon-dark text-sm">Carbonwise Electronics</span>
            <span>© 2026. All rights reserved.</span>
          </div>

          <p className="text-center md:text-right text-[11px] text-gray-500 max-w-xl">
            * <strong>Disclaimer:</strong> Carbon footprint metrics and avoided CO2e figures are approximate estimates calculated from standard circular economy lifecycle assessment (LCA) benchmarks, not exact values.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/recycler-dashboard"
          element={
            <ProtectedRoute allowedRoles={["ROLE_RECYCLER", "RECYCLER"]}>
              <RecyclerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ROLE_ADMIN", "ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/recycle" element={<UserRecycleRequest />} />
                <Route path="/sell" element={<Sell />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/orders" element={<Orders />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}
