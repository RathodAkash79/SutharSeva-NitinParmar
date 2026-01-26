import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  setDoc,
  doc,
  deleteDoc,
  Timestamp,
  DocumentData,
} from "firebase/firestore";

interface Attendance {
  id: string;
  workerId: string;
  workerName: string;
  date: string;
  status: "present" | "absent" | "half";
  createdAt: Timestamp;
}

interface Worker {
  id: string;
  name: string;
}

export default function AdminAttendance() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Load workers
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "workers"), (snapshot) => {
      const loadedWorkers: Worker[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        loadedWorkers.push({
          id: doc.id,
          name: data.name,
        });
      });
      setWorkers(loadedWorkers);
    });

    return () => unsubscribe();
  }, []);

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
            date: data.date,
            status: data.status,
            createdAt: data.createdAt,
          });
        });
        setAttendance(loadedAttendance);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedDate, workers.length]);

  const handleMarkAttendance = async (
    workerId: string,
    workerName: string,
    status: "present" | "absent" | "half"
  ) => {
    try {
      const attendanceRef = doc(
        db,
        "attendance",
        `${workerId}_${selectedDate}`
      );

      if (
        attendance.find(
          (a) => a.workerId === workerId && a.status === status
        )
      ) {
        // Delete if already marked
        await deleteDoc(attendanceRef);
      } else {
        // Add or update
        await setDoc(attendanceRef, {
          workerId,
          workerName,
          date: selectedDate,
          status,
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

      {/* Selected Date Attendance */}
      <div className="bg-white rounded-xl p-6 border border-border shadow-sm">
        <div className="flex flex-wrap items-center gap-sm mb-4">
          <h3 className="text-lg font-bold text-primary-dark">હાજરી</h3>
          <span className="text-sm text-secondary">તારીખ: {formatDateForDisplay(selectedDate)}</span>
          <span className="text-xs px-2 py-1 rounded bg-[#e6f4ea] text-[#2f855a]">ALL - KANTHKOT</span>
        </div>

        <div className="space-y-3">
          {workers.map((worker) => {
            const present = attendance.find(
              (a) =>
                a.workerId === worker.id &&
                a.date === selectedDate &&
                a.status === "present"
            );
            const half = attendance.find(
              (a) =>
                a.workerId === worker.id &&
                a.date === selectedDate &&
                a.status === "half"
            );
            const absent = attendance.find(
              (a) =>
                a.workerId === worker.id &&
                a.date === selectedDate &&
                a.status === "absent"
            );

            return (
              <div key={worker.id} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary-dark">{worker.name}</span>
                  <span className="text-success font-semibold">₹0</span>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="દૈનિક પગાર (₹)"
                    className="border-border"
                  />
                  <Button className="bg-primary text-white hover:bg-primary-dark">સેવ</Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleMarkAttendance(worker.id, worker.name, "present")}
                    className={`px-3 py-2 rounded-lg font-semibold border ${
                      present ? "bg-primary text-white border-primary" : "border-border text-secondary"
                    }`}
                  >
                    પૂર્ણ દિવસ
                  </button>
                  <button
                    onClick={() => handleMarkAttendance(worker.id, worker.name, "half")}
                    className={`px-3 py-2 rounded-lg font-semibold border ${
                      half ? "bg-primary text-white border-primary" : "border-border text-secondary"
                    }`}
                  >
                    અડધો દિવસ
                  </button>
                  <button
                    onClick={() => handleMarkAttendance(worker.id, worker.name, "absent")}
                    className={`px-3 py-2 rounded-lg font-semibold border ${
                      absent ? "bg-primary text-white border-primary" : "border-border text-secondary"
                    }`}
                  >
                    ગેરહાજર
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
