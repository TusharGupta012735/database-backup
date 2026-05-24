# Database Backup Tool

### Project URL :
https://roadmap.sh/projects/database-backup-utility

A small CLI utility for backing up and restoring table data as JSON. The project is currently focused on **PostgreSQL**, with placeholders for MongoDB and Cassandra support in the future.

## Repository

- GitHub: https://github.com/TusharGupta012735/database-backup.git

## Overview

This tool helps you:

- Select the database type from the CLI
- Enter a PostgreSQL connection string
- Choose a table to export
- Choose the directory where the backup JSON file should be saved
- Restore JSON backup data back into PostgreSQL

The current implementation stores table rows as a JSON array and uses the `pg` driver to connect to PostgreSQL.

## Current status

### Working today

- Backup flow for **PostgreSQL**
- Restore flow for **PostgreSQL**
- Interactive CLI prompts using `@clack/prompts`
- JSON file creation and restore execution

### Still planned / future work

- MongoDB and Cassandra are listed as selectable options, but their connection and restore logic are not implemented yet
- `fs-extra` is currently unused
- `.env` support is not yet wired into the restore flow

## Project structure

- `src/index.ts` – CLI entry point and command registration
- `src/command/backupCommand.ts` – backup workflow
- `src/command/restoreCommand.ts` – restore workflow
- `src/connection/postgres.ts` – PostgreSQL connection logic
- `src/helper/*.ts` – prompt helpers, directory selection, file writing, and database-specific utilities
- `src/constants/*.ts` – database list and package mappings

## Dependencies

### Runtime dependencies

- `@clack/prompts` – interactive CLI prompts
- `dotenv` – loads environment variables from `.env`
- `execa` – runs shell commands such as `npm install`
- `fs-extra` – present in the package but not currently used by the active logic
- `pg` – PostgreSQL client driver
- `picocolors` – colored terminal output
- `typescript` – TypeScript compiler
- `yargs` – CLI command parsing

### Development dependencies

- `@types/node` – Node.js type definitions
- `@types/pg` – PostgreSQL type definitions
- `nodemon` – development process restarting
- `ts-node` – TypeScript execution support

## Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the backup command:

   ```bash
   npm run backup
   ```

3. Run the restore command:

   ```bash
   npm run restore
   ```

## How the backup flow works

### 1. CLI startup

`src/index.ts` registers the `backup` and `restore` commands using `yargs`.

### 2. Database selection

`getDatabaseName()` shows a prompt using `@clack/prompts` and lets the user choose the database. The current options are:

- `Postgres`
- `MongoDB`
- `Cassandra`

### 3. Dependency handling

`downloadDependecies()` uses `execa` to run `npm install` for the database-specific package list from `databasePackages.ts`.

Current package mapping:

- `Postgres` → `pg`
- `MongoDb` → `mongoose`
- `Cassandra` → `cassandra-driver`

### 4. Connection establishment

`getConnectionString()` asks the user to enter a PostgreSQL connection string.

`connectPostgres()` in `src/connection/postgres.ts` then:

- creates a new `Client` from `pg`
- passes the connection string
- sets `ssl.rejectUnauthorized = false`
- connects using `await client.connect()`
- verifies the connection with `SELECT now()`

If the connection fails, the process exits.

### 5. Table selection

`getTableName()` asks the user to enter the table name to export.

### 6. Fetching table data

`getTableData()` runs:

```sql
SELECT * FROM <table_name>
```

and returns the rows as JSON-serializable objects.

### 7. Output directory selection

`getDirectoryPath()` asks the user to provide an absolute path where the backup should be saved.

### 8. Saving the backup

`saveBackup()` creates the directory if needed and writes a file named:

```text
backup_<table_name>.json
```

The file contains a JSON array of rows. For example:

```json
[
  {
    "order_id": 1,
    "user_id": 1,
    "product_id": 1,
    "quantity": 1,
    "order_date": "2026-05-22T06:56:31.045Z"
  }
]
```

## How the restore flow works

The restore flow is now implemented in `src/command/restoreCommand.ts`.

### Restore steps

1. Ask the user to select the database
2. Download database-specific dependencies
3. Ask for the PostgreSQL connection string
4. Connect to PostgreSQL
5. Ask for the backup file path
6. Read and parse the JSON backup file
7. Validate that the data is not empty
8. For each row:
   - build an `INSERT ... ON CONFLICT (user_id) DO UPDATE` query
   - insert the row values into the target table
9. Close the PostgreSQL client
10. Print a success message

### Restore behavior

For PostgreSQL, the current restore logic:

- uses `user_id` as the conflict target
- updates all fields except `user_id`
- performs one insert/update per row in the backup file
- restores data into the table entered by the user during the prompt

### Example restore logic

```sql
INSERT INTO <table_name> (columns...)
VALUES (...)
ON CONFLICT (user_id)
DO UPDATE SET
  column_a = EXCLUDED.column_a,
  column_b = EXCLUDED.column_b
```

## Connection and storage details

### PostgreSQL connection details

The current connection flow uses:

- `pg.Client`
- `connectionString` from user input
- `ssl.rejectUnauthorized = false`

This means the tool currently expects a valid PostgreSQL connection string and does not yet use `.env` automatically for restore connection setup.

### Backup storage format

Backups are written as JSON files, not SQL dumps.

This makes the data easy to inspect, copy, and move, but it also means:

- restore logic must understand the JSON shape
- insert behavior must match the target table schema
- the caller must ensure the backup matches the destination table structure

## Support for future databases

The project already includes placeholders for:

- `MongoDB`
- `Cassandra`

The current codebase is **Postgres-first**, and future work should add:

1. A database adapter layer
2. A connector per database
3. A restore strategy per database
4. A shared backup metadata format

A clean future design would be:

- `src/connection/postgres.ts`
- `src/connection/mongodb.ts`
- `src/connection/cassandra.ts`
- a shared `backupService` interface for table exports and restores

## Current limitations

- `fs-extra` is present in `package.json` but not used in the current code
- `.env` is not yet used automatically for restore connection setup
- `MongoDB` and `Cassandra` are not functionally implemented yet
- The restore conflict target is currently hardcoded to `user_id`

## Suggested next improvements

1. Add a proper `.env`-based connection configuration flow
2. Add table existence validation before restore
3. Add file validation for backup JSON structure
4. Add transaction handling for safer restores
5. Implement database adapters for MongoDB and Cassandra
6. Add a metadata header to each backup file (source DB, table, timestamp, row count)
7. Add tests for backup and restore behavior

## Example workflow

### Backup

```bash
npm run backup
```

CLI flow:

1. Select `Postgres`
2. Enter your PostgreSQL connection string
3. Enter the table name
4. Enter an absolute directory path
5. The tool saves `backup_<table>.json`

### Restore

```bash
npm run restore
```

CLI flow:

1. Select `Postgres`
2. Enter your PostgreSQL connection string
3. Enter the backup file path
4. Enter the target table name
5. The tool parses the JSON and restores the rows
6. The tool prints `Database restored succesfully`

## Notes

This project is currently designed for **PostgreSQL only**, and the codebase is already structured to expand toward other databases in the future. The restore flow is now active for PostgreSQL, while the future database support remains a planned extension.
