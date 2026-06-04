#!/usr/bin/env node
import dotenv from "dotenv";
import { intro, outro } from "@clack/prompts";
import pc from "picocolors";

import { databasePackages } from "../constants/databasePackages";
import { downloadDependecies } from "../helper/downloadDependecies";
import { getDatabaseName } from "../helper/getDatabaseName";
import { getTableName } from "../helper/getTableName";
import { getDirectoryPath } from "../helper/getDirectory";
import { getConnectionString } from "../helper/getConnectionString";
import { getBackupType } from "../helper/getBackupType";
import { getBackupMetadataPath, getWalArchivePath } from "../helper/getWalArchivePath";
import { connectPostgres } from "../connection/postgres";
import {
  buildBackupFilePath,
  buildWalBackupPath,
  createCompressedTableBackup,
  createFullPostgresBackup,
  createWalArchiveBackup,
  getCurrentWalFile,
  readWalBackupMetadata,
} from "../helper/postgresBackupUtils";

import type { Client } from "pg";

dotenv.config();

async function backupCommand() {
  intro(pc.cyan("Backup my database"));

  // get database name
  const databaseName = await getDatabaseName();

  if (databaseName !== "Postgres") {
    console.log(
      pc.redBright(
        "Compressed utility-based backup is currently supported only for Postgres.",
      ),
    );
    process.exit(0);
  }

  // download dependency packages
  const packages = databasePackages[databaseName as string];
  await downloadDependecies(packages);

  const backupType = await getBackupType();
  const dir = await getDirectoryPath();
  const connectionString = await getConnectionString();

  if (backupType === "table") {
    // ask for table name to backup
    const tableName = await getTableName();
    const backupFilePath = buildBackupFilePath(dir, tableName);

    console.log(pc.blueBright("Creating compressed backup using pg_dump utility"));
    await createCompressedTableBackup(connectionString, tableName, backupFilePath);
    console.log(pc.greenBright(`Backup saved successfully at ${backupFilePath}`));

    outro("Backup Completed");
    process.exit(0);
  }

  const backupPath = buildWalBackupPath(dir, backupType);
  const client = await connectPostgres(connectionString) as Client;

  try {
    const currentWalFile = await getCurrentWalFile(client);

    if (backupType === "full") {
      console.log(pc.blueBright("Creating full PostgreSQL base backup using pg_basebackup"));
      await createFullPostgresBackup(connectionString, backupPath, currentWalFile);
    } else {
      const walArchivePath = await getWalArchivePath();
      const metadataPath = await getBackupMetadataPath();
      const baseMetadata = await readWalBackupMetadata(metadataPath);

      console.log(
        pc.blueBright(`Creating ${backupType} PostgreSQL backup from WAL archive`),
      );
      await createWalArchiveBackup(
        backupType,
        connectionString,
        backupPath,
        walArchivePath,
        currentWalFile,
        baseMetadata,
      );
    }
  } finally {
    await client.end();
  }

  console.log(pc.greenBright(`Backup saved successfully at ${backupPath}`));
  outro("Backup Completed");
  process.exit(0);
}

export default backupCommand;
