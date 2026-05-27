#!/usr/bin/env node
import { select } from "@clack/prompts";

import { connectPostgres } from "../connection/postgres";
import { getDbCredentials } from "./paramtericConnection";
import { buildConnectionString } from "../helper/buildConnectionString";
import { connectionOptions } from "../constants/connectionOptions";
import { getConnectionString } from "../helper/getConnectionString";
import pc from "picocolors";
import { Client } from "pg";

export async function establishConnection(databaseName : string) : Promise<Client>{
  try {
    const inputType = await select({
      message: "Enter the connection method",
      options: connectionOptions,
    });

    let client;

    if (inputType == "cs") {
      const connectionString = await getConnectionString();
      client = await connectPostgres(connectionString);
    } else {
      const res = await getDbCredentials();
      const connectionString = buildConnectionString(res, databaseName);
      client = await connectPostgres(connectionString);
    }
    if (client == null || client == undefined) {
      throw new Error("Error in establishing connection");
    }
    return client;
  } catch (error) {
    console.log(pc.redBright(`Error is ${error}`));
    process.exit(0);
  }
}
