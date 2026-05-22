export interface DatabaseList {
  value: string;
  label: string;
}

const databaseList: DatabaseList[] = [
  {
    value: "MongoDB",
    label: "MongoDB",
  },
  {
    value: "Cassandra",
    label: "Cassandra",
  },
  {
    value: "Postgres",
    label: "Postgres",
  },
];
export { databaseList };
