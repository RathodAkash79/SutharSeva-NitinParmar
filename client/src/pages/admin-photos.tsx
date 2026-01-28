import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Trash2 } from "lucide-react";
import { subscribeToProjects, WorkProject } from "@/lib/firebase";
import { apiUrl, resolveApiAssetUrl } from "@/lib/api";
import { compressImageFile } from "@/lib/imageUpload";
import { db, auth } from "@/lib/firebase";
import { getWorkTypeLabel, resolveWorkTypeId } from "@/lib/workTypes";
import { useWorkTypes } from "@/hooks/use-work-types";
import OptimizedImage from "@/components/system/OptimizedImage";
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["📦 કબાટ"]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [compressing, setCompressing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  const { options: categories } = useWorkTypes();

  useEffect(() => {
    if (categories.length === 0) return;
    setSelectedCategories((prev) => {
      const filtered = prev.filter((item) => categories.some((option) => option.label === item));
      if (filtered.length > 0) return filtered;
      return [categories[0].label];
    });
  }, [categories]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

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
    setVisibleCount(12);
  }, [selectedProjectId, projects]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.72,
      });
      setImageFile(compressed);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(compressed);
    } finally {
      setCompressing(false);
    }
  };

  const handleUpload = async () => {
    if (!imageFile || !selectedProject) {
      alert("કૃપા કરીને પ્રોજેક્ટ અને ફોટો પસંદ કરો");
      return;
    }

    if (selectedCategories.length === 0) {
      alert("કૃપા કરીને કામનો પ્રકાર પસંદ કરો");
      return;
    }

    setUploading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Authentication token not available");

      const payload = new FormData();
      payload.append("image", imageFile);
      payload.append("category", selectedCategories[0]);

      const uploadResponse = await fetch(apiUrl("/api/upload"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: payload,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(errorText || "અપલોડ નિષ્ફળ");
      }

      const uploadedData = await uploadResponse.json();
      const imageUrl = uploadedData.secure_url || uploadedData.url;

      if (!imageUrl) {
        console.error("Upload response:", uploadedData);
        throw new Error("Image URL not returned from server");
      }

      if (imageUrl.includes("/uploads/public/")) {
        throw new Error("Upload did not persist to Cloudinary. Please check Cloudinary configuration.");
      }

      // Update Firestore with the new photo
      const projectRef = doc(db, "projects", selectedProject.id);
      const workTypeIds = selectedCategories
        .map((category) => resolveWorkTypeId(category) || "other")
        .filter(Boolean);
      const newPhoto = {
        url: imageUrl,
        // Store workType for consistent search + preview across UI
        workTypes: workTypeIds,
        workType: selectedCategories[0],
        category: selectedCategories[0],
        type: selectedCategories[0],
      };

      const currentPhotos = selectedProject.photos || [];
      await updateDoc(projectRef, {
        photos: [...currentPhotos, newPhoto],
      });

      alert("ફોટો સફળતાથી અપલોડ થયો!");
      setImageFile(null);
      setImagePreview("");
      setSelectedCategories(["📦 કબાટ"]);
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

      setSelectedProject((prev) =>
        prev ? { ...prev, photos: updatedPhotos } : prev
      );

      await updateDoc(projectRef, {
        photos: updatedPhotos,
      });

      const targetPhoto = (selectedProject.photos || [])[photoIndex];
      if (targetPhoto?.url) {
        try {
          const idToken = await auth.currentUser?.getIdToken();
          if (idToken) {
            await fetch(apiUrl("/api/upload/delete"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({ url: targetPhoto.url }),
            });
          }
        } catch (error) {
          console.warn("Image delete API failed:", error);
        }
      }

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
                <img src={imagePreview} alt="Preview" className="w-full h-auto" style={{ objectFit: "contain" }} />
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
              <label className="form__label">કામનો પ્રકાર (બહુવિધ પસંદ કરો)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2 p-2 rounded border border-border cursor-pointer hover:bg-background"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.label)}
                      onChange={() => handleCategoryToggle(cat.label)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-secondary">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!imageFile || uploading || compressing}
              variant="success"
              className="btn--full-width"
            >
              <Upload className="w-4 h-4" />
              {compressing
                ? "ફોટો તૈયાર થઈ રહ્યો છે..."
                : uploading
                ? "અપલોડ થઈ રહ્યું છે..."
                : "અપલોડ કરો"}
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
              {selectedProject.photos.slice(0, visibleCount).map((photo, idx) => (
                <div key={idx} className="relative card card--hover" style={{ aspectRatio: "1/1", overflow: "hidden" }}>
                  <OptimizedImage
                    src={resolveApiAssetUrl(photo.url)}
                    alt={`Photo ${idx + 1}`}
                    aspectRatio="1 / 1"
                    sizes="(max-width: 640px) 28vw, (max-width: 1024px) 20vw, 15vw"
                    loading={idx < 6 ? "eager" : "lazy"}
                    priority={idx < 3}
                    widthCandidates={[200, 320, 480, 640]}
                  />
                  <button
                    onClick={() => handleDeletePhoto(idx)}
                    className="btn btn-danger btn--icon"
                    style={{ position: "absolute", top: "8px", right: "8px" }}
                    aria-label="Delete photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div
                    className="d-flex flex-wrap gap-xs"
                    style={{ position: "absolute", bottom: "8px", left: "8px" }}
                  >
                    {(photo.workTypes && photo.workTypes.length > 0
                      ? photo.workTypes
                      : [photo.category || "અન્ય"]
                    ).map((type) => (
                      <span key={type} className="badge badge--primary">
                        {getWorkTypeLabel(type, true)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {selectedProject.photos.length > visibleCount && (
              <div className="d-flex justify-center mt-md">
                <button
                  className="btn btn-outline"
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                >
                  વધુ જુઓ
                </button>
              </div>
            )}
          )}
        </div>
      )}
    </div>
  );
}
