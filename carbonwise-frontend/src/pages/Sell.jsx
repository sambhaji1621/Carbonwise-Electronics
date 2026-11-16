import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Smartphone,
  CheckCircle,
  ShieldCheck,
  MapPin,
  X,
  AlertTriangle,
  Plus,
  Video,
} from "lucide-react";
import api from "../api/axiosConfig";

export default function Sell() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("SMARTPHONE");
  const [video, setVideo] = useState(null);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("IDLE"); // IDLE, SUBMITTING, COMPLETE
  const [aiResult, setAiResult] = useState(null);

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Combine with current images up to a max of 5
    const combined = [...images, ...files].slice(0, 5);
    setImages(combined);
    const newPreviews = combined.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const handleRemoveImage = (indexToRemove) => {
    const updatedImages = images.filter((_, idx) => idx !== indexToRemove);
    setImages(updatedImages);
    const updatedPreviews = updatedImages.map((file) => URL.createObjectURL(file));
    setPreviews(updatedPreviews);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const tempVideo = document.createElement("video");
      tempVideo.preload = "metadata";
      tempVideo.onloadedmetadata = () => {
        window.URL.revokeObjectURL(tempVideo.src);
        if (tempVideo.duration > 30) {
          alert("Video duration exceeds 30 seconds (maximum allowed). Please select a shorter video.");
          setVideo(null);
        } else {
          setVideo(file);
        }
      };
      tempVideo.src = URL.createObjectURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      alert("Please upload at least one clear device photo (3-4 photos recommended for best buyer response).");
      return;
    }
    if (!title.trim() || title.trim().length < 3) {
      alert("Please provide a valid product title (at least 3 characters).");
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      alert("Please enter a valid price in INR (minimum ₹1).");
      return;
    }
    if (numPrice > 10000000) {
      alert("Listing price exceeds the maximum allowed limit (₹1,00,00,000).");
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      alert("Please provide a condition description (at least 5 characters).");
      return;
    }

    setStatus("SUBMITTING");

    const formData = new FormData();
    // Append all selected photos
    images.forEach((img) => {
      formData.append("images", img);
    });
    // Append primary image for backward compatibility
    formData.append("image", images[0]);

    formData.append("title", title.trim());
    formData.append("price", numPrice);
    formData.append("category", category);
    formData.append("description", description.trim());
    if (video) {
      formData.append("video", video);
    }

    try {
      const response = await api.post("/products/add", formData);
      setAiResult(response.data);
      setStatus("COMPLETE");
    } catch (error) {
      console.error(error);
      setStatus("IDLE");
      const errorMsg =
        error.response?.data?.message ||
        (typeof error.response?.data === "string" ? error.response.data : "") ||
        "Submission failed. Ensure you are logged in and under the rate limit.";
      alert(errorMsg);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <p className="text-gray-500 text-sm mb-2 font-semibold">
          Seller workspace / New listing
        </p>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold text-carbon-dark mb-2">
              A second life starts here.
            </h1>
            <p className="text-gray-500">
              Upload 3-4 photos of your device. Let AI verify specs. Sell with confidence.
            </p>
          </div>
          <div className="bg-white border-2 border-carbon-dark px-4 py-2 font-bold text-sm shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
            <ShieldCheck size={18} className="inline mr-2 text-carbon-primary" /> AI-powered verification
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Inputs */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <h3 className="font-bold text-base text-carbon-dark mb-2">
              Product Title
            </h3>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-2 border-gray-200 rounded p-3.5 focus:border-carbon-primary focus:outline-none bg-gray-50 text-carbon-dark font-medium text-sm"
              placeholder="e.g. Lenovo Ideapad Slim 3 15.6 inch i5 16GB RAM 512GB SSD"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-bold text-base text-carbon-dark mb-2">
                Price (₹)
              </h3>
              <input
                type="number"
                required
                min="1"
                max="10000000"
                step="1"
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e") e.preventDefault();
                }}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border-2 border-gray-200 rounded p-3.5 focus:border-carbon-primary focus:outline-none bg-gray-50 text-carbon-dark font-medium text-sm"
                placeholder="e.g. 28000"
              />
            </div>
            <div>
              <h3 className="font-bold text-base text-carbon-dark mb-2">
                Category
              </h3>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border-2 border-gray-200 rounded p-3.5 focus:border-carbon-primary focus:outline-none bg-gray-50 text-carbon-dark font-medium text-sm"
              >
                <option value="SMARTPHONE">Smartphone</option>
                <option value="LAPTOP">Laptop</option>
                <option value="TABLET">Tablet</option>
                <option value="SMARTWATCH">Smartwatch</option>
                <option value="AUDIO">Audio (Headphones / Speakers)</option>
                <option value="PC_COMPONENT">PC Component (GPU, RAM, etc.)</option>
                <option value="UNSUPPORTED">Other / Unsupported</option>
              </select>
            </div>
          </div>

          {/* Multiple Photos Upload Section (3-4 photos allowed, max 5) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-base text-carbon-dark">
                Device Photos <span className="text-xs font-normal text-gray-500">(Upload 3 to 4 clear photos · Max 5)</span>
              </h3>
              <span className="text-xs font-bold text-carbon-primary">
                {images.length}/5 Selected
              </span>
            </div>

            {images.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded bg-gray-50 p-8 flex flex-col items-center justify-center relative hover:bg-gray-100 transition cursor-pointer">
                <Upload size={36} className="text-gray-400 mb-2" />
                <p className="text-sm font-bold text-carbon-dark mb-1">
                  Click or drag photos here (attach 3-4 photos)
                </p>
                <p className="text-xs text-gray-500">
                  Front, back, sides, and screen on · JPG, PNG up to 10 MB each
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImagesChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {previews.map((previewUrl, index) => (
                    <div
                      key={index}
                      className="relative border-2 border-carbon-dark rounded bg-white aspect-square overflow-hidden group shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
                    >
                      <img
                        src={previewUrl}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-contain p-2 mix-blend-multiply"
                      />
                      <span className="absolute bottom-1 left-1 bg-carbon-dark text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                        {index === 0 ? "Cover Photo" : `Photo ${index + 1}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition shadow"
                        title="Remove photo"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {images.length < 5 && (
                    <label className="border-2 border-dashed border-gray-300 rounded bg-gray-50 aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition text-gray-500">
                      <Plus size={24} className="mb-1 text-gray-400" />
                      <span className="text-[11px] font-bold">Add Photo</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImagesChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 italic">
                  Tip: Uploading all angles (front, back, ports, screen working) boosts buyer confidence and speeds up AI verification.
                </p>
              </div>
            )}
          </div>

          {/* Verification Video Upload */}
          <div>
            <h3 className="font-bold text-base text-carbon-dark mb-2">
              Verification Video (Optional · Max 30s)
            </h3>
            <div className="border-2 border-dashed border-gray-300 rounded bg-gray-50 p-4 flex flex-col items-center justify-center relative hover:bg-gray-100 transition cursor-pointer">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Video size={18} className="text-gray-400" />
                <span className="font-medium">
                  {video ? `Selected: ${video.name}` : "Upload quick 360° device inspection · MP4, WebM (max 30s)"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-base text-carbon-dark mb-2">
              Describe your device
            </h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border-2 border-gray-200 rounded p-3.5 h-32 focus:border-carbon-primary focus:outline-none resize-none bg-gray-50 font-medium text-sm"
              placeholder="Detail device condition, storage, battery life, included accessories, and any cosmetic flaws..."
            ></textarea>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <MapPin size={12} className="mr-1 text-carbon-primary flex-shrink-0" />
              Listing will be shown to buyers with your registered profile location for local meetups.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={
              status === "SUBMITTING" ||
              status === "COMPLETE" ||
              images.length === 0 ||
              !description ||
              !title ||
              !price
            }
            className={`w-full py-4 font-black rounded text-white transition border-2 border-carbon-dark ${
              status !== "IDLE" || images.length === 0 || !description || !title || !price
                ? "bg-gray-400 border-gray-400 cursor-not-allowed"
                : "bg-carbon-dark hover:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(46,204,113,1)]"
            }`}
          >
            {status === "SUBMITTING"
              ? "Running AI Forensic Verification..."
              : status === "COMPLETE"
                ? "Listing Verified!"
                : "Submit for AI Verification ↗"}
          </button>
        </div>

        {/* AI Results Side Dashboard */}
        <div className="lg:col-span-5">
          <div className="bg-carbon-dark text-white p-6 border-b-4 border-carbon-primary">
            <h2 className="text-xl font-bold flex items-center">
              <ShieldCheck size={24} className="text-carbon-primary mr-3" />
              AI Verification Engine
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Autonomous fraud and category verification.
            </p>
          </div>

          <div className="bg-white border-2 border-t-0 border-carbon-dark p-6 space-y-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            {status === "IDLE" && (
              <div className="h-72 flex flex-col items-center justify-center text-gray-400 text-center p-4">
                <Smartphone size={48} className="mb-4 opacity-50" />
                <p className="font-bold text-carbon-dark text-sm mb-1">Awaiting Product Submission</p>
                <p className="text-xs text-gray-500 max-w-xs">
                  Fill in title, price, category and attach 3-4 photos. AI will automatically inspect and approve valid electronics.
                </p>
              </div>
            )}

            {status === "SUBMITTING" && (
              <div className="h-72 flex flex-col items-center justify-center text-carbon-primary text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-carbon-primary mb-4"></div>
                <p className="font-black text-carbon-dark text-base mb-1">Running AI Forensic Audit</p>
                <p className="text-xs text-gray-500">Checking price plausibility, hardware specs, and category match...</p>
              </div>
            )}

            {status === "COMPLETE" && aiResult && (
              <div className="flex flex-col h-full justify-center space-y-4">
                {aiResult.status === "ACTIVE" ? (
                  /* AUTOMATICALLY APPROVED CASE */
                  <div className="bg-green-50 border-2 border-green-500 p-5 rounded text-green-900 space-y-3">
                    <div className="flex items-center">
                      <CheckCircle className="text-green-600 mr-2 flex-shrink-0" size={24} />
                      <p className="font-black text-lg text-carbon-dark">AI Verification Passed!</p>
                    </div>
                    <p className="text-xs text-gray-700">
                      Your listing meets all marketplace criteria and is <strong>immediately live</strong> in the marketplace.
                    </p>
                    <div className="bg-white border border-green-200 p-3 rounded text-xs space-y-1 font-mono">
                      <p>
                        <strong>Status:</strong>{" "}
                        <span className="bg-green-100 text-green-800 font-black px-1.5 py-0.5 rounded text-[11px]">
                          ACTIVE (Live on Marketplace)
                        </span>
                      </p>
                      <p>
                        <strong>Fraud Score:</strong> {aiResult.scamProbability1To10 || 1}/10 (Safe)
                      </p>
                      <p>
                        <strong>Hardware Specs:</strong> {aiResult.hardwareSpecs || title}
                      </p>
                    </div>
                    <div className="flex space-x-3 pt-2">
                      <button
                        onClick={() => navigate("/")}
                        className="w-1/2 bg-carbon-dark text-white font-bold py-3 text-xs rounded hover:bg-gray-800 transition"
                      >
                        View in Marketplace
                      </button>
                      <button
                        onClick={() => navigate("/dashboard")}
                        className="w-1/2 bg-carbon-primary text-carbon-dark font-black py-3 text-xs rounded border-2 border-carbon-dark hover:bg-carbon-secondary transition"
                      >
                        My Dashboard
                      </button>
                    </div>
                  </div>
                ) : (
                  /* FLAGGED FOR ADMIN REVIEW CASE */
                  <div className="bg-amber-50 border-2 border-amber-500 p-5 rounded text-amber-900 space-y-3">
                    <div className="flex items-center">
                      <AlertTriangle className="text-amber-600 mr-2 flex-shrink-0" size={24} />
                      <p className="font-black text-lg text-carbon-dark">Routed for Admin Review</p>
                    </div>
                    <p className="text-xs text-gray-700">
                      Our AI safety engine flagged potential anomalies that require human verification before this listing goes live.
                    </p>
                    <div className="bg-white border border-amber-200 p-3 rounded text-xs space-y-1.5">
                      <p>
                        <strong>Flag Reason:</strong> {aiResult.aiFraudReasoning}
                      </p>
                      <p>
                        <strong>Risk Score:</strong>{" "}
                        <span className="text-red-600 font-bold">{aiResult.scamProbability1To10 || 8}/10</span>
                      </p>
                    </div>
                    <button
                      onClick={() => navigate("/dashboard")}
                      className="w-full bg-carbon-dark text-white font-black py-3 text-xs rounded hover:bg-gray-800 transition"
                    >
                      Proceed to Dashboard
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
