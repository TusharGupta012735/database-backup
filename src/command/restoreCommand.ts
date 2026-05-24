#!/usr/bin/env node
import { intro, text } from "@clack/prompts";
import pc from "picocolors";
import * as fs from "fs/promises"

import { databasePackages } from "../constants/databasePackages";
import { downloadDependecies } from "../helper/downloadDependecies";
import { connectPostgres } from "../connection/postgres";
import { getDatabaseName } from "../helper/getDatabaseName";
import { getConnectionString } from "../helper/getConnectionString";
import { getTableName } from "../helper/getTableName";

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

  const tableName = await getTableName();

  // read file and parse data to json
  const rawData = await fs.readFile(fileDir as string, "utf-8")
  const records = JSON.parse(rawData);

  // iterate every record and update if required or insert if not present
  if(records == null || records.length == 0){
    console.log(pc.redBright("Data is empty"))
    process.exit(0)
  }

  for(const record of records){
    const columns = Object.keys(record)
    const values = Object.values(record)

    const placeholders = columns.map((_,i) => `$${i+1}`)

    const updateClause = columns
    .filter((col) => col !== "user_id")
    .map((col) => `${col} = EXCLUDED.${col}`)
    .join(",")

    const query = `
    Insert into ${tableName}
    (${columns.join(",")})
    VALUES (${placeholders.join(",")})
    ON CONFLICT (user_id)
    DO UPDATE SET
    ${updateClause}
    `;

    await client.query(query, values)
  }

  console.log(pc.greenBright("Database restored succesfully"))
  await client.end()
}
