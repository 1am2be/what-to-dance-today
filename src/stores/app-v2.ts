import { computed, ref } from "vue";
import { defineStore } from "pinia";
import defaultBackgroundUrl from "@/assets/idol-dance-default-background.png";
import { seedArtists, seedDances, seedPracticeRecords } from "@/data/seed";
import { defaultAppSettings, type AppSettings } from "@/domain/models/app-settings";
import type { Artist, ArtistSummary } from "@/domain/models/artist";
import type { AudioTrack } from "@/domain/models/audio-track";
import type { Dance, DanceSource, ScopeType } from "@/domain/models/dance";
import type { PracticeRecord, PracticeRecordView } from "@/domain/models/practice-record";
import { assetRepository, dataUrlToBlob, type AssetKind, type StoredAsset } from "@/repositories/assetRepository";
import { createBackupFile, readBackupFile } from "@/services/backup";

const STORAGE_KEY_V1 = "idol-dance-data-v1";
const STORAGE_KEY_V2 = "idol-dance-data-v2";
const REVIEW_INTERVALS = [1, 3, 7, 14] as const;
export const MAX_AUDIO_FILE_SIZE = 100 * 1024 * 1024;
export const MAX_TOTAL_AUDIO_SIZE = 1024 * 1024 * 1024;
const LEGACY_TEST_ARTIST_IDS = new Set([
  "artist-newjeans",
  "artist-aespa",
  "artist-illit",
  "artist-lesserafim",
]);
const LEGACY_TEST_DANCE_IDS = new Set([
  "dance-super-shy",
  "dance-eta",
  "dance-how-sweet",
  "dance-attention",
  "dance-ditto",
  "dance-omg",
  "dance-drama",
  "dance-supernova",
  "dance-whiplash",
  "dance-armageddon",
  "dance-magnetic",
  "dance-cherish",
  "dance-tick-tack",
  "dance-smart",
  "dance-easy",
  "dance-crazy",
  "dance-antifragile",
  "dance-perfect-night",
]);

export type PersistedDataV2 = {
  schemaVersion: 2;
  artists: Artist[];
  dances: Dance[];
  practiceRecords: PracticeRecord[];
  audioTracks: AudioTrack[];
  settings: AppSettings;
};

