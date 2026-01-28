import { collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface WorkTypeDefinition {
  id: string;
  englishName: string;
  gujaratiName: string;
  aliases: string[];
  emoji?: string;
}

const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

const slugSanitizeRegex = (() => {
  try {
    return new RegExp("[^\\p{L}\\p{N}\\s_-]", "gu");
  } catch (error) {
    return /[^a-z0-9\s_-]/g;
  }
})();

const toSlug = (value: string) =>
  normalizeSearchText(value)
    .replace(slugSanitizeRegex, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");

const extractEmoji = (value: string) => {
  const match = value.match(emojiRegex);
  return match ? match[0] : undefined;
};

const sanitizeLabelText = (value: string) => value.replace(emojiRegex, "").trim();

export const buildWorkTypeDefinitionFromLabel = (label: string): WorkTypeDefinition => {
  const trimmed = label.trim();
  const emoji = extractEmoji(trimmed);
  const text = sanitizeLabelText(trimmed);
  const idBase = toSlug(text || trimmed) || "work";
  return {
    id: idBase,
    englishName: text || trimmed,
    gujaratiName: text || trimmed,
    aliases: [],
    emoji,
  };
};

const toLabel = (entry: WorkTypeDefinition) =>
  entry.emoji ? `${entry.emoji} ${entry.gujaratiName}` : entry.gujaratiName;

const normalizeEntry = (entry: WorkTypeDefinition) => ({
  ...entry,
  englishName: entry.englishName || entry.gujaratiName || entry.id,
  gujaratiName: entry.gujaratiName || entry.englishName || entry.id,
  aliases: entry.aliases || [],
});

const mergeAndSortEntries = (entries: WorkTypeDefinition[]) => {
  const unique = new Map<string, WorkTypeDefinition>();
  entries.forEach((entry) => {
    unique.set(entry.id, normalizeEntry(entry));
  });
  return Array.from(unique.values()).sort((a, b) => toLabel(a).localeCompare(toLabel(b), "gu"));
};

const workTypesCollection = () => collection(db, "public", "workTypes", "items");

export const startWorkTypeSync = () => {
  if (workTypeUnsubscribe) return workTypeUnsubscribe;
  const q = query(workTypesCollection(), orderBy("createdAt", "asc"));
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        refreshWorkTypeMap([...defaultWorkTypeDictionary]);
        return;
      }

      const remoteEntries: WorkTypeDefinition[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Partial<WorkTypeDefinition> & { label?: string };
        const label = data.label || data.gujaratiName || data.englishName || docSnap.id;
        const base = buildWorkTypeDefinitionFromLabel(label);
        remoteEntries.push({
          ...base,
          id: data.id || docSnap.id || base.id,
          englishName: data.englishName || base.englishName,
          gujaratiName: data.gujaratiName || base.gujaratiName,
          aliases: data.aliases || base.aliases,
          emoji: data.emoji || base.emoji,
        });
      });

      refreshWorkTypeMap(mergeAndSortEntries(remoteEntries));
    },
    (error) => {
      console.error("Work type sync failed:", error);
      refreshWorkTypeMap([...defaultWorkTypeDictionary]);
    }
  );

  workTypeUnsubscribe = unsubscribe;
  return unsubscribe;
};

export const ensureDefaultWorkTypesInFirestore = async () => {
  const snap = await getDocs(workTypesCollection());
  if (!snap.empty) return;

  const writes = defaultWorkTypeDictionary.map((entry) => {
    const label = toLabel(entry);
    const docRef = doc(workTypesCollection(), entry.id);
    return setDoc(docRef, {
      id: entry.id,
      englishName: entry.englishName,
      gujaratiName: entry.gujaratiName,
      aliases: entry.aliases,
      emoji: entry.emoji || null,
      label,
      createdAt: Timestamp.now(),
    });
  });

  await Promise.all(writes);
};

