import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Leaf,
  ShieldAlert,
  Scale,
  CheckCircle,
  AlertTriangle,
  X,
  LogOut,
  Eye,
  Video,
  User,
  Phone,
  MapPin,
  ShieldCheck,
  Package,
} from "lucide-react";
import api from "../api/axiosConfig";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("security");
  const [flaggedListings, setFlaggedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inspectListing, setInspectListing] = useState(null);
  const [inspectPhotoIndex, setInspectPhotoIndex] = useState(0);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    navigate("/login");
  };

  // FETCH AI-FLAGGED LISTINGS
  const fetchFlaggedListings = async () => {
    try {
      const response = await api.get("/admin/flagged-products");
      setFlaggedListings(response.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching flagged items", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "security") fetchFlaggedListings();
  }, [activeTab]);

  // APPROVE LISTING ACTION
  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/products/${id}/approve`);
      setFlaggedListings(flaggedListings.filter((item) => item.id !== id));
      if (inspectListing?.id === id) setInspectListing(null);
      alert("Listing approved and published to marketplace!");
    } catch (err) {
      alert("Failed to approve listing.");
    }
  };

  // REJECT LISTING ACTION
  const handleReject = async (id) => {
    if (!window.confirm("Permanently reject and delete this listing?")) return;
    try {
      await api.put(`/admin/products/${id}/reject`);
      setFlaggedListings(flaggedListings.filter((item) => item.id !== id));
      if (inspectListing?.id === id) setInspectListing(null);
      alert("Listing rejected and permanently deleted.");
    } catch (err) {
      alert("Failed to reject listing.");
    }
  };

  const getListingPhotos = (listing) => {
    if (!listing) return [];
    if (listing.allImages && Array.isArray(listing.allImages) && listing.allImages.length > 0) {
      return listing.allImages;
    }
    if (listing.imageUrls && typeof listing.imageUrls === "string") {
      const split = listing.imageUrls.split(";").map((s) => s.trim()).filter(Boolean);
      if (split.length > 0) return split;
    }
    if (listing.imageUrl) {
      return [listing.imageUrl];
    }
    return ["https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=500&q=80"];
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden font-sans">
      {/* Dark Sidebar */}
      <div className="w-64 bg-[#0f172a] text-white flex flex-col justify-between flex-shrink-0 h-full border-r-4 border-carbon-primary">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <div className="bg-carbon-primary text-carbon-dark p-1 rounded-sm">
              <Leaf size={24} />
            </div>
            <span className="text-2xl font-extrabold tracking-tight">
              Carbonwise
            </span>
          </div>
          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-4">
            Trust & Safety (Admin)
          </p>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("security")}
              className={`w-full flex items-center py-3 px-4 rounded font-bold transition ${
                activeTab === "security" ? "bg-carbon-primary text-[#0f172a]" : "text-gray-400 hover:text-white"
              }`}
            >
              <ShieldAlert size={18} className="mr-3" /> AI Flags Queue
              {flaggedListings.length > 0 && (
                <span className="ml-auto bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {flaggedListings.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("escrow")}
              className={`w-full flex items-center py-3 px-4 rounded font-bold transition ${
                activeTab === "escrow" ? "bg-carbon-primary text-[#0f172a]" : "text-gray-400 hover:text-white"
              }`}
            >
              <Scale size={18} className="mr-3" /> Disputes
            </button>
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
      <div className="flex-grow flex flex-col h-full overflow-hidden p-8">
        {activeTab === "security" && (
          <>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-extrabold text-carbon-dark">
                  Security Review: AI-Flagged Listings
                </h1>
                <p className="text-xs text-gray-500 mt-1 font-semibold">
                  Inspect photos, videos, and AI fraud signals before granting marketplace access.
                </p>
              </div>
              <button
                onClick={fetchFlaggedListings}
                className="bg-white border-2 border-carbon-dark text-carbon-dark px-4 py-2 text-xs font-bold rounded shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-gray-50"
              >
                Refresh Queue
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-sm mb-6 flex items-start text-yellow-800 text-sm">
              <AlertTriangle size={18} className="mr-3 flex-shrink-0 text-yellow-600 mt-0.5" />
              <p>
                <strong>AI flags are review alerts.</strong> Review all uploaded photos, inspection videos, and seller details before approving or rejecting.
              </p>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-sm flex-grow overflow-auto">
              {loading ? (
                <p className="p-8 text-center text-gray-500 font-bold animate-pulse">
                  Loading flagged queue...
                </p>
              ) : flaggedListings.length === 0 ? (
                <div className="p-12 text-center text-green-700">
                  <CheckCircle size={48} className="mx-auto mb-3 text-carbon-primary" />
                  <p className="font-extrabold text-lg">Flagged Queue is Clear!</p>
                  <p className="text-xs text-gray-500 mt-1">
                    All products are either clean and auto-approved or have been reviewed.
                  </p>
                </div>
              ) : (
                <div className="divide-y-2 divide-gray-100">
                  {flaggedListings.map((listing) => {
                    const photos = getListingPhotos(listing);
                    return (
                      <div
                        key={listing.id}
                        className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50 transition gap-4"
                      >
                        <div className="w-full sm:w-1/4">
                          <p className="font-bold text-carbon-dark text-sm truncate">
                            {listing.title || `Listing #${String(listing.id).substring(0, 8)}`}
                          </p>
                          <p className="text-xs font-black text-carbon-dark mt-0.5">
                            ₹{listing.price?.toLocaleString()} • {listing.category || "TECH"}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded uppercase">
                              Risk Score: {listing.scamProbability1To10 || 8}/10
                            </span>
                            {listing.videoUrl && (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded flex items-center">
                                <Video size={10} className="mr-1" /> Video Attached
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <img
                            src={photos[0]}
                            alt="Flagged"
                            className="w-16 h-12 object-contain border-2 border-carbon-dark rounded-sm mix-blend-multiply bg-gray-50 p-1"
                          />
                          {photos.length > 1 && (
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-1 rounded border">
                              +{photos.length - 1} more
                            </span>
                          )}
                        </div>

                        <div className="w-full sm:w-1/3 text-xs">
                          <p className="font-bold text-red-700">AI Fraud Signal:</p>
                          <p className="text-gray-700 mt-0.5 line-clamp-2">
                            {listing.aiFraudReasoning || "Flagged for safety review."}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              setInspectListing(listing);
                              setInspectPhotoIndex(0);
                            }}
                            className="bg-gray-100 border-2 border-carbon-dark text-carbon-dark font-bold text-xs px-3 py-2 rounded hover:bg-gray-200 flex items-center shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
                          >
                            <Eye size={14} className="mr-1" /> Inspect Details
                          </button>
                          <button
                            onClick={() => handleApprove(listing.id)}
                            className="bg-carbon-primary text-carbon-dark font-bold text-xs px-3 py-2 rounded shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] border-2 border-carbon-dark hover:bg-carbon-secondary flex items-center"
                          >
                            <CheckCircle size={14} className="mr-1" /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(listing.id)}
                            className="bg-white text-red-600 font-bold text-xs px-3 py-2 rounded border-2 border-red-200 hover:bg-red-50 flex items-center transition"
                          >
                            <X size={14} className="mr-1" /> Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "escrow" && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Scale size={48} className="mb-4 opacity-50" />
            <h2 className="text-2xl font-bold">Escrow Disputes Module</h2>
            <p>No active disputes to mediate at this time.</p>
          </div>
        )}
      </div>

      {/* FULL INSPECTION MODAL (All Photos, Videos, Specs, Seller Profile) */}
      {inspectListing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-carbon-dark w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#0f172a] text-white p-4 flex justify-between items-center border-b-4 border-carbon-primary">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Administrative Forensic Inspection
                </p>
                <h2 className="text-xl font-black text-white">{inspectListing.title}</h2>
              </div>
              <button
                onClick={() => setInspectListing(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Media (All 3-4 Photos + Video) */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-carbon-dark text-sm border-b pb-1">
                  Uploaded Visual Evidence
                </h3>

                {/* Main Selected Photo */}
                {(() => {
                  const photos = getListingPhotos(inspectListing);
                  return (
                    <div>
                      <div className="border-2 border-carbon-dark bg-gray-50 rounded aspect-video flex items-center justify-center p-3 relative shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                        <img
                          src={photos[inspectPhotoIndex] || photos[0]}
                          alt="Inspection Main"
                          className="max-h-full max-w-full object-contain mix-blend-multiply"
                        />
                        <span className="absolute bottom-2 left-2 bg-carbon-dark text-white text-[10px] font-black px-2 py-0.5 rounded">
                          Photo {inspectPhotoIndex + 1} of {photos.length}
                        </span>
                      </div>

                      {/* Photo Thumbnails Gallery */}
                      {photos.length > 1 && (
                        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                          {photos.map((pUrl, idx) => (
                            <button
                              key={idx}
                              onClick={() => setInspectPhotoIndex(idx)}
                              className={`w-16 h-16 border-2 rounded p-1 bg-white flex-shrink-0 transition ${
                                inspectPhotoIndex === idx
                                  ? "border-carbon-primary shadow-[2px_2px_0px_0px_rgba(46,204,113,1)]"
                                  : "border-gray-300 opacity-60 hover:opacity-100"
                              }`}
                            >
                              <img
                                src={pUrl}
                                alt={`Thumb ${idx + 1}`}
                                className="w-full h-full object-contain mix-blend-multiply"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Video Inspection Player */}
                <div>
                  <h4 className="font-bold text-xs text-carbon-dark mb-1 flex items-center">
                    <Video size={14} className="mr-1 text-carbon-primary" />
                    360° Verification Video
                  </h4>
                  {inspectListing.videoUrl ? (
                    <div className="border-2 border-carbon-dark rounded bg-black overflow-hidden shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                      <video
                        src={inspectListing.videoUrl}
                        controls
                        className="w-full max-h-52 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="bg-gray-100 border border-gray-200 p-3 rounded text-center text-xs text-gray-500 italic">
                      No inspection video attached with this submission.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Listing Details, AI Forensics, Seller */}
              <div className="space-y-4 text-xs">
                {/* Financials & Category */}
                <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold">Declared Listing Price:</span>
                    <span className="text-xl font-black text-carbon-dark">
                      ₹{inspectListing.price?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold">Category:</span>
                    <span className="font-extrabold uppercase bg-gray-200 px-2 py-0.5 rounded text-[11px]">
                      {inspectListing.category}
                    </span>
                  </div>
                </div>

                {/* AI Safety Report */}
                <div className="bg-red-50 border-2 border-red-300 p-4 rounded space-y-2 text-red-900">
                  <div className="flex justify-between items-center border-b border-red-200 pb-2">
                    <span className="font-extrabold flex items-center">
                      <ShieldAlert size={16} className="mr-1.5 text-red-600" /> AI Scam Assessment
                    </span>
                    <span className="bg-red-600 text-white font-black px-2 py-0.5 rounded text-[10px]">
                      Risk Score: {inspectListing.scamProbability1To10 || 8}/10
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    <strong>Reasoning Log:</strong> {inspectListing.aiFraudReasoning || "Flagged for manual review."}
                  </p>
                  <p className="text-[11px] text-gray-700">
                    <strong>Detected Specs:</strong> {inspectListing.hardwareSpecs || "Standard device model"}
                  </p>
                </div>

                {/* User Description */}
                <div>
                  <h4 className="font-bold text-gray-500 uppercase tracking-wider text-[10px] mb-1">
                    Seller Description
                  </h4>
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded text-gray-700 whitespace-pre-wrap max-h-36 overflow-y-auto">
                    {inspectListing.description}
                  </div>
                </div>

                {/* Seller Profile */}
                <div className="bg-gray-50 border border-gray-200 p-3 rounded space-y-1">
                  <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                    Seller Profile & Hub
                  </p>
                  <p className="font-extrabold text-carbon-dark text-sm flex items-center">
                    <User size={13} className="mr-1.5 text-gray-400" />
                    {inspectListing.seller?.name || "Registered User"}
                  </p>
                  <p className="text-gray-600 flex items-center">
                    <Phone size={12} className="mr-1.5 text-gray-400" />
                    {inspectListing.seller?.phone || "N/A"}
                  </p>
                  <p className="text-gray-600 flex items-center">
                    <MapPin size={12} className="mr-1.5 text-gray-400" />
                    {inspectListing.seller?.city || "Kothrud, Pune"} {inspectListing.seller?.pinCode ? `(${inspectListing.seller.pinCode})` : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-gray-50 border-t-2 border-gray-200 p-4 flex justify-end space-x-3 mt-auto">
              <button
                onClick={() => setInspectListing(null)}
                className="px-4 py-2 border-2 border-gray-300 font-bold text-xs rounded hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={() => handleReject(inspectListing.id)}
                className="bg-white text-red-600 border-2 border-red-300 font-bold text-xs px-5 py-2 rounded hover:bg-red-50 flex items-center"
              >
                <X size={14} className="mr-1.5" /> Reject & Delete Listing
              </button>
              <button
                onClick={() => handleApprove(inspectListing.id)}
                className="bg-carbon-primary text-carbon-dark font-black text-xs px-6 py-2.5 rounded border-2 border-carbon-dark shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:bg-carbon-secondary flex items-center"
              >
                <CheckCircle size={14} className="mr-1.5" /> Approve & Publish to Marketplace ↗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
