import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Leaf,
  Bell,
  CircleHelp,
  Calendar,
  Printer,
  CheckCircle,
  Package,
  Truck,
  Activity,
  MapPin,
  Phone,
  User,
  LogOut,
} from "lucide-react";
import api from "../api/axiosConfig";

export default function RecyclerDashboard() {
  const [tasks, setTasks] = useState({
    pending: [],
    accepted: [],
    recycled: [],
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    navigate("/login");
  };

  // FETCH ALL RECYCLING TASKS
  const fetchTasks = async () => {
    try {
      // Adjust endpoint to match your controller
      const response = await api.get("/recycle/tasks");
      const data = response.data;

      setTasks({
        pending: data.filter((t) => t.status === "PENDING"),
        accepted: data.filter((t) => t.status === "ACCEPTED"),
        recycled: data.filter((t) => t.status === "RECYCLED"),
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching recycle tasks", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // ACCEPT PICKUP ACTION
  const handleAccept = async (id) => {
    try {
      await api.put(`/recycle/${id}/accept`);
      fetchTasks(); // Refresh board
    } catch (err) {
      alert("Failed to accept task.");
    }
  };

  // COMPLETE RECYCLING & CREDIT USER ACTION
  const handleComplete = async (id) => {
    if (
      !window.confirm(
        "Confirm physical recycling is complete? This will issue carbon credits to the user.",
      )
    )
      return;
    try {
      await api.put(`/recycle/${id}/complete`);
      fetchTasks(); // Refresh board
    } catch (err) {
      alert("Failed to complete recycling.");
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden font-sans">
      {/* Sidebar (Unchanged layout) */}
      <div className="w-64 bg-carbon-dark text-white flex flex-col justify-between flex-shrink-0 h-full">
        <div>
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-carbon-primary text-white p-1 rounded-sm">
                <Leaf size={20} />
              </div>
              <span className="text-xl font-extrabold tracking-tight">
                Carbonwise
              </span>
            </div>
            <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">
              Recycling Partner
            </p>
            <h3 className="font-bold text-white text-lg leading-tight">
              EcoLoop Recovery
            </h3>
          </div>
          <nav className="p-4 space-y-2">
            <a
              href="#"
              className="flex items-center text-carbon-dark bg-carbon-primary py-2.5 px-4 rounded font-bold shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]"
            >
              <Package size={18} className="mr-3" /> Live Operations
            </a>
          </nav>
        </div>

        <div className="p-6 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded transition"
          >
            <LogOut size={18} className="mr-2" /> Logout
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-grow flex flex-col h-full overflow-hidden">
        <div className="bg-white border-b-2 border-gray-200 px-8 py-4 flex justify-between items-center flex-shrink-0">
          <span className="font-bold text-carbon-dark">
            Recycler operations / Pune region
          </span>
        </div>

        <div className="flex-grow overflow-auto p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-carbon-dark">
              Local E-Waste Requests
            </h1>
          </div>

          {loading ? (
            <p className="text-carbon-primary font-bold animate-pulse">
              Loading recycling pipeline...
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start pb-10">
              {/* PENDING COLUMN */}
              <div className="bg-gray-100 p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-carbon-dark flex items-center">
                    <span className="w-2 h-2 bg-gray-400 mr-2 rounded-sm"></span>{" "}
                    Pending
                  </h4>
                  <span className="bg-white border border-gray-200 text-xs font-bold px-2 py-0.5 rounded-sm">
                    {tasks.pending.length}
                  </span>
                </div>
                <div className="space-y-4">
                  {tasks.pending.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white border-2 border-carbon-dark p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-bold text-carbon-dark text-sm">
                          Task #{task.id}
                        </span>
                        <span className="text-[10px] font-bold border border-gray-300 px-1.5 py-0.5 uppercase tracking-wider">
                          New
                        </span>
                      </div>
                      <div className="flex items-start mb-4">
                        {task.imageUrl ? (
                          <img
                            src={task.imageUrl}
                            alt={task.productName}
                            className="w-16 h-16 object-cover border-2 border-carbon-dark rounded mr-3 flex-shrink-0"
                          />
                        ) : (
                          <Printer
                            size={24}
                            className="text-gray-400 mr-3 flex-shrink-0"
                          />
                        )}
                        <div>
                          <p className="font-bold text-carbon-dark">
                            {task.productName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Est. weight {task.weightKg} kg
                          </p>
                          {task.user?.city && (
                            <p className="text-xs text-gray-500 flex items-center mt-1">
                              <MapPin size={11} className="mr-1 text-gray-400" />
                              Area: {task.user.city}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAccept(task.id)}
                        className="w-full bg-white border-2 border-carbon-dark text-carbon-dark font-bold py-2 mb-2 hover:bg-gray-50 transition"
                      >
                        + Accept pickup
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACCEPTED COLUMN */}
              <div className="bg-gray-100 p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-carbon-dark flex items-center">
                    <span className="w-2 h-2 bg-carbon-dark mr-2 rounded-sm"></span>{" "}
                    Accepted
                  </h4>
                  <span className="bg-white border border-gray-200 text-xs font-bold px-2 py-0.5 rounded-sm">
                    {tasks.accepted.length}
                  </span>
                </div>
                <div className="space-y-4">
                  {tasks.accepted.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white border border-gray-300 p-4 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-bold text-carbon-dark text-sm">
                          Task #{task.id}
                        </span>
                        <span className="text-[10px] font-bold border border-gray-300 px-1.5 py-0.5 uppercase tracking-wider text-gray-500">
                          Assigned
                        </span>
                      </div>
                      <div className="flex items-start mb-4">
                        {task.imageUrl ? (
                          <img
                            src={task.imageUrl}
                            alt={task.productName}
                            className="w-16 h-16 object-cover border-2 border-carbon-dark rounded mr-3 flex-shrink-0"
                          />
                        ) : (
                          <Printer
                            size={24}
                            className="text-gray-400 mr-3 flex-shrink-0"
                          />
                        )}
                        <div>
                          <p className="font-bold text-carbon-dark">
                            {task.productName}
                          </p>
                          {task.weightKg && (
                            <p className="text-xs text-gray-500">
                              Est. weight {task.weightKg} kg
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Detailed Pickup Location & Contact Info */}
                      <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4 space-y-2 text-xs">
                        <div className="flex items-center text-amber-900 font-bold">
                          <MapPin size={14} className="mr-1.5 text-amber-700 flex-shrink-0" />
                          <span>Pickup Address:</span>
                        </div>
                        <p className="pl-5 text-gray-700 font-medium">
                          {task.user?.city ? `${task.user.city}, PIN: ${task.user.pinCode || "411001"}` : "Pune Central, Registered Address"}
                        </p>
                        
                        <div className="flex items-center text-amber-900 font-bold pt-1.5 border-t border-amber-200">
                          <User size={14} className="mr-1.5 text-amber-700 flex-shrink-0" />
                          <span>Contact Person:</span>
                        </div>
                        <div className="pl-5 space-y-0.5 text-gray-700">
                          <p className="font-semibold">{task.user?.name || "Customer"}</p>
                          <p className="flex items-center text-carbon-dark font-mono font-bold">
                            <Phone size={12} className="mr-1 text-gray-500" />
                            {task.user?.phone || "No phone listed"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleComplete(task.id)}
                        className="w-full bg-carbon-primary text-carbon-dark font-black py-2.5 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] border-2 border-carbon-dark hover:bg-carbon-secondary transition"
                      >
                        Mark as Recycled (Credit User)
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* RECYCLED COLUMN */}
              <div className="bg-green-50 p-4 border border-green-100">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-green-800 flex items-center">
                    <span className="w-2 h-2 bg-carbon-primary mr-2 rounded-sm"></span>{" "}
                    Recycled
                  </h4>
                  <span className="bg-white border border-green-200 text-green-700 text-xs font-bold px-2 py-0.5 rounded-sm">
                    {tasks.recycled.length}
                  </span>
                </div>
                <div className="space-y-4">
                  {tasks.recycled.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white border border-green-200 p-4 shadow-sm opacity-75"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="font-bold text-carbon-dark text-sm">
                          Task #{task.id}
                        </span>
                        <span className="text-[10px] font-bold text-carbon-primary flex items-center uppercase tracking-wider">
                          <CheckCircle size={12} className="mr-1" /> Credited
                        </span>
                      </div>
                      <div className="flex items-start mb-2">
                        {task.imageUrl && (
                          <img
                            src={task.imageUrl}
                            alt={task.productName}
                            className="w-12 h-12 object-cover border-2 border-green-300 rounded mr-3 flex-shrink-0"
                          />
                        )}
                        <div>
                          <p className="font-bold text-carbon-dark">
                            {task.productName}
                          </p>
                          <p className="text-xs font-black text-green-700 mt-1">
                            User credited: {task.carbonCredits} kg CO2e
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
