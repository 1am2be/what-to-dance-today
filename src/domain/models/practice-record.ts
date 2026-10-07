export interface PracticeRecord {
  id: string;
  danceId: string;
  artistId: string;
  type: "learning" | "review";
  practicedAt: string;
  reviewRound: 0 | 1 | 2 | 3 | 4 | null;
  createdAt: string;
}

export interface PracticeRecordView {
  id: string;
  danceId: string;
  artistName: string;
  artistTone: "pink" | "blue";
  songTitle: string;
  scopeText: string;
  actionLabel: "新学" | "复习";
  practicedAt: string;
}
