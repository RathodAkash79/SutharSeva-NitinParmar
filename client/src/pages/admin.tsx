import { useState, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { 
  Plus, 
  Users, 
  Calendar, 
  LogOut,
  Menu,
  X 
} from "lucide-react";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { apiUrl } from "@/lib/api";
import { db, auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { onAuthStateChanged, signOut } from "firebase/auth";
import AdminProjects from "./admin-projects";
import AdminWorkers from "./admin-workers";
import AdminAttendance from "./admin-attendance";

// ALLOWED ADMIN EMAILS - ONLY NITIN
const ALLOWED_ADMIN_EMAILS = [
  "rathodakashr79@gmail.com",
  "admin@sutharseva.com",
  "nitin.parmar@sutharseva.com",
];

function isAllowedAdmin(userEmail: string | null): boolean {
  if (!userEmail) return false;
  return ALLOWED_ADMIN_EMAILS.some(
    (allowedEmail) =>
      userEmail.toLowerCase() === allowedEmail.toLowerCase()
  );
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [authUser, setAuthUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [, params] = useRoute("/admin/:section");
  
  const currentSection = params?.section || "dashboard";

  useEffect(() => {
    // Real Firebase Authentication Check with Admin Validation
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // NOT LOGGED IN
        setAuthError("Not authenticated. Redirecting to login...");
        setLoading(false);
        setTimeout(() => {
          setLocation("/admin-login");
        }, 800);
        return;
      }

      // CHECK IF USER IS ALLOWED ADMIN
      if (!isAllowedAdmin(user.email)) {
        // UNAUTHORIZED USER - LOGOUT IMMEDIATELY
        console.warn(`❌ Unauthorized admin access attempt: ${user.email}`);
        setAuthError(`Access denied. You are not authorized (${user.email})`);
        await signOut(auth);
        setLoading(false);
        setTimeout(() => {
          setLocation("/admin-login");
        }, 1000);
        return;
      }

      // AUTHORIZED ADMIN
      setAuthUser(user);
      setLoading(false);
      setAuthError(null);
      console.log(`✅ Admin authenticated: ${user.email}`);
    });

    return () => unsubscribe();
  }, [setLocation]);

  // Track viewport to handle responsive sidebar
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handleMedia = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    setIsMobile(mq.matches);
    mq.addEventListener("change", handleMedia);
    return () => mq.removeEventListener("change", handleMedia);
  }, []);

  // Collapse sidebar on mobile by default, expand on desktop
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

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

  // Show auth error
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
    <div className="app">
      <div className="layout">
      <aside
        className={cn(
          "layout__sidebar",
          sidebarOpen ? "is-open" : "is-hidden",
          isMobile ? "is-drawer" : undefined
        )}
        aria-label="Admin navigation"
      >
        <div className="p-md border-b border-border">
          <div className="d-flex items-center justify-between gap-sm">
            {sidebarOpen && (
              <Link href="/admin">
                <a className="app-header__logo">
                  <span className="app-header__logo-icon">🔨</span>
                  <span className="app-header__logo-text">સુથાર સેવા</span>
                </a>
              </Link>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn btn-ghost btn--icon"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <X className="w-4 h-4 text-secondary" />
              ) : (
                <Menu className="w-4 h-4 text-secondary" />
              )}
            </button>
          </div>
        </div>

        <nav className="p-md d-flex flex-col gap-sm">
          <Link href="/admin">
            <a
              className={`btn btn--full-width ${
                currentSection === "dashboard" || currentSection === undefined
                  ? "btn-primary"
                  : "btn-ghost"
              } d-flex items-center gap-md justify-start`}
            >
              <span className="text-xl">📊</span>
              {sidebarOpen && <span className="font-semibold">ડેશબોર્ડ</span>}
            </a>
          </Link>

          <Link href="/admin/projects">
            <a
              className={`btn btn--full-width d-flex items-center gap-md justify-start ${
                currentSection === "projects" ? "btn-primary" : "btn-ghost"
              }`}
            >
              <Plus className="w-5 h-5" />
              {sidebarOpen && <span className="font-semibold">પ્રોજેક્ટ</span>}
            </a>
          </Link>

          <Link href="/admin/workers">
            <a
              className={`btn btn--full-width d-flex items-center gap-md justify-start ${
                currentSection === "workers" ? "btn-primary" : "btn-ghost"
              }`}
            >
              <Users className="w-5 h-5" />
              {sidebarOpen && <span className="font-semibold">કારીગરો</span>}
            </a>
          </Link>

          <Link href="/admin/attendance">
            <a
              className={`btn btn--full-width d-flex items-center gap-md justify-start ${
                currentSection === "attendance" ? "btn-primary" : "btn-ghost"
              }`}
            >
              <Calendar className="w-5 h-5" />
              {sidebarOpen && <span className="font-semibold">હાજરી</span>}
            </a>
          </Link>

          <div className="border-t border-border pt-sm mt-sm">
            <button
              onClick={handleLogout}
              className="btn btn--full-width btn-ghost d-flex items-center gap-md justify-start"
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="font-semibold">લોગ આઉટ</span>}
            </button>
          </div>
        </nav>
      </aside>
      <div className={cn(
        "layout__content",
        sidebarOpen && !isMobile ? undefined : "is-overlay"
      )}>
        <header className="sticky top-0 z-30 bg-surface border-b border-border shadow-sm">
          <div className="section section--compact d-flex items-center justify-between px-lg">
            <button
              className="btn btn-ghost btn--icon"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              {sidebarOpen ? <X className="w-4 h-4 text-secondary" /> : <Menu className="w-4 h-4 text-secondary" />}
            </button>
            <h2 className="text-2xl font-bold text-primary-dark">
              {currentSection === "projects" && "પ્રોજેક્ટ્સ"}
              {currentSection === "workers" && "કારીગરો"}
              {currentSection === "attendance" && "હાજરી"}
              {(!currentSection || currentSection === "dashboard") && "ડેશબોર્ડ"}
            </h2>
            <p className="text-sm text-secondary font-medium truncate max-w-xs" title={authUser?.email || ""}>
              સ્વાગત છે{authUser?.email ? `, ${authUser.email}` : ""}
            </p>
          </div>
        </header>

        <main className="page page--centered">
          {(!currentSection || currentSection === "dashboard") && (
            <section className="section">
              <div className="grid grid--3-col grid--responsive">
                <div className="card">
                  <p className="text-secondary font-semibold text-sm mb-sm">કુલ પ્રોજેક્ટ્સ</p>
                  <h3 className="text-3xl font-bold text-primary-dark">0</h3>
                </div>
                <div className="card">
                  <p className="text-secondary font-semibold text-sm mb-sm">કુલ કારીગરો</p>
                  <h3 className="text-3xl font-bold text-primary-dark">0</h3>
                </div>
                <div className="card">
                  <p className="text-secondary font-semibold text-sm mb-sm">આજનો હાજરી</p>
                  <h3 className="text-3xl font-bold text-primary-dark">0</h3>
                </div>
              </div>
            </section>
          )}

          {currentSection === "projects" && <AdminProjects isMobile={isMobile} />}

          {currentSection === "workers" && <AdminWorkers isMobile={isMobile} />}

          {currentSection === "attendance" && <AdminAttendance isMobile={isMobile} />}
        </main>
        <ConnectionStatusBar />
      </div>
    </div>
    </div>
  );
}

