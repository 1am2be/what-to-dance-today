import type { ArtistSummary } from "@/domain/models/artist";
import type { PracticeRecordView } from "@/domain/models/practice-record";

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

const toIso = (value: Date) => value.toISOString();

export const demoArtists: ArtistSummary[] = [
  {
    id: "artist-newjeans",
    name: "NewJeans",
    imageUrl: "",
    danceCount: 6,
    artworkTone: "aqua",
    createdAt: toIso(today),
    updatedAt: toIso(today),
  },
  {
    id: "artist-aespa",
    name: "aespa",
    imageUrl: "",
    danceCount: 4,
    artworkTone: "silver",
    createdAt: toIso(today),
    updatedAt: toIso(today),
  },
  {
    id: "artist-illit",
    name: "ILLIT",
    imageUrl: "",
    danceCount: 3,
    artworkTone: "pearl",
    createdAt: toIso(today),
    updatedAt: toIso(today),
  },
  {
    id: "artist-lesserafim",
    name: "LE SSERAFIM",
    imageUrl: "",
    danceCount: 5,
    artworkTone: "mint",
    createdAt: toIso(today),
    updatedAt: toIso(today),
  },
];

export const demoPracticeRecords: PracticeRecordView[] = [
  {
    id: "record-magnetic",
    danceId: "dance-magnetic",
    artistName: "ILLIT",
    artistTone: "pink",
    songTitle: "Magnetic",
    scopeText: "00:36–01:12",
    actionLabel: "新学",
    practicedAt: toIso(today),
  },
  {
    id: "record-eta",
    danceId: "dance-eta",
    artistName: "NewJeans",
    artistTone: "blue",
    songTitle: "ETA",
    scopeText: "副歌",
    actionLabel: "复习",
    practicedAt: toIso(today),
  },
  {
    id: "record-drama",
    danceId: "dance-drama",
    artistName: "aespa",
    artistTone: "blue",
    songTitle: "Drama",
    scopeText: "全曲",
    actionLabel: "复习",
    practicedAt: toIso(yesterday),
  },
  {
    id: "record-smart",
    danceId: "dance-smart",
    artistName: "LE SSERAFIM",
    artistTone: "pink",
    songTitle: "Smart",
    scopeText: "00:52–01:30",
    actionLabel: "新学",
    practicedAt: toIso(yesterday),
  },
];
