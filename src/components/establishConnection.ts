#!/usr/bin/env node
import { select } from "@clack/prompts";

import { connectPostgres } from "../connection/postgres";
import { getDbCredentials } from "./paramtericConnection";
import { buildConnectionString } from "../helper/buildConnectionString";
import { connectionOptions } from "../constants/connectionOptions";
import { getConnectionString } from "../helper/getConnectionString";
import pc from "picocolors";
import { Client } from "pg";

type EstablishConnectionDeps = {
  selectConnectionMethod: typeof select;
  requestConnectionString: typeof getConnectionString;
  requestDbCredentials: typeof getDbCredentials;
  connect: typeof connectPostgres;
};

const defaultDeps: EstablishConnectionDeps = {
  selectConnectionMethod: select,
  requestConnectionString: getConnectionString,
  requestDbCredentials: getDbCredentials,
  connect: connectPostgres,
};

export async function establishConnection(
  databaseName: string,
  deps: EstablishConnectionDeps = defaultDeps,
): Promise<Client> {
  try {
    const inputType = await deps.selectConnectionMethod({
      message: "Enter the connection method",
      options: connectionOptions,
    });

    let client;

    if (inputType == "cs") {
      const connectionString = await deps.requestConnectionString();
      client = await deps.connect(connectionString);
    } else {
      const res = await deps.requestDbCredentials();
      const connectionString = buildConnectionString(res, databaseName);
      client = await deps.connect(connectionString);
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
