import type { Artist } from "@/domain/models/artist";
import type { Dance, DanceState } from "@/domain/models/dance";
import type { PracticeRecord } from "@/domain/models/practice-record";

const now = new Date();
const atNoon = (daysAgo: number) => {
  const value = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, 12);
  return value.toISOString();
};

const artists: Array<[string, string]> = [
  ["artist-newjeans", "NewJeans"],
  ["artist-aespa", "aespa"],
  ["artist-illit", "ILLIT"],
  ["artist-lesserafim", "LE SSERAFIM"],
];

export const seedArtists: Artist[] = artists.map(([id, name], index) => ({
  id,
  name,
  imageUrl: "",
  createdAt: atNoon(30 - index),
  updatedAt: atNoon(index),
}));

type DanceSeed = [string, string, string, DanceState, 0 | 1 | 2 | 3 | 4, number | null, string];

const danceSeeds: DanceSeed[] = [
  ["super-shy", "artist-newjeans", "Super Shy", "reviewing", 0, 8, "副歌"],
  ["eta", "artist-newjeans", "ETA", "mastered", 4, null, "全曲"],
  ["how-sweet", "artist-newjeans", "How Sweet", "reviewing", 1, 6, "00:48–01:26"],
  ["attention", "artist-newjeans", "Attention", "mastered", 4, null, "副歌"],
  ["ditto", "artist-newjeans", "Ditto", "mastered", 4, null, "半曲"],
  ["omg", "artist-newjeans", "OMG", "reviewing", 0, 0, "副歌"],
  ["drama", "artist-aespa", "Drama", "reviewing", 1, 7, "全曲"],
  ["supernova", "artist-aespa", "Supernova", "mastered", 4, null, "副歌"],
  ["whiplash", "artist-aespa", "Whiplash", "mastered", 4, null, "全曲"],
  ["armageddon", "artist-aespa", "Armageddon", "mastered", 4, null, "半曲"],
  ["magnetic", "artist-illit", "Magnetic", "reviewing", 0, 0, "00:36–01:12"],
  ["cherish", "artist-illit", "Cherish", "mastered", 4, null, "副歌"],
  ["tick-tack", "artist-illit", "Tick-Tack", "mastered", 4, null, "副歌"],
  ["smart", "artist-lesserafim", "Smart", "mastered", 4, null, "00:52–01:30"],
  ["easy", "artist-lesserafim", "Easy", "mastered", 4, null, "全曲"],
  ["crazy", "artist-lesserafim", "CRAZY", "reviewing", 2, 9, "副歌"],
  ["antifragile", "artist-lesserafim", "ANTIFRAGILE", "mastered", 4, null, "全曲"],
  ["perfect-night", "artist-lesserafim", "Perfect Night", "mastered", 4, null, "副歌"],
];

export const seedDances: Dance[] = danceSeeds.map(
  ([id, artistId, songTitle, state, reviewRound, daysAgo, scopeText]) => {
    const learnedAt = daysAgo === null ? null : atNoon(daysAgo);
    const nextReviewAt = state === "reviewing"
      ? atNoon(Math.max(0, (daysAgo ?? 0) - (reviewRound === 0 ? 1 : 3)))
      : null;
    return {
      id: `dance-${id}`,
      artistId,
      songTitle,
      scopeType: scopeText === "全曲" ? "full" : scopeText === "半曲" ? "half" : scopeText === "副歌" ? "chorus" : "custom",
      scopeText,
      sourceType: state === "mastered" ? "old" : "new",
      state,
      reviewRound,
      learnedAt,
      lastReviewAt: reviewRound > 0 && daysAgo !== null ? atNoon(Math.max(0, daysAgo - 1)) : null,
      nextReviewAt,
      createdAt: learnedAt ?? atNoon(25),
      updatedAt: learnedAt ?? atNoon(25),
    };
  },
);

const recordSeeds: Array<[string, string, string, "learning" | "review", number, 0 | 1 | 2 | 3 | 4 | null]> = [
  ["record-magnetic", "dance-magnetic", "artist-illit", "learning", 0, null],
  ["record-eta", "dance-eta", "artist-newjeans", "review", 0, 4],
  ["record-drama", "dance-drama", "artist-aespa", "review", 1, 1],
  ["record-smart", "dance-smart", "artist-lesserafim", "learning", 1, null],
  ["record-super-shy", "dance-super-shy", "artist-newjeans", "learning", 8, null],
  ["record-how-sweet", "dance-how-sweet", "artist-newjeans", "learning", 6, null],
  ["record-crazy-learning", "dance-crazy", "artist-lesserafim", "learning", 9, null],
  ["record-crazy-review", "dance-crazy", "artist-lesserafim", "review", 3, 2],
];

export const seedPracticeRecords: PracticeRecord[] = recordSeeds.map(
  ([id, danceId, artistId, type, daysAgo, reviewRound]) => ({
    id,
    danceId,
    artistId,
    type,
    practicedAt: atNoon(daysAgo),
    reviewRound,
    createdAt: atNoon(daysAgo),
  }),
);