export const addWorkType = async (label: string) => {
  const entry = buildWorkTypeDefinitionFromLabel(label);
  const docRef = doc(workTypesCollection(), entry.id);
  await setDoc(docRef, {
    id: entry.id,
    englishName: entry.englishName,
    gujaratiName: entry.gujaratiName,
    aliases: entry.aliases,
    emoji: entry.emoji || null,
    label: toLabel(entry),
    createdAt: Timestamp.now(),
  });
  return entry;
};

export const deleteWorkType = async (id: string) => {
  await deleteDoc(doc(workTypesCollection(), id));
};

const defaultWorkTypeDictionary: WorkTypeDefinition[] = [
  {
    id: "door",
    englishName: "Door",
    gujaratiName: "દરવાજા",
    aliases: ["doors", "door work"],
    emoji: "🚪",
  },
  {
    id: "window",
    englishName: "Window",
    gujaratiName: "બારી",
    aliases: ["windows"],
    emoji: "🪟",
  },
  {
    id: "furniture",
    englishName: "Furniture",
    gujaratiName: "ફર્નિચર",
    aliases: ["furnitures"],
    emoji: "🪑",
  },
  {
    id: "wardrobe",
    englishName: "Wardrobe",
    gujaratiName: "અલમારી",
    aliases: ["almari", "almirah"],
    emoji: "🧥",
  },
  {
    id: "cupboard",
    englishName: "Cupboard",
    gujaratiName: "કબાટ",
    aliases: ["cupboards", "kabaat", "kabat"],
    emoji: "📦",
  },
  {
    id: "showcase",
    englishName: "Showcase",
    gujaratiName: "શો-કેસ",
    aliases: ["show case", "display"],
    emoji: "🗄️",
  },
  {
    id: "tv_unit",
    englishName: "TV Unit",
    gujaratiName: "TV યુનિટ",
    aliases: ["tv", "television unit"],
    emoji: "📺",
  },
  {
    id: "sofa",
    englishName: "Sofa",
    gujaratiName: "સોફા",
    aliases: ["sofa set", "couch"],
    emoji: "🛋️",
  },
  {
    id: "mandir",
    englishName: "Temple",
    gujaratiName: "મંદિર",
    aliases: ["pooja", "puja", "mandir"],
    emoji: "🛕",
  },
  {
    id: "bed",
    englishName: "Bed",
    gujaratiName: "પલંગ",
    aliases: ["beds"],
    emoji: "🛏️",
  },
  {
    id: "study_table",
    englishName: "Study Table",
    gujaratiName: "સ્ટડી ટેબલ",
    aliases: ["study", "table", "desk"],
    emoji: "📚",
  },
  {
    id: "glass",
    englishName: "Glass",
    gujaratiName: "કાચ",
    aliases: ["mirror", "glass work"],
    emoji: "🪞",
  },
  {
    id: "dressing_table",
    englishName: "Dressing Table",
    gujaratiName: "ડ્રેસિંગ ટેબલ",
    aliases: ["dressing", "dresser"],
    emoji: "💄",
  },
  {
    id: "ac_paneling",
    englishName: "AC Paneling",
    gujaratiName: "AC પેનલિંગ",
    aliases: ["paneling", "ac"],
    emoji: "❄️",
  },
  {
    id: "kitchen",
    englishName: "Kitchen",
    gujaratiName: "રસોડું",
    aliases: ["kitchen work", "kitchen unit"],
    emoji: "🍳",
  },
  {
    id: "other",
    englishName: "Other",
    gujaratiName: "અન્ય",
    aliases: ["misc", "miscellaneous"],
    emoji: "✨",
  },
];

let workTypeDictionary: WorkTypeDefinition[] = [...defaultWorkTypeDictionary];
let workTypeMap = new Map(workTypeDictionary.map((entry) => [entry.id, entry]));
const listeners = new Set<(entries: WorkTypeDefinition[]) => void>();
let workTypeUnsubscribe: (() => void) | null = null;

const refreshWorkTypeMap = (entries: WorkTypeDefinition[]) => {
  workTypeDictionary = entries;
  workTypeMap = new Map(entries.map((entry) => [entry.id, entry]));
  listeners.forEach((listener) => listener(entries));
};

