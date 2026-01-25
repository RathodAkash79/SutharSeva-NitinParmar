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
  const activeUploadProject = uploadingPhotoForId
    ? projects.find((p) => p.id === uploadingPhotoForId) || null
    : null;

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
    <div className="d-flex flex-column gap-lg">
      <div className="d-flex gap-sm">
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({
              name: "",
              village: "",
              workTypes: [],
              totalAmount: "",
              status: "Ongoing",
            });
          }}
        >
          <Plus className="w-4 h-4" /> નવું પ્રોજેક્ટ ઉમેરો
        </Button>
      </div>

      <div className="d-flex flex-column gap-md">
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📁</div>
            <p className="empty-state__text">હજી કોઈ પ્રોજેક્ટ નથી</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="card card--hover">
              <div className="card__header">
                <div>
                  <h3 className="card__title">{project.name}</h3>
                  <p className="text-sm text-secondary">📍 {project.village}</p>
                  <div className="d-flex flex-wrap gap-xs mt-xs">
                    {project.workTypes?.map((type) => (
                      <span key={type} className="badge badge--primary">
                        {type}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-primary mt-sm">
                    ₹{project.totalAmount.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="d-flex gap-xs">
                  <button onClick={() => handleEdit(project)} className="btn btn-ghost btn--icon" aria-label="Edit project">
                    <Edit2 className="w-4 h-4 text-secondary" />
                  </button>
                  <button onClick={() => handleDelete(project.id)} className="btn btn-ghost btn--icon" aria-label="Delete project">
                    <Trash2 className="w-4 h-4 text-danger" />
                  </button>
                </div>
              </div>

              <div className="card__footer">
                <div className="card__actions">
                  <Button
                    variant="success"
                    onClick={() => setUploadingPhotoForId(project.id)}
                    className="btn--full-width"
                  >
                    <Upload className="w-4 h-4" /> ફોટો અપલોડ કરો ({(project.photos || []).length})
                  </Button>
                </div>
              </div>

              {(project.photos || []).length > 0 && (
                <div className="mt-md">
                  <h4 className="text-sm font-semibold text-secondary mb-sm">
                    ફોટો ({project.photos!.length})
                  </h4>
                  <div className="grid grid--3-col gap-sm">
                    {project.photos!.map((photo, idx) => (
                      <div key={idx} className="relative card card--hover" style={{ aspectRatio: "1 / 1" }}>
                        <img
                          src={photo.url}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleDeletePhoto(project.id, idx)}
                          className="btn btn-danger btn--icon"
                          style={{ position: "absolute", top: "8px", right: "8px" }}
                          aria-label="Delete photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="badge badge--primary" style={{ position: "absolute", bottom: "8px", left: "8px" }}>
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

      {showForm && (
        <div className="modal-overlay">
          <div className="modal modal--large">
            <div className="modal__header">
              <h3 className="modal__title">{editingId ? "પ્રોજેક્ટ સંપાદિત કરો" : "નવું પ્રોજેક્ટ ઉમેરો"}</h3>
              <button className="btn btn-ghost btn--icon" onClick={() => setShowForm(false)} aria-label="Close project form">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal__body d-flex flex-column gap-md">
              <div className="form__group">
                <label className="form__label" htmlFor="project-name">પ્રોજેક્ટ નામ</label>
                <Input
                  id="project-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="દા.ત. કિચન ફર્નિચર"
                  className="input"
                />
              </div>

              <div className="form__group">
                <label className="form__label" htmlFor="project-village">ગામ</label>
                <Input
                  id="project-village"
                  type="text"
                  value={formData.village}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, village: e.target.value }))
                  }
                  placeholder="દા.ત. ભાવનગર"
                  className="input"
                />
              </div>

              <div className="form__group">
                <label className="form__label">કામના પ્રકાર (બહુવિધ પસંદ કરો)</label>
                <div className="grid grid--2-col gap-sm">
                  {workTypeOptions.map((type) => (
                    <label
                      key={type}
                      className="card card--hover d-flex items-center gap-sm"
                    >
                      <input
                        type="checkbox"
                        checked={formData.workTypes.includes(type)}
                        onChange={() => handleWorkTypeToggle(type)}
                      />
                      <span className="text-sm text-secondary">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form__group">
                <label className="form__label" htmlFor="project-amount">કુલ રકમ (₹)</label>
                <Input
                  id="project-amount"
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, totalAmount: e.target.value }))
                  }
                  placeholder="0"
                  className="input"
                />
              </div>

              <div className="form__group">
                <label className="form__label" htmlFor="project-status">સ્થિતિ</label>
                <select
                  id="project-status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, status: e.target.value as any }))
                  }
                  className="input"
                >
                  <option value="Ongoing">ચાલુ</option>
                  <option value="Completed">પૂર્ણ</option>
                </select>
              </div>

              <div className="modal__footer">
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
        </div>
      )}

      {activeUploadProject && (
        <div className="modal-overlay">
          <div className="modal modal--large">
            <div className="modal__header">
              <div>
                <h3 className="modal__title">ફોટો અપલોડ કરો</h3>
                <p className="text-sm text-secondary">{activeUploadProject.name}</p>
              </div>
              <button
                className="btn btn-ghost btn--icon"
                onClick={() => {
                  setUploadingPhotoForId(null);
                  setImageFile(null);
                  setImagePreview("");
                }}
                aria-label="Close photo upload"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="modal__body d-flex flex-column gap-md">
              {imagePreview && (
                <div className="card" style={{ minHeight: "200px" }}>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                </div>
              )}

              <div className="form__group">
                <label className="form__label" htmlFor="project-photo">ફોટો પસંદ કરો</label>
                <input id="project-photo" type="file" accept="image/*" onChange={handleImageSelect} className="input" />
              </div>

              <div className="form__group">
                <label className="form__label" htmlFor="photo-category">કામનો પ્રકાર</label>
                <select
                  id="photo-category"
                  value={selectedPhotoCategory}
                  onChange={(e) => setSelectedPhotoCategory(e.target.value)}
                  className="input"
                >
                  {workTypeOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal__footer">
                <Button
                  onClick={() => handleUploadPhoto(activeUploadProject.id)}
                  disabled={!imageFile || uploading}
                  variant="success"
                >
                  <Upload className="w-4 h-4" /> {uploading ? "અપલોડ થઈ રહ્યું..." : "અપલોડ કરો"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setUploadingPhotoForId(null);
                    setImageFile(null);
                    setImagePreview("");
                  }}
                >
                  રદ કરો
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
