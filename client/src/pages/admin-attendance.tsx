import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/firebase";
import { subscribeToProjects, WorkProject } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  setDoc,
  doc,
  deleteDoc,
  query,
  where,
  Timestamp,
  DocumentData,
} from "firebase/firestore";

interface Attendance {
  id: string;
  workerId: string;
  workerName: string;
  projectId?: string;
  projectName?: string;
  date: string;
  status: "present" | "absent" | "half" | "night";
  amount?: number;
  createdAt: Timestamp;
}

interface Worker {
  id: string;
  name: string;
  dailyWage?: number;
}

interface WorkerPayment {
  id: string;
  workerId: string;
  amount: number;
  date: string;
}

export default function AdminAttendance() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [projects, setProjects] = useState<WorkProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedWorkByWorker, setSelectedWorkByWorker] = useState<Record<string, string>>({});
  const [paymentsForDate, setPaymentsForDate] = useState<WorkerPayment[]>([]);

  const runningProjects = projects.filter((project) => project.status !== "Completed");

  const getWorkById = (id?: string) =>
    runningProjects.find((project) => project.id === id);

  const getWageMultiplier = (status: Attendance["status"]) => {
    if (status === "half") return 0.5;
    if (status === "night") return 1.5;
    if (status === "absent") return 0;
    return 1;
  };

  // Load workers
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "workers"), (snapshot) => {
      const loadedWorkers: Worker[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        loadedWorkers.push({
          id: doc.id,
          name: data.name,
          dailyWage: data.dailyWage || 0,
        });
      });
      setWorkers(loadedWorkers);
    });

    return () => unsubscribe();
  }, []);

  // Load projects
  useEffect(() => {
    const unsubscribe = subscribeToProjects((loadedProjects) => {
      setProjects(loadedProjects);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (runningProjects.length === 0 || workers.length === 0) return;
    setSelectedWorkByWorker((prev) => {
      const next = { ...prev };
      workers.forEach((worker) => {
        if (!next[worker.id]) {
          next[worker.id] = runningProjects[0].id;
        }
      });
      return next;
    });
  }, [runningProjects.length, workers.length]);

  // Load attendance for selected date
  useEffect(() => {
    if (!workers.length) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query(
        collection(db, "attendance"),
        where("date", "==", selectedDate)
      ),
      (snapshot) => {
        const loadedAttendance: Attendance[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as DocumentData;
          loadedAttendance.push({
            id: doc.id,
            workerId: data.workerId,
            workerName: data.workerName,
            projectId: data.projectId,
            projectName: data.projectName,
            date: data.date,
            status: data.status,
            amount: data.amount || 0,
            createdAt: data.createdAt,
          });
        });
        setAttendance(loadedAttendance);
        setSelectedWorkByWorker((prev) => {
          const next = { ...prev };
          loadedAttendance.forEach((entry) => {
            if (entry.workerId && entry.projectId && !next[entry.workerId]) {
              next[entry.workerId] = entry.projectId;
            }
          });
          return next;
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedDate, workers.length]);

  // Load payments for selected date
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(
        collection(db, "workerPayments"),
        where("date", "==", selectedDate)
      ),
      (snapshot) => {
        const loaded: WorkerPayment[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as DocumentData;
          loaded.push({
            id: docSnap.id,
            workerId: data.workerId,
            amount: data.amount || 0,
            date: data.date || "",
          });
        });
        setPaymentsForDate(loaded);
      }
    );

    return () => unsubscribe();
  }, [selectedDate]);

  const handleMarkAttendance = async (
    workerId: string,
    workerName: string,
    status: "present" | "absent" | "half" | "night"
  ) => {
    try {
      const selectedWorkId = selectedWorkByWorker[workerId];
      const selectedWork = getWorkById(selectedWorkId);

      if (!selectedWork) {
        alert("કૃપા કરીને કામ પસંદ કરો");
        return;
      }

      const attendanceRef = doc(
        db,
        "attendance",
        `${workerId}_${selectedDate}_${selectedWork.id}`
      );

      if (
        attendance.find(
          (a) =>
            a.workerId === workerId &&
            a.status === status &&
            a.projectId === selectedWork.id
        )
      ) {
        // Delete if already marked
        await deleteDoc(attendanceRef);
      } else {
        // Add or update
        const worker = workers.find((w) => w.id === workerId);
        const dailyWage = worker?.dailyWage || 0;
        const amount = Math.round(dailyWage * getWageMultiplier(status));
        await setDoc(attendanceRef, {
          workerId,
          workerName,
          projectId: selectedWork.id,
          projectName: selectedWork.name,
          date: selectedDate,
          status,
          amount,
          createdAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("ભૂલ આવી");
    }
  };

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getAttendanceCount = (date: string) => attendance.filter((a) => a.date === date && a.status === "present").length;

  const monthDays = getDaysInMonth(currentMonth);
  const days = Array.from({ length: monthDays }, (_, i) => i + 1);

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("gu-IN", {
      day: "numeric",
      month: "numeric",
      year: "2-digit",
    });
  };

  const getRunningDays = (project: WorkProject) => {
    const start = project.startDate
      ? new Date(project.startDate)
      : project.createdAt?.toDate?.() ?? null;
    if (!start) return "-";
    const end = new Date(selectedDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "-";
    const diff = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return diff.toString();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary font-medium">લોડ થઈ રહ્યું છે...</p>
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-border">
        <p className="text-secondary font-medium">
          પહેલા કુछ કારીગર ઉમેરો
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="bg-white rounded-xl p-6 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-background rounded transition">
            <ChevronLeft className="w-5 h-5 text-secondary" />
          </button>
          <h3 className="text-lg font-bold text-primary-dark">
            {currentMonth.toLocaleDateString("gu-IN", { month: "long", year: "numeric" })}
          </h3>
          <button onClick={handleNextMonth} className="p-2 hover:bg-background rounded transition">
            <ChevronRight className="w-5 h-5 text-secondary" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          {days.map((day) => {
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isSelected = dateStr === selectedDate;
            const count = getAttendanceCount(dateStr);

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`date-cell ${isSelected ? "selected" : ""} ${count > 0 && !isSelected ? "has-data" : ""}`}
              >
                <span>{day}</span>
                {count > 0 && (
                  <span className="date-cell__badge">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Running Works List */}
      <div className="bg-white rounded-xl p-6 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-primary-dark">ચાલુ કામ</h3>
          <span className="text-sm text-secondary">કુલ: {runningProjects.length}</span>
        </div>
        {runningProjects.length === 0 ? (
          <p className="text-secondary">કોઈ ચાલુ કામ નથી</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {runningProjects.map((project) => (
              <div key={project.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-primary-dark">{project.name}</p>
                    <p className="text-xs text-secondary">📍 {project.village}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-[#fff7e6] text-[#b7791f]">ચાલુ</span>
                </div>
                <div className="text-xs text-secondary flex flex-wrap gap-3">
                  <span>દિવસ: {getRunningDays(project)}</span>
                  {project.startDate && <span>શરૂ: {project.startDate}</span>}
                  {project.expectedEndDate && <span>અંત: {project.expectedEndDate}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Date Attendance */}
      <div className="bg-white rounded-xl p-6 border border-border shadow-sm">
        <div className="flex flex-wrap items-center gap-sm mb-4">
          <h3 className="text-lg font-bold text-primary-dark">હાજરી</h3>
          <span className="text-sm text-secondary">પસંદ કરેલી તારીખ:</span>
          <span className="text-sm font-semibold px-3 py-1 rounded-full bg-[#e6f4ea] text-[#2f855a]">
            {formatDateForDisplay(selectedDate)}
          </span>
        </div>

        <div className="space-y-4">
          {workers.map((worker) => {
            const selectedWorkId = selectedWorkByWorker[worker.id];
            const selectedWork = getWorkById(selectedWorkId);
            const present = attendance.find(
              (a) =>
                a.workerId === worker.id &&
                a.date === selectedDate &&
                a.status === "present" &&
                a.projectId === selectedWorkId
            );
            const half = attendance.find(
              (a) =>
                a.workerId === worker.id &&
                a.date === selectedDate &&
                a.status === "half" &&
                a.projectId === selectedWorkId
            );
            const night = attendance.find(
              (a) =>
                a.workerId === worker.id &&
                a.date === selectedDate &&
                a.status === "night" &&
                a.projectId === selectedWorkId
            );
            const absent = attendance.find(
              (a) =>
                a.workerId === worker.id &&
                a.date === selectedDate &&
                a.status === "absent" &&
                a.projectId === selectedWorkId
            );

            const dailyWage = worker.dailyWage || 0;
            const activeStatus = present ? "present" : half ? "half" : night ? "night" : absent ? "absent" : undefined;
            const computedAmount = activeStatus
              ? Math.round(dailyWage * getWageMultiplier(activeStatus))
              : 0;
            const paidToday = paymentsForDate
              .filter((payment) => payment.workerId === worker.id)
              .reduce((sum, payment) => sum + (payment.amount || 0), 0);

            return (
              <div key={worker.id} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-primary-dark">{worker.name}</span>
                    <p className="text-xs text-secondary">દૈનિક રેટ: ₹{dailyWage}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-secondary">આજની મજૂરી</p>
                    <p className="text-success font-semibold">₹{computedAmount}</p>
                    {paidToday > 0 && (
                      <p className="text-xs text-secondary">ચુકવણી: ₹{paidToday}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">
                      કામ પસંદ કરો
                    </label>
                    <select
                      value={selectedWorkId || ""}
                      onChange={(e) =>
                        setSelectedWorkByWorker((prev) => ({
                          ...prev,
                          [worker.id]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg text-secondary"
                    >
                      <option value="">-- કામ પસંદ કરો --</option>
                      {runningProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name} ({project.village})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="text-xs text-secondary flex flex-col justify-end">
                    <span>પ્રોજેક્ટ શરૂ: {selectedWork?.startDate || "-"}</span>
                    <span>અંત તારીખ: {selectedWork?.expectedEndDate || "-"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleMarkAttendance(worker.id, worker.name, "present")}
                    className={`py-2 rounded-lg text-sm font-semibold ${present ? "bg-success text-white" : "bg-background border border-border text-secondary"}`}
                  >
                    પૂર્ણ
                  </button>
                  <button
                    onClick={() => handleMarkAttendance(worker.id, worker.name, "half")}
                    className={`py-2 rounded-lg text-sm font-semibold ${half ? "bg-warning text-white" : "bg-background border border-border text-secondary"}`}
                  >
                    અર્ધ
                  </button>
                  <button
                    onClick={() => handleMarkAttendance(worker.id, worker.name, "night")}
                    className={`py-2 rounded-lg text-sm font-semibold ${night ? "bg-primary text-white" : "bg-background border border-border text-secondary"}`}
                  >
                    રાત
                  </button>
                  <button
                    onClick={() => handleMarkAttendance(worker.id, worker.name, "absent")}
                    className={`py-2 rounded-lg text-sm font-semibold ${absent ? "bg-danger text-white" : "bg-background border border-border text-secondary"}`}
                  >
                    ગેરહાજર
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

            {/* Work Info Section */}
            <div className="bg-white rounded-xl p-6 border border-border shadow-sm">
              <h3 className="text-lg font-bold text-primary-dark mb-3">કામ માહિતી</h3>
              {runningProjects.length === 0 ? (
                <p className="text-secondary">કોઈ ચાલુ કામ નથી</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {runningProjects.map((project) => {
                    const start = project.startDate ? new Date(project.startDate) : project.createdAt.toDate();
                    const end = project.expectedEndDate ? new Date(project.expectedEndDate) : undefined;
                    const selected = new Date(selectedDate);
                    const withinRange = end
                      ? selected >= start && selected <= end
                      : selected >= start;

                    return (
                      <div key={project.id} className="border border-border rounded-lg p-4">
                        <p className="font-semibold text-primary-dark">{project.name}</p>
                        <p className="text-xs text-secondary">📍 {project.village}</p>
                        <div className="text-xs text-secondary mt-2">
                          <p>શરૂ: {project.startDate || "-"}</p>
                          <p>અંત: {project.expectedEndDate || "-"}</p>
                        </div>
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${withinRange ? "bg-[#e6f4ea] text-[#2f855a]" : "bg-border text-secondary"}`}>
                            {withinRange ? "આ તારીખમાં ચાલું" : "તારીખ બહાર"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
    </div>
  );
}
