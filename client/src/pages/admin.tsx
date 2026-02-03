import { useState, useEffect } from "react";
import { collection, getDocs, limit, query, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { testApiHealth } from "@/lib/api";
import { db, auth, WorkProject } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import AdminProjects from "./admin-projects";
import AdminWorkers from "./admin-workers";
import AdminAttendance from "./admin-attendance";
import AdminWorkTypes from "./admin-work-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ALLOWED ADMIN EMAILS
const ALLOWED_ADMIN_EMAILS = [
  "rathodakashr79@gmail.com",
  "admin@sutharseva.com",
  "nitin@sutharseva.com",
  "nitin.parmar@sutharseva.com",
  "parmarnitin4438@gmail.com",
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
  const [activeTab, setActiveTab] = useState<"projects" | "attendance" | "workers" | "rate" | "work-types">("attendance");
  const [rate, setRate] = useState("");
  const [savingRate, setSavingRate] = useState(false);
  const [projects, setProjects] = useState<WorkProject[]>([]);
  const [attendance, setAttendance] = useState<Array<{ date: string; amount?: number }>>([]);
  const [attendanceSelectedDate, setAttendanceSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

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

  useEffect(() => {
    const unsubscribeProjects = onSnapshot(collection(db, "projects"), (snapshot) => {
      const loadedProjects: WorkProject[] = [];
      snapshot.forEach((projectDoc) => {
        const data = projectDoc.data() as any;
        loadedProjects.push({
          id: projectDoc.id,
          name: data.name,
          village: data.village,
          workTypes: data.workTypes || [],
          images: data.images || [],
          photos: data.photos || [],
          totalAmount: data.totalAmount || 0,
          finalAmount: data.finalAmount || data.totalAmount || 0,
          status: data.status || "Ongoing",
          startDate: data.startDate || "",
          expectedEndDate: data.expectedEndDate || "",
          completedAt: data.completedAt || undefined,
          createdAt: data.createdAt,
        } as WorkProject);
      });
      setProjects(loadedProjects);
    });

    const unsubscribeAttendance = onSnapshot(collection(db, "attendance"), (snapshot) => {
      const loadedAttendance: Array<{ date: string; amount?: number }> = [];
      snapshot.forEach((attendanceDoc) => {
        const data = attendanceDoc.data() as any;
        loadedAttendance.push({
          date: data.date,
          amount: data.amount || 0,
        });
      });
      setAttendance(loadedAttendance);
    });

    return () => {
      unsubscribeProjects();
      unsubscribeAttendance();
    };
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
      const rateDocRef = doc(db, "public", "rates");
      await setDoc(rateDocRef, {
        perFoot: parseFloat(rate),
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

  const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const formatMonth = (key: string) => {
    const [year, month] = key.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("gu-IN", { month: "long", year: "numeric" });
  };

  const incomeByMonth = new Map<string, number>();
  projects
    .filter((project) => project.status === "Completed")
    .forEach((project) => {
      const dateSource = project.expectedEndDate
        ? new Date(`${project.expectedEndDate}T00:00:00`)
        : project.completedAt?.toDate?.() || project.createdAt?.toDate?.() || new Date();
      const monthKey = getMonthKey(dateSource);
      const amount = project.finalAmount || 0;
      incomeByMonth.set(monthKey, (incomeByMonth.get(monthKey) || 0) + amount);
    });

  const majduriByMonth = new Map<string, number>();
  attendance.forEach((entry) => {
    if (!entry.date) return;
    const monthKey = entry.date.slice(0, 7);
    const amount = entry.amount || 0;
    majduriByMonth.set(monthKey, (majduriByMonth.get(monthKey) || 0) + amount);
  });

  const currentMonthKey = getMonthKey(new Date());
  const allMonthKeys = Array.from(new Set([...incomeByMonth.keys(), ...majduriByMonth.keys()])).sort().reverse();
  const selectedMonthKey = attendanceSelectedDate
    ? getMonthKey(new Date(`${attendanceSelectedDate}T00:00:00`))
    : currentMonthKey;
  const visibleMonthKeys = allMonthKeys.filter((key) => key === selectedMonthKey);
  const currentIncome = incomeByMonth.get(currentMonthKey) || 0;
  const currentMajduri = majduriByMonth.get(currentMonthKey) || 0;
  const hasCurrentIncome = currentIncome > 0;
  const currentProfit = hasCurrentIncome ? currentIncome - currentMajduri : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface shadow-sm border-b border-border" style={{ backdropFilter: "blur(12px)" }}>
        <div className="px-lg py-md flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <img src="/logo.svg" alt="NP Carpentry" className="h-9 w-9" />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-primary-dark">NP Carpentry</p>
              <p className="text-xs text-secondary">Admin Panel</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-secondary font-medium">સ્વાગત છે, નિતિનભાઈ</p>
          </div>
        </div>
      </header>

      {/* Dashboard summary */}
      <section className="px-lg py-md flex flex-col gap-md">
        <div className="flex gap-md overflow-x-auto">
          <div className="bg-white rounded-xl p-lg border border-border shadow-sm min-w-[180px]">
            <p className="text-secondary font-semibold text-sm mb-sm">માસિક આવક</p>
            {hasCurrentIncome ? (
              <h3 className="text-3xl font-bold text-primary-dark">₹{currentIncome.toLocaleString("en-IN")}</h3>
            ) : (
              <h3 className="text-3xl font-bold text-secondary">—</h3>
            )}
            <p className="text-xs text-secondary mt-2">{formatMonth(currentMonthKey)}</p>
          </div>
          <div className="bg-white rounded-xl p-lg border border-border shadow-sm min-w-[180px]">
            <p className="text-secondary font-semibold text-sm mb-sm">માસિક મજૂરી</p>
            <h3 className="text-3xl font-bold text-primary-dark">₹{currentMajduri.toLocaleString("en-IN")}</h3>
            <p className="text-xs text-secondary mt-2">{formatMonth(currentMonthKey)}</p>
          </div>
          <div className="bg-white rounded-xl p-lg border border-border shadow-sm min-w-[180px]">
            <p className="text-secondary font-semibold text-sm mb-sm">માસિક નફો</p>
            {hasCurrentIncome ? (
              <h3 className={`text-3xl font-bold ${currentProfit >= 0 ? "text-success" : "text-danger"}`}>
                ₹{currentProfit.toLocaleString("en-IN")}
              </h3>
            ) : (
              <h3 className="text-3xl font-bold text-secondary">—</h3>
            )}
            <p className="text-xs text-secondary mt-2">{formatMonth(currentMonthKey)}</p>
          </div>
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
          <button
            className={`px-4 py-2 rounded-lg font-semibold ${activeTab === "work-types" ? "bg-primary text-white" : "border border-border text-secondary"}`}
            onClick={() => setActiveTab("work-types")}
          >
            કામ પ્રકાર
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
          {activeTab === "attendance" && (
            <AdminAttendance
              selectedDate={attendanceSelectedDate}
              onSelectedDateChange={setAttendanceSelectedDate}
            />
          )}
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
                        const rateDocRef = doc(db, "public", "rates");
                        const rateDoc = await getDoc(rateDocRef);
                        if (rateDoc.exists()) {
                          setRate(rateDoc.data().perFoot?.toString() || "");
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
          {activeTab === "work-types" && <AdminWorkTypes />}
        </div>
      </section>

      {activeTab === "attendance" && (
        <section className="px-lg pb-lg">
          <div className="bg-white rounded-xl p-lg border border-border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary-dark">માસિક સંક્ષેપ</h3>
              <span className="text-xs text-secondary">Completed works only</span>
            </div>
            {visibleMonthKeys.length === 0 ? (
              <p className="text-secondary">હજી કોઈ રેકોર્ડ નથી</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleMonthKeys.map((monthKey) => {
                  const income = incomeByMonth.get(monthKey) || 0;
                  const majduri = majduriByMonth.get(monthKey) || 0;
                  const profit = income > 0 ? income - majduri : 0;
                  return (
                    <div key={monthKey} className="border border-border rounded-lg p-4">
                      <p className="font-semibold text-primary-dark mb-2">{formatMonth(monthKey)}</p>
                      <div className="text-sm text-secondary space-y-1">
                        <p>મજૂરી: ₹{majduri.toLocaleString("en-IN")}</p>
                        {income > 0 ? (
                          <>
                            <p>આવક: ₹{income.toLocaleString("en-IN")}</p>
                            <p className={profit >= 0 ? "text-success" : "text-danger"}>
                              નફો: ₹{profit.toLocaleString("en-IN")}
                            </p>
                          </>
                        ) : (
                          <>
                            <p>આવક: —</p>
                            <p className="text-secondary">નફો: —</p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

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
