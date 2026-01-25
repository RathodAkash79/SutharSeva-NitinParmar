import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, Upload, X } from "lucide-react";
import { subscribeToProjects, loadProjects, WorkProject } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { apiUrl } from "@/lib/api";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";

export default function AdminProjects() {
  const [projects, setProjects] = useState<WorkProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploadingPhotoForId, setUploadingPhotoForId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState("📦 કબાટ");
  const [formData, setFormData] = useState({
    name: "",
    village: "",
    workTypes: [] as string[],
    totalAmount: "",
    status: "Ongoing",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const workTypeOptions = [
    "🚪 દરવાજા",
    "🪟 બારી",
    "🪑 ફર્નિચર",
    "🧥 અલમારી",
    "📦 કબાટ",
    "🗄️ શો-કેસ",
    "📺 TV યુનિટ",
    "🛋️ સોફા",
    "🛕 મંદિર",
    "🛏️ પલંગ",
    "📚 સ્ટડી ટેબલ",
    "🪞 કાચ",
    "💄 ડ્રેસિંગ ટેબલ",
    "❄️ AC પેનલિંગ",
    "🍳 રસોડું",
    "✨ અન્ય",
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async (projectId: string) => {
    if (!imageFile) {
      alert("કૃપા કરીને ફોટો પસંદ કરો");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const uploadResponse = await fetch(apiUrl("/api/upload"), {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("અપલોડ નિષ્ફળ");
      }

      const uploadedData = await uploadResponse.json();
      const imageUrl = uploadedData.secure_url;

      // Find project and update
      const project = projects.find((p) => p.id === projectId);
      if (!project) throw new Error("પ્રોજેક્ટ મળ્યો નહીં");

      const projectRef = doc(db, "projects", projectId);
      const newPhoto = {
        url: imageUrl,
        category: selectedPhotoCategory,
        type: selectedPhotoCategory,
      };

      const currentPhotos = project.photos || [];
      await updateDoc(projectRef, {
        photos: [...currentPhotos, newPhoto],
      });

      alert("ફોટો સફળતાથી અપલોડ થયો!");
      setImageFile(null);
      setImagePreview("");
      setUploadingPhotoForId(null);
      setSelectedPhotoCategory("📦 કબાટ");
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`ભૂલ: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (projectId: string, photoIndex: number) => {
    if (!confirm("કી તમે નિશ્ચિત છો?")) return;

    try {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const projectRef = doc(db, "projects", projectId);
      const updatedPhotos = (project.photos || []).filter(
        (_, idx) => idx !== photoIndex
      );

      await updateDoc(projectRef, {
        photos: updatedPhotos,
      });

      alert("ફોટો હટાવવામાં આવ્યો");
    } catch (error) {
      console.error("Delete error:", error);
      alert("ભૂલ આવી");
    }
  }

  // Load projects
  useEffect(() => {
    const unsubscribe = subscribeToProjects((loadedProjects) => {
      setProjects(loadedProjects);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleWorkTypeToggle = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      workTypes: prev.workTypes.includes(type)
        ? prev.workTypes.filter((t) => t !== type)
        : [...prev.workTypes, type],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.village || formData.workTypes.length === 0) {
      alert("કૃપા કરીને બધુ માહિતી ભરો");
      return;
    }

    try {
      if (editingId) {
        // Update existing
        const projectRef = doc(db, "projects", editingId);
        await updateDoc(projectRef, {
          name: formData.name,
          village: formData.village,
          workTypes: formData.workTypes,
          totalAmount: parseInt(formData.totalAmount) || 0,
          status: formData.status,
        });
        alert("પ્રોજેક્ટ અપડેટ થયો");
      } else {
        // Add new
        await addDoc(collection(db, "projects"), {
          name: formData.name,
          village: formData.village,
          workTypes: formData.workTypes,
          totalAmount: parseInt(formData.totalAmount) || 0,
          status: formData.status,
          images: [],
          photos: [],
          createdAt: Timestamp.now(),
        });
        alert("પ્રોજેક્ટ ઉમેરવામાં આવ્યો");
      }

      // Reset form
      setFormData({
        name: "",
        village: "",
        workTypes: [],
        totalAmount: "",
        status: "Ongoing",
      });
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      console.error("Error saving project:", error);
      alert("ભૂલ આવી. ફરી પ્રયાસ કરો.");
    }
  };

  const handleEdit = (project: WorkProject) => {
    setFormData({
      name: project.name,
      village: project.village,
      workTypes: project.workTypes,
      totalAmount: project.totalAmount.toString(),
      status: project.status,
    });
    setEditingId(project.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("કી તમે નિશ્ચિત છો?")) return;

    try {
      await deleteDoc(doc(db, "projects", id));
      alert("પ્રોજેક્ટ હટાવવામાં આવ્યો");
    } catch (error) {
      console.error("Error deleting project:", error);
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
              village: "",
              workTypes: [],
              totalAmount: "",
              status: "Ongoing",
            });
          }}
          className="bg-primary text-white hover:bg-primary-dark"
        >
          <Plus className="w-4 h-4 mr-2" />
          નવું પ્રોજેક્ટ ઉમેરો
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 border border-border shadow-sm">
          <h3 className="text-xl font-bold text-primary-dark mb-4">
            {editingId ? "પ્રોજેક્ટ સંપાદિત કરો" : "નવું પ્રોજેક્ટ ઉમેરો"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                પ્રોજેક્ટ નામ
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="દા.ત. કિચન ફર્નિચર"
                className="border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                ગામ
              </label>
              <Input
                type="text"
                value={formData.village}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, village: e.target.value }))
                }
                placeholder="દા.ત. ભાવનગર"
                className="border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                કામના પ્રકાર (બહુવિધ પસંદ કરો)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {workTypeOptions.map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 p-2 rounded border border-border cursor-pointer hover:bg-background"
                  >
                    <input
                      type="checkbox"
                      checked={formData.workTypes.includes(type)}
                      onChange={() => handleWorkTypeToggle(type)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-secondary">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                કુલ રકમ (₹)
              </label>
              <Input
                type="number"
                value={formData.totalAmount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, totalAmount: e.target.value }))
                }
                placeholder="0"
                className="border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                સ્થિતિ
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value as any }))
                }
                className="w-full px-3 py-2 border border-border rounded-lg text-secondary"
              >
                <option value="Ongoing">ચાલુ</option>
                <option value="Completed">પૂર્ણ</option>
              </select>
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

      {/* Projects List */}
      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-border">
            <p className="text-[#795548] font-medium">હજી કોઈ પ્રોજેક્ટ નથી</p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl border border-border shadow-sm overflow-hidden"
            >
              {/* Project Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-primary-dark mb-1">
                      {project.name}
                    </h3>
                    <p className="text-sm text-secondary mb-2">📍 {project.village}</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {project.workTypes?.map((type) => (
                        <span
                          key={type}
                          className="text-xs bg-border text-secondary px-2 py-1 rounded"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm font-semibold text-primary">
                      ₹{project.totalAmount.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(project)}
                      className="p-2 hover:bg-background rounded transition"
                    >
                      <Edit2 className="w-4 h-4 text-secondary" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-2 hover:bg-background rounded transition"
                    >
                      <Trash2 className="w-4 h-4 text-danger" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="p-4 bg-background border-b border-border">
                {uploadingPhotoForId === project.id ? (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-secondary">ફોટો અપલોડ કરો</h4>

                    {imagePreview && (
                      <div className="relative w-full h-40 bg-border rounded-lg overflow-hidden">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    />

                    <select
                      value={selectedPhotoCategory}
                      onChange={(e) => setSelectedPhotoCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg text-secondary"
                    >
                      {workTypeOptions.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUploadPhoto(project.id)}
                        disabled={!imageFile || uploading}
                        className="flex-1 bg-primary text-white hover:bg-primary-dark"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? "અપલોડ થઈ રહ્યું..." : "અપલોડ કરો"}
                      </Button>
                      <Button
                        onClick={() => {
                          setUploadingPhotoForId(null);
                          setImageFile(null);
                          setImagePreview("");
                        }}
                        className="flex-1 bg-gray-200 text-secondary hover:bg-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setUploadingPhotoForId(project.id)}
                    className="w-full bg-success text-white hover:bg-success-dark"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    ફોટો અપલોડ કરો ({(project.photos || []).length})
                  </Button>
                )}
              </div>

              {/* Photos Grid */}
              {(project.photos || []).length > 0 && (
                <div className="p-4">
                  <h4 className="font-semibold text-secondary mb-3">
                    ફોટો ({project.photos!.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {project.photos!.map((photo, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={photo.url}
                          alt={`Photo ${idx + 1}`}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center">
                          <button
                            onClick={() => handleDeletePhoto(project.id, idx)}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-2 py-1 rounded">
                          {photo.category?.replace(/^[^\s]*\s/, "") || "ફોટો"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
