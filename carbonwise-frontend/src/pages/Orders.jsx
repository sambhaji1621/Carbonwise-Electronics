import { useState, useEffect } from "react";
import {
  Package,
  FileText,
  ChevronLeft,
  Check,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Copy,
  CheckCircle,
  Truck,
  ArrowRight,
  User,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";

export default function Orders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("purchases"); // 'purchases' | 'sales'
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchAllOrders = async () => {
    try {
      const [purchasesRes, salesRes] = await Promise.all([
        api.get("/orders/my-orders").catch(() => ({ data: [] })),
        api.get("/orders/my-sales").catch(() => ({ data: [] })),
      ]);
      setPurchases(purchasesRes.data || []);
      setSales(salesRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const currentList = activeTab === "purchases" ? purchases : sales;

  // Set default selected order when tab changes or data loads
  useEffect(() => {
    if (currentList.length > 0) {
      if (!selectedOrderId || !currentList.some((o) => o.id === selectedOrderId)) {
        setSelectedOrderId(currentList[0].id);
      }
    } else {
      setSelectedOrderId(null);
    }
  }, [activeTab, currentList]);

  const selectedOrder = currentList.find((o) => o.id === selectedOrderId) || null;

  // Map backend status to 4-step progress tracker
  const getProgressStep = (escrowStatus) => {
    if (escrowStatus === "RELEASED" || escrowStatus === "COMPLETED") return 4;
    if (escrowStatus === "AWAITING_HANDOVER" || escrowStatus === "IN_TRANSIT") return 3;
    if (escrowStatus === "PREPARING") return 2;
    return 1; // PAYMENT_HELD / ESCROW_FUNDED
  };

  const currentStep = selectedOrder ? getProgressStep(selectedOrder.escrowStatus || selectedOrder.status) : 1;
  const isReleased = selectedOrder?.escrowStatus === "RELEASED" || selectedOrder?.status === "RELEASED";

  // Formatted Handover Code
  const handoverCode = selectedOrder
    ? (selectedOrder.qrHash ? selectedOrder.qrHash.substring(0, 8) : String(selectedOrder.id).substring(0, 8)).toUpperCase()
    : "";

  const handleCopyCode = () => {
    if (handoverCode) {
      navigator.clipboard.writeText(`CW-${handoverCode}`);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Buyer confirms receipt directly
  const handleBuyerConfirmReceipt = async () => {
    if (!selectedOrder) return;
    const confirmed = window.confirm(
      "Have you received and tested your item? Once confirmed, the payment held in escrow will be released immediately to the seller."
    );
    if (!confirmed) return;

    try {
      setIsVerifying(true);
      const res = await api.post(`/orders/${selectedOrder.id}/release`);
      alert(res.data?.message || "Delivery confirmed! Escrow funds released to seller.");
      await fetchAllOrders();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || "Failed to release escrow funds.";
      alert(errMsg);
    } finally {
      setIsVerifying(false);
    }
  };

  // Seller verifies buyer's handover code
  const handleSellerVerifyCode = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !verificationCode.trim()) {
      alert("Please enter the 8-character handover code from the buyer.");
      return;
    }

    try {
      setIsVerifying(true);
      const res = await api.post(
        `/orders/${selectedOrder.id}/verify-qr?scannedQrHash=${encodeURIComponent(verificationCode.trim())}`
      );
      alert(res.data?.message || "Handover verified! Escrow released to your account.");
      setVerificationCode("");
      await fetchAllOrders();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || "Verification failed. Please check the code.";
      alert(errMsg);
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 font-bold text-carbon-primary animate-pulse">
        Loading secure escrow data...
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row max-w-7xl mx-auto gap-8 pb-12">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-carbon-dark">Escrow Center</h2>
          <p className="text-xs text-gray-500 font-semibold">Protected Marketplace Handover</p>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab("purchases")}
            className={`w-full text-left flex items-center justify-between py-2.5 px-3 rounded font-bold transition border-2 ${
              activeTab === "purchases"
                ? "bg-green-50 text-carbon-dark border-carbon-dark shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
                : "border-transparent text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center">
              <Package size={18} className="mr-3 text-carbon-primary" /> My Purchases
            </span>
            <span className="text-xs bg-gray-200 text-carbon-dark px-2 py-0.5 rounded-full font-black">
              {purchases.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("sales")}
            className={`w-full text-left flex items-center justify-between py-2.5 px-3 rounded font-bold transition border-2 ${
              activeTab === "sales"
                ? "bg-green-50 text-carbon-dark border-carbon-dark shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
                : "border-transparent text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center">
              <FileText size={18} className="mr-3 text-carbon-secondary" /> Incoming Sales
            </span>
            <span className="text-xs bg-gray-200 text-carbon-dark px-2 py-0.5 rounded-full font-black">
              {sales.length}
            </span>
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full text-left flex items-center py-2.5 px-3 rounded font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            <User size={18} className="mr-3 text-gray-400" /> Account Dashboard
          </button>
        </nav>

        {/* Order Selector (When user has multiple orders in this tab) */}
        {currentList.length > 1 && (
          <div className="pt-4 border-t-2 border-gray-200">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              {activeTab === "purchases" ? "Select Purchase" : "Select Sale"}
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {currentList.map((ord) => {
                const isOrdReleased = ord.escrowStatus === "RELEASED" || ord.status === "RELEASED";
                const isSelected = ord.id === selectedOrderId;
                return (
                  <button
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`w-full text-left p-2.5 rounded border-2 text-xs transition ${
                      isSelected
                        ? "border-carbon-dark bg-white shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] font-bold"
                        : "border-gray-200 bg-gray-50 hover:bg-white text-gray-600"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-extrabold text-carbon-dark truncate pr-1">
                        {ord.product?.title || ord.product?.name || "Order"}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                          isOrdReleased ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isOrdReleased ? "RELEASED" : "HELD"}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>₹{ord.amountPaid?.toLocaleString()}</span>
                      <span>#{String(ord.id).substring(0, 6).toUpperCase()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-grow">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm font-bold text-carbon-primary mb-6 hover:text-carbon-secondary transition"
        >
          <ChevronLeft size={18} className="mr-1" /> Back to Marketplace
        </button>

        {/* Empty State */}
        {currentList.length === 0 ? (
          <div className="bg-white border-2 border-carbon-dark p-12 text-center shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-black text-carbon-dark mb-2">
              {activeTab === "purchases" ? "No purchases yet" : "No incoming sales yet"}
            </h2>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              {activeTab === "purchases"
                ? "When you buy an item with Carbonwise Escrow protection, tracking and handover passes will appear here."
                : "When buyers purchase your listed electronics, escrow details and handover verification codes will appear here."}
            </p>
            <button
              onClick={() => navigate(activeTab === "purchases" ? "/" : "/sell")}
              className="bg-carbon-dark text-white font-bold px-6 py-3 rounded hover:bg-gray-800 transition"
            >
              {activeTab === "purchases" ? "Explore Verified Marketplace" : "List a Device for Sale"}
            </button>
          </div>
        ) : selectedOrder ? (
          <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-3">
              <div>
                <p className="text-xs font-bold text-carbon-primary tracking-widest uppercase mb-1">
                  {activeTab === "purchases" ? "Protected Purchase" : "Incoming Sale (Seller Escrow)"}
                </p>
                <h1 className="text-3xl font-black text-carbon-dark">
                  Order #{String(selectedOrder.id).substring(0, 8).toUpperCase()}
                </h1>
              </div>
              <span
                className={`border text-xs font-black px-3 py-1.5 rounded-full flex items-center ${
                  isReleased
                    ? "bg-green-100 text-green-800 border-green-300"
                    : "bg-amber-100 text-amber-800 border-amber-300"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${isReleased ? "bg-green-500" : "bg-amber-500 animate-pulse"}`}
                ></span>
                {isReleased ? "ESCROW RELEASED (COMPLETED)" : "PAYMENT HELD IN ESCROW"}
              </span>
            </div>

            {/* Progress Tracker */}
            <div className="bg-white border-2 border-gray-200 p-6 rounded-sm mb-6 relative overflow-hidden">
              <h3 className="font-bold text-carbon-dark mb-8 text-sm">Escrow & Handover Progress</h3>
              <div className="relative mb-4 flex justify-between">
                <div className="absolute top-4 left-4 right-4 h-1 bg-gray-100 z-0"></div>
                <div
                  className="absolute top-4 left-4 h-1 bg-carbon-primary z-0 transition-all duration-500"
                  style={{ width: `${(currentStep - 1) * 33}%` }}
                ></div>

                {[
                  "1. Payment Held",
                  "2. Order Preparing",
                  "3. Handover / Meetup",
                  "4. Escrow Released",
                ].map((stepName, index) => {
                  const stepNum = index + 1;
                  const isCompleted = currentStep > stepNum || (stepNum === 4 && isReleased);
                  const isCurrent = currentStep === stepNum && !isReleased;

                  return (
                    <div key={stepNum} className="relative z-10 flex flex-col items-center w-1/4 text-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-3 shadow-[0_0_0_4px_white] transition-colors ${
                          isCompleted
                            ? "bg-carbon-primary text-white"
                            : isCurrent
                            ? "bg-white border-2 border-carbon-primary text-carbon-primary"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {isCompleted ? <Check size={16} /> : stepNum}
                      </div>
                      <p
                        className={`text-xs font-bold ${
                          isCurrent || isCompleted ? "text-carbon-dark" : "text-gray-400"
                        }`}
                      >
                        {stepName}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detail Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Order Summary & Counterparty Details */}
              <div className="bg-white border-2 border-gray-200 p-6 rounded-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-carbon-dark mb-4 text-base">Order Details</h3>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded flex items-center justify-center p-2 flex-shrink-0">
                      <img
                        src={
                          selectedOrder.product?.imageUrl ||
                          "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=200&q=80"
                        }
                        alt="Product"
                        className="max-h-full mix-blend-multiply object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-carbon-dark text-lg leading-tight">
                        {selectedOrder.product?.title || selectedOrder.product?.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Category: {selectedOrder.product?.category || "ELECTRONICS"} • Delivery:{" "}
                        <span className="font-bold text-carbon-dark">
                          {selectedOrder.deliveryMethod === "COURIER" ? "Courier Delivery" : "Local Handover"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Counterparty Box */}
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded mb-6 text-xs space-y-2">
                    <p className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                      {activeTab === "purchases" ? "Seller Contact & Location" : "Buyer Details for Handover"}
                    </p>
                    {activeTab === "purchases" ? (
                      <div>
                        <p className="font-bold text-carbon-dark text-sm">
                          {selectedOrder.product?.seller?.name || "Verified Carbonwise Seller"}
                        </p>
                        <p className="text-gray-600 flex items-center mt-1">
                          <Phone size={12} className="mr-1 text-gray-400" />
                          {selectedOrder.product?.seller?.phone || "Registered Seller"}
                        </p>
                        <p className="text-gray-600 flex items-center mt-0.5">
                          <MapPin size={12} className="mr-1 text-gray-400" />
                          {selectedOrder.product?.seller?.city || "Local Meetup Point"}
                          {selectedOrder.product?.seller?.pinCode ? ` (PIN: ${selectedOrder.product.seller.pinCode})` : ""}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold text-carbon-dark text-sm">
                          {selectedOrder.buyer?.name || "Customer"}
                        </p>
                        <p className="text-gray-600 flex items-center mt-1">
                          <Phone size={12} className="mr-1 text-gray-400" />
                          {selectedOrder.buyer?.phone || "N/A"}
                        </p>
                        <p className="text-gray-600 flex items-center mt-0.5">
                          <MapPin size={12} className="mr-1 text-gray-400" />
                          {selectedOrder.buyer?.city || "Pune"}
                          {selectedOrder.buyer?.pinCode ? ` - PIN: ${selectedOrder.buyer.pinCode}` : ""}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-end mb-4 border-t border-gray-100 pt-4">
                    <span className="font-bold text-carbon-dark text-base">
                      {activeTab === "purchases" ? "Total Price Paid" : "Escrow Amount"}
                    </span>
                    <span className="font-black text-carbon-dark text-3xl">
                      ₹{selectedOrder.amountPaid?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Status Guarantee Notice */}
                {isReleased ? (
                  <div className="bg-green-50 border border-green-200 text-green-800 text-xs p-3 rounded flex items-center font-semibold mt-4">
                    <ShieldCheck size={18} className="mr-2 flex-shrink-0 text-carbon-primary" />
                    Transaction complete. Funds released and Carbon Credits awarded to both parties.
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded flex items-center font-semibold mt-4">
                    <ShieldAlert size={18} className="mr-2 flex-shrink-0 text-amber-600" />
                    {activeTab === "purchases"
                      ? "Funds securely locked in Escrow. Not credited to seller until handover is verified."
                      : "Funds securely held in Escrow. Verify the buyer's handover code to claim your payout."}
                  </div>
                )}
              </div>

              {/* Right Column: Handover Pass & Actions */}
              <div className="bg-white border-2 border-gray-200 p-6 rounded-sm flex flex-col justify-center items-center text-center">
                {activeTab === "purchases" ? (
                  /* BUYER VIEW */
                  <>
                    <h3 className="text-xl font-bold text-carbon-dark mb-1">
                      {selectedOrder.deliveryMethod === "COURIER" ? "Courier Delivery Handover" : "Local Handover Pass"}
                    </h3>
                    <p className="text-xs text-gray-500 mb-6">
                      Show this QR code or 8-character code to the seller upon receiving your device.
                    </p>

                    {/* QR Code Container */}
                    <div className="bg-gray-50 border-2 border-gray-200 p-6 rounded mb-4 w-full max-w-xs flex flex-col items-center justify-center aspect-square relative">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                          selectedOrder.qrHash || selectedOrder.id
                        )}`}
                        alt="Handover QR Code"
                        className="w-44 h-44 object-contain mix-blend-multiply"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <div className="bg-white border-2 border-carbon-dark font-mono font-black text-xs px-3 py-1.5 uppercase tracking-wider absolute bottom-4 flex items-center shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                        CW-{handoverCode}
                        <button
                          onClick={handleCopyCode}
                          className="ml-2 hover:text-carbon-primary transition"
                          title="Copy Code"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>

                    {copiedCode && (
                      <p className="text-xs font-bold text-carbon-primary mb-2">Code copied to clipboard!</p>
                    )}

                    <p className="text-xs text-gray-600 px-4 mb-6">
                      Once the seller verifies your code or you confirm receipt below, the payment is securely transferred.
                    </p>

                    {isReleased ? (
                      <div className="w-full bg-green-50 border-2 border-green-500 text-green-800 font-bold p-3 rounded flex items-center justify-center text-xs">
                        <CheckCircle size={16} className="mr-2 text-carbon-primary" />
                        Funds Released & Received. Order Completed!
                      </div>
                    ) : (
                      <button
                        onClick={handleBuyerConfirmReceipt}
                        disabled={isVerifying}
                        className="w-full max-w-xs bg-carbon-primary text-carbon-dark font-black text-xs px-4 py-3 rounded border-2 border-carbon-dark hover:bg-carbon-secondary transition shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] disabled:opacity-50"
                      >
                        {isVerifying ? "Releasing Escrow..." : "Confirm Item Received & Release Escrow ↗"}
                      </button>
                    )}
                  </>
                ) : (
                  /* SELLER VIEW */
                  <>
                    <h3 className="text-xl font-bold text-carbon-dark mb-1">Seller Escrow Claim</h3>
                    <p className="text-xs text-gray-500 mb-6">
                      Enter the buyer's 8-character handover code or scan their QR code to claim your payment.
                    </p>

                    <div className="w-full max-w-sm bg-gray-50 border-2 border-gray-200 p-6 rounded mb-6 text-left">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-gray-500 uppercase">Payout Amount:</span>
                        <span className="text-xl font-black text-carbon-dark">
                          ₹{selectedOrder.amountPaid?.toLocaleString()}
                        </span>
                      </div>

                      {isReleased ? (
                        <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded text-xs font-bold flex items-center">
                          <CheckCircle size={18} className="mr-2 text-green-700 flex-shrink-0" />
                          Payment has already been released to your account.
                        </div>
                      ) : (
                        <form onSubmit={handleSellerVerifyCode} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-carbon-dark mb-1">
                              Buyer Handover Code (8 characters)
                            </label>
                            <input
                              type="text"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                              placeholder="e.g. CW-A1B2C3D4 or A1B2C3D4"
                              maxLength={15}
                              className="w-full p-3 border-2 border-carbon-dark rounded font-mono font-bold text-sm uppercase focus:outline-none focus:border-carbon-primary bg-white"
                              required
                            />
                            <p className="text-[11px] text-gray-500 mt-1">
                              Shown on the buyer's screen under their Handover QR Code.
                            </p>
                          </div>

                          <button
                            type="submit"
                            disabled={isVerifying || !verificationCode.trim()}
                            className="w-full bg-carbon-dark text-white font-black text-xs py-3 rounded border-2 border-carbon-dark hover:bg-gray-800 transition shadow-[3px_3px_0px_0px_rgba(46,204,113,1)] disabled:opacity-50"
                          >
                            {isVerifying ? "Verifying Handover..." : "Verify Code & Claim Escrow Funds ↗"}
                          </button>
                        </form>
                      )}
                    </div>

                    <div className="bg-green-50 border border-green-200 text-green-900 text-[11px] p-3 rounded max-w-sm text-left">
                      <strong>Escrow Protection:</strong> Carbonwise holds funds until both parties verify the physical handover.
                      No buyer disputes can reverse funds after valid code verification.
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
