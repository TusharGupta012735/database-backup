#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import pc from "picocolors"
import backupCommand from "./command/backupCommand";
import { restoreCommand } from "./command/restoreCommand";

yargs(hideBin(process.argv));
yargs(hideBin(process.argv))
  .command(
    "backup",
    "backup the database",
    (y) => y,
    async (argv) => {
      if (argv.verbose) console.info(pc.italic("starting to backup database"));
      await backupCommand();
    },
  )
  .command(
    "restore",
    "restore the database",
    (y) => y,
    async (argv) => {
      if (argv.verbose) console.info(pc.italic("starting to backup database"));
      await restoreCommand();
    },
  )
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging",
  })
  .parse();
