import { execa } from "execa";
import type { Client } from "pg";
import * as path from "path";
import * as fs from "fs/promises";

export type PostgresBackupType = "table" | "full" | "incremental" | "differential";

export interface WalBackupMetadata {
  backupType: "full" | "incremental" | "differential";
  createdAt: string;
  connectionString: string;
  backupPath: string;
  walArchivePath?: string;
  fullBackupWalFile?: string;
  previousWalFile?: string;
  currentWalFile?: string;
  copiedWalFiles?: string[];
}

const METADATA_FILE_NAME = "postgres-backup-metadata.json";
const WAL_FILE_NAME_PATTERN = /^[0-9A-F]{24}(?:\.partial)?$/;

export function buildBackupFilePath(dir: string, tableName: string): string {
  return path.join(dir, `backup_${tableName}.dump`);
}

function timestampForPath(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

export function buildWalBackupPath(dir: string, backupType: Exclude<PostgresBackupType, "table">): string {
  return path.join(dir, `${backupType}_${timestampForPath()}`);
}

export async function createCompressedTableBackup(
  connectionString: string,
  tableName: string,
  outputPath: string,
): Promise<void> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  await execa("pg_dump", [
    "--format=custom",
    "--compress=9",
    `--table=${tableName}`,
    `--file=${outputPath}`,
    connectionString,
  ]);
}

export async function restoreCompressedBackup(
  connectionString: string,
  backupFilePath: string,
): Promise<void> {
  await execa("pg_restore", [
    "--clean",
    "--if-exists",
    "--no-owner",
    `--dbname=${connectionString}`,
    backupFilePath,
  ]);
}

export async function getCurrentWalFile(client: Client): Promise<string> {
  const result = await client.query<{ wal_file: string }>(
    "SELECT pg_walfile_name(pg_current_wal_lsn()) AS wal_file",
  );

  const walFile = result.rows[0]?.wal_file;
  if (!walFile) {
    throw new Error("Unable to determine the current PostgreSQL WAL file.");
  }

  return walFile;
}

export async function createFullPostgresBackup(
  connectionString: string,
  outputPath: string,
  currentWalFile: string,
): Promise<WalBackupMetadata> {
  await fs.mkdir(outputPath, { recursive: true });

  await execa("pg_basebackup", [
    `--dbname=${connectionString}`,
    `--pgdata=${outputPath}`,
    "--format=tar",
    "--gzip",
    "--wal-method=fetch",
    "--progress",
  ]);

  const metadata: WalBackupMetadata = {
    backupType: "full",
    createdAt: new Date().toISOString(),
    connectionString,
    backupPath: outputPath,
    fullBackupWalFile: currentWalFile,
    currentWalFile,
  };

  await writeWalBackupMetadata(outputPath, metadata);
  return metadata;
}

export async function createWalArchiveBackup(
  backupType: "incremental" | "differential",
  connectionString: string,
  outputPath: string,
  walArchivePath: string,
  currentWalFile: string,
  baseMetadata: WalBackupMetadata,
): Promise<WalBackupMetadata> {
  const startWalFile = backupType === "incremental"
    ? baseMetadata.currentWalFile
    : baseMetadata.fullBackupWalFile;

  if (!startWalFile) {
    throw new Error(
      `${backupType} backups require metadata from an earlier full backup.`,
    );
  }

  const walOutputPath = path.join(outputPath, "wal");
  await fs.mkdir(walOutputPath, { recursive: true });

  const copiedWalFiles = await copyWalFilesInRange(
    walArchivePath,
    walOutputPath,
    startWalFile,
    currentWalFile,
  );

  const metadata: WalBackupMetadata = {
    backupType,
    createdAt: new Date().toISOString(),
    connectionString,
    backupPath: outputPath,
    walArchivePath,
    fullBackupWalFile: baseMetadata.fullBackupWalFile,
    previousWalFile: startWalFile,
    currentWalFile,
    copiedWalFiles,
  };

  await writeWalBackupMetadata(outputPath, metadata);
  return metadata;
}

export async function copyWalFilesInRange(
  walArchivePath: string,
  outputPath: string,
  startWalFile: string,
  endWalFile: string,
): Promise<string[]> {
  const entries = await fs.readdir(walArchivePath, { withFileTypes: true });
  const walFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => WAL_FILE_NAME_PATTERN.test(fileName))
    .filter((fileName) => fileName >= startWalFile && fileName <= endWalFile)
    .sort();

  if (walFiles.length === 0) {
    throw new Error(
      `No WAL archive files found between ${startWalFile} and ${endWalFile}.`,
    );
  }

  await fs.mkdir(outputPath, { recursive: true });

  await Promise.all(
    walFiles.map((fileName) => fs.copyFile(
      path.join(walArchivePath, fileName),
      path.join(outputPath, fileName),
    )),
  );

  return walFiles;
}

export async function readWalBackupMetadata(metadataPath: string): Promise<WalBackupMetadata> {
  const filePath = metadataPath.endsWith(".json")
    ? metadataPath
    : path.join(metadataPath, METADATA_FILE_NAME);
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as WalBackupMetadata;
}

export async function writeWalBackupMetadata(
  outputPath: string,
  metadata: WalBackupMetadata,
): Promise<void> {
  await fs.mkdir(outputPath, { recursive: true });
  await fs.writeFile(
    path.join(outputPath, METADATA_FILE_NAME),
    JSON.stringify(metadata, null, 2),
  );
}
