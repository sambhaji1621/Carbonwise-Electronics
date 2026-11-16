import { ShieldCheck, Leaf, Scale, Info } from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="max-w-4xl mx-auto py-12 space-y-12 text-center">
      <h1 className="text-5xl font-extrabold text-carbon-dark mb-4">
        The Circular Electronics Economy.
      </h1>
      <p className="text-xl text-gray-500 max-w-2xl mx-auto">
        Carbonwise combines AI forensics with secure escrow to make buying and
        selling used tech safer for you, and better for the planet.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-16">
        <div className="bg-white border-2 border-gray-200 p-8">
          <ShieldCheck size={48} className="text-carbon-primary mb-6" />
          <h3 className="text-xl font-bold text-carbon-dark mb-3">
            1. AI Verification
          </h3>
          <p className="text-gray-500">
            Every listing is instantly audited by our AI pipeline to detect
            stock photos, unrealistic prices, and category mismatches before
            going live.
          </p>
        </div>
        <div className="bg-white border-2 border-gray-200 p-8">
          <Scale size={48} className="text-carbon-primary mb-6" />
          <h3 className="text-xl font-bold text-carbon-dark mb-3">
            2. Escrow Protection
          </h3>
          <p className="text-gray-500">
            Buyers pay into a secure vault. Funds are only released to the
            seller after the buyer physically inspects the device and scans the
            QR code.
          </p>
        </div>
        <div className="bg-green-50 border-2 border-green-200 p-8">
          <Leaf size={48} className="text-carbon-primary mb-6" />
          <h3 className="text-xl font-bold text-carbon-dark mb-3">
            3. Carbon Credits
          </h3>
          <p className="text-gray-500">
            Dead electronics are routed to certified CPCB recyclers. For every
            kg recovered, users are awarded Carbon Credits in their digital
            wallet.
          </p>
        </div>
      </div>

      {/* Approximate Carbon Footprint Disclaimer Note */}
      <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-sm max-w-3xl mx-auto flex items-start text-left shadow-[2px_2px_0px_0px_rgba(217,119,6,0.3)]">
        <Info size={20} className="text-amber-700 mr-3 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 leading-relaxed">
          <strong>Note on Carbon Calculations:</strong> Please note that all carbon footprint numbers, avoided emissions (kg CO2e), and green credit calculations shown across this platform are approximate estimates derived from standardized lifecycle assessment (LCA) benchmarks and average device manufacturing data, not exact laboratory measurements.
        </p>
      </div>
    </div>
  );
}
