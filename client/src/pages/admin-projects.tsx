import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, Upload, X } from "lucide-react";
import { subscribeToProjects, subscribeToRate, WorkProject } from "@/lib/firebase";
import { db, auth } from "@/lib/firebase";
import { apiUrl, resolveApiAssetUrl } from "@/lib/api";
import { compressImageFile } from "@/lib/imageUpload";
import { getWorkTypeLabel, resolveWorkTypeId } from "@/lib/workTypes";
import { useWorkTypes } from "@/hooks/use-work-types";
import OptimizedImage from "@/components/system/OptimizedImage";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
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
  const [compressing, setCompressing] = useState(false);
  const [selectedPhotoCategories, setSelectedPhotoCategories] = useState<string[]>(["📦 કબાટ"]);
  const [formData, setFormData] = useState({
    name: "",
    village: "",
    workTypes: [] as string[],
    totalFeet: "",
    totalAmount: "",
    status: "Ongoing",
    startDate: "",
    expectedEndDate: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [completionProject, setCompletionProject] = useState<WorkProject | null>(null);
  const [finalIncome, setFinalIncome] = useState("");
  const [savingCompletion, setSavingCompletion] = useState(false);
  const [majduriByProject, setMajduriByProject] = useState<Record<string, number>>({});
  const [visiblePhotosByProject, setVisiblePhotosByProject] = useState<Record<string, number>>({});
  const [activePhotoProjectId, setActivePhotoProjectId] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [currentRate, setCurrentRate] = useState(0);

  const { options: workTypeOptionObjects } = useWorkTypes();
  const workTypeOptions = workTypeOptionObjects.map((option) => option.label);

  useEffect(() => {
    if (workTypeOptions.length === 0) return;
    setSelectedPhotoCategories((prev) => {
      const filtered = prev.filter((item) => workTypeOptions.includes(item));
      if (filtered.length > 0) return filtered;
      return [workTypeOptions[0]];
    });
  }, [workTypeOptions]);

  const handlePhotoCategoryToggle = (category: string) => {
    setSelectedPhotoCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    );
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.72,
      });
      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
    } finally {
      setCompressing(false);
    }
  };

  const handleUploadPhoto = async (projectId: string) => {
    if (!imageFile) {
      alert("કૃપા કરીને ફોટો પસંદ કરો");
      return;
    }

    if (selectedPhotoCategories.length === 0) {
      alert("કૃપા કરીને કામનો પ્રકાર પસંદ કરો");
      return;
    }

    setUploading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Authentication token not available");

      const payload = new FormData();
      payload.append("image", imageFile);
      payload.append("category", selectedPhotoCategories[0]);

      const uploadResponse = await fetch(apiUrl("/api/upload"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: payload,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(errorText || `Upload failed (${uploadResponse.status})`);
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

      console.log("✅ Image uploaded successfully:", imageUrl);

      const project = projects.find((p) => p.id === projectId);
      if (!project) throw new Error("પ્રોજેક્ટ મળ્યો નહીં");

      const projectRef = doc(db, "projects", projectId);
      const workTypeIds = selectedPhotoCategories
        .map((category) => resolveWorkTypeId(category) || "other")
        .filter(Boolean);
      const newPhoto = {
        url: imageUrl,
        // Store workType for consistent search + preview across UI
        workTypes: workTypeIds,
        workType: selectedPhotoCategories[0],
        category: selectedPhotoCategories[0],
        type: selectedPhotoCategories[0],
      };

      const currentPhotos = project.photos || [];
      await updateDoc(projectRef, {
        photos: [...currentPhotos, newPhoto],
      });

      console.log("✅ Photo saved to Firestore");
      alert("ફોટો સફળતાથી અપલોડ થયો!");
      setImageFile(null);
      setImagePreview("");
      setUploadingPhotoForId(null);
      setSelectedPhotoCategories(["📦 કબાટ"]);
    } catch (error: any) {
      console.error("❌ Upload error:", error);
      alert(`ભૂલ: ${error.message || "Upload failed"}`);
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

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, photos: updatedPhotos } : p
        )
      );

      await updateDoc(projectRef, {
        photos: updatedPhotos,
      });

      const targetPhoto = (project.photos || [])[photoIndex];
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
  }

  // Load projects
  useEffect(() => {
    const unsubscribe = subscribeToProjects((loadedProjects) => {
      setProjects(loadedProjects);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToRate((rate) => setCurrentRate(rate));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const attendanceQuery = query(collection(db, "attendance"));
    const unsubscribe = onSnapshot(attendanceQuery, (snapshot) => {
      const totals: Record<string, number> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const projectId = data.projectId as string | undefined;
        const amount = typeof data.amount === "number" ? data.amount : 0;
        if (!projectId) return;
        totals[projectId] = (totals[projectId] || 0) + amount;
      });
      setMajduriByProject(totals);
    });

    return () => unsubscribe();
  }, []);

  const getMajduriForProject = (projectId: string) => majduriByProject[projectId] || 0;

  const getVisiblePhotoCount = (projectId: string) =>
    visiblePhotosByProject[projectId] || 6;

  const openPhotoViewer = (projectId: string, index: number) => {
    setActivePhotoProjectId(projectId);
    setActivePhotoIndex(index);
  };

  const activeProject = projects.find((project) => project.id === activePhotoProjectId);
  const activePhotos = activeProject?.photos || [];
  const activePhoto = activePhotos[activePhotoIndex];

  const handleViewerDelete = async () => {
    if (!activeProject) return;
    await handleDeletePhoto(activeProject.id, activePhotoIndex);
    if (activePhotos.length <= 1) {
      closePhotoViewer();
      return;
    }
    setActivePhotoIndex((prev) => Math.max(0, prev - 1));
  };

  const closePhotoViewer = () => {
    setActivePhotoProjectId(null);
  };

  const showNextPhoto = (photos: WorkProject["photos"]) => {
    if (!photos || photos.length === 0) return;
    setActivePhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const showPrevPhoto = (photos: WorkProject["photos"]) => {
    if (!photos || photos.length === 0) return;
    setActivePhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (photos: WorkProject["photos"], e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const swipeThreshold = 40;

    if (deltaX > swipeThreshold) {
      showPrevPhoto(photos);
    } else if (deltaX < -swipeThreshold) {
      showNextPhoto(photos);
    }

    setTouchStartX(null);
  };

  const increaseVisiblePhotos = (projectId: string) => {
    setVisiblePhotosByProject((prev) => ({
      ...prev,
      [projectId]: (prev[projectId] || 6) + 6,
    }));
  };

  const handleWorkTypeToggle = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      workTypes: prev.workTypes.includes(type)
        ? prev.workTypes.filter((t) => t !== type)
        : [...prev.workTypes, type],
    }));
  };

  const getDerivedStatus = (endDate: string) => (endDate ? "Completed" : "Ongoing");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.village || formData.workTypes.length === 0) {
      alert("કૃપા કરીને બધુ માહિતી ભરો");
      return;
    }

    const parsedFeet = parseFloat(formData.totalFeet);
    const hasFeet = Number.isFinite(parsedFeet) && parsedFeet > 0;
    const computedAmount = hasFeet && currentRate > 0 ? Math.round(parsedFeet * currentRate) : 0;
    const resolvedTotalAmount = computedAmount || parseInt(formData.totalAmount) || 0;

    if (!resolvedTotalAmount) {
      alert("કૃપા કરીને કુલ ફૂટ દાખલ કરો");
      return;
    }

    const derivedStatus = getDerivedStatus(formData.expectedEndDate);
    const todayDate = new Date().toISOString().split("T")[0];

    try {
      if (editingId) {
        // Update existing
        const projectRef = doc(db, "projects", editingId);
        const payload: Record<string, any> = {
          name: formData.name,
          village: formData.village,
          workTypes: formData.workTypes,
          totalAmount: resolvedTotalAmount,
          status: derivedStatus,
          startDate: formData.startDate || "",
          expectedEndDate: formData.expectedEndDate || "",
        };
        if (hasFeet) payload.totalFeet = parsedFeet;

        await updateDoc(projectRef, payload);
        alert("પ્રોજેક્ટ અપડેટ થયો");
      } else {
        // Add new
        const payload: Record<string, any> = {
          name: formData.name,
          village: formData.village,
          workTypes: formData.workTypes,
          totalAmount: resolvedTotalAmount,
          status: derivedStatus,
          startDate: formData.startDate || todayDate,
          expectedEndDate: formData.expectedEndDate || "",
          images: [],
          photos: [],
          createdAt: Timestamp.now(),
        };
        if (hasFeet) payload.totalFeet = parsedFeet;

        await addDoc(collection(db, "projects"), payload);
        alert("પ્રોજેક્ટ ઉમેરવામાં આવ્યો");
      }

      // Reset form
      setFormData({
        name: "",
        village: "",
        workTypes: [],
        totalFeet: "",
        totalAmount: "",
        status: "Ongoing",
        startDate: "",
        expectedEndDate: "",
      });
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      console.error("Error saving project:", error);
      alert("ભૂલ આવી. ફરી પ્રયાસ કરો.");
    }
  };

  const handleEdit = (project: WorkProject) => {
    const inferredFeet =
      typeof project.totalFeet === "number"
        ? project.totalFeet.toString()
        : currentRate > 0 && project.totalAmount > 0
          ? (project.totalAmount / currentRate).toFixed(2)
          : "";

    setFormData({
      name: project.name,
      village: project.village,
      workTypes: project.workTypes,
      totalFeet: inferredFeet,
      totalAmount: project.totalAmount.toString(),
      status: project.status,
      startDate: project.startDate || "",
      expectedEndDate: project.expectedEndDate || "",
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

  const handleCompleteProject = async () => {
    if (!completionProject) return;
    if (!finalIncome || isNaN(Number(finalIncome))) {
      alert("કૃપા કરીને અંતિમ આવક દાખલ કરો");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const resolvedEndDate = completionProject.expectedEndDate || today;
    setSavingCompletion(true);
    try {
      const projectRef = doc(db, "projects", completionProject.id);
      await updateDoc(projectRef, {
        status: "Completed",
        expectedEndDate: resolvedEndDate,
        finalAmount: Number(finalIncome),
        completedAt: Timestamp.now(),
      });
      alert("પ્રોજેક્ટ પૂર્ણ થયો તરીકે સાચવાયું");
      setCompletionProject(null);
      setFinalIncome("");
    } catch (error) {
      console.error("Error completing project:", error);
      alert("ભૂલ આવી. ફરી પ્રયાસ કરો.");
    } finally {
      setSavingCompletion(false);
    }
  };

  const parsedFeet = parseFloat(formData.totalFeet);
  const hasFeet = Number.isFinite(parsedFeet) && parsedFeet > 0;
  const computedAmount = hasFeet && currentRate > 0 ? Math.round(parsedFeet * currentRate) : 0;
  const displayAmount = computedAmount || parseInt(formData.totalAmount) || 0;
  const formDerivedStatus = getDerivedStatus(formData.expectedEndDate);
  const todayDateForForm = new Date().toISOString().split("T")[0];

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
              totalFeet: "",
              totalAmount: "",
              status: "Ongoing",
              startDate: todayDateForForm,
              expectedEndDate: "",
            });
          }}
          className="bg-primary text-white hover:bg-primary-dark"
        >
          <Plus className="w-4 h-4 mr-2" />
          નવું પ્રોજેક્ટ ઉમેરો
        </Button>
      </div>

      {/* Form */}
      <Modal
        open={showForm}
        title={editingId ? "પ્રોજેક્ટ સંપાદિત કરો" : "નવું પ્રોજેક્ટ ઉમેરો"}
        size="large"
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                શરૂ તારીખ
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                અંત તારીખ (વૈકલ્પિક)
              </label>
              <Input
                type="date"
                value={formData.expectedEndDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, expectedEndDate: e.target.value }))
                }
                className="border-border"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                કુલ ફૂટ
              </label>
              <Input
                type="number"
                value={formData.totalFeet}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, totalFeet: e.target.value }))
                }
                placeholder="દા.ત. 120"
                className="border-border"
              />
              <p className="text-xs text-secondary mt-1">
                વર્તમાન રેટ: ₹{currentRate.toLocaleString("en-IN")}/ફૂટ
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                કુલ રકમ (રેટ મુજબ) ₹
              </label>
              <div className="w-full px-3 py-2 border border-border rounded-lg text-secondary bg-background">
                ₹{displayAmount.toLocaleString("en-IN")}
              </div>
              {!currentRate && (
                <p className="text-xs text-danger mt-1">રેટ સેટ નથી. એડમિન પેનલમાંથી રેટ સેટ કરો.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                સ્થિતિ
              </label>
              <div className="w-full px-3 py-2 border border-border rounded-lg text-secondary bg-background">
                {formDerivedStatus === "Completed" ? "પૂર્ણ" : "ચાલુ"}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              કામના પ્રકાર (બહુવિધ પસંદ કરો)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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

          <div className="flex flex-wrap gap-2 justify-end">
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
            <Button
              type="submit"
              className="bg-primary text-white hover:bg-primary-dark"
            >
              સાચવો
            </Button>
          </div>
        </form>
      </Modal>

      {/* Completion Modal */}
      <Modal
        open={!!completionProject}
        title="પ્રોજેક્ટ પૂર્ણ કરો"
        onClose={() => {
          setCompletionProject(null);
          setFinalIncome("");
        }}
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-background border border-border p-4">
            <p className="text-sm text-secondary">પ્રોજેક્ટ</p>
            <p className="text-lg font-semibold text-primary-dark">
              {completionProject?.name}
            </p>
            <p className="text-sm text-secondary">📍 {completionProject?.village}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              અંતિમ આવક (ડિસ્કાઉન્ટ બાદ) ₹
            </label>
            <Input
              type="number"
              value={finalIncome}
              onChange={(e) => setFinalIncome(e.target.value)}
              placeholder="દા.ત. 125000"
              className="border-border"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              type="button"
              onClick={() => {
                setCompletionProject(null);
                setFinalIncome("");
              }}
              className="bg-gray-200 text-secondary hover:bg-gray-300"
            >
              રદ કરો
            </Button>
            <Button
              onClick={handleCompleteProject}
              disabled={savingCompletion}
              className="bg-success text-white hover:bg-success-dark"
            >
              {savingCompletion ? "સાચવી રહ્યું છે..." : "પૂર્ણ કરો"}
            </Button>
          </div>
        </div>
      </Modal>

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
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          project.status === "Completed"
                            ? "bg-[#e6f4ea] text-[#2f855a]"
                            : "bg-[#fff7e6] text-[#b7791f]"
                        }`}
                      >
                        {project.status === "Completed" ? "પૂર્ણ" : "ચાલુ"}
                      </span>
                      <p className="text-xs text-secondary">#{project.id.slice(0, 6)}</p>
                    </div>
                    <h3 className="text-xl font-bold text-primary-dark mb-1">
                      {project.name}
                    </h3>
                    <p className="text-sm text-secondary mb-2">📍 {project.village}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.workTypes?.map((type) => (
                        <span
                          key={type}
                          className="text-xs bg-border text-secondary px-2 py-1 rounded"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-secondary">
                      {project.startDate && <span>શરૂ: {project.startDate}</span>}
                      {project.expectedEndDate && <span>અંત: {project.expectedEndDate}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.status !== "Completed" && (
                      <button
                        onClick={() => {
                          setCompletionProject(project);
                          setFinalIncome(project.totalAmount.toString());
                        }}
                        className="px-3 py-2 rounded-lg bg-success text-white text-xs font-semibold hover:bg-success-dark"
                      >
                        પ્રોજેક્ટ પૂર્ણ કરો
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(project)}
                      className="p-2 border border-border rounded-lg hover:bg-background"
                    >
                      <Edit2 className="w-4 h-4 text-secondary" />
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-2 border border-border rounded-lg hover:bg-background"
                    >
                      <Trash2 className="w-4 h-4 text-danger" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="project-card__sections">
                {/* Details + Photos */}
                <div className="project-card__section project-card__section--primary">
                  <div className="project-card__block">
                    <h4 className="font-semibold text-primary-dark mb-3">કામની માહિતી</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-secondary">
                      <div>
                        <p className="text-xs text-muted">પ્રોજેક્ટ નામ</p>
                        <p className="font-semibold text-primary-dark">{project.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">ગામ</p>
                        <p className="font-semibold text-primary-dark">{project.village}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">શરૂ તારીખ</p>
                        <p className="font-semibold text-primary-dark">{project.startDate || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">અંત તારીખ</p>
                        <p className="font-semibold text-primary-dark">{project.expectedEndDate || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">કુલ મજૂરી</p>
                        <p className="font-semibold text-primary-dark">
                          ₹{getMajduriForProject(project.id).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="project-card__block">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-primary-dark">ફોટો</h4>
                      <span className="text-xs text-secondary">{(project.photos || []).length} ફોટા</span>
                    </div>

                    {uploadingPhotoForId === project.id ? (
                      <div className="space-y-4">
                        {imagePreview && (
                          <div className="relative w-full h-40 bg-border rounded-lg overflow-hidden">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-auto object-contain"
                            />
                          </div>
                        )}

                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="w-full px-3 py-2 border border-border rounded-lg"
                        />

                        <div>
                          <p className="text-sm font-semibold text-secondary mb-2">
                            કામનો પ્રકાર (બહુવિધ પસંદ કરો)
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {workTypeOptionObjects.map((cat) => (
                              <label
                                key={cat.id}
                                className="flex items-center gap-2 p-2 rounded border border-border cursor-pointer hover:bg-background"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedPhotoCategories.includes(cat.label)}
                                  onChange={() => handlePhotoCategoryToggle(cat.label)}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm text-secondary">{cat.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleUploadPhoto(project.id)}
                            disabled={!imageFile || uploading || compressing}
                            className="flex-1 bg-primary text-white hover:bg-primary-dark"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {compressing
                              ? "ફોટો તૈયાર થઈ રહ્યો છે..."
                              : uploading
                              ? "અપલોડ થઈ રહ્યું..."
                              : "અપલોડ કરો"}
                          </Button>
                          <Button
                            onClick={() => {
                              setUploadingPhotoForId(null);
                              setImageFile(null);
                              setImagePreview("");
                              setSelectedPhotoCategories(["📦 કબાટ"]);
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
                        ફોટો અપલોડ કરો
                      </Button>
                    )}

                    {(project.photos || []).length > 0 && (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                          {project.photos!.slice(0, getVisiblePhotoCount(project.id)).map((photo, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="relative group text-left"
                              onClick={() => openPhotoViewer(project.id, idx)}
                            >
                              <OptimizedImage
                                src={resolveApiAssetUrl(photo.url)}
                                alt={`Photo ${idx + 1}`}
                                aspectRatio="1 / 1"
                                sizes="(max-width: 640px) 28vw, (max-width: 1024px) 20vw, 16vw"
                                loading={idx < 4 ? "eager" : "lazy"}
                                priority={idx < 2}
                                widthCandidates={[200, 320, 480, 640]}
                              />
                              <div className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-1 rounded">
                                {getWorkTypeLabel((photo.workTypes && photo.workTypes[0]) || photo.workType || photo.type || photo.category || "ફોટો", true)}
                              </div>
                            </button>
                          ))}
                        </div>
                        {project.photos!.length > getVisiblePhotoCount(project.id) && (
                          <div className="d-flex justify-center mt-md">
                            <button
                              className="btn btn-outline"
                              onClick={() => increaseVisiblePhotos(project.id)}
                            >
                              વધુ જુઓ
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="project-card__section project-card__section--finance">
                  <h4 className="font-semibold text-primary-dark mb-4">ફાઇનાન્સ સંક્ષેપ</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-secondary">કુલ અંદાજિત રકમ</span>
                      <span className="font-semibold text-primary-dark">₹{project.totalAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-secondary">મજૂરી (હાજરી આધારે)</span>
                      <span className="font-semibold text-primary-dark">₹{getMajduriForProject(project.id).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-secondary">અંતિમ આવક</span>
                      <span className="font-semibold text-primary-dark">
                        {project.status === "Completed"
                          ? `₹${(project.finalAmount || 0).toLocaleString("en-IN")}`
                          : "₹0"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <span className="text-secondary">નફો</span>
                      <span
                        className={`font-semibold ${
                          project.status === "Completed"
                            ? (project.finalAmount || 0) - getMajduriForProject(project.id) >= 0
                              ? "text-success"
                              : "text-danger"
                            : "text-secondary"
                        }`}
                      >
                        {project.status === "Completed"
                          ? `₹${((project.finalAmount || 0) - getMajduriForProject(project.id)).toLocaleString("en-IN")}`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {activeProject && activePhoto && (
        <div
          className="modal-overlay modal-overlay--top"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closePhotoViewer();
            }
          }}
        >
          <div
            className="modal modal--large"
            onTouchStart={handleTouchStart}
            onTouchEnd={(event) => handleTouchEnd(activePhotos, event)}
          >
            <div className="modal__header">
              <h3 className="modal__title">ફોટો પ્રિવ્યુ</h3>
              <button
                className="btn btn-outline btn--icon"
                onClick={closePhotoViewer}
                aria-label="Close photo preview"
              >
                ✕
              </button>
            </div>
            <div className="modal__body photo-viewer">
              <div className="photo-viewer__frame">
                <OptimizedImage
                  src={resolveApiAssetUrl(activePhoto.url)}
                  alt="Project photo preview"
                  aspectRatio="4 / 3"
                  sizes="100vw"
                  loading="eager"
                  priority
                  objectFit="contain"
                  widthCandidates={[640, 900, 1200, 1600, 2000]}
                />
                <div className="photo-viewer__tag">
                  {getWorkTypeLabel(
                    (activePhoto.workTypes && activePhoto.workTypes[0]) ||
                      activePhoto.workType ||
                      activePhoto.type ||
                      activePhoto.category ||
                      "ફોટો",
                    true
                  )}
                </div>
                <button
                  className="photo-viewer__delete btn btn-danger"
                  onClick={handleViewerDelete}
                >
                  Delete
                </button>
                {activePhotos.length > 1 && (
                  <>
                    <button
                      className="photo-viewer__nav photo-viewer__nav--prev"
                      onClick={() => showPrevPhoto(activePhotos)}
                      aria-label="Previous photo"
                    >
                      ‹
                    </button>
                    <button
                      className="photo-viewer__nav photo-viewer__nav--next"
                      onClick={() => showNextPhoto(activePhotos)}
                      aria-label="Next photo"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
