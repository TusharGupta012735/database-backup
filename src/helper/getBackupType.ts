import { select } from "@clack/prompts";

import type { PostgresBackupType } from "./postgresBackupUtils";

export async function getBackupType(): Promise<PostgresBackupType> {
  const backupType = await select({
    message: "Select PostgreSQL backup type",
    options: [
      {
        value: "table",
        label: "Table dump",
        hint: "Compressed pg_dump backup for one table",
      },
      {
        value: "full",
        label: "Full backup",
        hint: "pg_basebackup base backup with WAL included",
      },
      {
        value: "incremental",
        label: "Incremental backup",
        hint: "Copy WAL files since the previous full or incremental backup",
      },
      {
        value: "differential",
        label: "Differential backup",
        hint: "Copy WAL files since the previous full backup",
      },
    ],
  });

  return backupType as PostgresBackupType;
}
