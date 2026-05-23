import { text } from "@clack/prompts";
import pc from "picocolors"

export async function getDirectoryPath() : Promise<string>{
    const dir = await text({
      message: "Enter absolute directory of the path to create backup",
      validate(path) {
        if (path?.length == 0) {
          console.log(pc.redBright("Path should not be empty"));
          process.exit(0);
        }
      },
    });
    return dir as string
}