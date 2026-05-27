import { ConnectionDetails } from "../model/connectionDetails";

export function buildConnectionString(details: ConnectionDetails, databaseName : string) : string {
  const { host, port, user, database, password } = details;
  const connectionString = `${databaseName}://${user}:${password}@${host}:${port}/${database}`;
  return connectionString;
}