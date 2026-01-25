import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { db } from "@/lib/firebase";
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
} from "firebase/firestore";

interface Worker {
  id: string;
  name: string;
  phone: string;
  speciality: string;
  dailyWage: number;
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
            createdAt: data.createdAt || Timestamp.now(),
          });
        });
        setWorkers(loadedWorkers.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.speciality) {
      alert("કૃપા કરીને બધુ માહિતી ભરો");
      return;
    }

    try {
      if (editingId) {
        // Update existing
        const workerRef = doc(db, "workers", editingId);
        await updateDoc(workerRef, {
          name: formData.name,
          phone: formData.phone,
          speciality: formData.speciality,
          dailyWage: parseInt(formData.dailyWage) || 0,
        });
        alert("કારીગર અપડેટ થયો");
      } else {
        // Add new
        await addDoc(collection(db, "workers"), {
          name: formData.name,
          phone: formData.phone,
          speciality: formData.speciality,
          dailyWage: parseInt(formData.dailyWage) || 0,
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
    <div className="d-flex flex-column gap-lg">
      <div className="d-flex gap-sm">
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
        >
          <Plus className="w-4 h-4" /> નવો કારીગર ઉમેરો
        </Button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="card__title mb-sm">{editingId ? "કારીગર સંપાદિત કરો" : "નવો કારીગર ઉમેરો"}</h3>
          <form onSubmit={handleSubmit} className="d-flex flex-column gap-md">
            <div className="form__group">
              <label className="form__label" htmlFor="worker-name">નામ</label>
              <Input
                id="worker-name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="દા.ત. રાજુ"
              />
            </div>

            <div className="form__group">
              <label className="form__label" htmlFor="worker-phone">ફોન નંબર</label>
              <Input
                id="worker-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="9876543210"
              />
            </div>

            <div className="form__group">
              <label className="form__label" htmlFor="worker-speciality">વિશેષતા</label>
              <select
                id="worker-speciality"
                value={formData.speciality}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, speciality: e.target.value }))
                }
                className="input"
              >
                <option value="">પસંદ કરો</option>
                {specialities.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            <div className="form__group">
              <label className="form__label" htmlFor="worker-wage">દૈનિક મજૂરી (₹)</label>
              <Input
                id="worker-wage"
                type="number"
                value={formData.dailyWage}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dailyWage: e.target.value }))
                }
                placeholder="0"
              />
            </div>

            <div className="d-flex gap-sm">
              <Button type="submit">સાચવો</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                રદ કરો
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="d-flex flex-column gap-sm">
        {workers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">👷</div>
            <p className="empty-state__text">હજી કોઈ કારીગર નથી</p>
          </div>
        ) : (
          workers.map((worker) => (
            <div key={worker.id} className="card card--hover">
              <div className="d-flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="card__title">{worker.name}</h3>
                  <p className="text-sm text-secondary mb-xs">📱 {worker.phone}</p>
                  <p className="text-sm text-secondary mb-xs">🔧 {worker.speciality}</p>
                  <p className="text-sm font-semibold text-primary">
                    દૈનિક મજૂરી: ₹{worker.dailyWage.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="d-flex gap-xs">
                  <button
                    onClick={() => handleEdit(worker)}
                    className="btn btn-ghost btn--icon"
                    aria-label="Edit worker"
                  >
                    <Edit2 className="w-4 h-4 text-secondary" />
                  </button>
                  <button
                    onClick={() => handleDelete(worker.id)}
                    className="btn btn-ghost btn--icon"
                    aria-label="Delete worker"
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
