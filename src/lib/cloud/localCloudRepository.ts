import type {
  CloudBootstrapResult,
  CloudFamilySpace,
  CloudMembership,
  CloudUser,
  FamilyScopedRecord,
  GuestMigrationRecord,
} from "@/lib/cloud/schema";
import type {
  BootstrapIdentityInput,
  GuestMigrationInput,
  ListRecordsInput,
  NestlyCloudRepository,
  UpsertRecordInput,
} from "@/lib/cloud/repository";

const localCloudKey = "nestly-cloud-foundation";

type LocalCloudState = {
  users: CloudUser[];
  familySpaces: CloudFamilySpace[];
  memberships: CloudMembership[];
  records: FamilyScopedRecord[];
  migrations: GuestMigrationRecord[];
};

function getEmptyState(): LocalCloudState {
  return {
    users: [],
    familySpaces: [],
    memberships: [],
    records: [],
    migrations: [],
  };
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeId(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "_");
}

function readState(): LocalCloudState {
  if (typeof window === "undefined") {
    return getEmptyState();
  }

  const rawValue = window.localStorage.getItem(localCloudKey);

  if (!rawValue) {
    return getEmptyState();
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<LocalCloudState>;

    return {
      users: Array.isArray(parsedValue.users) ? parsedValue.users : [],
      familySpaces: Array.isArray(parsedValue.familySpaces)
        ? parsedValue.familySpaces
        : [],
      memberships: Array.isArray(parsedValue.memberships)
        ? parsedValue.memberships
        : [],
      records: Array.isArray(parsedValue.records) ? parsedValue.records : [],
      migrations: Array.isArray(parsedValue.migrations)
        ? parsedValue.migrations
        : [],
    };
  } catch {
    return getEmptyState();
  }
}

function writeState(state: LocalCloudState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(localCloudKey, JSON.stringify(state));
}

function createFamilySpaceName(name?: string | null) {
  const firstName = name?.trim().split(" ").filter(Boolean)[0];
  return firstName
    ? `המרחב המשפחתי של ${firstName}`
    : "המרחב המשפחתי שלי";
}

export const localCloudRepository: NestlyCloudRepository = {
  async bootstrapIdentity(
    input: BootstrapIdentityInput
  ): Promise<CloudBootstrapResult> {
    const state = readState();
    const timestamp = nowIso();
    const userId = normalizeId(input.userId || input.email);
    const existingUser = state.users.find((user) => user.id === userId);
    const user: CloudUser = existingUser
      ? {
          ...existingUser,
          email: input.email,
          name: input.name,
          image: input.image,
          updatedAt: timestamp,
        }
      : {
          id: userId,
          email: input.email,
          name: input.name,
          image: input.image,
          createdAt: timestamp,
          updatedAt: timestamp,
        };

    const existingMembership = state.memberships.find(
      (membership) => membership.userId === user.id
    );
    const existingFamilySpace = existingMembership
      ? state.familySpaces.find(
          (space) => space.id === existingMembership.familySpaceId
        )
      : null;

    const familySpace: CloudFamilySpace =
      existingFamilySpace ??
      {
        id: `space_${user.id}_${Date.now()}`,
        name: createFamilySpaceName(input.name),
        ownerUserId: user.id,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    const membership: CloudMembership =
      existingMembership ??
      {
        id: `membership_${user.id}_${familySpace.id}`,
        userId: user.id,
        familySpaceId: familySpace.id,
        role: "owner",
        createdAt: timestamp,
        updatedAt: timestamp,
      };

    writeState({
      ...state,
      users: [user, ...state.users.filter((item) => item.id !== user.id)],
      familySpaces: [
        familySpace,
        ...state.familySpaces.filter((item) => item.id !== familySpace.id),
      ],
      memberships: [
        membership,
        ...state.memberships.filter((item) => item.id !== membership.id),
      ],
    });

    return {
      user,
      familySpace,
      membership,
      isFirstLogin: !existingUser || !existingFamilySpace,
    };
  },

  async listRecords<TData = unknown>({ familySpaceId, kind }: ListRecordsInput) {
    return readState().records.filter(
      (record): record is FamilyScopedRecord<TData> =>
        record.familySpaceId === familySpaceId &&
        !record.deletedAt &&
        (!kind || record.kind === kind)
    );
  },

  async upsertRecord<TData = unknown>({
    familySpaceId,
    kind,
    recordId,
    data,
  }: UpsertRecordInput<TData>) {
    const state = readState();
    const timestamp = nowIso();
    const existingRecord = state.records.find(
      (record) =>
        record.familySpaceId === familySpaceId && record.id === recordId
    );
    const record: FamilyScopedRecord<TData> = {
      id: recordId,
      familySpaceId,
      kind,
      data,
      createdAt: existingRecord?.createdAt ?? timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    };

    writeState({
      ...state,
      records: [
        record,
        ...state.records.filter(
          (item) =>
            !(item.familySpaceId === familySpaceId && item.id === recordId)
        ),
      ],
    });

    return record;
  },

  async markRecordDeleted({ familySpaceId, recordId }) {
    const state = readState();
    const timestamp = nowIso();

    writeState({
      ...state,
      records: state.records.map((record) =>
        record.familySpaceId === familySpaceId && record.id === recordId
          ? { ...record, deletedAt: timestamp, updatedAt: timestamp }
          : record
      ),
    });
  },

  async migrateGuestRecords(input: GuestMigrationInput) {
    const state = readState();
    const timestamp = nowIso();
    const migration: GuestMigrationRecord = {
      id: `migration_${input.userId}_${Date.now()}`,
      userId: input.userId,
      familySpaceId: input.familySpaceId,
      decision: input.decision,
      migratedKinds:
        input.decision === "import"
          ? [...new Set(input.records.map((record) => record.kind))]
          : [],
      createdAt: timestamp,
    };

    if (input.decision === "start_fresh") {
      writeState({ ...state, migrations: [migration, ...state.migrations] });
      return migration;
    }

    const nextRecords = [...state.records];

    input.records.forEach((record) => {
      const exists = nextRecords.some(
        (item) =>
          item.familySpaceId === input.familySpaceId && item.id === record.id
      );

      if (!exists) {
        nextRecords.unshift({
          ...record,
          familySpaceId: input.familySpaceId,
          createdAt: timestamp,
          updatedAt: timestamp,
          deletedAt: null,
        });
      }
    });

    writeState({
      ...state,
      records: nextRecords,
      migrations: [migration, ...state.migrations],
    });

    return migration;
  },
};
