import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Trash2 } from "lucide-react";
import { subscribeToProjects, WorkProject } from "@/lib/firebase";
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

      const uploadResponse = await fetch("/api/upload", {
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
        <p className="text-[#795548] font-medium">લોડ થઈ રહ્યું છે...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Selection */}
      <div className="bg-white rounded-xl p-6 border border-[#efebe9] shadow-sm">
        <h3 className="text-lg font-bold text-[#5d4037] mb-4">પ્રોજેક્ટ પસંદ કરો</h3>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full px-4 py-2 border border-[#efebe9] rounded-lg text-[#795548]"
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
        <div className="bg-white rounded-xl p-6 border border-[#efebe9] shadow-sm">
          <h3 className="text-lg font-bold text-[#5d4037] mb-4">ફોટો અપલોડ કરો</h3>

          <div className="space-y-4">
            {/* Image Preview */}
            {imagePreview && (
              <div className="relative w-full h-64 bg-[#efebe9] rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* File Input */}
            <div>
              <label className="block text-sm font-semibold text-[#795548] mb-2">
                ફોટો પસંદ કરો
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="w-full px-4 py-2 border border-[#efebe9] rounded-lg"
              />
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-semibold text-[#795548] mb-2">
                કામનો પ્રકાર
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-[#efebe9] rounded-lg text-[#795548]"
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
              className="w-full bg-[#855e42] text-white hover:bg-[#5d4037]"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "અપલોડ થઈ રહ્યું છે..." : "અપલોડ કરો"}
            </Button>
          </div>
        </div>
      )}

      {/* Project Photos */}
      {selectedProject && (
        <div className="bg-white rounded-xl p-6 border border-[#efebe9] shadow-sm">
          <h3 className="text-lg font-bold text-[#5d4037] mb-4">
            {selectedProject.name} - ફોટો
          </h3>

          {!selectedProject.photos || selectedProject.photos.length === 0 ? (
            <p className="text-center text-[#795548] py-8">
              હજી કોઈ ફોટો નથી
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {selectedProject.photos.map((photo, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={photo.url}
                    alt={`Photo ${idx + 1}`}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center">
                    <button
                      onClick={() => handleDeletePhoto(idx)}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-2 py-1 rounded">
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
