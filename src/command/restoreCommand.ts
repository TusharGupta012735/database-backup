#!/usr/bin/env node
import { intro, text } from "@clack/prompts";
import pc from "picocolors";
import * as fs from "fs/promises"

import { databasePackages } from "../constants/databasePackages";
import { downloadDependecies } from "../helper/downloadDependecies";
import { connectPostgres } from "../connection/postgres";
import { getDatabaseName } from "../helper/getDatabaseName";
import { getConnectionString } from "../helper/getConnectionString";

export async function restoreCommand() {
  intro(pc.cyan("Restore the database"));

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
    process.exit(0);
  }

  // get backup file location
  const fileDir = await text({
    message : "Enter backup file directory",
    validate : (f) => {
        if(f == null) {
            console.log(pc.redBright("File name required"));
            process.exit(0);
        }
    }
  })

  // read file and parse data to json
  const rawData = await fs.readFile(fileDir as string, "utf-8")
  const records = JSON.parse(rawData);

  

}
