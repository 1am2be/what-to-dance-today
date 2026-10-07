import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { seedArtists, seedDances, seedPracticeRecords } from "@/data/seed";
import type { Artist, ArtistSummary } from "@/domain/models/artist";
import type { Dance, DanceSource, ScopeType } from "@/domain/models/dance";
import type { PracticeRecord, PracticeRecordView } from "@/domain/models/practice-record";

const STORAGE_KEY = "idol-dance-data-v1";
const REVIEW_INTERVALS = [1, 3, 7, 14] as const;

type PersistedData = {
  artists: Artist[];
  dances: Dance[];
  practiceRecords: PracticeRecord[];
};

export type AddDanceInput = {
  artistId?: string;
  artistName: string;
  artistImageUrl: string;
  songTitle: string;
  scopeType: ScopeType;
  scopeText: string;
  sourceType: DanceSource;
  learnedDate?: string;
};

export type AddDanceResult = "created" | "scope-updated";
export type UpdateScopeResult = "unchanged" | "updated" | "reset";

export class DanceValidationError extends Error {
  constructor(public code: "artist-name" | "artist-image" | "song-title" | "scope" | "future-date" | "duplicate-unchanged") {
    super(code);
  }
}

const cloneSeed = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const normalize = (value: string) => value.trim().toLocaleLowerCase();
const localDateIso = (dateText: string) => {
  const [year, month, day] = dateText.split("-").map(Number);
  return new Date(year, month - 1, day, 12).toISOString();
};
const addDays = (iso: string, days: number) => {
  const value = new Date(iso);
  value.setDate(value.getDate() + days);
  return value.toISOString();
};
const todayText = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
};

