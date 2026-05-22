import { Client } from "pg";

export async function connectPostgres(
  connectionString: string,
): Promise<Client | void> {
  try {
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();
    const res = await client.query("Select now()");
    if (res == null) throw new Error("Error connecting with db");
    return client;
  } catch (error) {
    console.log(error);
    process.exit(0);
  }
}
