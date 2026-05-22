#!/usr/bin/env node
import dotenv from "dotenv"
import { cancel, intro, isCancel, outro, select } from "@clack/prompts";
import pc from "picocolors";

import {databaseList} from "../constants/databaseList"
import { databasePackages } from "../constants/databasePackages";
import { downloadDependecies } from "../helper/downloadDependecies";
import { cancelCheck } from "../helper/checkCancel";

dotenv.config();

async function cli(){
  intro(pc.cyan("Backup my database"));

  // get database name
  const databaseName = await getDatabaseName();

  // download dependency packages
  const packages = databasePackages[databaseName as string];
  await downloadDependecies(packages);

  // establish a connection

  // ask for table name to backup

  // verify if table exist

  // ask location to save data at


  console.log(databaseName);

  outro("Backup Completed");
}

async function getDatabaseName(){
  const databaseName = await select({
    message: "Select DB",
    options: databaseList,
  });
  cancelCheck(databaseName);

  return databaseName;
}

export default cli;