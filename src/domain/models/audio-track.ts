export interface AudioTrack {
  id: string;
  danceId: string;
  assetId: string;
  displayName: string;
  mimeType: string;
  fileSize: number;
  duration: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
