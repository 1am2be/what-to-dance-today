export interface AppSettings {
  backgroundAssetId: string | null;
  backgroundPositionX: number;
  backgroundPositionY: number;
  updatedAt: string;
}

export const defaultAppSettings = (): AppSettings => ({
  backgroundAssetId: null,
  backgroundPositionX: 50,
  backgroundPositionY: 50,
  updatedAt: new Date().toISOString(),
});
