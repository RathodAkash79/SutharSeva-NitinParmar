import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { 
  Plus, 
  Users, 
  Calendar, 
  LogOut,
  Menu,
  X 
} from "lucide-react";
import AdminProjects from "./admin-projects";
import AdminWorkers from "./admin-workers";
import AdminAttendance from "./admin-attendance";

export default function Admin() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, params] = useRoute("/admin/:section");
  
  const currentSection = params?.section || "dashboard";

  useEffect(() => {
    // Check if user is authenticated (in a real app, use Firebase Auth)
    // For now, we'll just check localStorage
    const user = localStorage.getItem("adminUser");
    if (user) {
      setCurrentUser(JSON.parse(user));
    } else {
      // Redirect to login - would be handled in routing
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    window.location.href = "/";
  };

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
        className={`layout__sidebar ${sidebarOpen ? "is-open" : "is-collapsed"}`}
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

      <div className={`layout__content ${sidebarOpen ? "" : "is-collapsed"}`}>
        <header className="sticky top-0 z-30 bg-surface border-b border-border shadow-sm">
          <div className="section section--compact d-flex items-center justify-between px-lg">
            <h2 className="text-2xl font-bold text-primary-dark">
              {currentSection === "projects" && "પ્રોજેક્ટ્સ"}
              {currentSection === "workers" && "કારીગરો"}
              {currentSection === "attendance" && "હાજરી"}
              {(!currentSection || currentSection === "dashboard") && "ડેશબોર્ડ"}
            </h2>
            <p className="text-sm text-secondary font-medium">સ્વાગત છે, નિતિનભાઈ</p>
          </div>
        </header>

        <main className="page page--centered">
          {(!currentSection || currentSection === "dashboard") && (
            <section className="section">
              <div className="grid grid--3-col">
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

          {currentSection === "projects" && <AdminProjects />}

          {currentSection === "workers" && <AdminWorkers />}

          {currentSection === "attendance" && <AdminAttendance />}
        </main>
      </div>
    </div>
    </div>
  );
}
