export interface Artist {
  id: string;
  name: string;
  imageUrl: string;
  imageAssetId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ArtistSummary extends Artist {
  danceCount: number;
  artworkTone: "aqua" | "silver" | "pearl" | "mint";
}
