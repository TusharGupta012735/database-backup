import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import {
  copyWalFilesInRange,
  createWalArchiveBackup,
  readWalBackupMetadata,
  writeWalBackupMetadata,
  type WalBackupMetadata,
} from "../src/helper/postgresBackupUtils.ts";

describe("PostgreSQL WAL backup utilities", () => {
  it("copies only WAL files inside the requested inclusive range", async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), "wal-copy-"));
    const archivePath = path.join(workspace, "archive");
    const outputPath = path.join(workspace, "output");
    await mkdir(archivePath);

    await writeFile(path.join(archivePath, "000000010000000000000001"), "one");
    await writeFile(path.join(archivePath, "000000010000000000000002"), "two");
    await writeFile(path.join(archivePath, "000000010000000000000003"), "three");
    await writeFile(path.join(archivePath, "not-a-wal-note.txt"), "skip");

    const copied = await copyWalFilesInRange(
      archivePath,
      outputPath,
      "000000010000000000000002",
      "000000010000000000000003",
    );

    assert.deepEqual(copied, [
      "000000010000000000000002",
      "000000010000000000000003",
    ]);
    assert.equal(await readFile(path.join(outputPath, copied[0]), "utf8"), "two");
    assert.equal(await readFile(path.join(outputPath, copied[1]), "utf8"), "three");
  });

  it("uses the previous backup WAL marker for incremental backups", async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), "wal-incremental-"));
    const archivePath = path.join(workspace, "archive");
    const outputPath = path.join(workspace, "incremental");
    await mkdir(archivePath);

    await writeFile(path.join(archivePath, "000000010000000000000001"), "one");
    await writeFile(path.join(archivePath, "000000010000000000000002"), "two");
    await writeFile(path.join(archivePath, "000000010000000000000003"), "three");

    const baseMetadata: WalBackupMetadata = {
      backupType: "full",
      createdAt: "2026-06-04T00:00:00.000Z",
      connectionString: "postgres://user:pass@localhost:5432/app",
      backupPath: path.join(workspace, "full"),
      fullBackupWalFile: "000000010000000000000001",
      currentWalFile: "000000010000000000000002",
    };

    const metadata = await createWalArchiveBackup(
      "incremental",
      baseMetadata.connectionString,
      outputPath,
      archivePath,
      "000000010000000000000003",
      baseMetadata,
    );

    assert.equal(metadata.previousWalFile, "000000010000000000000002");
    assert.deepEqual(metadata.copiedWalFiles, [
      "000000010000000000000002",
      "000000010000000000000003",
    ]);
  });

  it("round-trips WAL backup metadata from a backup directory", async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), "wal-metadata-"));
    const metadata: WalBackupMetadata = {
      backupType: "differential",
      createdAt: "2026-06-04T00:00:00.000Z",
      connectionString: "postgres://user:pass@localhost:5432/app",
      backupPath: workspace,
      walArchivePath: path.join(workspace, "archive"),
      fullBackupWalFile: "000000010000000000000001",
      previousWalFile: "000000010000000000000001",
      currentWalFile: "000000010000000000000003",
      copiedWalFiles: ["000000010000000000000001"],
    };

    await writeWalBackupMetadata(workspace, metadata);
    assert.deepEqual(await readWalBackupMetadata(workspace), metadata);
  });
});
