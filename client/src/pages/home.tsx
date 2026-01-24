import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Phone,
  MessageCircle,
  Calculator,
  MapPin,
  Hammer,
  ArrowRight,
} from "lucide-react";
import { loadCurrentRate, subscribeToRate } from "@/lib/firebase";

export default function Home() {
  const [currentRate, setCurrentRate] = useState(0);
  const [feet, setFeet] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial rate
    loadCurrentRate().then((rate) => {
      setCurrentRate(rate);
      setLoading(false);
    });

    // Subscribe to rate updates
    const unsubscribe = subscribeToRate((rate) => {
      setCurrentRate(rate);
    });

    return () => unsubscribe();
  }, []);

  const totalCost = feet ? parseInt(feet) * currentRate : 0;

  const handleWhatsAppEstimate = () => {
    if (!feet) {
      alert("કૃપया ફૂટ લખો");
      return;
    }
    const message = `નમસ્તે નિતિનભાઈ, %0a%0aમારે અંદાજે ${feet} ફૂટ ફર્નિચર કામ કરાવવું છે. %0aઅંદાજિત ભાવ ₹${totalCost.toLocaleString("en-IN")} બતાવે છે. વિગત માટે સંપર્ક કરશો.`;
    window.open(`https://wa.me/918160911612?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-[#efebe9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 cursor-pointer">
              <span className="text-2xl">🔨</span>
              <h1 className="text-lg font-bold text-[#5d4037]">સુથાર સેવા</h1>
            </a>
          </Link>
        <div className="flex gap-2">
            <a
              href="tel:+918160911612"
              className="px-3 py-1.5 bg-[#855e42] text-white rounded-full text-sm font-semibold hover:bg-[#5d4037] transition flex items-center gap-1"
            >
              <Phone className="w-4 h-4" /> ફોન
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 text-center border-b-8 border-[#d7ccc8] bg-gradient-to-b from-[#fdfbf7] to-[#efebe9]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-[#5d4037] mb-4">
            નિતિન પરમાર - ફર્નિચર આર્ટિસ્ટ
          </h2>
          <p className="text-lg sm:text-xl text-[#795548] font-medium mb-3">
            મજબૂત, સુંદર અને વ્યાજબી ફર્નિચર કામ માટે આજે જ સંપર્ક કરો.
          </p>
          <p className="text-sm sm:text-base text-[#6d4c41] font-semibold mb-8">
            કોઈ પણ ફોટો કે આઈડિયા મોકલો, એ જ કામ તૈયાર કરીને આપીશું.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/918160911612"
              className="px-6 py-3 bg-[#43a047] text-white rounded-full font-semibold hover:bg-[#2e7d32] transition flex items-center justify-center gap-2 text-lg"
            >
              <MessageCircle className="w-5 h-5" /> WhatsApp મેસેજ
            </a>
            <a
              href="#calculator"
              className="px-6 py-3 bg-white text-[#855e42] border-2 border-[#855e42] rounded-full font-semibold hover:bg-[#fdfbf7] transition flex items-center justify-center gap-2 text-lg"
            >
              <Calculator className="w-5 h-5" /> ભાવ જાણો
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Service Categories Preview */}
        <section className="mb-12">
          <p className="text-xs text-[#999] font-semibold uppercase mb-4">
            📁 કામના પ્રકાર
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              "🚪 દરવાજા",
              "🪟 બારી",
              "🪑 ફર્નિચર",
              "🧥 અલમારી",
              "📦 કબાટ",
              "🗄️ શો-કેસ",
              "📺 TV યુનિટ",
              "🛋️ સોફા",
              "🛕 મંદિર",
              "🛏️ પલંગ",
              "📚 સ્ટડી ટેબલ",
              "🪞 કાચ",
              "💄 ડ્રેસિંગ ટેબલ",
              "❄️ AC પેનલિંગ",
              "✨ અન્ય",
            ].map((category) => (
              <div
                key={category}
                className="text-center p-4 bg-white rounded-lg border border-[#efebe9] hover:border-[#855e42] hover:shadow-md transition"
              >
                <p className="font-semibold text-[#5d4037] text-sm">
                  {category}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Calculator Section */}
        <section
          id="calculator"
          className="bg-white rounded-2xl shadow-lg p-8 mb-12 border border-[#efebe9]"
        >
          <div className="flex items-center gap-3 mb-8">
            <Calculator className="w-7 h-7 text-[#855e42]" />
            <h3 className="text-2xl font-bold text-[#5d4037]">
              અંદાજિત ખર્ચ ગણો
            </h3>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#795548] mb-3">
              તમારા ફર્નિચરના કુલ ચોરસ ફૂટ (Sq. Ft)
            </label>
            <div className="flex items-center gap-2 bg-[#fdfbf7] border-2 border-[#efebe9] rounded-xl px-4 py-3 focus-within:border-[#855e42] focus-within:bg-white transition">
              <Input
                type="number"
                value={feet}
                onChange={(e) => setFeet(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent border-0 text-2xl font-bold text-[#5d4037] placeholder:text-[#bdbdbd] outline-none"
              />
              <span className="font-bold text-lg text-[#795548]">ફૂટ</span>
            </div>
          </div>

          {/* Rate Display */}
          <div className="text-center bg-[#efebe9] rounded-xl px-4 py-3 mb-6">
            <p className="text-[#795548] font-semibold">વર્તમાન રેટ</p>
            <p className="text-2xl font-bold text-[#5d4037]">
              ₹{currentRate.toLocaleString("en-IN")} / ચોરસ ફૂટ
            </p>
          </div>

          {/* Result Box */}
          <div className="bg-gradient-to-b from-[#fdfbf7] to-[#efebe9] rounded-2xl p-8 text-center mb-6 border border-[#d7ccc8]">
            <p className="text-[#795548] font-semibold text-sm mb-2">
              અંદાજિત કુલ ખર્ચ
            </p>
            <h2 className="text-5xl font-bold text-[#5d4037] mb-3">
              ₹{totalCost.toLocaleString("en-IN")}
            </h2>
            <p className="text-xs text-[#999]">
              *કારીગરીના રેટ અને મટીરીયલ મુજબ ફેરફાર થઈ શકે છે.
            </p>
          </div>

          <button
            onClick={handleWhatsAppEstimate}
            className="w-full px-6 py-3.5 bg-[#43a047] text-white rounded-full font-bold hover:bg-[#2e7d32] transition text-lg flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" /> આ ભાવ WhatsApp પર મોકલો
          </button>
        </section>

        {/* Prominent Gallery Link */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-[#855e42] to-[#5d4037] rounded-2xl shadow-lg p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-3">અમારું કામ જુઓ</h3>
            <p className="text-lg opacity-90 mb-6">
              નિતિનભાઈના હજારો સંતુષ્ટ ગ્રાહકોનું કામ જુઓ અને આપનું કામ કરાવો.
            </p>
            <Link href="/work-gallery">
              <a className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-[#855e42] rounded-full font-bold hover:bg-[#fdfbf7] transition text-lg">
                કામ ગેલેરી જુઓ
                <ArrowRight className="w-5 h-5" />
              </a>
            </Link>
          </div>
        </section>

        {/* About Section */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold text-[#5d4037] mb-6 text-center">
            કેમ નિતિનભાઈ પર વિશ્વાસ કરો?
          </h3>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: "⭐",
                title: "ગુણવત્તા",
                desc: "બીસ વર્ષનો અનુભવ સાથે શ્રેષ્ઠ ગુણવત્તાનું કામ",
              },
              {
                icon: "💰",
                title: "સાશ્રય ભાવ",
                desc: "બજારમાં સૌથી વ્યાજબી આંકવણી અને શર્તો",
              },
              {
                icon: "⏱️",
                title: "સમય પર",
                desc: "સમય પર અને ગુણવત્તા સાથે પૂર્ણ કામ",
              },
              {
                icon: "🏆",
                title: "પુરસ્કૃત",
                desc: "સ્થાનિક અને વિસ્તરેલ વિસ્તારમાં વિખ્યાત",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-6 border border-[#efebe9] hover:border-[#855e42] hover:shadow-md transition"
              >
                <p className="text-4xl mb-3">{item.icon}</p>
                <h4 className="font-bold text-[#5d4037] mb-2 text-lg">
                  {item.title}
                </h4>
                <p className="text-[#795548] text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#efebe9] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h4 className="font-bold text-[#5d4037] text-lg mb-3">
            નિતિનભાઈ પરમાર
          </h4>
          <p className="text-[#795548] font-medium mb-4">
            📱 મોબાઈલ: 8160911612
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="tel:+918160911612"
              className="inline-block px-6 py-2 bg-[#855e42] text-white rounded-full font-semibold hover:bg-[#5d4037] transition"
            >
              ☎️ કૉલ કરો
            </a>
            <a
              href="https://wa.me/918160911612"
              className="inline-block px-6 py-2 bg-[#43a047] text-white rounded-full font-semibold hover:bg-[#2e7d32] transition"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