type PersistedDataV1 = {
  artists: Array<Partial<Artist> & Pick<Artist, "id" | "name" | "imageUrl" | "createdAt" | "updatedAt">>;
  dances: Array<Partial<Dance> & Omit<Dance, "sortOrder">>;
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

export type AddDanceResult = { status: "created" | "scope-updated"; danceId: string };
export type UpdateScopeResult = "unchanged" | "updated" | "reset";

export class DanceValidationError extends Error {
  constructor(public code:
    | "artist-name"
    | "artist-image"
    | "artist-duplicate"
    | "song-title"
    | "scope"
    | "future-date"
    | "duplicate-unchanged") {
    super(code);
  }
}

export class AudioStorageError extends Error {
  constructor(public code: "file-too-large" | "total-too-large" | "storage-full" | "invalid-audio") {
    super(code);
  }
}

export interface AudioUploadInput {
  blob: Blob;
  name: string;
  mimeType: string;
  duration: number | null;
}

const cloneSeed = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
const isPersistedData = (value: unknown): value is PersistedDataV1 => {
  const data = value as PersistedDataV1 | undefined;
  return Boolean(data && Array.isArray(data.artists) && Array.isArray(data.dances) && Array.isArray(data.practiceRecords));
};

export const useAppStore = defineStore("app-v2", () => {
  const artists = ref<Artist[]>([]);
  const dances = ref<Dance[]>([]);
  const practiceRecords = ref<PracticeRecord[]>([]);
  const audioTracks = ref<AudioTrack[]>([]);
  const settings = ref<AppSettings>(defaultAppSettings());
  const assetUrls = ref<Record<string, string>>({});
  const initialized = ref(false);
  let initializingPromise: Promise<void> | null = null;

  const nextUniqueId = (prefix: string, usedIds: string[]) => {
    let id = makeId(prefix);
    while (usedIds.includes(id)) id = makeId(prefix);
    return id;
  };

  const normalizedArtists = (items: PersistedDataV1["artists"]): Artist[] => items.map((artist, index) => ({
    id: artist.id,
    name: artist.name.trim(),
    imageUrl: artist.imageUrl || "",
    imageAssetId: artist.imageAssetId ?? null,
    sortOrder: Number.isFinite(artist.sortOrder) ? Number(artist.sortOrder) : index,
    createdAt: artist.createdAt,
    updatedAt: artist.updatedAt,
  }));

  const normalizedDances = (items: PersistedDataV1["dances"]): Dance[] => {
    const orderByArtist = new Map<string, number>();
    return items.map((dance) => {
      const fallbackOrder = orderByArtist.get(dance.artistId) ?? 0;
      orderByArtist.set(dance.artistId, fallbackOrder + 1);
      return {
        ...dance,
        sortOrder: Number.isFinite(dance.sortOrder) ? Number(dance.sortOrder) : fallbackOrder,
      } as Dance;
    });
  };

  const revokeAssetUrls = () => {
    if (typeof URL === "undefined") return;
    Object.values(assetUrls.value).forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    });
    assetUrls.value = {};
  };

  const setRuntimeAssetUrl = (asset: StoredAsset) => {
    if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return "";
    const current = assetUrls.value[asset.id];
    if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
    const url = URL.createObjectURL(asset.blob);
    assetUrls.value = { ...assetUrls.value, [asset.id]: url };
    return url;
  };

  const refreshAssetUrls = async () => {
    revokeAssetUrls();
    const assets = await assetRepository.list();
    assets.forEach(setRuntimeAssetUrl);
    artists.value.forEach((artist) => {
      if (artist.imageAssetId && assetUrls.value[artist.imageAssetId]) {
        artist.imageUrl = assetUrls.value[artist.imageAssetId];
      }
    });
  };

  const storeAssetFromSource = async (source: string, kind: AssetKind) => {
    const blob = await dataUrlToBlob(source);
    const existingAssets = await assetRepository.list();
    const asset: StoredAsset = {
      id: nextUniqueId("asset", existingAssets.map((item) => item.id)),
      kind,
      blob,
      createdAt: new Date().toISOString(),
    };
    await assetRepository.put(asset);
    setRuntimeAssetUrl(asset);
    return asset;
  };

  const removeAsset = async (id: string | null) => {
    if (!id) return;
    const current = assetUrls.value[id];
    if (current?.startsWith("blob:") && typeof URL !== "undefined") URL.revokeObjectURL(current);
    const next = { ...assetUrls.value };
    delete next[id];
    assetUrls.value = next;
    await assetRepository.remove(id);
  };

  const removeLegacyTestData = async () => {
    const hasLegacyData = dances.value.some((dance) => LEGACY_TEST_DANCE_IDS.has(dance.id))
      || artists.value.some((artist) => LEGACY_TEST_ARTIST_IDS.has(artist.id));
    if (!hasLegacyData) return;

    const legacyTracks = audioTracks.value.filter((track) => LEGACY_TEST_DANCE_IDS.has(track.danceId));
    await Promise.all(legacyTracks.map((track) => removeAsset(track.assetId)));
    audioTracks.value = audioTracks.value.filter((track) => !LEGACY_TEST_DANCE_IDS.has(track.danceId));
    practiceRecords.value = practiceRecords.value.filter((record) => !LEGACY_TEST_DANCE_IDS.has(record.danceId));
    dances.value = dances.value.filter((dance) => !LEGACY_TEST_DANCE_IDS.has(dance.id));

    const remainingArtistIds = new Set(dances.value.map((dance) => dance.artistId));
    const removableArtists = artists.value.filter(
      (artist) => LEGACY_TEST_ARTIST_IDS.has(artist.id) && !remainingArtistIds.has(artist.id),
    );
    await Promise.all(removableArtists.map((artist) => removeAsset(artist.imageAssetId)));
    const removableArtistIds = new Set(removableArtists.map((artist) => artist.id));
    artists.value = artists.value
      .filter((artist) => !removableArtistIds.has(artist.id))
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((artist, index) => ({ ...artist, sortOrder: index }));
  };

  const enforceArtistUniqueness = async () => {
    const artistsByName = new Map<string, Artist>();
    const remappedArtistIds = new Map<string, string>();
    const usedIds: string[] = [];
    const uniqueArtists: Artist[] = [];

    for (const artist of [...artists.value].sort((a, b) => a.sortOrder - b.sortOrder)) {
      const nameKey = normalize(artist.name);
      const sameName = artistsByName.get(nameKey);
      if (sameName) {
        remappedArtistIds.set(artist.id, sameName.id);
        if (!sameName.imageAssetId && artist.imageAssetId) sameName.imageAssetId = artist.imageAssetId;
        else if (artist.imageAssetId && artist.imageAssetId !== sameName.imageAssetId) await removeAsset(artist.imageAssetId);
        continue;
      }
      const uniqueArtist = usedIds.includes(artist.id)
        ? { ...artist, id: nextUniqueId("artist", usedIds) }
        : artist;
      usedIds.push(uniqueArtist.id);
      artistsByName.set(nameKey, uniqueArtist);
      uniqueArtists.push(uniqueArtist);
    }

    if (remappedArtistIds.size) {
      dances.value.forEach((dance) => { dance.artistId = remappedArtistIds.get(dance.artistId) ?? dance.artistId; });
      practiceRecords.value.forEach((record) => { record.artistId = remappedArtistIds.get(record.artistId) ?? record.artistId; });
    }
    artists.value = uniqueArtists.map((artist, index) => ({ ...artist, sortOrder: index }));
  };

  const snapshot = (): PersistedDataV2 => ({
    schemaVersion: 2,
    artists: artists.value.map((artist) => ({
      ...artist,
      imageUrl: artist.imageUrl.startsWith("blob:") ? "" : artist.imageUrl,
    })),
    dances: dances.value,
    practiceRecords: practiceRecords.value,
    audioTracks: audioTracks.value,
    settings: settings.value,
  });

  const persist = () => uni.setStorageSync(STORAGE_KEY_V2, snapshot());

  const migrateLegacyImages = async () => {
    for (const artist of artists.value) {
      if (artist.imageAssetId || !artist.imageUrl) continue;
      try {
        const asset = await storeAssetFromSource(artist.imageUrl, "artist-image");
        artist.imageAssetId = asset.id;
        artist.imageUrl = assetUrls.value[asset.id] || artist.imageUrl;
      } catch {
        // Keep the legacy image URL if this runtime cannot create a Blob.
      }
    }
  };

  const loadPersistedData = async () => {
    const savedV2 = uni.getStorageSync(STORAGE_KEY_V2) as PersistedDataV2 | "";
    if (savedV2 && savedV2.schemaVersion === 2 && isPersistedData(savedV2)) {
      artists.value = normalizedArtists(savedV2.artists);
      dances.value = normalizedDances(savedV2.dances);
      practiceRecords.value = savedV2.practiceRecords;
      audioTracks.value = Array.isArray(savedV2.audioTracks) ? savedV2.audioTracks : [];
      settings.value = savedV2.settings ?? defaultAppSettings();
    } else {
      const savedV1 = uni.getStorageSync(STORAGE_KEY_V1) as PersistedDataV1 | "";
      if (isPersistedData(savedV1)) {
        artists.value = normalizedArtists(savedV1.artists);
        dances.value = normalizedDances(savedV1.dances);
        practiceRecords.value = savedV1.practiceRecords;
      } else {
        artists.value = cloneSeed(seedArtists);
        dances.value = cloneSeed(seedDances);
        practiceRecords.value = cloneSeed(seedPracticeRecords);
      }
      audioTracks.value = [];
      settings.value = defaultAppSettings();
      await migrateLegacyImages();
    }
    await removeLegacyTestData();
    await enforceArtistUniqueness();
    await refreshAssetUrls();
    persist();
  };

  const initialize = () => {
    if (initialized.value) return Promise.resolve();
    if (initializingPromise) return initializingPromise;
    initializingPromise = loadPersistedData()
      .then(() => { initialized.value = true; })
      .finally(() => { initializingPromise = null; });
    return initializingPromise;
  };

  const artistSummaries = computed<ArtistSummary[]>(() =>
    [...artists.value]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((artist, index) => ({
        ...artist,
        imageUrl: artist.imageAssetId ? assetUrls.value[artist.imageAssetId] || artist.imageUrl : artist.imageUrl,
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
          artistImageUrl: artist.imageAssetId ? assetUrls.value[artist.imageAssetId] || artist.imageUrl : artist.imageUrl,
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
  const totalAudioBytes = computed(() => audioTracks.value.reduce((total, track) => total + track.fileSize, 0));
  const backgroundUrl = computed(() => settings.value.backgroundAssetId
    ? assetUrls.value[settings.value.backgroundAssetId] || defaultBackgroundUrl
    : defaultBackgroundUrl);

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

  const addDance = async (input: AddDanceInput): Promise<AddDanceResult> => {
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
        const imageAsset = await storeAssetFromSource(input.artistImageUrl, "artist-image");
        const nowIso = new Date().toISOString();
        artist = {
          id: nextUniqueId("artist", artists.value.map((item) => item.id)),
          name: input.artistName.trim(),
          imageUrl: assetUrls.value[imageAsset.id] || input.artistImageUrl,
          imageAssetId: imageAsset.id,
          sortOrder: artists.value.length,
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
      return { status: "scope-updated", danceId: duplicate.id };
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
      sortOrder: dances.value.filter((item) => item.artistId === artist!.id).length,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    dances.value.push(dance);
    if (input.sourceType === "new") addLearningRecord(dance, practicedAt);
    persist();
    return { status: "created", danceId: dance.id };
  };

  const recordReview = (danceId: string) => {
    const dance = dances.value.find((item) => item.id === danceId);
    if (!dance) return;
    const practicedAt = new Date().toISOString();
    const nextRound = dance.state === "reviewing" ? Math.min(4, dance.reviewRound + 1) as 1 | 2 | 3 | 4 : 4;
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
    } else dance.nextReviewAt = addDays(practicedAt, REVIEW_INTERVALS[nextRound]);
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
    if (scopeType === "custom") expanded = scopeText.length > dance.scopeText.trim().length;
    else if (dance.scopeType === "custom") expanded = scopeType === "full";
    else expanded = rank[scopeType] > rank[dance.scopeType];
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

  const renameArtist = (artistId: string, nextName: string) => {
    const name = nextName.trim();
    if (!name) throw new DanceValidationError("artist-name");
    if (artists.value.some((artist) => artist.id !== artistId && normalize(artist.name) === normalize(name))) {
      throw new DanceValidationError("artist-duplicate");
    }
    const artist = artists.value.find((item) => item.id === artistId);
    if (!artist) return false;
    artist.name = name;
    artist.updatedAt = new Date().toISOString();
    persist();
    return true;
  };

  const updateArtistImage = async (artistId: string, imageUrl: string) => {
    const artist = artists.value.find((item) => item.id === artistId);
    if (!artist || !imageUrl) return false;
    const previousAssetId = artist.imageAssetId;
    const imageAsset = await storeAssetFromSource(imageUrl, "artist-image");
    artist.imageAssetId = imageAsset.id;
    artist.imageUrl = assetUrls.value[imageAsset.id] || imageUrl;
    artist.updatedAt = new Date().toISOString();
    if (previousAssetId) await removeAsset(previousAssetId);
    persist();
    return true;
  };

  const reorderArtists = (ids: string[]) => {
    const order = new Map(ids.map((id, index) => [id, index]));
    artists.value.forEach((artist) => {
      artist.sortOrder = order.get(artist.id) ?? artist.sortOrder;
      artist.updatedAt = new Date().toISOString();
    });
    persist();
  };

  const reorderDances = (artistId: string, ids: string[]) => {
    const order = new Map(ids.map((id, index) => [id, index]));
    dances.value.filter((dance) => dance.artistId === artistId).forEach((dance) => {
      dance.sortOrder = order.get(dance.id) ?? dance.sortOrder;
      dance.updatedAt = new Date().toISOString();
    });
    persist();
  };

  const deleteDance = async (danceId: string) => {
    if (!dances.value.some((dance) => dance.id === danceId)) return false;
    const tracks = audioTracks.value.filter((track) => track.danceId === danceId);
    await Promise.all(tracks.map((track) => removeAsset(track.assetId)));
    audioTracks.value = audioTracks.value.filter((track) => track.danceId !== danceId);
    dances.value = dances.value.filter((dance) => dance.id !== danceId);
    practiceRecords.value = practiceRecords.value.filter((record) => record.danceId !== danceId);
    persist();
    return true;
  };

  const deleteArtist = async (artistId: string) => {
    const artist = artists.value.find((item) => item.id === artistId);
    if (!artist) return false;
    const danceIds = new Set(dances.value.filter((dance) => dance.artistId === artistId).map((dance) => dance.id));
    const tracks = audioTracks.value.filter((track) => danceIds.has(track.danceId));
    await Promise.all(tracks.map((track) => removeAsset(track.assetId)));
    await removeAsset(artist.imageAssetId);
    artists.value = artists.value.filter((item) => item.id !== artistId);
    dances.value = dances.value.filter((dance) => dance.artistId !== artistId);
    audioTracks.value = audioTracks.value.filter((track) => !danceIds.has(track.danceId));
    practiceRecords.value = practiceRecords.value.filter(
      (record) => record.artistId !== artistId && !danceIds.has(record.danceId),
    );
    artists.value.sort((a, b) => a.sortOrder - b.sortOrder).forEach((item, index) => { item.sortOrder = index; });
    persist();
    return true;
  };

  const updateBackground = async (sourceUrl: string, positionX = 50, positionY = 50) => {
    const previousAssetId = settings.value.backgroundAssetId;
    const asset = await storeAssetFromSource(sourceUrl, "background");
    settings.value = {
      backgroundAssetId: asset.id,
      backgroundPositionX: Math.max(0, Math.min(100, positionX)),
      backgroundPositionY: Math.max(0, Math.min(100, positionY)),
      updatedAt: new Date().toISOString(),
    };
    if (previousAssetId) await removeAsset(previousAssetId);
    persist();
  };

  const resetBackground = async () => {
    const previousAssetId = settings.value.backgroundAssetId;
    settings.value = defaultAppSettings();
    if (previousAssetId) await removeAsset(previousAssetId);
    persist();
  };

  const ensureStorageCapacity = async (newBytes: number) => {
    if (newBytes > MAX_AUDIO_FILE_SIZE) throw new AudioStorageError("file-too-large");
    if (totalAudioBytes.value + newBytes > MAX_TOTAL_AUDIO_SIZE) throw new AudioStorageError("total-too-large");
    if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota && estimate.usage && estimate.usage + newBytes > estimate.quota * 0.94) {
        throw new AudioStorageError("storage-full");
      }
      await navigator.storage.persist?.();
    }
  };

  const addAudioTracks = async (danceId: string, inputs: AudioUploadInput[]) => {
    if (!inputs.length || !dances.value.some((dance) => dance.id === danceId)) throw new AudioStorageError("invalid-audio");
    const totalNewBytes = inputs.reduce((total, item) => total + item.blob.size, 0);
    for (const input of inputs) {
      if (!input.blob.size || input.blob.size > MAX_AUDIO_FILE_SIZE) {
        throw new AudioStorageError(input.blob.size > MAX_AUDIO_FILE_SIZE ? "file-too-large" : "invalid-audio");
      }
    }
    if (totalAudioBytes.value + totalNewBytes > MAX_TOTAL_AUDIO_SIZE) throw new AudioStorageError("total-too-large");
    await ensureStorageCapacity(Math.max(...inputs.map((item) => item.blob.size)));
    const existingCount = audioTracks.value.filter((track) => track.danceId === danceId).length;
    const created: AudioTrack[] = [];
    for (const [index, input] of inputs.entries()) {
      const existingAssets = await assetRepository.list();
      const asset: StoredAsset = {
        id: nextUniqueId("audio-asset", existingAssets.map((item) => item.id)),
        kind: "audio",
        blob: input.blob,
        createdAt: new Date().toISOString(),
      };
      await assetRepository.put(asset);
      setRuntimeAssetUrl(asset);
      const now = new Date().toISOString();
      const track: AudioTrack = {
        id: nextUniqueId("audio", audioTracks.value.map((item) => item.id)),
        danceId,
        assetId: asset.id,
        displayName: input.name.trim() || "练舞音乐",
        mimeType: input.mimeType || "audio/mpeg",
        fileSize: input.blob.size,
        duration: input.duration,
        sortOrder: existingCount + index,
        createdAt: now,
        updatedAt: now,
      };
      audioTracks.value.push(track);
      created.push(track);
    }
    persist();
    return created;
  };

  const renameAudioTrack = (trackId: string, nameValue: string) => {
    const track = audioTracks.value.find((item) => item.id === trackId);
    const name = nameValue.trim();
    if (!track || !name) return false;
    track.displayName = name;
    track.updatedAt = new Date().toISOString();
    persist();
    return true;
  };

  const deleteAudioTrack = async (trackId: string) => {
    const track = audioTracks.value.find((item) => item.id === trackId);
    if (!track) return false;
    await removeAsset(track.assetId);
    audioTracks.value = audioTracks.value.filter((item) => item.id !== trackId);
    persist();
    return true;
  };

  const audioUrl = (assetId: string) => assetUrls.value[assetId] || "";
  const tracksForDance = (danceId: string) => audioTracks.value
    .filter((track) => track.danceId === danceId)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  const exportBackup = async () => createBackupFile(snapshot(), await assetRepository.list());

  const restoreBackup = async (file: Blob) => {
    const { data, assets } = await readBackupFile<PersistedDataV2>(file);
    if (!data || data.schemaVersion !== 2 || !isPersistedData(data)) throw new Error("invalid-backup-data");
    revokeAssetUrls();
    await assetRepository.replaceAll(assets);
    artists.value = normalizedArtists(data.artists);
    dances.value = normalizedDances(data.dances);
    practiceRecords.value = data.practiceRecords;
    audioTracks.value = Array.isArray(data.audioTracks) ? data.audioTracks : [];
    settings.value = data.settings ?? defaultAppSettings();
    await enforceArtistUniqueness();
    await refreshAssetUrls();
    persist();
  };

  return {
    artists,
    dances,
    practiceRecords,
    audioTracks,
    settings,
    initialized,
    artistSummaries,
    practiceRecordViews,
    dueDances,
    masteredDances,
    totalAudioBytes,
    backgroundUrl,
    initialize,
    addDance,
    recordReview,
    updateDanceScope,
    renameArtist,
    updateArtistImage,
    reorderArtists,
    reorderDances,
    deleteDance,
    deleteArtist,
    updateBackground,
    resetBackground,
    addAudioTracks,
    renameAudioTrack,
    deleteAudioTrack,
    audioUrl,
    tracksForDance,
    exportBackup,
    restoreBackup,
  };
});
