import { Client } from "pg";
import pc from "picocolors"

export async function getTableData(client : Client, tableName : string) : Promise<any[]>{
    
    const query = `Select * from ${tableName}`
    const res = await client.query(query)

    if (!res.rows[0]) {
      console.log(pc.redBright("No data found or database is empty"));
      process.exit(0);
    }
    return res.rows;
}