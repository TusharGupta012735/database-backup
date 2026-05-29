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
import {
  buildBackupFilePath,
  createCompressedTableBackup,
} from "../helper/postgresBackupUtils";

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

  // ask for table name to backup
  const tableName = await getTableName();

  // ask location to save data at
  const dir = await getDirectoryPath();
  const connectionString = await getConnectionString();
  const backupFilePath = buildBackupFilePath(dir, tableName);

  console.log(pc.blueBright("Creating compressed backup using pg_dump utility"));
  await createCompressedTableBackup(connectionString, tableName, backupFilePath);
  console.log(pc.greenBright(`Backup saved successfully at ${backupFilePath}`));

  outro("Backup Completed");
  process.exit(0);
}

export default backupCommand;
