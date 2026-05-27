import { Client } from "pg";

type PostgresClientFactory = (connectionString: string) => Client;

function createPostgresClient(connectionString: string): Client {
  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
}

export async function connectPostgres(
  connectionString: string,
  clientFactory: PostgresClientFactory = createPostgresClient,
): Promise<Client | void> {
  try {
    const client = clientFactory(connectionString);
    await client.connect();
    const res = await client.query("Select now()");
    if (res == null) throw new Error("Error connecting with db");
    return client;
  } catch (error) {
    console.log(error);
    process.exit(0);
  }
}
