import { useState } from "react";
import { Leaf, Package, CheckCircle } from "lucide-react";
import api from "../api/axiosConfig";

export default function UserRecycleRequest() {
  const [formData, setFormData] = useState({ productName: "", weightKg: "" });
  const [image, setImage] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productName.trim() || formData.productName.trim().length < 3) {
      alert("Please provide a valid device description (at least 3 characters).");
      return;
    }
    const weight = parseFloat(formData.weightKg);
    if (isNaN(weight) || weight <= 0) {
      alert("Estimated weight must be a positive number greater than 0 kg.");
      return;
    }
    if (weight > 1000) {
      alert("Estimated weight cannot exceed 1000 kg.");
      return;
    }
    if (!image) {
      alert("Device photo is mandatory for pickup verification.");
      return;
    }

    try {
      const data = new FormData();
      data.append("productName", formData.productName.trim());
      data.append("weightKg", weight);
      data.append("image", image);
      await api.post("/recycle/submit", data);
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data || "Failed to submit request. Please verify inputs and login.";
      alert(typeof msg === "string" ? msg : "Failed to submit request.");
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <CheckCircle size={64} className="text-carbon-primary mx-auto mb-6" />
        <h1 className="text-4xl font-extrabold text-carbon-dark mb-4">
          Pickup Requested!
        </h1>
        <p className="text-gray-500 mb-8">
          A certified recycling partner will contact you shortly. Once
          physically recycled, Carbon Credits will be added to your wallet
          automatically.
        </p>
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-carbon-dark text-white font-bold px-8 py-3 rounded hover:bg-gray-800"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white border-2 border-carbon-dark p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
      <div className="flex items-center mb-6">
        <Leaf className="text-carbon-primary mr-3" size={32} />
        <h1 className="text-3xl font-extrabold text-carbon-dark">
          Schedule an E-Waste Pickup
        </h1>
      </div>
      <p className="text-gray-600 mb-8 border-b border-gray-200 pb-6">
        Turn your completely dead or broken electronics into Carbon Credits. Our
        partners will collect the items directly from your registered address.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-carbon-dark mb-2">
            Device Description
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Broken Dell Monitor, Dead Printer"
            className="w-full p-4 border-2 border-gray-200 rounded focus:border-carbon-primary focus:outline-none"
            value={formData.productName}
            onChange={(e) =>
              setFormData({ ...formData, productName: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-carbon-dark mb-2">
            Estimated Weight (kg)
          </label>
          <input
            type="number"
            required
            min="0.1"
            max="1000"
            step="0.1"
            placeholder="e.g. 2.5"
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e") e.preventDefault();
            }}
            className="w-full p-4 border-2 border-gray-200 rounded focus:border-carbon-primary focus:outline-none"
            value={formData.weightKg}
            onChange={(e) =>
              setFormData({ ...formData, weightKg: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-carbon-dark mb-2">
            Device Photo
          </label>
          <input
            type="file"
            required
            accept="image/*"
            className="w-full p-4 border-2 border-gray-200 rounded focus:border-carbon-primary focus:outline-none bg-white cursor-pointer"
            onChange={(e) => setImage(e.target.files[0])}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-carbon-primary text-carbon-dark font-black text-lg py-4 border-2 border-carbon-dark shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-carbon-secondary transition flex justify-center items-center"
        >
          <Package className="mr-2" /> Request Free Pickup
        </button>
        <p className="text-[11px] text-gray-500 text-center mt-2">
          * Carbon credit awards are approximate estimates calculated from device recovery weight and standard LCA circular recovery factors.
        </p>
      </form>
    </div>
  );
}
