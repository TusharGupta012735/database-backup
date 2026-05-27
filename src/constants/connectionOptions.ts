export interface ConnectionOption {
  value: string;
  label: string;
}

const connectionOptions: ConnectionOption[] = [
  {
    value: "cs",
    label: "Connection String",
  },
  {
    value: "pm",
    label: "Parameters",
  },
];
export { connectionOptions };
