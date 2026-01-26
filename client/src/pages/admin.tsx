import { useState, useEffect } from "react";
import { collection, getDocs, limit, query, doc, getDoc, setDoc } from "firebase/firestore";
import { testApiHealth } from "@/lib/api";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import AdminProjects from "./admin-projects";
import AdminWorkers from "./admin-workers";
import AdminAttendance from "./admin-attendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ALLOWED ADMIN EMAILS
const ALLOWED_ADMIN_EMAILS = [
  "rathodakashr79@gmail.com",
  "admin@sutharseva.com",
  "nitin@sutharseva.com",
  "nitin.parmar@sutharseva.com",
];

function isAllowedAdmin(userEmail: string | null): boolean {
  if (!userEmail) return false;
  return ALLOWED_ADMIN_EMAILS.some(
    (allowedEmail) => userEmail.toLowerCase() === allowedEmail.toLowerCase()
  );
}

export default function Admin() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"projects" | "attendance" | "workers" | "rate">("attendance");
  const [rate, setRate] = useState("");
  const [savingRate, setSavingRate] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthError("Not authenticated. Redirecting to login...");
        setLoading(false);
        setTimeout(() => {
          window.location.href = "/admin-login";
        }, 800);
        return;
      }

      if (!isAllowedAdmin(user.email)) {
        console.warn(`❌ Unauthorized admin access attempt: ${user.email}`);
        setAuthError(`Access denied. You are not authorized (${user.email})`);
        await signOut(auth);
        setLoading(false);
        setTimeout(() => {
          window.location.href = "/admin-login";
        }, 1000);
        return;
      }

      setAuthUser(user);
      setLoading(false);
      setAuthError(null);
      console.log(`✅ Admin authenticated: ${user.email}`);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAuthUser(null);
      window.location.href = "/admin-login";
    } catch (error) {
      console.error("Logout error:", error);
      alert("લોગ આઉટ કરવામાં ભૂલ આવી");
    }
  };

  const handleSaveRate = async () => {
    if (!rate || isNaN(parseFloat(rate))) {
      alert("કૃપા કરીને યોગ્ય રકમ દાખલ કરો");
      return;
    }

    setSavingRate(true);
    try {
      const rateDocRef = doc(db, "settings", "rate");
      await setDoc(rateDocRef, {
        pricePerSqFt: parseFloat(rate),
        updatedAt: new Date(),
        updatedBy: authUser?.email || "unknown",
      });
      alert("રેટ સફળતાથી સાચવ્યો!");
      setRate("");
    } catch (error) {
      console.error("Error saving rate:", error);
      alert("રેટ સાચવવામાં ભૂલ આવી");
    } finally {
      setSavingRate(false);
    }
  };

  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 px-4">
        <div className="text-center max-w-sm">
          <p className="text-red-600 font-medium mb-2">🔒 {authError}</p>
          <p className="text-sm text-gray-600">તમે લોગિન પેજ પર રીડાયરેક્ટ થશો...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-secondary font-medium">લોડ થઈ રહ્યું છે...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface shadow-sm border-b border-border" style={{ backdropFilter: "blur(12px)" }}>
        <div className="px-lg py-md flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <span className="text-2xl">🔨</span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-primary-dark">સુથાર સેવા</p>
              <p className="text-xs text-secondary">Admin Panel</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-secondary font-medium">સ્વાગત છે, નિતિનભાઈ</p>
          </div>
        </div>
      </header>

      {/* Dashboard summary */}
      <section className="px-lg py-md flex gap-md overflow-x-auto">
        <div className="bg-white rounded-xl p-lg border border-border shadow-sm min-w-[180px]">
          <p className="text-secondary font-semibold text-sm mb-sm">આજની આવક</p>
          <h3 className="text-3xl font-bold text-primary-dark">₹0</h3>
        </div>
        <div className="bg-white rounded-xl p-lg border border-border shadow-sm min-w-[180px]">
          <p className="text-secondary font-semibold text-sm mb-sm">કુલ આવક</p>
          <h3 className="text-3xl font-bold text-primary-dark">₹0</h3>
        </div>
        <div className="bg-white rounded-xl p-lg border border-border shadow-sm min-w-[180px]">
          <p className="text-secondary font-semibold text-sm mb-sm">બાકી રકમ</p>
          <h3 className="text-3xl font-bold text-primary-dark">₹0</h3>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-lg">
        <div className="flex flex-wrap items-center gap-sm mb-md">
          <button
            className={`px-4 py-2 rounded-lg font-semibold ${activeTab === "projects" ? "bg-primary text-white" : "border border-border text-secondary"}`}
            onClick={() => setActiveTab("projects")}
          >
            પ્રોજેક્ટ
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold ${activeTab === "attendance" ? "bg-primary text-white" : "border border-border text-secondary"}`}
            onClick={() => setActiveTab("attendance")}
          >
            હાજરી
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold ${activeTab === "workers" ? "bg-primary text-white" : "border border-border text-secondary"}`}
            onClick={() => setActiveTab("workers")}
          >
            કારીગર
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold ${activeTab === "rate" ? "bg-primary text-white" : "border border-border text-secondary"}`}
            onClick={() => setActiveTab("rate")}
          >
            રેટ
          </button>
          <div className="ml-auto">
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg font-semibold border border-border text-secondary hover:bg-background"
            >
              લોગ આઉટ
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="pb-lg">
          {activeTab === "projects" && <AdminProjects />}
          {activeTab === "attendance" && <AdminAttendance />}
          {activeTab === "workers" && <AdminWorkers />}
          {activeTab === "rate" && (
            <div className="bg-white rounded-xl p-6 border border-border shadow-sm max-w-xl">
              <h3 className="text-xl font-bold text-primary-dark mb-4">રેટ બદલો (₹ / sq ft)</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    કિંમત પ્રતિ ચોરસ ફૂટ (₹)
                  </label>
                  <Input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="દા.ત. 150"
                    className="border-border"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveRate}
                    disabled={savingRate}
                    className="bg-primary text-white hover:bg-primary-dark"
                  >
                    {savingRate ? "સાચવી રહ્યું છે..." : "સાચવો"}
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const rateDocRef = doc(db, "settings", "rate");
                        const rateDoc = await getDoc(rateDocRef);
                        if (rateDoc.exists()) {
                          setRate(rateDoc.data().pricePerSqFt.toString());
                        } else {
                          setRate("");
                        }
                      } catch (error) {
                        console.error("Error loading rate:", error);
                      }
                    }}
                    className="border border-border text-secondary"
                  >
                    રિફ્રેશ
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <ConnectionStatusBar />
    </div>
  );
}

type StatusValue = "ok" | "error" | "checking";

function ConnectionStatusBar() {
  const [status, setStatus] = useState<{
    api: StatusValue;
    firebase: StatusValue;
    cloudinary: StatusValue;
  }>({
    api: "checking",
    firebase: "checking",
    cloudinary: "checking",
  });

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    const checkApi = async (): Promise<StatusValue> => {
      try {
        const isHealthy = await testApiHealth();
        return isHealthy ? "ok" : "error";
      } catch (error) {
        console.error("API health check failed", error);
        return "error";
      }
    };

    const checkFirebase = async (): Promise<StatusValue> => {
      try {
        const projectsRef = collection(db, "projects");
        const q = query(projectsRef, limit(1));
        await getDocs(q);
        return "ok";
      } catch (error) {
        console.error("Firebase health check failed", error);
        return "error";
      }
    };

    const checkCloudinary = async (): Promise<StatusValue> => {
      return "ok";
    };

    const run = async () => {
      const [api, firebase, cloudinary] = await Promise.all([
        checkApi(),
        checkFirebase(),
        checkCloudinary(),
      ]);
      if (isCancelled) return;
      setStatus({ api, firebase, cloudinary });
    };

    run();
    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, []);

  const renderIndicator = (label: string, value: StatusValue) => {
    const icon = value === "ok" ? "🟢" : value === "checking" ? "🟡" : "🔴";
    return (
      <div className="flex items-center gap-xs text-sm text-secondary">
        <span aria-hidden>{icon}</span>
        <span>{label}</span>
      </div>
    );
  };

  return (
    <footer className="sticky bottom-0 bg-white border-t border-border px-lg py-md">
      <div className="flex flex-wrap gap-md items-center">
        <p className="text-sm font-semibold text-secondary">સિસ્ટમ સ્થિતિ</p>
        {renderIndicator("API", status.api)}
        {renderIndicator("Firebase", status.firebase)}
        {renderIndicator("Cloudinary", status.cloudinary)}
      </div>
    </footer>
  );
}
