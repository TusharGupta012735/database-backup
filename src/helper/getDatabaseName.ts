import { select } from "@clack/prompts";
import { databaseList } from "../constants/databaseList";
import { cancelCheck } from "./checkCancel";

export async function getDatabaseName() {
  const databaseName = await select({
    message: "Select DB",
    options: databaseList,
  });
  cancelCheck(databaseName);

  return databaseName as string;
}
