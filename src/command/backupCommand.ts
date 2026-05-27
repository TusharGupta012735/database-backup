#!/usr/bin/env node
import dotenv from "dotenv";
import { intro, outro } from "@clack/prompts";
import pc from "picocolors";

import { databasePackages } from "../constants/databasePackages";
import { downloadDependecies } from "../helper/downloadDependecies";
import { getDatabaseName } from "../helper/getDatabaseName";
import { getTableName } from "../helper/getTableName";
import { getTableData } from "../helper/getTableData";
import { getDirectoryPath } from "../helper/getDirectory";
import { saveBackup } from "../helper/saveBackup";
import { establishConnection } from "../components/establishConnection";

dotenv.config();

async function backupCommand() {
  intro(pc.cyan("Backup my database"));

  // get database name
  const databaseName = await getDatabaseName();

  // establish connection
  const client = await establishConnection(databaseName);

  // download dependency packages
  const packages = databasePackages[databaseName as string];
  await downloadDependecies(packages);

  // ask for table name to backup
  const tableName = await getTableName();

  // fetch data from db
  console.log(pc.blueBright("Fetching data from database"));
  const data = await getTableData(client!, tableName);
  // verify if table exist

  // ask location to save data at
  const dir = await getDirectoryPath();

  // save backup
  await saveBackup(dir, tableName, data);

  outro("Backup Completed");
  process.exit(1);
}

export default backupCommand;
