import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Trash2 } from "lucide-react";
import { subscribeToProjects, WorkProject } from "@/lib/firebase";
import { apiUrl } from "@/lib/api";
import { db } from "@/lib/firebase";
import {
  collection,
  updateDoc,
  doc,
} from "firebase/firestore";

export default function AdminPhotos() {
  const [projects, setProjects] = useState<WorkProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<WorkProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("কাবাট");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const categories = [
    "📦 કબાટ",
    "🚪 દરવાજા",
    "🪟 બારી",
    "🪑 ફર્નિચર",
    "🧥 અલમારી",
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

  // Load projects
  useEffect(() => {
    const unsubscribe = subscribeToProjects((loadedProjects) => {
      setProjects(loadedProjects);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update selected project when ID changes
  useEffect(() => {
    const project = projects.find((p) => p.id === selectedProjectId);
    setSelectedProject(project || null);
  }, [selectedProjectId, projects]);

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

  const handleUpload = async () => {
    if (!imageFile || !selectedProject) {
      alert("કૃપા કરીને પ્રોજેક્ટ અને ફોટો પસંદ કરો");
      return;
    }

    setUploading(true);
    try {
      // Upload to server for cloudinary
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

      // Update Firestore with the new photo
      const projectRef = doc(db, "projects", selectedProject.id);
      const newPhoto = {
        url: imageUrl,
        category: selectedCategory,
        type: selectedCategory,
      };

      const currentPhotos = selectedProject.photos || [];
      await updateDoc(projectRef, {
        photos: [...currentPhotos, newPhoto],
      });

      alert("ફોટો સફળતાથી અપલોડ થયો!");
      setImageFile(null);
      setImagePreview("");
      setSelectedCategory("📦 કબાટ");
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`ભૂલ: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoIndex: number) => {
    if (!selectedProject) return;
    if (!confirm("કી તમે નિશ્ચિત છો?")) return;

    try {
      const projectRef = doc(db, "projects", selectedProject.id);
      const updatedPhotos = (selectedProject.photos || []).filter(
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
      {/* Project Selection */}
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">પ્રોજેક્ટ પસંદ કરો</h3>
        </div>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="input"
        >
          <option value="">-- પ્રોજેક્ટ પસંદ કરો --</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name} ({project.village})
            </option>
          ))}
        </select>
      </div>

      {/* Upload Form */}
      {selectedProject && (
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">ફોટો અપલોડ કરો</h3>
          </div>

          <div className="d-flex flex-column gap-md">
            {/* Image Preview */}
            {imagePreview && (
              <div className="card" style={{ minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img src={imagePreview} alt="Preview" className="w-full h-full" style={{ objectFit: "contain" }} />
              </div>
            )}

            {/* File Input */}
            <div className="form__group">
              <label className="form__label" htmlFor="file-input-photo">
                ફોટો પસંદ કરો
              </label>
              <input
                id="file-input-photo"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="input"
              />
            </div>

            {/* Category Selection */}
            <div className="form__group">
              <label className="form__label" htmlFor="category-select">
                કામનો પ્રકાર
              </label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!imageFile || uploading}
              variant="success"
              className="btn--full-width"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "અપલોડ થઈ રહ્યું છે..." : "અપલોડ કરો"}
            </Button>
          </div>
        </div>
      )}

      {/* Project Photos */}
      {selectedProject && (
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">
              {selectedProject.name} - ફોટો
            </h3>
          </div>

          {!selectedProject.photos || selectedProject.photos.length === 0 ? (
            <p className="text-center text-secondary py-md">
              હજી કોઈ ફોટો નથી
            </p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-md">
              {selectedProject.photos.map((photo, idx) => (
                <div key={idx} className="relative card card--hover" style={{ aspectRatio: "1/1", overflow: "hidden" }}>
                  <img
                    src={photo.url}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full"
                    style={{ objectFit: "cover" }}
                  />
                  <button
                    onClick={() => handleDeletePhoto(idx)}
                    className="btn btn-danger btn--icon"
                    style={{ position: "absolute", top: "8px", right: "8px" }}
                    aria-label="Delete photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="badge badge--primary" style={{ position: "absolute", bottom: "8px", left: "8px" }}>
                    {photo.category}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
