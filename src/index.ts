#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import pc from "picocolors"
import backupCommand from "./command/cli";

yargs(hideBin(process.argv));
yargs(hideBin(process.argv))
  .command(
    "backup",
    "backup the database",
    (y) => y,
    async (argv) => {
      if (argv.verbose) console.info(pc.italic("starting to backup database"));
      await backupCommand()
    },
  )
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging",
  })
  .parse();
