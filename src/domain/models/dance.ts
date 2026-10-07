export type ScopeType = "full" | "half" | "chorus" | "custom";
export type DanceSource = "new" | "old";
export type DanceState = "reviewing" | "mastered";

export interface Dance {
  id: string;
  artistId: string;
  songTitle: string;
  scopeType: ScopeType;
  scopeText: string;
  sourceType: DanceSource;
  state: DanceState;
  reviewRound: 0 | 1 | 2 | 3 | 4;
  learnedAt: string | null;
  lastReviewAt: string | null;
  nextReviewAt: string | null;
  createdAt: string;
  updatedAt: string;
}
