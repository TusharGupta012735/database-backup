import * as path from "path"
import * as fs from "fs/promises"
import pc from "picocolors"

export async function saveBackup(dir : string, tableName : string, data : any[]){
    try {
        const filePath = path.join(dir, `backup_${tableName}.json`);

        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");

        console.log(pc.greenBright("Backup saved successfully"));
    } catch (error) {
        console.log(pc.redBright("Error in saving backup"));
        process.exit(0)
    }
}