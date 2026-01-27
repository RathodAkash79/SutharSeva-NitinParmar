import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { db, subscribeToProjects, WorkProject } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  Timestamp,
  DocumentData,
  query,
  where,
} from "firebase/firestore";

interface Worker {
  id: string;
  name: string;
  phone: string;
  speciality: string;
  dailyWage: number;
  paidAmount?: number;
  createdAt: Timestamp;
}

interface WorkerPayment {
  id: string;
  workerId: string;
  workerName: string;
  amount: number;
  date: string;
  workId?: string;
  workName?: string;
  note?: string;
  createdAt: Timestamp;
}

export default function AdminWorkers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    speciality: "",
    dailyWage: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailWorker, setDetailWorker] = useState<Worker | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailStats, setDetailStats] = useState({
    totalHajri: 0,
    totalEarned: 0,
    paidAmount: 0,
    remaining: 0,
  });
  const [paymentAmountInput, setPaymentAmountInput] = useState("");
  const [paymentDateInput, setPaymentDateInput] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentWorkId, setPaymentWorkId] = useState("");
  const [paymentNoteInput, setPaymentNoteInput] = useState("");
  const [detailRateInput, setDetailRateInput] = useState("");
  const [payments, setPayments] = useState<WorkerPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [projects, setProjects] = useState<WorkProject[]>([]);

  const updateWorkerRate = async (workerId: string, dailyRate: string) => {
    const rateValue = Number.parseInt(dailyRate, 10);
    if (!Number.isFinite(rateValue)) {
      throw new Error("Invalid daily rate value");
    }
    const workerRef = doc(db, "workers", workerId);
    await updateDoc(workerRef, {
      dailyWage: rateValue,
    });
  };

  const specialities = [
    "સામાન્ય કારીગર",
    "દરવાજા",
    "કપાટ કાર્ય",
    "પોલિશ",
    "રંગ કાર્ય",
    "વેલ્ડિંગ",
    "હાર્ડવેર ઇન્સ્ટલેશન",
  ];

  // Load workers
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "workers"),
      (snapshot) => {
        const loadedWorkers: Worker[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as DocumentData;
          loadedWorkers.push({
            id: doc.id,
            name: data.name,
            phone: data.phone,
            speciality: data.speciality,
            dailyWage: data.dailyWage || 0,
            paidAmount: data.paidAmount || 0,
            createdAt: data.createdAt || Timestamp.now(),
          });
        });
        setWorkers(loadedWorkers.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Load projects for payment linking
  useEffect(() => {
    const unsubscribe = subscribeToProjects((loadedProjects) => {
      setProjects(loadedProjects);
    });

    return () => unsubscribe();
  }, []);

  const getWageMultiplier = (status: string) => {
    if (status === "half") return 0.5;
    if (status === "night") return 1.5;
    if (status === "absent") return 0;
    return 1;
  };

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime())
      ? dateStr
      : date.toLocaleDateString("gu-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const loadWorkerStats = async (worker: Worker, workerPayments: WorkerPayment[]) => {
    setDetailLoading(true);
    try {
      const attendanceSnap = await getDocs(
        query(collection(db, "attendance"), where("workerId", "==", worker.id))
      );

      let totalHajri = 0;
      let totalEarned = 0;

      attendanceSnap.forEach((attendanceDoc) => {
        const data = attendanceDoc.data() as DocumentData;
        const status = data.status || "absent";
        const multiplier = getWageMultiplier(status);
        totalHajri += multiplier;

        if (typeof data.amount === "number") {
          totalEarned += data.amount;
        } else {
          totalEarned += Math.round((worker.dailyWage || 0) * multiplier);
        }
      });

      const legacyPaid = worker.paidAmount || 0;
      const transactionPaid = workerPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const paidAmount = legacyPaid + transactionPaid;
      setDetailStats({
        totalHajri,
        totalEarned,
        paidAmount,
        remaining: totalEarned - paidAmount,
      });
    } catch (error) {
      console.error("Error loading worker stats:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (!detailWorker) return;
    setPaymentsLoading(true);

    const paymentsQuery = query(
      collection(db, "workerPayments"),
      where("workerId", "==", detailWorker.id)
    );

    const unsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
      const loaded: WorkerPayment[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as DocumentData;
        loaded.push({
          id: docSnap.id,
          workerId: data.workerId,
          workerName: data.workerName,
          amount: data.amount || 0,
          date: data.date || "",
          workId: data.workId || "",
          workName: data.workName || "",
          note: data.note || "",
          createdAt: data.createdAt || Timestamp.now(),
        });
      });
      loaded.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setPayments(loaded);
      setPaymentsLoading(false);
    });

    return () => unsubscribe();
  }, [detailWorker?.id]);

  useEffect(() => {
    if (!detailWorker) return;
    loadWorkerStats(detailWorker, payments);
  }, [detailWorker, payments]);

  const handleOpenWorkerDetail = async (worker: Worker) => {
    setDetailWorker(worker);
    setDetailRateInput(worker.dailyWage?.toString() || "");
    setPaymentAmountInput("");
    setPaymentDateInput(new Date().toISOString().split("T")[0]);
    setPaymentWorkId("");
    setPaymentNoteInput("");
    await loadWorkerStats(worker, payments);
  };

  const handleSaveWorkerRate = async () => {
    if (!detailWorker) return;
    const rateValue = Number.parseInt(detailRateInput || "0", 10) || 0;

    try {
      const workerRef = doc(db, "workers", detailWorker.id);
      await updateDoc(workerRef, {
        dailyWage: rateValue,
      });

      setDetailWorker((prev) =>
        prev ? { ...prev, dailyWage: rateValue } : prev
      );
      alert("દૈનિક દર સાચવાયો");
    } catch (error) {
      console.error("Error saving worker rate:", error);
      alert("ભૂલ આવી. ફરી પ્રયાસ કરો.");
    }
  };

  const handleSavePayment = async () => {
    if (!detailWorker) return;
    const amountValue = Number.parseFloat(paymentAmountInput || "0");
    if (!Number.isFinite(amountValue) || amountValue === 0) {
      alert("ચુકવણી રકમ દાખલ કરો");
      return;
    }

    try {
      const work = projects.find((project) => project.id === paymentWorkId);
      await addDoc(collection(db, "workerPayments"), {
        workerId: detailWorker.id,
        workerName: detailWorker.name,
        amount: amountValue,
        date: paymentDateInput,
        workId: paymentWorkId || "",
        workName: work?.name || "",
        note: paymentNoteInput || "",
        createdAt: Timestamp.now(),
      });

      setPaymentAmountInput("");
      setPaymentNoteInput("");
      setPaymentWorkId("");
      alert("ચુકવણી સાચવાઈ ગઈ");
    } catch (error) {
      console.error("Error saving worker payment:", error);
      alert("ભૂલ આવી. ફરી પ્રયાસ કરો.");
    }
  };

  const handleSaveNote = async (paymentId: string) => {
    try {
      await updateDoc(doc(db, "workerPayments", paymentId), {
        note: noteDraft,
      });
      setEditingNoteId(null);
      setNoteDraft("");
    } catch (error) {
      console.error("Error updating note:", error);
      alert("નોટ અપડેટ કરવામાં ભૂલ આવી");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.speciality) {
      alert("કૃપા કરીને બધુ માહિતી ભરો");
      return;
    }

    try {
      const dailyRateValue = Number.parseInt(formData.dailyWage, 10) || 0;
      if (editingId) {
        // Update existing
        const workerRef = doc(db, "workers", editingId);
        await updateDoc(workerRef, {
          name: formData.name,
          phone: formData.phone,
          speciality: formData.speciality,
        });
        await updateWorkerRate(editingId, formData.dailyWage);
        alert("કારીગર અપડેટ થયો");
      } else {
        // Add new
        await addDoc(collection(db, "workers"), {
          name: formData.name,
          phone: formData.phone,
          speciality: formData.speciality,
          dailyWage: dailyRateValue,
          createdAt: Timestamp.now(),
        });
        alert("કારીગર ઉમેરવામાં આવ્યો");
      }

      // Reset form
      setFormData({
        name: "",
        phone: "",
        speciality: "",
        dailyWage: "",
      });
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      console.error("Error saving worker:", error);
      alert("ભૂલ આવી. ફરી પ્રયાસ કરો.");
    }
  };

  const handleEdit = (worker: Worker) => {
    setFormData({
      name: worker.name,
      phone: worker.phone,
      speciality: worker.speciality,
      dailyWage: worker.dailyWage.toString(),
    });
    setEditingId(worker.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("કી તમે નિશ્ચિત છો?")) return;

    try {
      await deleteDoc(doc(db, "workers", id));
      alert("કારીગર હટાવવામાં આવ્યો");
    } catch (error) {
      console.error("Error deleting worker:", error);
      alert("ભૂલ આવી");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary font-medium">લોડ થઈ રહ્યું છે...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Button */}
      <div className="flex gap-2">
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              name: "",
              phone: "",
              speciality: "",
              dailyWage: "",
            });
          }}
          className="bg-primary text-white hover:bg-primary-dark"
        >
          <Plus className="w-4 h-4 mr-2" />
          નવો કારીગર ઉમેરો
        </Button>
      </div>

      {/* Form */}
      <Modal
        open={showForm}
        title={editingId ? "કારીગર સંપાદિત કરો" : "નવો કારીગર ઉમેરો"}
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                નામ
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="દા.ત. રાજુ"
                className="border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                ફોન નંબર
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="9876543210"
                className="border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                વિશેષતા
              </label>
              <select
                value={formData.speciality}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, speciality: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded-lg text-secondary"
              >
                <option value="">પસંદ કરો</option>
                {specialities.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                દૈનિક મજૂરી (₹)
              </label>
              <Input
                type="number"
                value={formData.dailyWage}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dailyWage: e.target.value }))
                }
                placeholder="0"
                className="border-border"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="bg-primary text-white hover:bg-primary-dark"
              >
                સાચવો
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="bg-gray-200 text-secondary hover:bg-gray-300"
              >
                રદ કરો
              </Button>
            </div>
        </form>
      </Modal>

      {/* Transaction History Modal */}
      <Modal
        open={showTransactions}
        title="Transaction History"
        size="large"
        onClose={() => {
          setShowTransactions(false);
          setEditingNoteId(null);
          setNoteDraft("");
        }}
      >
        <div className="space-y-4">
          {paymentsLoading ? (
            <p className="text-secondary">લોડ થઈ રહ્યું છે...</p>
          ) : payments.length === 0 ? (
            <p className="text-secondary">હજી કોઈ ટ્રાન્ઝેક્શન નથી</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="border border-border rounded-lg p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-primary-dark">
                        ₹{payment.amount.toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-secondary">
                        {formatDateForDisplay(payment.date)}
                      </p>
                    </div>
                    <div className="text-xs text-secondary text-right">
                      <p>{payment.workName || "—"}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    {editingNoteId === payment.id ? (
                      <div className="flex flex-col gap-2">
                        <Input
                          type="text"
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          className="border-border"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSaveNote(payment.id)}
                            className="bg-primary text-white hover:bg-primary-dark"
                          >
                            સાચવો
                          </Button>
                          <Button
                            onClick={() => {
                              setEditingNoteId(null);
                              setNoteDraft("");
                            }}
                            className="bg-gray-200 text-secondary hover:bg-gray-300"
                          >
                            રદ કરો
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-secondary">
                          {payment.note ? `નોટ: ${payment.note}` : "નોટ નથી"}
                        </p>
                        <button
                          onClick={() => {
                            setEditingNoteId(payment.id);
                            setNoteDraft(payment.note || "");
                          }}
                          className="text-xs text-primary font-semibold"
                        >
                          {payment.note ? "નોટ ફેરફાર કરો" : "Add Note"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Worker Detail Modal */}
      <Modal
        open={!!detailWorker}
        title="કારીગર વિગતો"
        size="large"
        onClose={() => {
          setDetailWorker(null);
          setPaymentAmountInput("");
          setPaymentDateInput(new Date().toISOString().split("T")[0]);
          setPaymentWorkId("");
          setPaymentNoteInput("");
          setDetailRateInput("");
          setDetailStats({ totalHajri: 0, totalEarned: 0, paidAmount: 0, remaining: 0 });
          setPayments([]);
          setShowTransactions(false);
        }}
      >
        {detailWorker && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-secondary">નામ</p>
                <p className="text-lg font-semibold text-primary-dark">{detailWorker.name}</p>
                <p className="text-xs text-secondary">📱 {detailWorker.phone}</p>
                <p className="text-xs text-secondary">🔧 {detailWorker.speciality}</p>
              </div>
              <div className="rounded-lg border border-border bg-background px-4 py-3">
                <p className="text-xs text-secondary">હાલનો દર</p>
                <p className="text-lg font-semibold text-primary-dark">₹{detailWorker.dailyWage}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-secondary">કુલ હાજરી</p>
                <p className="text-xl font-bold text-primary-dark">{detailLoading ? "..." : detailStats.totalHajri.toFixed(1)}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-secondary">કુલ કમાણી</p>
                <p className="text-xl font-bold text-primary-dark">₹{detailLoading ? "..." : detailStats.totalEarned.toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-secondary">કુલ ચૂકવેલ</p>
                <p className="text-xl font-bold text-primary-dark">
                  ₹{detailLoading ? "..." : detailStats.paidAmount.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-secondary">બાકી રકમ</p>
                <p className={`text-xl font-bold ${detailStats.remaining >= 0 ? "text-danger" : "text-success"}`}>
                  ₹{detailLoading ? "..." : detailStats.remaining.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  નવો દર (₹/દિવસ)
                </label>
                <Input
                  type="number"
                  value={detailRateInput}
                  onChange={(e) => setDetailRateInput(e.target.value)}
                  className="border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  ચુકવણી રકમ (₹)
                </label>
                <Input
                  type="number"
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(e.target.value)}
                  className="border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  ચુકવણી તારીખ
                </label>
                <Input
                  type="date"
                  value={paymentDateInput}
                  onChange={(e) => setPaymentDateInput(e.target.value)}
                  className="border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  કામ પસંદ કરો
                </label>
                <select
                  value={paymentWorkId}
                  onChange={(e) => setPaymentWorkId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-secondary"
                >
                  <option value="">-- કામ પસંદ કરો --</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.village})
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-secondary mb-2">
                  નોટ (વૈકલ્પિક)
                </label>
                <Input
                  type="text"
                  value={paymentNoteInput}
                  onChange={(e) => setPaymentNoteInput(e.target.value)}
                  placeholder="જેમ કે એડવાન્સ ચુકવણી"
                  className="border-border"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                onClick={() => setShowTransactions(true)}
                className="border border-border text-secondary"
              >
                Transaction History
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={handleSaveWorkerRate}
                  className="bg-primary text-white hover:bg-primary-dark"
                >
                  દર સાચવો
                </Button>
                <Button
                  type="button"
                  onClick={handleSavePayment}
                  className="bg-success text-white hover:bg-success-dark"
                >
                  ચુકવણી સાચવો
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setDetailWorker(null);
                    setPaymentAmountInput("");
                    setPaymentDateInput(new Date().toISOString().split("T")[0]);
                    setPaymentWorkId("");
                    setPaymentNoteInput("");
                    setDetailRateInput("");
                    setDetailStats({ totalHajri: 0, totalEarned: 0, paidAmount: 0, remaining: 0 });
                  }}
                  className="bg-gray-200 text-secondary hover:bg-gray-300"
                >
                  બંધ કરો
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Workers List */}
      <div className="space-y-4">
        {workers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-border">
            <p className="text-secondary font-medium">હજી કોઈ કારીગર નથી</p>
          </div>
        ) : (
          workers.map((worker) => (
            <div
              key={worker.id}
              className="bg-white rounded-xl p-4 border border-border shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-primary-dark mb-1">
                    {worker.name}
                  </h3>
                  <p className="text-sm text-secondary mb-1">📱 {worker.phone}</p>
                  <p className="text-sm text-secondary mb-2">
                    🔧 {worker.speciality}
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    દૈનિક મજૂરી: ₹{worker.dailyWage.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenWorkerDetail(worker)}
                    className="px-3 py-1 rounded-lg border border-border text-xs text-secondary hover:bg-background"
                  >
                    વિગતો
                  </button>
                  <button
                    onClick={() => handleEdit(worker)}
                    className="p-2 hover:bg-background rounded transition"
                  >
                    <Edit2 className="w-4 h-4 text-secondary" />
                  </button>
                  <button
                    onClick={() => handleDelete(worker.id)}
                    className="p-2 hover:bg-background rounded transition"
                  >
                    <Trash2 className="w-4 h-4 text-danger" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
