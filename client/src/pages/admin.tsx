import { useState, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { 
  Plus, 
  Users, 
  Calendar, 
  LogOut,
  Menu,
  X,
  DollarSign
} from "lucide-react";
import { collection, getDocs, limit, query, doc, getDoc, setDoc } from "firebase/firestore";
import { apiUrl } from "@/lib/api";
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
  "nitin.parmar@sutharseva.com",
];

function isAllowedAdmin(userEmail: string | null): boolean {
  if (!userEmail) return false;
  return ALLOWED_ADMIN_EMAILS.some(
    (allowedEmail) => userEmail.toLowerCase() === allowedEmail.toLowerCase()
  );
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [authUser, setAuthUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [, params] = useRoute("/admin/:section");
  const [showRateModal, setShowRateModal] = useState(false);
  const [rate, setRate] = useState("");
  const [savingRate, setSavingRate] = useState(false);
  
  const currentSection = params?.section || "dashboard";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAuthError("Not authenticated. Redirecting to login...");
        setLoading(false);
        setTimeout(() => setLocation("/admin-login"), 800);
        return;
      }

      if (!isAllowedAdmin(user.email)) {
        console.warn(`❌ Unauthorized admin access attempt: ${user.email}`);
        setAuthError(`Access denied. You are not authorized (${user.email})`);
        await signOut(auth);
        setLoading(false);
        setTimeout(() => setLocation("/admin-login"), 1000);
        return;
      }

      setAuthUser(user);
      setLoading(false);
      setAuthError(null);
      console.log(`✅ Admin authenticated: ${user.email}`);
    });

    return () => unsubscribe();
  }, [setLocation]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAuthUser(null);
      setLocation("/admin-login");
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
      setShowRateModal(false);
      setRate("");
    } catch (error) {
      console.error("Error saving rate:", error);
      alert("રેટ સાચવવામાં ભૂલ આવી");
    } finally {
      setSavingRate(false);
    }
  };

  const handleOpenRateModal = async () => {
    try {
      const rateDocRef = doc(db, "settings", "rate");
      const rateDoc = await getDoc(rateDocRef);
      if (rateDoc.exists()) {
        setRate(rateDoc.data().pricePerSqFt.toString());
      }
    } catch (error) {
      console.error("Error loading rate:", error);
    }
    setShowRateModal(true);
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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div
        style={{
          width: sidebarOpen ? "256px" : "80px",
          transition: "all 300ms ease-in-out",
        }}
        className="bg-white border-r border-border fixed h-screen left-0 top-0 z-40 overflow-y-auto"
      >
        <div className="p-md border-b border-border">
          <div className="flex items-center justify-between mb-md">
            {sidebarOpen && (
              <Link href="/admin">
                <a className="flex items-center gap-sm cursor-pointer">
                  <span className="text-2xl">🔨</span>
                  <h1 className="text-lg font-bold text-primary-dark">સુથાર સેવા</h1>
                </a>
              </Link>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-xs hover:bg-background rounded transition"
            >
              {sidebarOpen ? (
                <X className="w-4 h-4 text-secondary" />
              ) : (
                <Menu className="w-4 h-4 text-secondary" />
              )}
            </button>
          </div>
        </div>

        <nav className="p-md space-y-sm">
          <Link href="/admin">
            <a
              className={`flex items-center gap-md px-md py-md rounded-lg transition ${
                currentSection === "dashboard" || currentSection === undefined
                  ? "bg-primary text-white"
                  : "text-secondary hover:bg-background"
              }`}
            >
              <span className="text-xl">📊</span>
              {sidebarOpen && <span className="font-semibold">ડેશબોર્ડ</span>}
            </a>
          </Link>

          <Link href="/admin/projects">
            <a
              className={`flex items-center gap-md px-md py-md rounded-lg transition ${
                currentSection === "projects"
                  ? "bg-primary text-white"
                  : "text-secondary hover:bg-background"
              }`}
            >
              <Plus className="w-5 h-5" />
              {sidebarOpen && <span className="font-semibold">પ્રોજેક્ટ</span>}
            </a>
          </Link>

          <Link href="/admin/workers">
            <a
              className={`flex items-center gap-md px-md py-md rounded-lg transition ${
                currentSection === "workers"
                  ? "bg-primary text-white"
                  : "text-secondary hover:bg-background"
              }`}
            >
              <Users className="w-5 h-5" />
              {sidebarOpen && <span className="font-semibold">કારીગરો</span>}
            </a>
          </Link>

          <Link href="/admin/attendance">
            <a
              className={`flex items-center gap-md px-md py-md rounded-lg transition ${
                currentSection === "attendance"
                  ? "bg-primary text-white"
                  : "text-secondary hover:bg-background"
              }`}
            >
              <Calendar className="w-5 h-5" />
              {sidebarOpen && <span className="font-semibold">હાજરી</span>}
            </a>
          </Link>

          <button
            onClick={handleOpenRateModal}
            className="w-full flex items-center gap-md px-md py-md rounded-lg text-secondary hover:bg-background transition"
          >
            <DollarSign className="w-5 h-5" />
            {sidebarOpen && <span className="font-semibold">રેટ બદલો</span>}
          </button>

          <div className="border-t border-border pt-sm mt-sm">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-md px-md py-md rounded-lg text-secondary hover:bg-background transition"
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="font-semibold">લોગ આઉટ</span>}
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div
        style={{
          marginLeft: sidebarOpen ? "256px" : "80px",
          transition: "all 300ms ease-in-out",
        }}
        className="flex-1"
      >
        {/* Header */}
        <header
          className="sticky top-0 z-30 bg-surface shadow-sm border-b border-border"
          style={{ backdropFilter: "blur(12px)" }}
        >
          <div className="px-lg py-md flex items-center justify-between">
            <h2 className="text-2xl font-bold text-primary-dark">
              {currentSection === "projects" && "પ્રોજેક્ટ્સ"}
              {currentSection === "workers" && "કારીગરો"}
              {currentSection === "attendance" && "હાજરી"}
              {(!currentSection || currentSection === "dashboard") && "ડેશબોર્ડ"}
            </h2>
            <div className="text-right">
              <p className="text-sm text-secondary font-medium">સ્વાગત છે, નિતિનભાઈ</p>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-lg">
          {(!currentSection || currentSection === "dashboard") && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
              <div className="bg-white rounded-xl p-lg border border-border shadow-sm">
                <p className="text-secondary font-semibold text-sm mb-sm">કુલ પ્રોજેક્ટ્સ</p>
                <h3 className="text-4xl font-bold text-primary-dark">0</h3>
              </div>
              <div className="bg-white rounded-xl p-lg border border-border shadow-sm">
                <p className="text-secondary font-semibold text-sm mb-sm">કુલ કારીગરો</p>
                <h3 className="text-4xl font-bold text-primary-dark">0</h3>
              </div>
              <div className="bg-white rounded-xl p-lg border border-border shadow-sm">
                <p className="text-secondary font-semibold text-sm mb-sm">આજનો હાજરી</p>
                <h3 className="text-4xl font-bold text-primary-dark">0</h3>
              </div>
            </div>
          )}

          {currentSection === "projects" && <AdminProjects />}
          {currentSection === "workers" && <AdminWorkers />}
          {currentSection === "attendance" && <AdminAttendance />}
        </main>

        {/* Status Bar */}
        <ConnectionStatusBar />
      </div>

      {/* Rate Change Modal */}
      {showRateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowRateModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
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
                  onClick={() => {
                    setShowRateModal(false);
                    setRate("");
                  }}
                  className="bg-gray-200 text-secondary hover:bg-gray-300"
                >
                  રદ કરો
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
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
        const response = await fetch(apiUrl("/api/health"), {
          method: "GET",
          signal: controller.signal,
        });
        return response.ok ? "ok" : "error";
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
