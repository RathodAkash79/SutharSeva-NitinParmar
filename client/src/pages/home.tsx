import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, MessageCircle, Calculator, ArrowRight } from "lucide-react";
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
    <div className="app">
      <main className="page page--full">
        <header className="app-header">
          <div className="app-header__container">
            <Link href="/">
              <a className="app-header__logo">
                <span className="app-header__logo-icon">🔨</span>
                <span className="app-header__logo-text">સુથાર સેવા</span>
              </a>
            </Link>
            <div className="app-header__actions">
              <a href="tel:+918160911612" className="btn btn-primary btn--small">
                <Phone className="w-4 h-4" /> ફોન
              </a>
            </div>
          </div>
        </header>

        <section className="section section--hero hero">
        <div className="hero__container">
          <h2 className="hero__title">નિતિન પરમાર - ફર્નિચર આર્ટિસ્ટ</h2>
          <p className="hero__subtitle">
            મજબૂત, સુંદર અને વ્યાજબી ફર્નિચર કામ માટે આજે જ સંપર્ક કરો.
          </p>
          <p className="hero__description">
            કોઈ પણ ફોટો કે આઈડિયા મોકલો, એ જ કામ તૈયાર કરીને આપીશું.
          </p>
          <div className="hero__actions">
            <a href="https://wa.me/918160911612" className="btn btn-success btn--large">
              <MessageCircle className="w-5 h-5" /> WhatsApp મેસેજ
            </a>
            <a href="#calculator" className="btn btn-outline btn--large">
              <Calculator className="w-5 h-5" /> ભાવ જાણો
            </a>
          </div>
        </div>
      </section>

      <div className="page page--centered">
        <section id="calculator" className="section">
          <div className="card calculator">
            <div className="card__header">
              <div className="flex items-center gap-sm">
                <Calculator className="w-5 h-5 text-primary" />
                <h3 className="card__title">અંદાજિત ખર્ચ ગણો</h3>
              </div>
            </div>

            <div className="form__group">
              <label className="form__label" htmlFor="feet-input">
                તમારા ફર્નિચરના કુલ ચોરસ ફૂટ (Sq. Ft)
              </label>
              <div className="d-flex items-center gap-sm card card--hover">
                <Input
                  id="feet-input"
                  type="number"
                  value={feet}
                  onChange={(e) => setFeet(e.target.value)}
                  placeholder="0"
                  className="input input--large flex-1"
                />
                <span className="font-semibold text-secondary">ફૂટ</span>
              </div>
            </div>

            <div className="card card--hover text-center mb-md">
              <p className="text-secondary font-semibold">વર્તમાન રેટ</p>
              <p className="text-2xl font-bold text-primary-dark">
                ₹{currentRate.toLocaleString("en-IN")} / ચોરસ ફૂટ
              </p>
            </div>

            <div className="card card--hover text-center mb-md">
              <p className="text-secondary font-semibold text-sm">અંદાજિત કુલ ખર્ચ</p>
              <h2 className="text-4xl font-bold text-primary-dark mb-sm">
                ₹{totalCost.toLocaleString("en-IN")}
              </h2>
              <p className="text-xs text-muted">
                *કારીગરીના રેટ અને મટીરીયલ મુજબ ફેરફાર થઈ શકે છે.
              </p>
            </div>

            <Button
              onClick={handleWhatsAppEstimate}
              className="btn--full-width btn--large"
              variant="success"
            >
              <MessageCircle className="w-5 h-5" /> આ ભાવ WhatsApp પર મોકલો
            </Button>
          </div>
        </section>

        <section className="section">
          <div className="card card--hover text-center">
            <h3 className="text-2xl font-bold text-primary-dark mb-sm">અમારું કામ જુઓ</h3>
            <p className="text-base text-secondary mb-md">
              નિતિનભાઈના હજારો સંતુષ્ટ ગ્રાહકોનું કામ જુઓ અને આપનું કામ કરાવો.
            </p>
            <Link href="/work-gallery">
              <a className="btn btn-primary btn--large">
                કામ ગેલેરી જુઓ <ArrowRight className="w-5 h-5" />
              </a>
            </Link>
          </div>
        </section>

        <section className="section">
          <h3 className="section__title text-center">કેમ નિતિનભાઈ પર વિશ્વાસ કરો?</h3>
          <div className="grid grid--2-col">
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
            ].map((item) => (
              <div key={item.title} className="card card--hover">
                <p className="text-4xl mb-md">{item.icon}</p>
                <h4 className="card__title">{item.title}</h4>
                <p className="text-secondary text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

        <footer className="section section--compact text-center">
          <div className="page page--centered">
            <h4 className="font-bold text-primary-dark text-lg mb-sm">નિતિનભાઈ પરમાર</h4>
            <p className="text-secondary font-medium mb-md">📱 મોબાઈલ: 8160911612</p>
            <div className="d-flex justify-center gap-md">
              <a href="tel:+918160911612" className="btn btn-primary">
                ☎️ કૉલ કરો
              </a>
              <a href="https://wa.me/918160911612" className="btn btn-success">
                💬 WhatsApp
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
