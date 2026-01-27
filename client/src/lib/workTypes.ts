export interface WorkTypeDefinition {
  id: string;
  englishName: string;
  gujaratiName: string;
  aliases: string[];
  emoji?: string;
}

const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

export const workTypeDictionary: WorkTypeDefinition[] = [
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

const workTypeMap = new Map(workTypeDictionary.map((entry) => [entry.id, entry]));

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
