import { useState, useEffect } from "react";
import { User, Package, FileText, Leaf, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("listings"); // 'profile', 'listings', 'orders'
  const [myListings, setMyListings] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch User Info
        const userRes = await api.get("/users/me");
        setUserData(userRes.data);

        // Fetch Listings
        const listingsRes = await api.get("/products/my-listings");
        setMyListings(listingsRes.data);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this listing?")) return;
    try {
      await api.delete(`/products/${id}`);
      setMyListings(myListings.filter((item) => item.id !== id));
    } catch (err) {
      alert("Failed to delete listing.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row max-w-7xl mx-auto gap-8">
      {/* Sidebar */}
      <div className="w-full md:w-64 flex-shrink-0 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-carbon-dark">
            {userData ? userData.name : "User Account"}
          </h2>
          <p className="text-sm text-gray-500">
            {userData ? userData.city : "Secure Profile"}
          </p>
        </div>
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full text-left flex items-center py-2 px-3 rounded font-semibold transition ${activeTab === "profile" ? "bg-green-50 text-carbon-dark border-l-4 border-carbon-primary" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <User
              size={18}
              className={`mr-3 ${activeTab === "profile" ? "text-carbon-primary" : ""}`}
            />{" "}
            My Profile
          </button>
          <button
            onClick={() => setActiveTab("listings")}
            className={`w-full text-left flex items-center py-2 px-3 rounded font-semibold transition ${activeTab === "listings" ? "bg-green-50 text-carbon-dark border-l-4 border-carbon-primary" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <Package
              size={18}
              className={`mr-3 ${activeTab === "listings" ? "text-carbon-primary" : ""}`}
            />{" "}
            My Listings
          </button>
          <button
            onClick={() => navigate("/orders")}
            className="w-full text-left flex items-center text-gray-600 hover:bg-gray-50 py-2 px-3 rounded font-semibold transition"
          >
            <FileText size={18} className="mr-3" /> My Orders & Sales
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow bg-white border-2 border-gray-200 p-8 rounded-sm">
        {/* --- PROFILE TAB --- */}
        {activeTab === "profile" && (
          <div>
            <h2 className="text-3xl font-extrabold text-carbon-dark mb-6">
              Personal Details
            </h2>
            {loading ? (
              <p>Loading profile...</p>
            ) : (
              <div className="space-y-6 max-w-lg">
                <div className="border-b border-gray-100 pb-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                    Full Name
                  </p>
                  <p className="font-bold text-carbon-dark text-lg">
                    {userData?.name}
                  </p>
                </div>
                <div className="border-b border-gray-100 pb-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                    Registered Phone
                  </p>
                  <p className="font-bold text-carbon-dark text-lg">
                    {userData?.phone}
                  </p>
                </div>
                <div className="flex space-x-8 border-b border-gray-100 pb-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                      Locality & City
                    </p>
                    <p className="font-bold text-carbon-dark text-lg">
                      {userData?.city}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                      PIN Code
                    </p>
                    <p className="font-bold text-carbon-dark text-lg">
                      {userData?.pinCode}
                    </p>
                  </div>
                </div>
                <div className="bg-green-50 border-2 border-carbon-primary p-6 shadow-[4px_4px_0px_0px_rgba(46,204,113,1)] mt-8">
                  <p className="text-sm font-bold text-green-700 mb-1 flex items-center">
                    <Leaf size={16} className="mr-2" /> Lifetime Impact
                  </p>
                  <h3 className="text-4xl font-black text-carbon-dark">
                    {userData?.carbonCredits} kg
                  </h3>
                  <p className="text-xs text-green-800 mt-1">
                    CO2e diverted from landfills.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- LISTINGS TAB --- */}
        {activeTab === "listings" && (
          <div>
            <h2 className="text-3xl font-extrabold text-carbon-dark mb-6">
              My Listed Products
            </h2>
            <div className="space-y-4">
              {loading ? (
                <p>Loading listings...</p>
              ) : myListings.length === 0 ? (
                <p className="text-gray-500">No items listed yet.</p>
              ) : (
                myListings.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-2 border-gray-200 p-4 rounded hover:border-carbon-dark transition"
                  >
                    <div className="flex items-center space-x-4 w-1/3">
                      <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 overflow-hidden flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title || "Product"} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <h4 className="font-bold text-carbon-dark">
                        {item.title ||
                          item.name ||
                          item.description?.substring(0, 20)}
                      </h4>
                    </div>
                    <div className="w-1/6 font-black text-carbon-dark">
                      ₹{item.price || "N/A"}
                    </div>
                    <div className="w-1/4">
                      <span className="text-xs font-bold px-3 py-1 rounded-full border bg-gray-100 text-gray-600 border-gray-200">
                        {item.status}
                      </span>
                    </div>
                    <div className="w-auto">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 border border-red-200 px-3 py-1 rounded hover:bg-red-50 text-sm font-bold flex items-center transition"
                      >
                        <Trash2 size={14} className="mr-1" /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
