import type {
  CloudBootstrapResult,
  CloudEntityKind,
  FamilyScopedRecord,
  GuestMigrationDecision,
  GuestMigrationRecord,
} from "@/lib/cloud/schema";

export type BootstrapIdentityInput = {
  userId: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

export type ListRecordsInput = {
  familySpaceId: string;
  kind?: CloudEntityKind;
};

export type UpsertRecordInput<TData = unknown> = {
  familySpaceId: string;
  kind: CloudEntityKind;
  recordId: string;
  data: TData;
};

export type GuestMigrationInput = {
  userId: string;
  familySpaceId: string;
  decision: GuestMigrationDecision;
  records: Array<Pick<FamilyScopedRecord, "id" | "kind" | "data">>;
};

export interface NestlyCloudRepository {
  bootstrapIdentity(
    input: BootstrapIdentityInput
  ): Promise<CloudBootstrapResult>;
  listRecords<TData = unknown>(
    input: ListRecordsInput
  ): Promise<Array<FamilyScopedRecord<TData>>>;
  upsertRecord<TData = unknown>(
    input: UpsertRecordInput<TData>
  ): Promise<FamilyScopedRecord<TData>>;
  markRecordDeleted(input: {
    familySpaceId: string;
    recordId: string;
  }): Promise<void>;
  migrateGuestRecords(
    input: GuestMigrationInput
  ): Promise<GuestMigrationRecord>;
}