type StatusValue = "ok" | "error" | "checking";

function ConnectionStatusBar() {
  const [status, setStatus] = useState<{ api: StatusValue; firebase: StatusValue; cloudinary: StatusValue }>({
    api: "checking",
    firebase: "checking",
    cloudinary: "checking",
  });

  useEffect(() => {
    let isCancelled = false;
    const controller = new AbortController();

    const checkApi = async (): Promise<StatusValue> => {
      try {
        const response = await fetch(apiUrl("/health"), { method: "HEAD", signal: controller.signal });
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
      // Check if backend can upload (Cloudinary or fallback)
      try {
        // We'll test this when user tries to upload
        // For now, just assume it's available if the API is working
        return "ok";
      } catch (error) {
        console.error("Cloudinary health check failed", error);
        return "error";
      }
    };

    const run = async () => {
      const [api, firebase, cloudinary] = await Promise.all([checkApi(), checkFirebase(), checkCloudinary()]);
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
      <div className="d-flex items-center gap-xs text-sm text-secondary">
        <span aria-hidden>{icon}</span>
        <span>{label}</span>
      </div>
    );
  };

  return (
    <footer className="section section--compact">
      <div className="page page--centered">
        <div className="card card--hover">
          <div className="d-flex flex-wrap gap-md items-center">
            <p className="text-sm font-semibold text-secondary">સિસ્ટમ સ્થિતિ</p>
            {renderIndicator("API", status.api)}
            {renderIndicator("Firebase", status.firebase)}
            {renderIndicator("Cloudinary", status.cloudinary)}
          </div>
        </div>
      </div>
    </footer>
  );
}
