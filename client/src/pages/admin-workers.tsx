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
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-border shadow-sm">
          <h3 className="text-xl font-bold text-primary-dark mb-4">
            {editingId ? "કારીગર સંપાદિત કરો" : "નવો કારીગર ઉમેરો"}
          </h3>
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
        </div>
      )}

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
