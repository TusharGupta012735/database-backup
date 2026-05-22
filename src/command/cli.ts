#!/usr/bin/env node
import dotenv from "dotenv";
import { intro, outro, text } from "@clack/prompts";
import pc from "picocolors";
import * as fs from "fs/promises";
import * as path from "path";

import { databasePackages } from "../constants/databasePackages";
import { downloadDependecies } from "../helper/downloadDependecies";
import { connectPostgres } from "../connection/postgres";
import { getDatabaseName } from "../helper/getDatabaseName";
import { getConnectionString } from "../helper/getConnectionString";

dotenv.config();

async function cli() {
  intro(pc.cyan("Backup my database"));

  // get database name
  const databaseName = await getDatabaseName();

  // download dependency packages
  const packages = databasePackages[databaseName as string];
  await downloadDependecies(packages);

  // establish a connection
  const connectionString = await getConnectionString();
  const client = await connectPostgres(connectionString);
  if (client == null) {
    console.log(pc.redBright("Error connecting to Database"));
  }

  // ask for table name to backup
  const tableName = await text({
    message: "Enter table name to backup",
    validate(value) {
      if (value!.length == 0) {
        console.log(pc.redBright("Table name is required !"));
        process.exit(0);
      }
      // check if table name exist in db
    },
  });
  console.log(pc.blueBright("Fetching data from database"));
  const res = await client!.query(`Select * from ${tableName as string}`);

  if (!res.rows[0]) {
    console.log(pc.redBright("No data found or database is empty"));
    process.exit(0);
  }

  const data = res.rows;
  // verify if table exist

  // ask location to save data at
  const dir = await text({
    message: "Enter absolute directory of the path to create backup",
    validate(path) {
      if (path?.length == 0) {
        console.log(pc.redBright("Path should not be empty"));
        process.exit(0);
      }
    },
  });

  const filePath = path.join(
    dir as string,
    `backup_${tableName as string}.json`,
  );

  await fs.mkdir(dir as string, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");

  console.log(pc.greenBright("Backup saved successfully"));

  outro("Backup Completed");
  process.exit(1);
}

export default cli;
