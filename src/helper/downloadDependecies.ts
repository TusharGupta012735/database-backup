import { execa } from "execa";
import pc from "picocolors"

export async function downloadDependecies(packages : string[]) : Promise<void>{
    console.log(pc.blueBright("Downloading dependencies..."));
    await execa("npm", ["install", ...packages], {
      cwd: process.cwd(),
      stdio: "inherit",
    });
}