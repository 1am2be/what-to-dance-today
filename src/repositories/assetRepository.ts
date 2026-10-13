export type AssetKind = "artist-image" | "background" | "audio";

export interface StoredAsset {
  id: string;
  kind: AssetKind;
  blob: Blob;
  createdAt: string;
}

const DATABASE_NAME = "idol-dance-assets-v2";
const DATABASE_VERSION = 1;
const STORE_NAME = "assets";
const fallbackAssets = new Map<string, StoredAsset>();

const requestResult = <T>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
});

let databasePromise: Promise<IDBDatabase> | null = null;

const openDatabase = () => {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open IndexedDB"));
  });
  return databasePromise;
};

const hasIndexedDb = () => typeof indexedDB !== "undefined";

const transactionStore = async (mode: IDBTransactionMode) => {
  const database = await openDatabase();
  return database.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
};

export const assetRepository = {
  async put(asset: StoredAsset) {
    if (!hasIndexedDb()) {
      fallbackAssets.set(asset.id, asset);
      return;
    }
    const store = await transactionStore("readwrite");
    await requestResult(store.put(asset));
  },

  async get(id: string) {
    if (!hasIndexedDb()) return fallbackAssets.get(id) ?? null;
    const store = await transactionStore("readonly");
    return (await requestResult(store.get(id)) as StoredAsset | undefined) ?? null;
  },

  async list() {
    if (!hasIndexedDb()) return [...fallbackAssets.values()];
    const store = await transactionStore("readonly");
    return await requestResult(store.getAll()) as StoredAsset[];
  },

  async remove(id: string) {
    if (!hasIndexedDb()) {
      fallbackAssets.delete(id);
      return;
    }
    const store = await transactionStore("readwrite");
    await requestResult(store.delete(id));
  },

  async replaceAll(assets: StoredAsset[]) {
    if (!hasIndexedDb()) {
      fallbackAssets.clear();
      assets.forEach((asset) => fallbackAssets.set(asset.id, asset));
      return;
    }
    const store = await transactionStore("readwrite");
    await requestResult(store.clear());
    for (const asset of assets) await requestResult(store.put(asset));
  },
};

export const dataUrlToBlob = async (value: string) => {
  const response = await fetch(value);
  return response.blob();
};
