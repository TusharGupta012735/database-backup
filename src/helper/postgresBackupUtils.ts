import { execa } from "execa";
import * as path from "path";
import * as fs from "fs/promises";

export function buildBackupFilePath(dir: string, tableName: string): string {
  return path.join(dir, `backup_${tableName}.dump`);
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
