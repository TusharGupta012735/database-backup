import { group, text, password, intro, outro } from "@clack/prompts";
import { ConnectionDetails } from "../model/connectionDetails";

export async function getDbCredentials(): Promise<ConnectionDetails> {
  intro("Configure your Database Connection");

  const credentials = await group(
    {
      host: () =>
        text({
          message: "Database Host:",
          placeholder: "localhost",
          validate(value) {
            if (!value || value.trim().length === 0) return "Host is required.";

            const cleanValue = value.trim();

            if (/^[a-zA-Z]+:\/\//.test(cleanValue)) {
              return "Provide the host only. Do not include connection protocols (like 'postgres://' or 'http://').";
            }
            if (cleanValue.includes(":")) {
              return "Provide the host without the port. Specify the port in the next step.";
            }
            if (!/^[a-zA-Z0-9.-]+$/.test(cleanValue)) {
              return "Invalid host format. Use a valid domain name or IP address.";
            }
          },
        }),
      port: () =>
        text({
          message: "Database Port:",
          placeholder: "5432",
          validate(value) {
            if (!value || value.trim().length === 0) return "Port is required.";

            const cleanValue = value.trim();

            if (!/^\d+$/.test(cleanValue)) {
              return "Port must contain numbers only.";
            }

            const p = parseInt(cleanValue, 10);
            if (p < 1 || p > 65535) {
              return "Enter a valid port number between 1 and 65535.";
            }
          },
        }),
      user: () =>
        text({
          message: "Database User:",
          validate(value) {
            if (!value || value.trim().length === 0)
              return "Database user is required.";

            const cleanValue = value.trim();

            if (/\s/.test(cleanValue)) return "User cannot contain spaces.";

            if (cleanValue.length > 63)
              return "PostgreSQL usernames cannot exceed 63 characters.";

            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanValue)) {
              return "Username must start with a letter or underscore and contain only alphanumeric characters.";
            }
          },
        }),
      database: () =>
        text({
          message: "Database Name:",
          validate(value) {
            if (!value || value.trim().length === 0)
              return "Database name is required.";

            const cleanValue = value.trim();

            if (/\s/.test(cleanValue))
              return "Database name cannot contain spaces.";
            if (cleanValue.length > 63)
              return "Database names cannot exceed 63 characters.";

            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanValue)) {
              return "Database name must start with a letter or underscore and contain only alphanumeric characters.";
            }
          },
        }),
      password: () =>
        password({
          message: "Database Password:",
          mask: "*",
          validate(value) {
            if (!value || value.length === 0) {
              return "Password is required.";
            }
            if (value.startsWith(" ") || value.endsWith(" ")) {
              return "Password cannot start or end with a space.";
            }
          },
        }),
    },
    {
      onCancel: () => {
        outro("Operation cancelled.");
        process.exit(0);
      },
    },
  );

  outro("Credentials gathered successfully!");
  return {
    host: credentials.host.trim(),
    port: credentials.port.trim(),
    user: credentials.user.trim(),
    database: credentials.database.trim(),
    password: credentials.password,
  };
}
