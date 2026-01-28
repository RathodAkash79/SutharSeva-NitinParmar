import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Tag } from "lucide-react";
import { subscribeToProjects, WorkProject } from "@/lib/firebase";
import { resolveApiAssetUrl } from "@/lib/api";
import OptimizedImage from "@/components/system/OptimizedImage";
import {
  getWorkTypeLabel,
  getPhotoWorkTypeIds,
  getProjectWorkTypeIds,
  matchesWorkTypeTerm,
  normalizeSearchText,
  resolveWorkTypeId,
} from "@/lib/workTypes";
import { useWorkTypes } from "@/hooks/use-work-types";

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
  const [visibleCount, setVisibleCount] = useState(12);

  const { options: workTypeOptions } = useWorkTypes();
  const categories = ["બધા", ...workTypeOptions.map((option) => option.label)];

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
    let filtered = projects.filter((p) => {
      const hasMedia = (p.photos || []).length > 0 || (p.images || []).length > 0;
      const isCompleted = Boolean(p.expectedEndDate) || p.status === "Completed";
      return hasMedia && isCompleted;
    });

    // Filter by search term - supports English, Gujarati, aliases, without emoji
    if (searchTerm.trim()) {
      const term = normalizeSearchText(searchTerm);
      filtered = filtered.filter((p) => {
        const matchesPhotoType = (p.photos || []).some((photo) =>
          getPhotoWorkTypeIds(photo).some((id) => matchesWorkTypeTerm(term, id))
        );

        const matchesWorkType = getProjectWorkTypeIds(p.workTypes || []).some((id) =>
          matchesWorkTypeTerm(term, id)
        );
        const matchesWorkName = normalizeSearchText(p.name).includes(term);
        const matchesVillage = normalizeSearchText(p.village).includes(term);

        return matchesPhotoType || matchesWorkType || matchesWorkName || matchesVillage;
      });
    }

    // Filter by category (work type)
    if (selectedCategory !== "બધા") {
      const selectedTypeId = resolveWorkTypeId(selectedCategory) || "other";
      filtered = filtered.filter((p) => {
        const hasPhotoOfType = (p.photos || []).some((photo) =>
          getPhotoWorkTypeIds(photo).includes(selectedTypeId)
        );
        const hasWorkType = getProjectWorkTypeIds(p.workTypes || []).includes(selectedTypeId);
        return hasPhotoOfType || hasWorkType;
      });
    }

    // Filter by village
    if (selectedVillage !== "બધા") {
      filtered = filtered.filter((p) => p.village === selectedVillage);
    }

    setFilteredProjects(filtered);
    setVisibleCount(12);
  }, [projects, searchTerm, selectedCategory, selectedVillage]);

  const getProjectBadgeLabel = (project: WorkProject) => {
    if (selectedCategory !== "બધા") {
      return getWorkTypeLabel(selectedCategory, true);
    }
    if (project.workTypes && project.workTypes.length > 0) {
      return getWorkTypeLabel(project.workTypes[0], true);
    }
    return "";
  };

  const getMainImage = (project: WorkProject, preferredType?: string) => {
    // If a category or search term is provided, try to show photo of that type first
    if (preferredType && preferredType.trim()) {
      const normalizedPreferred = normalizeSearchText(preferredType);
      const matchingPhoto = (project.photos || []).find((photo) =>
        getPhotoWorkTypeIds(photo).some((id) => matchesWorkTypeTerm(normalizedPreferred, id))
      );
      if (matchingPhoto) return resolveApiAssetUrl(matchingPhoto.url);
    }

    // Fallback to normal behavior
    if (project.images && project.images.length > 0) {
      return resolveApiAssetUrl(project.images[0]);
    }
    if (project.photos && project.photos.length > 0) {
      return resolveApiAssetUrl(project.photos[0].url);
    }
    return "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500&q=80";
  };

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
      const typeIds = getPhotoWorkTypeIds(photo);
      const safeTypeIds = typeIds.length ? typeIds : ["other"];
      const uniqueTypeIds = Array.from(new Set(safeTypeIds));
      uniqueTypeIds.forEach((typeId) => {
        const typeLabel = getWorkTypeLabel(typeId, true);
        if (!grouped[typeLabel]) grouped[typeLabel] = [];
        grouped[typeLabel].push(resolveApiAssetUrl(photo.url));
      });
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

  useEffect(() => {
    const modalActive = Boolean(selectedWork) || isViewerOpen;
    if (modalActive) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedWork, isViewerOpen]);

  return (
    <div className="app">
      <div className="page page--full" onKeyDown={handleKeyDown}>
      <header className="app-header">
        <div className="app-header__container">
          <Link href="/">
            <a className="app-header__logo">
              <span className="app-header__logo-icon">🔨</span>
              <span className="app-header__logo-text">સુથાર સેવા</span>
            </a>
          </Link>
          <div className="app-header__actions">
            <a href="tel:+918160911612" className="btn btn-primary btn--small">
              ☎️ ફોન
            </a>
          </div>
        </div>
      </header>

      <section className="section section--compact bg-background-alt">
        <div className="page page--centered">
          <h2 className="section__title mb-sm">અમારા કામ</h2>
          <p className="text-secondary font-medium">
            નિતિનભાઈ પરમારના શ્રેષ્ઠ ફર્નિચર અને સર્વિસ કાર્યોનો સંગ્રહ
          </p>
        </div>
      </section>

      <main className="page page--centered">
        <section className="section section--compact">
          <div className="card card--hover">
            <div className="d-flex items-center gap-sm">
              <Search className="w-5 h-5 text-secondary" />
              <Input
                type="text"
                placeholder="ગામ, કામનો પ્રકાર શોધો..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input--large flex-1"
              />
            </div>
          </div>
        </section>

        <section className="section section--compact">
          <p className="text-xs text-muted font-semibold uppercase mb-sm">📁 કામના પ્રકાર</p>
          <div className="d-flex flex-wrap gap-sm">
            {categories.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`btn ${active ? "btn-primary" : "btn-outline"} btn--small`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </section>

        {villages.length > 0 && (
          <section className="section section--compact">
            <p className="text-xs text-muted font-semibold uppercase mb-sm">📍 ગામ પસંદ કરો</p>
            <div className="d-flex flex-wrap gap-sm">
              <button
                onClick={() => setSelectedVillage("બધા")}
                className={`btn ${selectedVillage === "બધા" ? "btn-primary" : "btn-outline"} btn--small`}
              >
                બધા
              </button>
              {villages.map((village) => (
                <button
                  key={village}
                  onClick={() => setSelectedVillage(village)}
                  className={`btn ${selectedVillage === village ? "btn-primary" : "btn-outline"} btn--small`}
                >
                  {village}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="section">
          {loading ? (
            <div className="card loading">
              <p className="loading__text">લોડ થઈ રહ્યું છે...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📷</div>
              <p className="empty-state__text">
                {projects.length === 0
                  ? "હજી કોઈ કામ દર્શાવવામાં આવ્યું નથી."
                  : "તમારી શોધ સાથે મેળતું કામ નથી."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid--3-col gap-lg">
                {filteredProjects.slice(0, visibleCount).map((project, index) => (
                  <div
                    key={project.id}
                    className="card card--interactive"
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
                    <div className="work-card__media" style={{ aspectRatio: "4 / 3" }}>
                      <OptimizedImage
                        src={getMainImage(project, selectedCategory !== "બધા" ? selectedCategory : searchTerm)}
                        alt={project.name}
                        aspectRatio="4 / 3"
                        sizes="(max-width: 640px) 92vw, (max-width: 1024px) 48vw, 33vw"
                        loading={index < 6 ? "eager" : "lazy"}
                        priority={index < 3}
                        widthCandidates={[320, 480, 640, 900]}
                      />
                      {getProjectBadgeLabel(project) && (
                        <div className="work-card__badge">{getProjectBadgeLabel(project)}</div>
                      )}
                    </div>

                    <div className="mt-md">
                      <h3 className="card__title mb-xs">{project.name}</h3>
                      <div className="d-flex items-center gap-xs text-secondary text-sm mb-sm">
                        <MapPin className="w-4 h-4" />
                        {project.village}
                      </div>
                      {project.workTypes && project.workTypes.length > 0 && (
                        <div className="d-flex flex-wrap gap-xs">
                          {project.workTypes.map((type) => (
                            <span key={type} className="badge badge--primary">
                              <Tag className="w-3 h-3" /> {getWorkTypeLabel(type, true)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {filteredProjects.length > visibleCount && (
                <div className="d-flex justify-center mt-lg">
                  <button
                    className="btn btn-outline"
                    onClick={() => setVisibleCount((prev) => prev + 12)}
                  >
                    વધુ જુઓ
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="section section--compact text-center">
        <div className="page page--centered">
          <h4 className="font-bold text-primary-dark text-lg mb-sm">નિતિનભાઈ પરમાર</h4>
          <p className="text-secondary font-medium mb-md">📱 મોબાઈલ: 8160911612</p>
          <a href="https://wa.me/918160911612" className="btn btn-success">
            💬 WhatsApp મેસેજ
          </a>
        </div>
      </footer>

      {selectedWork && (
        <div className="modal-overlay" tabIndex={-1} onKeyDown={handleKeyDown}>
          <div className="modal modal--large">
            <div className="modal__header">
              <div>
                <h3 className="modal__title">{selectedWork.name}</h3>
                <div className="d-flex items-center gap-xs text-secondary text-sm">
                  <MapPin className="w-4 h-4" />
                  {selectedWork.village}
                </div>
              </div>
              <button className="btn btn-outline btn--icon" onClick={closeWork} aria-label="Close work details">
                ✕
              </button>
            </div>

            <div className="modal__body">
              {getImagesGrouped(selectedWork).map((group) => (
                <div key={`${selectedWork.id}-${group.type}`} className="mb-lg">
                  <div className="badge badge--primary mb-sm">{group.type}</div>
                  <div className="grid grid--4-col gap-sm">
                    {group.items.map((item) => (
                      <button
                        key={`${selectedWork.id}-${group.type}-${item.index}`}
                        onClick={() => openViewer(item.index)}
                        className="card card--hover work-card__media"
                        style={{ aspectRatio: "1 / 1" }}
                      >
                        <OptimizedImage
                          src={item.url}
                          alt={`${selectedWork.name} ફોટો ${item.index + 1}`}
                          aspectRatio="1 / 1"
                          sizes="(max-width: 640px) 24vw, (max-width: 1024px) 20vw, 15vw"
                          loading="lazy"
                          widthCandidates={[200, 320, 480]}
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

      {isViewerOpen && selectedWork && (
        <div className="modal-overlay" tabIndex={-1} onKeyDown={handleKeyDown}>
          <div className="modal modal--large" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className="modal__header">
              <h3 className="modal__title">{selectedWork.name}</h3>
              <button className="btn btn-outline btn--icon" onClick={closeViewer} aria-label="Close photo viewer">
                ✕
              </button>
            </div>
            <div className="modal__body" onClick={showNextPhoto}>
              <OptimizedImage
                src={getFlatImages(selectedWork)[activePhotoIndex]}
                alt={`${selectedWork.name} ફોટો`}
                aspectRatio="16 / 9"
                sizes="100vw"
                loading="eager"
                priority
                objectFit="contain"
                widthCandidates={[640, 900, 1200, 1600, 2000]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
