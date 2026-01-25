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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-sticky bg-surface transition shadow-sm" style={{ backdropFilter: 'blur(12px)' }}>
        <div className="max-w-2xl mx-auto px-md sm:px-lg lg:px-xl py-sm flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-sm cursor-pointer">
              <span className="text-2xl">🔨</span>
              <h1 className="text-lg font-bold text-primary-dark">સુથાર સેવા</h1>
            </a>
          </Link>
          <div className="flex gap-sm">
            <a
              href="tel:+918160911612"
              className="px-md py-xs bg-primary text-white rounded-full text-sm font-semibold hover:bg-primary-dark transition flex items-center gap-xs"
            >
              <Phone className="w-4 h-4" /> ફોન
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-2xl px-md sm:px-lg lg:px-xl text-center border-b border-border-dark bg-gradient-to-b from-background to-primary-lightest">
        <div className="max-w-lg mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-primary-dark mb-md">
            નિતિન પરમાર - ફર્નિચર આર્ટિસ્ટ
          </h2>
          <p className="text-lg sm:text-xl text-secondary font-medium mb-sm">
            મજબૂત, સુંદર અને વ્યાજબી ફર્નિચર કામ માટે આજે જ સંપર્ક કરો.
          </p>
          <p className="text-sm sm:text-base text-tertiary font-semibold mb-lg">
            કોઈ પણ ફોટો કે આઈડિયા મોકલો, એ જ કામ તૈયાર કરીને આપીશું.
          </p>
          <div className="flex flex-col sm:flex-row gap-md justify-center">
            <a
              href="https://wa.me/918160911612"
              className="px-lg py-md bg-success text-white rounded-full font-semibold hover:bg-success-dark transition flex items-center justify-center gap-sm text-lg"
            >
              <MessageCircle className="w-5 h-5" /> WhatsApp મેસેજ
            </a>
            <a
              href="#calculator"
              className="px-lg py-md bg-white text-primary border border-primary rounded-full font-semibold hover:bg-background transition flex items-center justify-center gap-sm text-lg"
            >
              <Calculator className="w-5 h-5" /> ભાવ જાણો
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-xl mx-auto px-md sm:px-lg lg:px-xl py-lg">
        {/* Service Categories Preview */}
        <section className="mb-lg">
          <p className="text-xs text-muted font-semibold uppercase mb-md">
            📁 કામના પ્રકાર
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-sm">
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
                className="text-center p-md bg-white rounded-lg border border-border hover:border-primary hover:shadow-md transition"
              >
                <p className="font-semibold text-primary-dark text-sm">
                  {category}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Calculator Section */}
        <section
          id="calculator"
          className="bg-white rounded-2xl shadow-lg p-lg mb-lg border border-border"
        >
          <div className="flex items-center gap-md mb-lg">
            <Calculator className="w-7 h-7 text-primary" />
            <h3 className="text-2xl font-bold text-primary-dark">
              અંદાજિત ખર્ચ ગણો
            </h3>
          </div>

          <div className="mb-lg">
            <label className="block text-sm font-semibold text-secondary mb-md">
              તમારા ફર્નિચરના કુલ ચોરસ ફૂટ (Sq. Ft)
            </label>
            <div className="flex items-center gap-sm bg-background border border-border rounded-xl px-md py-md focus-within:border-primary focus-within:bg-white transition">
              <Input
                type="number"
                value={feet}
                onChange={(e) => setFeet(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent border-0 text-2xl font-bold text-primary-dark placeholder:text-muted outline-none"
              />
              <span className="font-bold text-lg text-secondary">ફૂટ</span>
            </div>
          </div>

          {/* Rate Display */}
          <div className="text-center bg-primary-lightest rounded-xl px-md py-md mb-lg">
            <p className="text-secondary font-semibold">વર્તમાન રેટ</p>
            <p className="text-2xl font-bold text-primary-dark">
              ₹{currentRate.toLocaleString("en-IN")} / ચોરસ ફૂટ
            </p>
          </div>

          {/* Result Box */}
          <div className="bg-gradient-to-b from-background to-primary-lightest rounded-2xl p-lg text-center mb-lg border border-border-dark">
            <p className="text-secondary font-semibold text-sm mb-sm">
              અંદાજિત કુલ ખર્ચ
            </p>
            <h2 className="text-5xl font-bold text-primary-dark mb-md">
              ₹{totalCost.toLocaleString("en-IN")}
            </h2>
            <p className="text-xs text-muted">
              *કારીગરીના રેટ અને મટીરીયલ મુજબ ફેરફાર થઈ શકે છે.
            </p>
          </div>

          <button
            onClick={handleWhatsAppEstimate}
            className="w-full px-lg py-md bg-success text-white rounded-full font-bold hover:bg-success-dark transition text-lg flex items-center justify-center gap-sm"
          >
            <MessageCircle className="w-5 h-5" /> આ ભાવ WhatsApp પર મોકલો
          </button>
        </section>

        {/* Prominent Gallery Link */}
        <section className="mb-lg">
          <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl shadow-lg p-lg text-center text-white">
            <h3 className="text-2xl font-bold mb-md">અમારું કામ જુઓ</h3>
            <p className="text-lg opacity-90 mb-lg">
              નિતિનભાઈના હજારો સંતુષ્ટ ગ્રાહકોનું કામ જુઓ અને આપનું કામ કરાવો.
            </p>
            <Link href="/work-gallery">
              <a className="inline-flex items-center justify-center gap-sm px-xl py-md bg-white text-primary rounded-full font-bold hover:bg-background transition text-lg">
                કામ ગેલેરી જુઓ
                <ArrowRight className="w-5 h-5" />
              </a>
            </Link>
          </div>
        </section>

        {/* About Section */}
        <section className="mb-lg">
          <h3 className="text-2xl font-bold text-primary-dark mb-lg text-center">
            કેમ નિતિનભાઈ પર વિશ્વાસ કરો?
          </h3>
          <div className="grid sm:grid-cols-2 gap-lg">
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
                className="bg-white rounded-xl p-lg border border-border hover:border-primary hover:shadow-md transition"
              >
                <p className="text-4xl mb-md">{item.icon}</p>
                <h4 className="font-bold text-primary-dark mb-sm text-lg">
                  {item.title}
                </h4>
                <p className="text-secondary text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-lg">
        <div className="max-w-2xl mx-auto px-md sm:px-lg lg:px-xl text-center">
          <h4 className="font-bold text-primary-dark text-lg mb-md">
            નિતિનભાઈ પરમાર
          </h4>
          <p className="text-secondary font-medium mb-md">
            📱 મોબાઈલ: 8160911612
          </p>
          <div className="flex justify-center gap-md">
            <a
              href="tel:+918160911612"
              className="inline-block px-lg py-sm bg-primary text-white rounded-full font-semibold hover:bg-primary-dark transition"
            >
              ☎️ કૉલ કરો
            </a>
            <a
              href="https://wa.me/918160911612"
              className="inline-block px-lg py-sm bg-success text-white rounded-full font-semibold hover:bg-success-dark transition"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