export const useAppStore = defineStore("app", () => {
  const artists = ref<Artist[]>([]);
  const dances = ref<Dance[]>([]);
  const practiceRecords = ref<PracticeRecord[]>([]);
  const initialized = ref(false);

  const nextUniqueId = (prefix: string, usedIds: string[]) => {
    let id = makeId(prefix);
    while (usedIds.includes(id)) id = makeId(prefix);
    return id;
  };

  const enforceArtistUniqueness = () => {
    const artistsByName = new Map<string, Artist>();
    const remappedArtistIds = new Map<string, string>();
    const usedIds: string[] = [];
    const uniqueArtists: Artist[] = [];

    artists.value.forEach((artist) => {
      const nameKey = normalize(artist.name);
      const sameName = artistsByName.get(nameKey);
      if (sameName) {
        remappedArtistIds.set(artist.id, sameName.id);
        if (!sameName.imageUrl && artist.imageUrl) sameName.imageUrl = artist.imageUrl;
        return;
      }

      const uniqueArtist = usedIds.includes(artist.id)
        ? { ...artist, id: nextUniqueId("artist", usedIds) }
        : artist;
      usedIds.push(uniqueArtist.id);
      artistsByName.set(nameKey, uniqueArtist);
      uniqueArtists.push(uniqueArtist);
    });

    if (remappedArtistIds.size) {
      dances.value.forEach((dance) => {
        dance.artistId = remappedArtistIds.get(dance.artistId) ?? dance.artistId;
      });
      practiceRecords.value.forEach((record) => {
        record.artistId = remappedArtistIds.get(record.artistId) ?? record.artistId;
      });
    }
    artists.value = uniqueArtists;
  };

  const persist = () => {
    const data: PersistedData = {
      artists: artists.value,
      dances: dances.value,
      practiceRecords: practiceRecords.value,
    };
    uni.setStorageSync(STORAGE_KEY, data);
  };

  const initialize = () => {
    if (initialized.value) return;
    const saved = uni.getStorageSync(STORAGE_KEY) as PersistedData | "";
    if (saved && Array.isArray(saved.artists) && Array.isArray(saved.dances) && Array.isArray(saved.practiceRecords)) {
      artists.value = saved.artists;
      dances.value = saved.dances;
      practiceRecords.value = saved.practiceRecords;
    } else {
      artists.value = cloneSeed(seedArtists);
      dances.value = cloneSeed(seedDances);
      practiceRecords.value = cloneSeed(seedPracticeRecords);
      persist();
    }
    enforceArtistUniqueness();
    persist();
    initialized.value = true;
  };

  const artistSummaries = computed<ArtistSummary[]>(() =>
    artists.value.map((artist, index) => ({
      ...artist,
      danceCount: dances.value.filter((dance) => dance.artistId === artist.id).length,
      artworkTone: (["aqua", "silver", "pearl", "mint"] as const)[index % 4],
    })),
  );

  const practiceRecordViews = computed<PracticeRecordView[]>(() =>
    practiceRecords.value
      .map((record, index) => {
        const artist = artists.value.find((item) => item.id === record.artistId);
        const dance = dances.value.find((item) => item.id === record.danceId);
        if (!artist || !dance) return null;
        return {
          id: record.id,
          danceId: dance.id,
          artistName: artist.name,
          artistTone: index % 2 === 0 ? "pink" as const : "blue" as const,
          songTitle: dance.songTitle,
          scopeText: dance.scopeText,
          actionLabel: record.type === "learning" ? "新学" as const : "复习" as const,
          practicedAt: record.practicedAt,
        };
      })
      .filter((record): record is PracticeRecordView => Boolean(record))
      .sort((left, right) => right.practicedAt.localeCompare(left.practicedAt)),
  );

  const dueDances = computed(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return dances.value
      .filter((dance) => dance.state === "reviewing" && dance.nextReviewAt && new Date(dance.nextReviewAt) <= today)
      .sort((left, right) => {
        if (left.reviewRound !== right.reviewRound) return left.reviewRound - right.reviewRound;
        return String(left.nextReviewAt).localeCompare(String(right.nextReviewAt));
      });
  });

  const masteredDances = computed(() => dances.value.filter((dance) => dance.state === "mastered"));

  const addLearningRecord = (dance: Dance, practicedAt: string) => {
    practiceRecords.value.push({
      id: nextUniqueId("record", practiceRecords.value.map((record) => record.id)),
      danceId: dance.id,
      artistId: dance.artistId,
      type: "learning",
      practicedAt,
      reviewRound: null,
      createdAt: new Date().toISOString(),
    });
  };

  const addDance = (input: AddDanceInput): AddDanceResult => {
    const title = input.songTitle.trim();
    const scopeText = input.scopeText.trim();
    if (!title) throw new DanceValidationError("song-title");
    if (!scopeText) throw new DanceValidationError("scope");
    const practicedAt = localDateIso(input.learnedDate || todayText());
    if ((input.learnedDate || todayText()) > todayText()) throw new DanceValidationError("future-date");

    let artist = input.artistId ? artists.value.find((item) => item.id === input.artistId) : undefined;
    if (!artist) {
      if (!input.artistName.trim()) throw new DanceValidationError("artist-name");
      artist = artists.value.find((item) => normalize(item.name) === normalize(input.artistName));
      if (!artist) {
        if (!input.artistImageUrl) throw new DanceValidationError("artist-image");
        const nowIso = new Date().toISOString();
        artist = {
          id: nextUniqueId("artist", artists.value.map((item) => item.id)),
          name: input.artistName.trim(),
          imageUrl: input.artistImageUrl,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        artists.value.push(artist);
      }
    }

    const duplicate = dances.value.find(
      (dance) => dance.artistId === artist!.id && normalize(dance.songTitle) === normalize(title),
    );
    if (duplicate) {
      if (duplicate.scopeType === input.scopeType && normalize(duplicate.scopeText) === normalize(scopeText)) {
        throw new DanceValidationError("duplicate-unchanged");
      }
      duplicate.scopeType = input.scopeType;
      duplicate.scopeText = scopeText;
      duplicate.sourceType = "new";
      duplicate.state = "reviewing";
      duplicate.reviewRound = 0;
      duplicate.learnedAt = practicedAt;
      duplicate.lastReviewAt = null;
      duplicate.nextReviewAt = addDays(practicedAt, 1);
      duplicate.updatedAt = new Date().toISOString();
      addLearningRecord(duplicate, practicedAt);
      persist();
      return "scope-updated";
    }

    const nowIso = new Date().toISOString();
    const dance: Dance = {
      id: nextUniqueId("dance", dances.value.map((item) => item.id)),
      artistId: artist.id,
      songTitle: title,
      scopeType: input.scopeType,
      scopeText,
      sourceType: input.sourceType,
      state: input.sourceType === "new" ? "reviewing" : "mastered",
      reviewRound: input.sourceType === "new" ? 0 : 4,
      learnedAt: input.sourceType === "new" ? practicedAt : null,
      lastReviewAt: null,
      nextReviewAt: input.sourceType === "new" ? addDays(practicedAt, 1) : null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    dances.value.push(dance);
    if (input.sourceType === "new") addLearningRecord(dance, practicedAt);
    persist();
    return "created";
  };

  const recordReview = (danceId: string) => {
    const dance = dances.value.find((item) => item.id === danceId);
    if (!dance) return;
    const practicedAt = new Date().toISOString();
    const nextRound = dance.state === "reviewing"
      ? Math.min(4, dance.reviewRound + 1) as 1 | 2 | 3 | 4
      : 4;
    practiceRecords.value.push({
      id: nextUniqueId("record", practiceRecords.value.map((record) => record.id)),
      danceId: dance.id,
      artistId: dance.artistId,
      type: "review",
      practicedAt,
      reviewRound: nextRound,
      createdAt: practicedAt,
    });
    dance.lastReviewAt = practicedAt;
    dance.reviewRound = nextRound;
    if (nextRound === 4) {
      dance.state = "mastered";
      dance.nextReviewAt = null;
    } else {
      dance.nextReviewAt = addDays(practicedAt, REVIEW_INTERVALS[nextRound]);
    }
    dance.updatedAt = practicedAt;
    persist();
  };

  const updateDanceScope = (danceId: string, scopeType: ScopeType, scopeTextValue: string): UpdateScopeResult => {
    const dance = dances.value.find((item) => item.id === danceId);
    const scopeText = scopeTextValue.trim();
    if (!dance || !scopeText) throw new DanceValidationError("scope");
    if (dance.scopeType === scopeType && normalize(dance.scopeText) === normalize(scopeText)) return "unchanged";

    const rank: Record<Exclude<ScopeType, "custom">, number> = { chorus: 1, half: 2, full: 3 };
    let expanded = false;
    if (scopeType === "custom") {
      expanded = scopeText.length > dance.scopeText.trim().length;
    } else if (dance.scopeType === "custom") {
      expanded = scopeType === "full";
    } else {
      expanded = rank[scopeType] > rank[dance.scopeType];
    }

    dance.scopeType = scopeType;
    dance.scopeText = scopeText;
    dance.updatedAt = new Date().toISOString();
    if (expanded) {
      const learnedAt = localDateIso(todayText());
      dance.sourceType = "new";
      dance.state = "reviewing";
      dance.reviewRound = 0;
      dance.learnedAt = learnedAt;
      dance.lastReviewAt = null;
      dance.nextReviewAt = addDays(learnedAt, 1);
      addLearningRecord(dance, learnedAt);
    }
    persist();
    return expanded ? "reset" : "updated";
  };

  const deleteDance = (danceId: string) => {
    const exists = dances.value.some((dance) => dance.id === danceId);
    if (!exists) return false;
    dances.value = dances.value.filter((dance) => dance.id !== danceId);
    practiceRecords.value = practiceRecords.value.filter((record) => record.danceId !== danceId);
    persist();
    return true;
  };

  const deleteArtist = (artistId: string) => {
    const exists = artists.value.some((artist) => artist.id === artistId);
    if (!exists) return false;
    const danceIds = new Set(dances.value.filter((dance) => dance.artistId === artistId).map((dance) => dance.id));
    artists.value = artists.value.filter((artist) => artist.id !== artistId);
    dances.value = dances.value.filter((dance) => dance.artistId !== artistId);
    practiceRecords.value = practiceRecords.value.filter(
      (record) => record.artistId !== artistId && !danceIds.has(record.danceId),
    );
    persist();
    return true;
  };

  return {
    artists,
    dances,
    practiceRecords,
    artistSummaries,
    practiceRecordViews,
    dueDances,
    masteredDances,
    initialize,
    addDance,
    recordReview,
    updateDanceScope,
    deleteDance,
    deleteArtist,
  };
});
