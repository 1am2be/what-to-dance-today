import type { Artist } from "@/domain/models/artist";
import type { Dance } from "@/domain/models/dance";
import type { PracticeRecord } from "@/domain/models/practice-record";

export interface AppRepository {
  listArtists(): Promise<Artist[]>;
  listDances(): Promise<Dance[]>;
  listPracticeRecords(): Promise<PracticeRecord[]>;
}
