import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Users, 
  Calendar, 
  Image, 
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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div style={{ 
        width: sidebarOpen ? '256px' : '80px',
        transition: 'all 300ms ease-in-out'
      }} className="bg-white border-r border-border fixed h-screen left-0 top-0 z-40 overflow-y-auto">
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
            <a className={`flex items-center gap-md px-md py-md rounded-lg transition ${
              currentSection === "dashboard" || currentSection === undefined
                ? "bg-primary text-white"
                : "text-secondary hover:bg-background"
            }`}>
              <span className="text-xl">📊</span>
              {sidebarOpen && <span className="font-semibold">ડેશબોર્ડ</span>}
            </a>
          </Link>

          <Link href="/admin/projects">
            <a className={`flex items-center gap-md px-md py-md rounded-lg transition ${
              currentSection === "projects"
                ? "bg-primary text-white"
                : "text-secondary hover:bg-background"
            }`}>
              <Plus className="w-5 h-5" />
              {sidebarOpen && <span className="font-semibold">પ્રોજેક્ટ</span>}
            </a>
          </Link>

          <Link href="/admin/workers">
            <a className={`flex items-center gap-md px-md py-md rounded-lg transition ${
              currentSection === "workers"
                ? "bg-primary text-white"
                : "text-secondary hover:bg-background"
            }`}>
              <Users className="w-5 h-5" />
              {sidebarOpen && <span className="font-semibold">કારીગરો</span>}
            </a>
          </Link>

          <Link href="/admin/attendance">
            <a className={`flex items-center gap-md px-md py-md rounded-lg transition ${
              currentSection === "attendance"
                ? "bg-primary text-white"
                : "text-secondary hover:bg-background"
            }`}>
              <Calendar className="w-5 h-5" />
              {sidebarOpen && <span className="font-semibold">હાજરી</span>}
            </a>
          </Link>

          <div className="border-t border-border pt-sm mt-sm">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-md px-md py-md rounded-lg text-secondary hover:bg-background transition"
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="font-semibold">લોગ આउટ</span>}
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: sidebarOpen ? '256px' : '80px', transition: 'all 300ms ease-in-out' }} className="flex-1">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-surface shadow-sm border-b border-border" style={{ backdropFilter: 'blur(12px)' }}>
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

          {currentSection === "projects" && (
            <AdminProjects />
          )}

          {currentSection === "workers" && (
            <AdminWorkers />
          )}

          {currentSection === "attendance" && (
            <AdminAttendance />
          )}
        </main>
      </div>
    </div>
  );
}
