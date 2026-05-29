#!/usr/bin/env node
import { intro, text } from "@clack/prompts";
import pc from "picocolors";

import { databasePackages } from "../constants/databasePackages";
import { downloadDependecies } from "../helper/downloadDependecies";
import { getDatabaseName } from "../helper/getDatabaseName";
import { getConnectionString } from "../helper/getConnectionString";
import { restoreCompressedBackup } from "../helper/postgresBackupUtils";

export async function restoreCommand() {
  intro(pc.cyan("Restore the database"));

  // get database name
  const databaseName = await getDatabaseName();

  if (databaseName !== "Postgres") {
    console.log(
      pc.redBright(
        "Compressed utility-based restore is currently supported only for Postgres.",
      ),
    );
    process.exit(0);
  }

  // download dependency packages
  const packages = databasePackages[databaseName as string];
  await downloadDependecies(packages);

  // get connection string for restore utility
  const connectionString = await getConnectionString();

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

  console.log(pc.blueBright("Restoring compressed backup using pg_restore utility"));
  await restoreCompressedBackup(connectionString, fileDir as string);

  console.log(pc.greenBright("Database restored succesfully"))
}
