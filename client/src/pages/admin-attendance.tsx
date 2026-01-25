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
    <div className="d-flex flex-column gap-lg">
      <div className="card">
        <div className="card__header">
          <button onClick={handlePrevMonth} className="btn btn-ghost btn--icon" aria-label="Previous month">
            <ChevronLeft className="w-5 h-5 text-secondary" />
          </button>
          <h3 className="card__title">
            {currentMonth.toLocaleDateString("gu-IN", {
              month: "long",
              year: "numeric",
            })}
          </h3>
          <button onClick={handleNextMonth} className="btn btn-ghost btn--icon" aria-label="Next month">
            <ChevronRight className="w-5 h-5 text-secondary" />
          </button>
        </div>

        <div className="grid grid--4-col gap-xs">
          {["સો", "સ", "બુ", "બ", "ગુ", "શુ", "રવિ"].map((day) => (
            <div key={day} className="text-center p-xs text-sm font-bold text-primary">
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

            let tone = "bg-border text-secondary";
            if (isSelected) tone = "bg-primary text-white";
            else if (count > 0) tone = "bg-success text-white";

            return (
              <button
                key={idx}
                onClick={() => dateStr && setSelectedDate(dateStr)}
                disabled={!dateStr}
                className={`d-flex flex-col items-center justify-center rounded-lg text-sm font-semibold ${tone}`}
                style={{ aspectRatio: "1 / 1" }}
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

      <div className="card">
        <div className="card__header">
          <h3 className="card__title">હાજરી - {formatDateForDisplay(selectedDate)}</h3>
        </div>

        <div className="d-flex flex-column gap-sm">
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
                className="card card--hover"
              >
                <div className="d-flex items-center justify-between">
                  <span className="font-semibold text-primary-dark">{worker.name}</span>
                  <div className="d-flex gap-xs">
                    <button
                      onClick={() =>
                        handleMarkAttendance(worker.id, worker.name, "present")
                      }
                      className={`btn ${present ? "btn-success" : "btn-outline"}`}
                    >
                      ✓ હાજર
                    </button>
                    <button
                      onClick={() =>
                        handleMarkAttendance(worker.id, worker.name, "absent")
                      }
                      className={`btn ${absent ? "btn-danger" : "btn-outline"}`}
                    >
                      ✗ ગેરહાજર
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
