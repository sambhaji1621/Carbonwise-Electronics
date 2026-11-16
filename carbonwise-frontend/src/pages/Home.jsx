import { useState, useEffect } from "react";
import { Leaf, Search, MapPin, ShieldCheck, ChevronDown, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig"; // Connects to Spring Boot

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedLocation, setSelectedLocation] = useState("ALL");

  // FETCH DATA FROM SPRING BOOT ON PAGE LOAD
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products");
        setProducts(response.data || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load marketplace data. Is the backend running?");
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = [
    { label: "All Items", value: "ALL" },
    { label: "Smartphones", value: "SMARTPHONE" },
    { label: "Laptops", value: "LAPTOP" },
    { label: "Tablets", value: "TABLET" },
    { label: "Audio", value: "AUDIO" },
  ];

  // Specific Pune localities
  const defaultLocations = [
    "Kothrud, Pune",
    "Baner, Pune",
    "Viman Nagar, Pune",
    "Hinjawadi, Pune",
    "Shivajinagar, Pune",
    "Wakad, Pimpri-Chinchwad",
    "Aundh, Pune",
    "Hadapsar, Pune",
  ];

  // Dynamically extract distinct locations from live products
  const dynamicLocations = Array.from(
    new Set(
      products
        .map((p) => p.seller?.city || p.location)
        .filter(Boolean)
    )
  );

  const availableLocations = Array.from(
    new Set([...dynamicLocations, ...defaultLocations])
  );

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !searchTerm.trim() ||
      (product.title && product.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === "ALL" ||
      (product.category && product.category.toUpperCase() === selectedCategory);

    const matchesLocation =
      selectedLocation === "ALL" ||
      (product.seller?.city &&
        product.seller.city.toLowerCase().includes(selectedLocation.toLowerCase())) ||
      (product.location &&
        product.location.toLowerCase().includes(selectedLocation.toLowerCase())) ||
      (product.seller?.pinCode &&
        selectedLocation.includes(product.seller.pinCode));

    return matchesSearch && matchesCategory && matchesLocation;
  });

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-[#f2fcf5] border-b-4 border-carbon-dark -mx-6 px-6 py-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8">
            <p className="text-carbon-primary font-bold uppercase tracking-widest text-xs mb-3 flex items-center">
              <span className="w-6 h-0.5 bg-carbon-primary mr-3"></span>
              The Circular Electronics Marketplace
            </p>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-carbon-dark leading-tight mb-3">
              Turn E-Waste into Impact.
              <br />
              Buy AI-Verified Electronics.
            </h1>
            <p className="text-gray-500 text-base max-w-xl">
              Great tech deserves another chapter. Shop verified. Pay protected.
              Keep it circular.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-center border-2 border-carbon-dark p-6 bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <p className="text-carbon-secondary font-bold text-xs flex items-center mb-2 tracking-wide uppercase">
              <Leaf size={14} className="mr-2" /> Less Waste. More Possibility.
            </p>
            <h2 className="text-4xl font-black text-carbon-dark mb-1">
              24,850 kg
            </h2>
            <p className="text-gray-500 text-xs leading-relaxed">
              CO2e avoided by our community.
              <br />
              One second life at a time.
            </p>
          </div>
        </div>

        {/* Search Bar with Functional Location Selector */}
        <div className="max-w-7xl mx-auto mt-8 flex flex-col md:flex-row border-2 border-carbon-dark bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] w-full">
          {/* Keyword Search */}
          <div className="flex items-center flex-grow px-4 border-b-2 md:border-b-0 md:border-r-2 border-gray-200">
            <Search className="text-gray-400 mr-3 flex-shrink-0" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search laptops, smartphones, tablets and more..."
              className="w-full py-3 focus:outline-none text-base font-medium placeholder-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 px-2"
              >
                Clear
              </button>
            )}
          </div>

          {/* Interactive Location Dropdown */}
          <div className="flex items-center px-4 border-b-2 md:border-b-0 md:border-r-2 border-gray-200 bg-white relative">
            <MapPin className="text-carbon-primary mr-2 flex-shrink-0" size={18} />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="py-3 bg-transparent font-bold text-carbon-dark text-sm focus:outline-none cursor-pointer pr-4 appearance-none"
            >
              <option value="ALL">All Locations</option>
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="text-gray-500 pointer-events-none -ml-2 mr-2" />
            {selectedLocation !== "ALL" && (
              <button
                onClick={() => setSelectedLocation("ALL")}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Reset location"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => {}}
            className="bg-carbon-dark text-white font-bold px-8 py-3 hover:bg-gray-800 transition whitespace-nowrap"
          >
            Search
          </button>
        </div>

        {/* Category Filter Pills & Active Filter Status */}
        <div className="max-w-7xl mx-auto mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`text-xs font-bold px-4 py-1.5 rounded-full border-2 transition ${
                  selectedCategory === cat.value
                    ? "bg-carbon-dark text-white border-carbon-dark shadow-[2px_2px_0px_0px_rgba(46,204,113,1)]"
                    : "bg-white text-gray-600 border-gray-300 hover:border-carbon-dark"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Active location indicator tag */}
          {selectedLocation !== "ALL" && (
            <div className="text-xs font-bold bg-green-100 text-carbon-dark border border-carbon-primary px-3 py-1 rounded-full flex items-center">
              <MapPin size={12} className="mr-1 text-carbon-primary" />
              Location: {selectedLocation}
              <button
                onClick={() => setSelectedLocation("ALL")}
                className="ml-2 hover:text-red-500"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-extrabold text-carbon-dark">
            Good tech. Great second lives.
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            {filteredProducts.length} verified listings available
            {selectedLocation !== "ALL" ? ` in ${selectedLocation}` : " across all regions"}
          </p>
        </div>
        <span className="text-sm font-bold text-gray-600 hidden md:flex items-center">
          Every purchase protected by Carbonwise Escrow ↗
        </span>
      </div>

      {/* Dynamic Product Grid */}
      {loading ? (
        <div className="text-center py-10 font-bold text-carbon-primary animate-pulse">
          Loading marketplace...
        </div>
      ) : error ? (
        <div className="text-center py-10 font-bold text-red-500">{error}</div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border-2 border-carbon-dark p-12 text-center shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <p className="text-lg font-bold text-carbon-dark mb-2">No matching products found.</p>
          <p className="text-sm text-gray-500 mb-4">
            No devices found for the current filters
            {selectedLocation !== "ALL" ? ` in ${selectedLocation}` : ""}.
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("ALL");
              setSelectedLocation("ALL");
            }}
            className="bg-carbon-primary text-carbon-dark font-black px-6 py-2.5 rounded border-2 border-carbon-dark shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-12">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => navigate(`/product/${product.id}`)}
              className="bg-white border-2 border-carbon-dark flex flex-col cursor-pointer hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-all"
            >
              <div className="relative h-48 bg-gray-100 flex items-center justify-center border-b-2 border-carbon-dark overflow-hidden">
                <img
                  src={
                    product.imageUrl ||
                    "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=500&q=80"
                  }
                  alt={product.title}
                  className="object-cover h-full w-full mix-blend-multiply"
                />
                <div className="absolute bottom-3 left-3 bg-white px-2 py-1 border-2 border-carbon-dark flex items-center text-xs font-bold shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                  <ShieldCheck size={14} className="mr-1 text-carbon-dark" /> AI
                  Verified
                </div>
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-carbon-dark truncate pr-2">
                    {product.title || product.name}
                  </h4>
                  <span className="font-black text-carbon-dark">
                    ₹{product.price?.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                  {product.description}
                </p>
                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-500 flex items-center font-medium">
                    <MapPin size={12} className="mr-1 text-carbon-primary flex-shrink-0" />
                    <span className="truncate max-w-[130px]">
                      {product.seller?.city || product.location || "Kothrud, Pune"}
                    </span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                    {product.category || "TECH"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