export const getWorkTypeDictionary = () => workTypeDictionary;

export const subscribeToWorkTypeUpdates = (listener: (entries: WorkTypeDefinition[]) => void) => {
  listeners.add(listener);
  listener(workTypeDictionary);
  return () => listeners.delete(listener);
};

export const normalizeSearchText = (value: string) =>
  value
    .replace(emojiRegex, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export const resolveWorkTypeId = (value?: string | null) => {
  if (!value) return null;
  const normalized = normalizeSearchText(value);
  if (!normalized) return null;

  const direct = workTypeMap.get(normalized);
  if (direct) return direct.id;

  for (const entry of workTypeDictionary) {
    const candidates = [
      entry.id,
      entry.englishName,
      entry.gujaratiName,
      ...entry.aliases,
      entry.emoji ? `${entry.emoji} ${entry.gujaratiName}` : entry.gujaratiName,
    ];

    if (candidates.some((candidate) => normalizeSearchText(candidate) === normalized)) {
      return entry.id;
    }
  }

  return null;
};

export const getWorkTypeLabel = (idOrLabel?: string | null, includeEmoji = true) => {
  if (!idOrLabel) return "અન્ય";
  const resolvedId = resolveWorkTypeId(idOrLabel);
  if (!resolvedId) return normalizeSearchText(idOrLabel) ? idOrLabel.replace(emojiRegex, "").trim() : "અન્ય";
  const entry = workTypeMap.get(resolvedId);
  if (!entry) return "અન્ય";
  return includeEmoji && entry.emoji ? `${entry.emoji} ${entry.gujaratiName}` : entry.gujaratiName;
};

export const getWorkTypeSearchTokens = (idOrLabel?: string | null) => {
  if (!idOrLabel) return [] as string[];
  const resolvedId = resolveWorkTypeId(idOrLabel);
  if (!resolvedId) {
    const fallback = normalizeSearchText(idOrLabel);
    return fallback ? [fallback] : [];
  }
  const entry = workTypeMap.get(resolvedId);
  if (!entry) return [] as string[];
  const tokens = [
    entry.id,
    entry.englishName,
    entry.gujaratiName,
    ...entry.aliases,
    entry.emoji ? `${entry.emoji} ${entry.gujaratiName}` : entry.gujaratiName,
  ];
  return Array.from(new Set(tokens.map((token) => normalizeSearchText(token)).filter(Boolean)));
};

export const matchesWorkTypeTerm = (term: string, idOrLabel?: string | null) => {
  const normalizedTerm = normalizeSearchText(term);
  if (!normalizedTerm) return false;
  const tokens = getWorkTypeSearchTokens(idOrLabel);
  return tokens.some((token) => token.includes(normalizedTerm) || normalizedTerm.includes(token));
};

export const getWorkTypeOptions = () =>
  workTypeDictionary.map((entry) => ({
    id: entry.id,
    label: entry.emoji ? `${entry.emoji} ${entry.gujaratiName}` : entry.gujaratiName,
  }));

export const getPhotoWorkTypeIds = (photo?: {
  workTypes?: string[];
  workType?: string;
  category?: string;
  type?: string;
}) => {
  if (!photo) return [] as string[];
  const legacy = [photo.workType, photo.category, photo.type];
  const ids = (photo.workTypes || [])
    .map((entry) => resolveWorkTypeId(entry) || entry)
    .filter(Boolean) as string[];
  legacy.forEach((value) => {
    const resolved = resolveWorkTypeId(value || "");
    if (resolved && !ids.includes(resolved)) {
      ids.push(resolved);
    }
  });
  return ids.length ? ids : ["other"];
};

export const getProjectWorkTypeIds = (projectWorkTypes: string[] = []) => {
  const ids = projectWorkTypes
    .map((entry) => resolveWorkTypeId(entry) || entry)
    .filter(Boolean) as string[];
  return ids.length ? ids : [];
};
