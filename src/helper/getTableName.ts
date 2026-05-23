import { text } from "@clack/prompts";
import pc from "picocolors";

export async function getTableName() : Promise<string>{
    const ip = await text({
      message: "Enter table name to backup",
      validate(value) {
        if (value!.length == 0) {
          console.log(pc.redBright("Table name is required !"));
          process.exit(0);
        }
        // check if table name exist in db
      },
    });

    return ip as string
}