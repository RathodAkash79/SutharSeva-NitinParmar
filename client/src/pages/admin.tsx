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
        <p className="text-[#795548] font-medium">લોડ થઈ રહ્યું છે...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#fdfbf7]">
      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? "w-64" : "w-20"
      } bg-white border-r border-[#efebe9] transition-all duration-300 fixed h-screen left-0 top-0 z-40 overflow-y-auto`}>
        <div className="p-4 border-b border-[#efebe9]">
          <div className="flex items-center justify-between mb-4">
            {sidebarOpen && (
              <Link href="/admin">
                <a className="flex items-center gap-2 cursor-pointer">
                  <span className="text-2xl">🔨</span>
                  <h1 className="text-lg font-bold text-[#5d4037]">સુથાર સેવા</h1>
                </a>
              </Link>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-[#fdfbf7] rounded transition"
            >
              {sidebarOpen ? (
                <X className="w-4 h-4 text-[#795548]" />
              ) : (
                <Menu className="w-4 h-4 text-[#795548]" />
              )}
            </button>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <Link href="/admin">
            <a className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
              currentSection === "dashboard" || currentSection === undefined
                ? "bg-[#855e42] text-white"
                : "text-[#795548] hover:bg-[#fdfbf7]"
            }`}>
              <span className="text-xl">📊</span>
              {sidebarOpen && <span className="font-semibold">ડેશબોર્ડ</span>}
            </a>
          </Link>

          <Link href="/admin/projects">
            <a className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
              currentSection === "projects"
                ? "bg-[#855e42] text-white"
                : "text-[#795548] hover:bg-[#fdfbf7]"
            }`}>
              <Plus className="w-5 h-5" />
              {sidebarOpen && <span className="font-semibold">પ્રોજેક્ટ</span>}
            </a>
          </Link>

          <Link href="/admin/workers">
            <a className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
              currentSection === "workers"
                ? "bg-[#855e42] text-white"
                : "text-[#795548] hover:bg-[#fdfbf7]"
            }`}>
              <Users className="w-5 h-5" />
              {sidebarOpen && <span className="font-semibold">કારીગરો</span>}
            </a>
          </Link>

          <Link href="/admin/attendance">
            <a className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
              currentSection === "attendance"
                ? "bg-[#855e42] text-white"
                : "text-[#795548] hover:bg-[#fdfbf7]"
            }`}>
              <Calendar className="w-5 h-5" />
              {sidebarOpen && <span className="font-semibold">હાજરી</span>}
            </a>
          </Link>

          <div className="border-t border-[#efebe9] pt-2 mt-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[#795548] hover:bg-[#fdfbf7] transition"
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="font-semibold">લોગ આउટ</span>}
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className={`${sidebarOpen ? "ml-64" : "ml-20"} flex-1 transition-all duration-300`}>
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-[#efebe9]">
          <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#5d4037]">
              {currentSection === "projects" && "પ્રોજેક્ટ્સ"}
              {currentSection === "workers" && "કારીગરો"}
              {currentSection === "attendance" && "હાજરી"}
              {(!currentSection || currentSection === "dashboard") && "ડેશબોર્ડ"}
            </h2>
            <div className="text-right">
              <p className="text-sm text-[#795548] font-medium">સ્વાગત છે, નિતિનભાઈ</p>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-6">
          {(!currentSection || currentSection === "dashboard") && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border border-[#efebe9] shadow-sm">
                <p className="text-[#795548] font-semibold text-sm mb-2">કુલ પ્રોજેક્ટ્સ</p>
                <h3 className="text-4xl font-bold text-[#5d4037]">0</h3>
              </div>
              <div className="bg-white rounded-xl p-6 border border-[#efebe9] shadow-sm">
                <p className="text-[#795548] font-semibold text-sm mb-2">કુલ કારીગરો</p>
                <h3 className="text-4xl font-bold text-[#5d4037]">0</h3>
              </div>
              <div className="bg-white rounded-xl p-6 border border-[#efebe9] shadow-sm">
                <p className="text-[#795548] font-semibold text-sm mb-2">આજનો હાજરી</p>
                <h3 className="text-4xl font-bold text-[#5d4037]">0</h3>
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
