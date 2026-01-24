import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Tag } from "lucide-react";
import { subscribeToProjects, WorkProject } from "@/lib/firebase";

export default function WorkGallery() {
  const [projects, setProjects] = useState<WorkProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<WorkProject[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("બધા");
  const [selectedVillage, setSelectedVillage] = useState("બધા");
  const [villages, setVillages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWork, setSelectedWork] = useState<WorkProject | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const categories = [
    "બધા",
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

  // Load projects from Firebase
  useEffect(() => {
    const unsubscribe = subscribeToProjects((loadedProjects) => {
      setProjects(loadedProjects);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Extract villages from projects
  useEffect(() => {
    const uniqueVillages = Array.from(
      new Set(projects.map((p) => p.village).filter(Boolean))
    ) as string[];
    setVillages(uniqueVillages.sort());
  }, [projects]);

  // Filter projects based on search, category, and village
  useEffect(() => {
    let filtered = projects;

    // Filter by search term - PHOTO TYPE PRIORITY
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((p) => {
        const matchesPhotoType = (p.photos || []).some((photo) =>
          getPhotoType(photo).toLowerCase().includes(term)
        );

        const matchesWorkType = p.workTypes && p.workTypes.some((t) => t.toLowerCase().includes(term));
        const matchesWorkName = p.name.toLowerCase().includes(term);
        const matchesVillage = p.village.toLowerCase().includes(term);

        return matchesPhotoType || matchesWorkType || matchesWorkName || matchesVillage;
      });
    }

    // Filter by category - PHOTO TYPE FIRST
    if (selectedCategory !== "બધા") {
      const categoryName = getCategoryName(selectedCategory);
      filtered = filtered.filter((p) => {
        const hasPhotoOfType = (p.photos || []).some(
          (photo) => getPhotoType(photo) === categoryName
        );
        const hasWorkType = p.workTypes && p.workTypes.includes(categoryName);
        
        // If photo type exists, IGNORE work type match
        if (hasPhotoOfType) return true;
        // Only check work type if no matching photo type
        return hasWorkType;
      });
    }

    // Filter by village
    if (selectedVillage !== "બધા") {
      filtered = filtered.filter((p) => p.village === selectedVillage);
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, selectedCategory, selectedVillage]);

  const getCategoryName = (category: string) => {
    return category.replace(/^[^\s]*\s/, "");
  };

  const getMainImage = (project: WorkProject, preferredType?: string) => {
    // If a category is selected, try to show photo of that type first
    if (preferredType && preferredType !== "બધા") {
      const categoryName = getCategoryName(preferredType);
      const matchingPhoto = (project.photos || []).find(
        (photo) => getPhotoType(photo) === categoryName
      );
      if (matchingPhoto) return matchingPhoto.url;
    }

    // Fallback to normal behavior
    if (project.images && project.images.length > 0) {
      return project.images[0];
    }
    if (project.photos && project.photos.length > 0) {
      return project.photos[0].url;
    }
    return "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500&q=80";
  };

  function getPhotoType(
    photo: { url: string; category?: string; type?: string } | undefined
  ) {
    if (!photo) return "અન્ય";
    return photo.type || photo.category || "અન્ય";
  }

  const getImagesGrouped = (project?: WorkProject | null) => {
    if (!project) return [] as Array<{ type: string; items: Array<{ url: string; index: number }> }>;

    const grouped: Record<string, string[]> = {};

    // Legacy main images treated as "મુખ્ય ફોટો"
    (project.images || []).forEach((img) => {
      if (!img) return;
      if (!grouped["મુખ્ય ફોટો"]) grouped["મુખ્ય ફોટો"] = [];
      grouped["મુખ્ય ફોટો"].push(img);
    });

    (project.photos || []).forEach((photo) => {
      if (!photo || !photo.url) return;
      const type = getPhotoType(photo);
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(photo.url);
    });

    if (Object.keys(grouped).length === 0) {
      grouped["ફોટો"] = [
        "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=1200&q=80",
      ];
    }

    const result: Array<{ type: string; items: Array<{ url: string; index: number }> }> = [];
    let globalIndex = 0;
    Object.keys(grouped).forEach((type) => {
      const urls = grouped[type];
      const items = urls.map((url) => ({ url, index: globalIndex++ }));
      result.push({ type, items });
    });
    return result;
  };

  const getFlatImages = (project?: WorkProject | null) => {
    return getImagesGrouped(project).flatMap((group) => group.items.map((i) => i.url));
  };

  const openWork = (project: WorkProject) => {
    setSelectedWork(project);
    setActivePhotoIndex(0);
    setIsViewerOpen(false);
  };

  const closeWork = () => {
    setSelectedWork(null);
    setIsViewerOpen(false);
  };

  const openViewer = (index: number) => {
    setActivePhotoIndex(index);
    setIsViewerOpen(true);
  };

  const closeViewer = () => {
    setIsViewerOpen(false);
  };

  const showNextPhoto = () => {
    const images = getFlatImages(selectedWork);
    if (images.length === 0) return;
    setActivePhotoIndex((prev) => (prev + 1) % images.length);
  };

  const showPrevPhoto = () => {
    const images = getFlatImages(selectedWork);
    if (images.length === 0) return;
    setActivePhotoIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const swipeThreshold = 40;

    if (deltaX > swipeThreshold) {
      showPrevPhoto();
    } else if (deltaX < -swipeThreshold) {
      showNextPhoto();
    }

    setTouchStartX(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      if (isViewerOpen) {
        closeViewer();
      } else {
        closeWork();
      }
    }

    if (!isViewerOpen) return;

    if (e.key === "ArrowRight") {
      showNextPhoto();
    }

    if (e.key === "ArrowLeft") {
      showPrevPhoto();
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-[#efebe9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 cursor-pointer">
              <span className="text-2xl">🔨</span>
              <h1 className="text-lg font-bold text-[#5d4037]">સુથાર સેવા</h1>
            </a>
          </Link>
          <div className="flex gap-2">
            <a
              href="tel:+918160911612"
              className="px-3 py-1.5 bg-[#855e42] text-white rounded-full text-sm font-semibold hover:bg-[#5d4037] transition"
            >
              ☎️ ફોન
            </a>
          </div>
        </div>
      </header>

      {/* Page Title */}
      <div className="bg-gradient-to-b from-[#fdfbf7] to-[#f5f5f5] py-8 border-b border-[#efebe9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-[#5d4037] mb-2">અમારા કામ</h2>
          <p className="text-[#795548] font-medium">
            નિતિનભાઈ પરમારના શ્રેષ્ઠ ફર્નિચર અને સર્વિસ કાર્યોનો સંગ્રહ
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#795548] w-5 h-5" />
          <Input
            type="text"
            placeholder="ગામ, કામનો પ્રકાર શોધો..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-transparent bg-white shadow-md focus:border-[#d7ccc8] transition text-base placeholder:text-[#bdbdbd]"
          />
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <p className="text-xs text-[#999] font-semibold uppercase mb-3">
            📁 કામના પ્રકાર
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                  selectedCategory === category
                    ? "bg-[#855e42] text-white shadow-md"
                    : "bg-white text-[#795548] border-2 border-[#efebe9] hover:border-[#855e42] hover:bg-[#fdfbf7]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Village Filter */}
        {villages.length > 0 && (
          <div className="mb-8">
            <p className="text-xs text-[#999] font-semibold uppercase mb-3">
              📍 ગામ પસંદ કરો
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedVillage("બધા")}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                  selectedVillage === "બધા"
                    ? "bg-[#855e42] text-white shadow-md"
                    : "bg-white text-[#795548] border-2 border-[#efebe9] hover:border-[#855e42] hover:bg-[#fdfbf7]"
                }`}
              >
                બધા
              </button>
              {villages.map((village) => (
                <button
                  key={village}
                  onClick={() => setSelectedVillage(village)}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                    selectedVillage === village
                      ? "bg-[#855e42] text-white shadow-md"
                      : "bg-white text-[#795548] border-2 border-[#efebe9] hover:border-[#855e42] hover:bg-[#fdfbf7]"
                  }`}
                >
                  {village}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Gallery Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#795548] font-medium">લોડ થઈ રહ્યું છે...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#795548] font-medium text-lg">
              {projects.length === 0
                ? "હજી કોઈ કામ દર્શાવવામાં આવ્યું નથી."
                : "તમારી શોધ સાથે મેળતું કામ નથી."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-[#efebe9] hover:border-[#855e42]"
                role="button"
                tabIndex={0}
                onClick={() => openWork(project)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openWork(project);
                  }
                }}
              >
                {/* Image Container */}
                <div className="relative w-full h-56 bg-[#efebe9] overflow-hidden">
                  <img
                    src={getMainImage(project, selectedCategory)}
                    alt={project.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Work Name */}
                  <h3 className="text-lg font-bold text-[#5d4037] mb-2">
                    {project.name}
                  </h3>

                  {/* Village */}
                  <div className="flex items-center gap-2 text-[#795548] font-medium text-sm mb-3">
                    <MapPin className="w-4 h-4" />
                    {project.village}
                  </div>

                  {/* Work Types */}
                  {project.workTypes && project.workTypes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {project.workTypes.map((type) => (
                        <span
                          key={type}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#efebe9] text-[#5d4037] text-xs font-semibold rounded-lg"
                        >
                          <Tag className="w-3 h-3" />
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#efebe9] py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h4 className="font-bold text-[#5d4037] text-lg mb-3">
            નિતિનભાઈ પરમાર
          </h4>
          <p className="text-[#795548] font-medium mb-4">
            📱 મોબાઈલ: 8160911612
          </p>
          <a
            href="https://wa.me/918160911612"
            className="inline-block px-6 py-2.5 bg-[#43a047] text-white rounded-full font-semibold hover:bg-[#2e7d32] transition"
          >
            💬 WhatsApp મેસેજ
          </a>
        </div>
      </footer>

      {/* Work Detail Modal */}
      {selectedWork && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center bg-black/50 backdrop-blur-sm px-4 py-6"
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-full overflow-hidden shadow-2xl border border-[#efebe9]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#efebe9] bg-[#fdfbf7]">
              <div>
                <h3 className="text-xl font-bold text-[#5d4037] mb-1">
                  {selectedWork.name}
                </h3>
                <div className="flex items-center gap-2 text-[#795548] font-medium text-sm">
                  <MapPin className="w-4 h-4" />
                  {selectedWork.village}
                </div>
              </div>
              <button
                onClick={closeWork}
                className="px-3 py-1.5 bg-[#855e42] text-white rounded-full text-sm font-semibold hover:bg-[#5d4037] transition"
                aria-label="Close work details"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[75vh] space-y-6">
              {getImagesGrouped(selectedWork).map((group) => (
                <div key={`${selectedWork.id}-${group.type}`} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#795548] px-2 py-1 bg-[#efebe9] rounded-full">
                      {group.type}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {group.items.map((item) => (
                      <button
                        key={`${selectedWork.id}-${group.type}-${item.index}`}
                        onClick={() => openViewer(item.index)}
                        className="relative block w-full aspect-square bg-[#efebe9] rounded-xl overflow-hidden border border-[#efebe9] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#855e42]"
                      >
                        <img
                          src={item.url}
                          alt={`${selectedWork.name} ફોટો ${item.index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Viewer */}
      {isViewerOpen && selectedWork && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          <div className="flex justify-end p-4">
            <button
              onClick={closeViewer}
              className="px-3 py-1.5 bg-white/10 text-white rounded-full text-sm font-semibold border border-white/20 hover:bg-white/20 transition"
              aria-label="Close photo viewer"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center px-4 pb-8">
            <div
              className="w-full h-full flex items-center justify-center overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onClick={showNextPhoto}
              style={{ touchAction: "pan-y pinch-zoom" }}
            >
              <img
                src={getFlatImages(selectedWork)[activePhotoIndex]}
                alt={`${selectedWork.name} ફોટો`}
                className="max-h-full max-w-full object-contain select-none"
                loading="lazy"
                style={{ touchAction: "inherit" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
