import type { StoredAsset } from "@/repositories/assetRepository";

const MAGIC = "IDOL-DANCE-BACKUP-V1\n";
const HEADER_LENGTH_WIDTH = 12;

export interface BackupHeader<T> {
  format: "idol-dance-backup";
  version: 1;
  createdAt: string;
  data: T;
  assets: Array<{
    id: string;
    kind: StoredAsset["kind"];
    type: string;
    size: number;
    createdAt: string;
  }>;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const createBackupFile = <T>(data: T, assets: StoredAsset[]) => {
  const header: BackupHeader<T> = {
    format: "idol-dance-backup",
    version: 1,
    createdAt: new Date().toISOString(),
    data,
    assets: assets.map((asset) => ({
      id: asset.id,
      kind: asset.kind,
      type: asset.blob.type || "application/octet-stream",
      size: asset.blob.size,
      createdAt: asset.createdAt,
    })),
  };
  const headerBytes = encoder.encode(JSON.stringify(header));
  const lengthLine = `${String(headerBytes.byteLength).padStart(HEADER_LENGTH_WIDTH, "0")}\n`;
  const blob = new Blob(
    [MAGIC, lengthLine, headerBytes, ...assets.map((asset) => asset.blob)],
    { type: "application/x-idol-dance-backup" },
  );
  const date = new Date().toISOString().slice(0, 10);
  return { blob, filename: `idol-dance-backup-${date}.idoldance` };
};

export const readBackupFile = async <T>(file: Blob) => {
  const prefixLength = encoder.encode(MAGIC).byteLength + HEADER_LENGTH_WIDTH + 1;
  const prefix = decoder.decode(await file.slice(0, prefixLength).arrayBuffer());
  if (!prefix.startsWith(MAGIC)) throw new Error("invalid-backup");
  const lengthText = prefix.slice(MAGIC.length, MAGIC.length + HEADER_LENGTH_WIDTH);
  const headerLength = Number(lengthText);
  if (!Number.isFinite(headerLength) || headerLength <= 0 || headerLength > 20_000_000) {
    throw new Error("invalid-backup-header");
  }
  const headerStart = prefixLength;
  const headerEnd = headerStart + headerLength;
  const header = JSON.parse(
    decoder.decode(await file.slice(headerStart, headerEnd).arrayBuffer()),
  ) as BackupHeader<T>;
  if (header.format !== "idol-dance-backup" || header.version !== 1 || !Array.isArray(header.assets)) {
    throw new Error("unsupported-backup");
  }

  let offset = headerEnd;
  const assets: StoredAsset[] = header.assets.map((entry) => {
    const end = offset + entry.size;
    if (end > file.size) throw new Error("incomplete-backup");
    const blob = file.slice(offset, end, entry.type);
    offset = end;
    return {
      id: entry.id,
      kind: entry.kind,
      blob,
      createdAt: entry.createdAt,
    };
  });
  return { data: header.data, assets, createdAt: header.createdAt };
};
