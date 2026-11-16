import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  MapPin,
  Truck,
  Handshake,
  Leaf,
  Lock,
  ChevronLeft,
  User,
  Phone,
  Video,
} from "lucide-react";
import api from "../api/axiosConfig";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState("LOCAL_QR");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const getProductPhotos = (prod) => {
    if (!prod) return [];
    if (prod.allImages && Array.isArray(prod.allImages) && prod.allImages.length > 0) {
      return prod.allImages;
    }
    if (prod.imageUrls && typeof prod.imageUrls === "string") {
      const split = prod.imageUrls.split(";").map((s) => s.trim()).filter(Boolean);
      if (split.length > 0) return split;
    }
    if (prod.imageUrl) {
      return [prod.imageUrl];
    }
    return ["https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800&q=80"];
  };

  // FETCH SINGLE PRODUCT FROM DATABASE
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data);
      } catch (err) {
        setError("Product not found or removed.");
      }
    };
    fetchProduct();
  }, [id]);

  // CREATE SECURE ORDER IN BACKEND
  const handleCheckout = async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      alert("Please log in to purchase items with Carbonwise Escrow protection.");
      navigate("/login");
      return;
    }

    if (product.status === "SOLD") {
      alert("This item has already been purchased.");
      return;
    }

    setIsProcessing(true);
    try {
      // Sends the order command to your Spring Boot controller
      await api.post("/orders/create", {
        productId: product.id,
        deliveryType: deliveryMethod,
        amountPaid:
          deliveryMethod === "COURIER" ? product.price + 150 : product.price,
      });

      // On success, backend created the escrow. Redirect to tracking.
      navigate("/orders");
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        (typeof error.response?.data === "string" ? error.response.data : "") ||
        "Payment/Checkout failed. Ensure you are logged in and item is active.";
      alert(errMsg);
      setIsProcessing(false);
    }
  };

  if (error)
    return (
      <div className="text-center py-20 font-bold text-red-500">{error}</div>
    );
  if (!product)
    return (
      <div className="text-center py-20 font-bold text-carbon-primary animate-pulse">
        Loading product details...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-semibold text-gray-500 mb-6 hover:text-carbon-dark"
      >
        <ChevronLeft size={16} className="mr-1" /> Back to Marketplace
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Image Gallery, Video & Condition Report */}
        <div className="lg:col-span-7 space-y-6">
          {(() => {
            const photos = getProductPhotos(product);
            return (
              <div className="space-y-3">
                <div className="bg-gray-50 border-2 border-carbon-dark relative aspect-video flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
                  <div className="absolute top-4 left-4 bg-white px-3 py-1.5 border-2 border-carbon-dark flex items-center text-sm font-bold shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                    <ShieldCheck size={16} className="mr-2 text-carbon-dark" /> AI Verified
                  </div>
                  <img
                    src={photos[activePhotoIndex] || photos[0]}
                    alt="Product"
                    className="max-h-full max-w-full object-contain mix-blend-multiply p-6"
                  />
                  <span className="absolute bottom-3 right-3 bg-carbon-dark text-white text-[10px] font-black px-2 py-0.5 rounded">
                    Photo {activePhotoIndex + 1} of {photos.length}
                  </span>
                </div>

                {/* Multiple Photos Thumbnails */}
                {photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {photos.map((pUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`w-20 h-20 border-2 rounded p-1 bg-white flex-shrink-0 transition ${
                          activePhotoIndex === idx
                            ? "border-carbon-primary shadow-[2px_2px_0px_0px_rgba(46,204,113,1)]"
                            : "border-gray-200 opacity-60 hover:opacity-100"
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

          {/* Verification Video Section (if uploaded by seller) */}
          {product.videoUrl && (
            <div className="border-2 border-gray-200 rounded-sm p-6 bg-white space-y-3">
              <h3 className="text-base font-bold text-carbon-dark flex items-center">
                <Video size={18} className="text-carbon-primary mr-2" />
                360° Device Verification Video
              </h3>
              <p className="text-xs text-gray-500">
                Uploaded by the seller to verify cosmetic condition and physical screen operation.
              </p>
              <div className="border-2 border-carbon-dark rounded bg-black overflow-hidden shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                <video src={product.videoUrl} controls className="w-full max-h-64 object-contain" />
              </div>
            </div>
          )}

          <div className="border-2 border-gray-200 rounded-sm p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-carbon-dark flex items-center">
                <ShieldCheck size={24} className="text-carbon-primary mr-2" />
                AI Condition Report
              </h3>
            </div>
            <p className="text-gray-600 mb-4 whitespace-pre-wrap text-sm leading-relaxed">{product.description}</p>
            <div className="bg-gray-50 border border-gray-200 p-4 text-xs font-semibold text-carbon-dark rounded">
              <strong>AI Fraud Analysis Result:</strong>{" "}
              {product.aiFraudReasoning || "Verified safe for transaction."}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout & Escrow */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <p className="text-xs font-bold text-carbon-primary tracking-widest uppercase mb-2">
              Verified. Pre-loved. Ready for you.
            </p>
            <h1 className="text-4xl font-extrabold text-carbon-dark mb-2">
              {product.title || product.name}
            </h1>
            <div className="flex items-end mb-4 mt-4">
              <span className="text-4xl font-black text-carbon-dark mr-3">
                ₹{product.price.toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-gray-500 mb-1.5">
                Protected transaction.
              </span>
            </div>

            {/* Seller Location & Details Badge */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700 bg-gray-50 border-2 border-gray-200 p-3 rounded mb-6">
              <div className="flex items-center">
                <MapPin size={14} className="text-carbon-primary mr-1.5 flex-shrink-0" />
                <span>
                  Seller Location: <strong className="text-carbon-dark">{product.seller?.city || product.location || "Kothrud, Pune"}</strong>
                  {product.seller?.pinCode ? ` (${product.seller.pinCode})` : ""}
                </span>
              </div>
              <span className="text-gray-300 hidden sm:inline">|</span>
              <div className="flex items-center">
                <User size={14} className="text-gray-500 mr-1.5 flex-shrink-0" />
                <span>
                  Seller: <strong className="text-carbon-dark">{product.seller?.name || "Verified Seller"}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Escrow Shield */}
          <div className="bg-carbon-dark text-white p-5 rounded-sm shadow-[4px_4px_0px_0px_rgba(46,204,113,1)]">
            <div className="flex items-start mb-3">
              <ShieldCheck
                size={24}
                className="text-carbon-primary mr-3 flex-shrink-0"
              />
              <p className="font-bold leading-tight">
                Protected by Carbonwise Escrow. Funds held safely until you
                verify the item.
              </p>
            </div>
          </div>

          {/* Delivery Selection */}
          <div>
            <h3 className="font-bold text-carbon-dark mb-3">
              Choose your handover
            </h3>
            <div className="space-y-3">
              <label
                className={`flex items-center justify-between p-4 border-2 cursor-pointer transition ${deliveryMethod === "COURIER" ? "border-carbon-dark bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    checked={deliveryMethod === "COURIER"}
                    onChange={() => setDeliveryMethod("COURIER")}
                    className="mr-4 w-4 h-4 accent-carbon-dark"
                  />
                  <div>
                    <p className="font-bold text-carbon-dark text-sm">
                      Courier Delivery (₹150)
                    </p>
                  </div>
                </div>
                <Truck
                  size={20}
                  className={
                    deliveryMethod === "COURIER"
                      ? "text-carbon-dark"
                      : "text-gray-400"
                  }
                />
              </label>

              <label
                className={`flex items-center justify-between p-4 border-2 cursor-pointer transition ${deliveryMethod === "LOCAL_QR" ? "border-carbon-primary bg-green-50" : "border-gray-200 hover:border-gray-300"}`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    checked={deliveryMethod === "LOCAL_QR"}
                    onChange={() => setDeliveryMethod("LOCAL_QR")}
                    className="mr-4 w-4 h-4 accent-carbon-primary"
                  />
                  <div>
                    <p className="font-bold text-carbon-dark text-sm">
                      Meet Locally (Free)
                    </p>
                    <p className="text-xs font-bold text-carbon-secondary mt-1 flex items-center">
                      <Leaf size={12} className="mr-1" /> 0 kg CO2e Emissions
                    </p>
                  </div>
                </div>
                <Handshake
                  size={20}
                  className={
                    deliveryMethod === "LOCAL_QR"
                      ? "text-carbon-primary"
                      : "text-gray-400"
                  }
                />
              </label>

              {/* Precise Seller Details & Meetup Hub shown when Meet Locally is selected */}
              {deliveryMethod === "LOCAL_QR" && (
                <div className="bg-white border-2 border-carbon-dark p-4 rounded shadow-[3px_3px_0px_0px_rgba(46,204,113,1)]">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                    <p className="text-xs font-black uppercase tracking-wider text-carbon-secondary flex items-center">
                      <MapPin size={14} className="mr-1.5 text-carbon-primary" /> Meetup & Seller Handover Details
                    </p>
                    <span className="bg-green-100 text-green-800 text-[10px] font-black px-2 py-0.5 rounded border border-green-200">
                      LOCAL MEETUP
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Seller Name</p>
                      <p className="font-extrabold text-carbon-dark text-sm flex items-center mt-0.5">
                        <User size={13} className="mr-1 text-gray-500" />
                        {product.seller?.name || "Verified Seller"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact Number</p>
                      <p className="font-extrabold text-carbon-dark text-sm flex items-center mt-0.5">
                        <Phone size={13} className="mr-1 text-gray-500" />
                        {product.seller?.phone || "Available on checkout"}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Meetup Area / Hub</p>
                      <p className="font-extrabold text-carbon-primary text-sm flex items-center mt-0.5">
                        <MapPin size={13} className="mr-1 text-carbon-primary" />
                        {product.seller?.city || product.location || "Kothrud, Pune"}
                        {product.seller?.pinCode ? ` (PIN: ${product.seller.pinCode})` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-gray-100 text-[11px] text-gray-500 flex items-start">
                    <ShieldCheck size={14} className="mr-1.5 text-carbon-primary flex-shrink-0 mt-0.5" />
                    <span>
                      Meet in a public area. Inspect device thoroughly before scanning/sharing your 8-digit Handover Code. Escrow securely protects your funds.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Final Checkout */}
          <div className="border-t-2 border-gray-200 pt-6">
            <div className="flex justify-between items-end mb-6">
              <span className="font-bold text-lg text-carbon-dark">
                Total to escrow
              </span>
              <span className="text-3xl font-black text-carbon-dark">
                ₹
                {(
                  product.price + (deliveryMethod === "COURIER" ? 150 : 0)
                ).toLocaleString()}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isProcessing || product.status === "SOLD"}
              className="w-full bg-carbon-dark text-white font-bold py-4 rounded-sm flex items-center justify-center hover:bg-gray-800 transition disabled:bg-gray-400"
            >
              {isProcessing ? (
                "Processing Secure Payment..."
              ) : product.status === "SOLD" ? (
                "Item Sold"
              ) : (
                <>
                  <Lock size={18} className="mr-2" /> Pay to Escrow
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
