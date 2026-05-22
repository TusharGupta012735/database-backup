import { Client } from "pg";

export async function connectPostgres(connectionString : string) : Promise<Client | void>{
    try {
        const client = new Client(connectionString);
        await client.connect();
        const res = await client.query("Select now()");
        console.log(res);
        return client;
    } catch (error) {
        console.log(error);
    }
}