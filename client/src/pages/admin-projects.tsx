import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, Upload, X } from "lucide-react";
import { subscribeToProjects, loadProjects, WorkProject } from "@/lib/firebase";
import { db, auth } from "@/lib/firebase";
import { apiUrl } from "@/lib/api";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";

const WORK_TYPE_OPTIONS = [
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

export default function AdminProjects({ isMobile = false }: { isMobile?: boolean }) {
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
  const [uploadError, setUploadError] = useState<string | null>(null);

  const activeUploadProject = uploadingPhotoForId
    ? projects.find((p) => p.id === uploadingPhotoForId) || null
    : null;

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
      setUploadError("કૃપા કરીને ફોટો પસંદ કરો");
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("image", imageFile);

      // Attach Firebase ID token for protected upload endpoint
      const idToken = await auth.currentUser?.getIdToken();

      const uploadResponse = await fetch(apiUrl("/api/upload"), {
        method: "POST",
        headers: idToken ? { Authorization: `Bearer ${idToken}` } : undefined,
        body: formDataUpload,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      const uploadedData = await uploadResponse.json();
      const imageUrl = uploadedData.secure_url || uploadedData.url;

      if (!imageUrl) {
        throw new Error("No image URL returned from server");
      }

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

      alert("✅ ફોટો સફળતાથી અપલોડ થયો!");
      console.log(`✅ Photo uploaded: ${imageUrl}`);
      setImageFile(null);
      setImagePreview("");
      setUploadingPhotoForId(null);
      setSelectedPhotoCategory("📦 કબાટ");
    } catch (error: any) {
      console.error("❌ Upload error:", error);
      setUploadError(`Upload failed: ${error.message || "Unknown error"}`);
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
    } catch (error: any) {
      console.error("❌ Project CRUD error:", error);
      const errorMessage = error.message || "An error occurred";
      const fullError = `Error: ${errorMessage}`;
      alert(fullError);
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
    if (!confirm("कृपया यह confirm करें कि आप यह project delete करना चाहते हैं")) return;

    try {
      await deleteDoc(doc(db, "projects", id));
      alert("✅ પ્રોજેક્ટ સફળતાથી હટાવવામાં આવ્યો");
    } catch (error: any) {
      console.error("❌ Delete error:", error);
      const errorMessage = error.message || "Failed to delete";
      alert(`Error deleting project: ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-secondary font-medium">લોડ થઈ રહ્યું છે...</p>
      </div>
    );
  }

  // Split projects into ongoing and completed
  const ongoingProjects = projects.filter((p) => p.status === "Ongoing");
  const completedProjects = projects.filter((p) => p.status === "Completed");

  return (
    <div className="space-y-8 pb-20">
      {/* ADD PROJECT BUTTON - STICKY AT TOP */}
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur border-b border-border pt-2 pb-4 -mx-4 px-4 sm:px-6">
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
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> નવું પ્રોજેક્ટ
        </Button>
      </div>

      {/* ONGOING PROJECTS */}
      {ongoingProjects.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-primary-dark mb-3">ચાલુ પ્રોજેક્ટ્સ ({ongoingProjects.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ongoingProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUploadPhoto={() => setUploadingPhotoForId(project.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* COMPLETED PROJECTS */}
      {completedProjects.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-primary-dark mb-3">પૂર્ણ પ્રોજેક્ટ્સ ({completedProjects.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUploadPhoto={() => setUploadingPhotoForId(project.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* EMPTY STATE */}
      {projects.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">📁</div>
          <p className="empty-state__text">હજી કોઈ પ્રોજેક્ટ નથી</p>
        </div>
      )}

      {/* EDIT FORM MODAL */}
      {showForm && (
        <ProjectFormModal
          project={editingId ? projects.find((p) => p.id === editingId) : null}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingId(null);
          }}
          onWorkTypeToggle={handleWorkTypeToggle}
        />
      )}

      {/* PHOTO UPLOAD MODAL */}
      {activeUploadProject && (
        <PhotoUploadModal
          project={activeUploadProject}
          imageFile={imageFile}
          imagePreview={imagePreview}
          selectedPhotoCategory={selectedPhotoCategory}
          uploading={uploading}
          uploadError={uploadError}
          onImageSelect={handleImageSelect}
          onCategoryChange={setSelectedPhotoCategory}
          onUpload={() => handleUploadPhoto(activeUploadProject.id)}
          onClose={() => {
            setUploadingPhotoForId(null);
            setImageFile(null);
            setImagePreview("");
            setUploadError(null);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPACT PROJECT CARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  onEdit,
  onDelete,
  onUploadPhoto,
}: {
  project: WorkProject;
  onEdit: (project: WorkProject) => void;
  onDelete: (id: string) => void;
  onUploadPhoto: () => void;
}) {
  return (
    <div className="card card--hover h-full flex flex-col gap-sm">
      <div className="flex items-start justify-between gap-sm">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-xs">
            <span className="badge badge--primary text-xxs">{project.status === "Completed" ? "પૂર્ણ" : "ચાલુ"}</span>
            <p className="text-xs text-secondary truncate">📍 {project.village}</p>
          </div>
          <h4 className="text-base font-semibold text-primary-dark mt-1 line-clamp-2">{project.name}</h4>
          <div className="flex flex-wrap gap-1 mt-2">
            {project.workTypes?.slice(0, 3).map((type) => (
              <span key={type} className="badge badge--primary text-xxs px-2 py-1">
                {type}
              </span>
            ))}
            {project.workTypes && project.workTypes.length > 3 && (
              <span className="text-xxs text-secondary">+{project.workTypes.length - 3}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onEdit(project)}
            className="btn btn-ghost btn--icon"
            aria-label="Edit"
            title="Edit project"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(project.id)}
            className="btn btn-ghost btn--icon text-danger"
            aria-label="Delete"
            title="Delete project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm bg-background p-2 rounded border border-border">
        <div>
          <p className="text-xxs text-secondary">રકમ</p>
          <p className="font-bold text-primary">₹{project.totalAmount.toLocaleString("en-IN")}</p>
        </div>
        <div className="text-right">
          <p className="text-xxs text-secondary">ફોટો</p>
          <p className="font-semibold text-primary-dark">{(project.photos || []).length}</p>
        </div>
      </div>

      <button
        onClick={onUploadPhoto}
        className="w-full btn btn-primary btn--small d-flex items-center justify-center gap-xs"
        title="Upload photos"
      >
        <Upload className="w-4 h-4" /> ફોટો અપલોડ
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT FORM MODAL
// ─────────────────────────────────────────────────────────────────────────────

function ProjectFormModal({
  project,
  formData,
  setFormData,
  onSubmit,
  onClose,
  onWorkTypeToggle,
}: {
  project?: WorkProject;
  formData: any;
  setFormData: any;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onWorkTypeToggle: (type: string) => void;
}) {
  return (
    <div className="modal-overlay">
      <div className="modal modal--large">
        <div className="modal__header">
          <h3 className="modal__title">
            {project ? "પ્રોજેક્ટ સંપાદિત કરો" : "નવું પ્રોજેક્ટ"}
          </h3>
          <button
            className="btn btn-ghost btn--icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="modal__body space-y-4">
          <div>
            <label className="form__label">પ્રોજેક્ટ નામ</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
              placeholder="દા.ત. કિચન ફર્નિચર"
              className="input"
            />
          </div>

          <div>
            <label className="form__label">ગામ</label>
            <Input
              type="text"
              value={formData.village}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, village: e.target.value }))}
              placeholder="દા.ત. ભાવનગર"
              className="input"
            />
          </div>

          <div>
            <label className="form__label mb-2 block">કામના પ્રકાર</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-border rounded p-2">
              {WORK_TYPE_OPTIONS.map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.workTypes.includes(type)}
                    onChange={() => onWorkTypeToggle(type)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-secondary">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="form__label">કુલ રકમ (₹)</label>
            <Input
              type="number"
              value={formData.totalAmount}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, totalAmount: e.target.value }))}
              placeholder="0"
              className="input"
            />
          </div>

          <div>
            <label className="form__label">સ્થિતિ</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, status: e.target.value }))}
              className="input"
            >
              <option value="Ongoing">ચાલુ</option>
              <option value="Completed">પૂર્ણ</option>
            </select>
          </div>

          <div className="modal__footer">
            <Button type="submit">સાચવો</Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              રદ કરો
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PHOTO UPLOAD MODAL
// ─────────────────────────────────────────────────────────────────────────────

function PhotoUploadModal({
  project,
  imageFile,
  imagePreview,
  selectedPhotoCategory,
  uploading,
  uploadError,
  onImageSelect,
  onCategoryChange,
  onUpload,
  onClose,
}: {
  project: WorkProject;
  imageFile: File | null;
  imagePreview: string;
  selectedPhotoCategory: string;
  uploading: boolean;
  uploadError: string | null;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCategoryChange: (category: string) => void;
  onUpload: () => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay">
      <div className="modal modal--large">
        <div className="modal__header">
          <div>
            <h3 className="modal__title">ફોટો અપલોડ કરો</h3>
            <p className="text-sm text-secondary mt-1">{project.name}</p>
          </div>
          <button className="btn btn-ghost btn--icon" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="modal__body space-y-4">
          {uploadError && (
            <div className="alert alert--danger text-sm">{uploadError}</div>
          )}

          {imagePreview && (
            <div className="border border-border rounded overflow-hidden max-h-64">
              <img src={imagePreview} alt="Preview" className="w-full h-auto object-contain" />
            </div>
          )}

          <div>
            <label className="form__label">ફોટો પસંદ કરો</label>
            <input
              type="file"
              accept="image/*"
              onChange={onImageSelect}
              className="input"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="form__label">કામનો પ્રકાર</label>
            <select
              value={selectedPhotoCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="input"
              disabled={uploading}
            >
              {WORK_TYPE_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="modal__footer">
            <Button
              onClick={onUpload}
              disabled={!imageFile || uploading}
              variant="success"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "અપલોડ થઈ રહ્યું..." : "અપલોડ કરો"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} disabled={uploading}>
              રદ કરો
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
