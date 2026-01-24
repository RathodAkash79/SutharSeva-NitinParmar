import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
  status: "present" | "absent";
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
    status: "present" | "absent"
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

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getAttendanceCount = (date: string) => {
    return attendance.filter((a) => a.date === date && a.status === "present")
      .length;
  };

  const monthDays = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: monthDays }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => null);

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
        <p className="text-[#795548] font-medium">લોડ થઈ રહ્યું છે...</p>
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-[#efebe9]">
        <p className="text-[#795548] font-medium">
          પહેલા કુछ કારીગર ઉમેરો
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="bg-white rounded-xl p-6 border border-[#efebe9] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-[#fdfbf7] rounded transition"
          >
            <ChevronLeft className="w-5 h-5 text-[#795548]" />
          </button>
          <h3 className="text-lg font-bold text-[#5d4037]">
            {currentMonth.toLocaleDateString("gu-IN", {
              month: "long",
              year: "numeric",
            })}
          </h3>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-[#fdfbf7] rounded transition"
          >
            <ChevronRight className="w-5 h-5 text-[#795548]" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {["સો", "સ", "બુ", "બ", "ગુ", "શુ", "રવિ"].map((day) => (
            <div
              key={day}
              className="text-center p-2 text-sm font-bold text-[#855e42]"
            >
              {day}
            </div>
          ))}

          {[...emptyDays, ...days].map((day, idx) => {
            const dateStr =
              day !== null
                ? `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                : null;

            const isSelected = dateStr === selectedDate;
            const count = dateStr ? getAttendanceCount(dateStr) : 0;

            return (
              <button
                key={idx}
                onClick={() => dateStr && setSelectedDate(dateStr)}
                disabled={!dateStr}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-semibold transition ${
                  !dateStr
                    ? "bg-transparent"
                    : isSelected
                      ? "bg-[#855e42] text-white"
                      : count > 0
                        ? "bg-[#43a047] text-white"
                        : "bg-[#efebe9] text-[#795548] hover:bg-[#d7ccc8]"
                }`}
              >
                {day && (
                  <>
                    <span>{day}</span>
                    {count > 0 && (
                      <span className="text-xs opacity-75">{count}</span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Attendance */}
      <div className="bg-white rounded-xl p-6 border border-[#efebe9] shadow-sm">
        <h3 className="text-lg font-bold text-[#5d4037] mb-4">
          હાજરી - {formatDateForDisplay(selectedDate)}
        </h3>

        <div className="space-y-3">
          {workers.map((worker) => {
            const present = attendance.find(
              (a) =>
                a.workerId === worker.id &&
                a.date === selectedDate &&
                a.status === "present"
            );
            const absent = attendance.find(
              (a) =>
                a.workerId === worker.id &&
                a.date === selectedDate &&
                a.status === "absent"
            );

            return (
              <div
                key={worker.id}
                className="flex items-center justify-between p-4 border border-[#efebe9] rounded-lg hover:bg-[#fdfbf7] transition"
              >
                <span className="font-semibold text-[#5d4037]">{worker.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleMarkAttendance(worker.id, worker.name, "present")
                    }
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      present
                        ? "bg-[#43a047] text-white"
                        : "bg-[#efebe9] text-[#795548] hover:bg-[#d7ccc8]"
                    }`}
                  >
                    ✓ હાજર
                  </button>
                  <button
                    onClick={() =>
                      handleMarkAttendance(worker.id, worker.name, "absent")
                    }
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      absent
                        ? "bg-red-500 text-white"
                        : "bg-[#efebe9] text-[#795548] hover:bg-[#d7ccc8]"
                    }`}
                  >
                    ✗ ગેરહાજર
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
