# Database Backup Tool

A small CLI utility for creating JSON backups of database tables and preparing for restore flows. The project is currently focused on **PostgreSQL**, with placeholders for MongoDB and Cassandra support in the future.

## Overview

This tool helps you:

- Select a database type from the CLI
- Ask for a PostgreSQL connection string
- Choose a table to export
- Pick a directory where the backup JSON file will be saved

The current implementation stores table rows as a JSON array and uses the `pg` driver to connect to PostgreSQL.

## Current status

### Working today

- Backup flow for **PostgreSQL**
- Interactive CLI prompts using `@clack/prompts`
- JSON file creation in a chosen directory

### Not fully implemented yet

- Restore flow is **not complete** yet. The current restore command reads the backup file path and parses JSON, but it does not yet insert the data back into the database.
- MongoDB and Cassandra are listed as selectable options, but there is **no working connection code** for those databases yet.

## Project structure

- `src/index.ts` – CLI entry point and command registration
- `src/command/backupCommand.ts` – backup workflow
- `src/command/restoreCommand.ts` – restore workflow (currently partial)
- `src/connection/postgres.ts` – PostgreSQL connection logic
- `src/helper/*.ts` – prompt helpers, directory selection, file writing, and database-specific utilities
- `src/constants/*.ts` – database list and package mappings

## Dependencies

### Runtime dependencies

- `@clack/prompts` – interactive command-line prompts
- `dotenv` – loads environment variables from `.env`
- `execa` – runs shell commands such as `npm install`
- `fs-extra` – not currently used in the active backup/restore flow
- `pg` – PostgreSQL client driver
- `picocolors` – colored CLI output
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

2. Create a `.env` file if you want to store environment variables for future enhancement:

   ```env
   PG_CONNECTION_STRING=postgres://user:password@host:5432/dbname
   ```

3. Run the backup command:

   ```bash
   npm run backup
   ```

4. Run the restore command:

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

## How restore is planned to work

The current restore entry point is present in `src/command/restoreCommand.ts`, but it is **not yet fully implemented**.

The intended restore flow is:

1. Ask the user to select the database
2. Ask for the connection string
3. Connect to the database
4. Ask for the backup file path
5. Read and parse the JSON
6. Restore the rows into the target table
7. Report success or failure

### Planned Postgres restore behavior

For PostgreSQL, the restore flow should:

- validate the backup file format
- reconnect to the selected database
- insert each row back into the original table
- optionally support safe restore options such as:
  - truncate before insert
  - skip duplicates
  - use transactions for atomicity

### Important note about current implementation

At the moment, the restore command only:

- asks for the database
- connects to PostgreSQL
- asks for a backup file path
- parses the JSON payload

It does **not** yet perform the actual database insert step.

## Connection and storage details

### PostgreSQL connection details

The current connection flow uses:

- `pg.Client`
- `connectionString` from user input
- `ssl.rejectUnauthorized = false`

That means the tool currently assumes a PostgreSQL connection string is available and does not use `.env` automatically during restore.

### Backup storage format

Backups are written as JSON files, not SQL dumps.

This makes the data easy to inspect, copy, and move, but it also means:

- restore logic must be implemented carefully
- database-specific insert behavior is required
- schema and column compatibility must be checked by the caller

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

- Only PostgreSQL backup flow is working
- Restore is incomplete
- `fs-extra` is present in `package.json` but not used in the current code
- `dotenv` is loaded in backup flow only
- `MongoDB` and `Cassandra` are not functionally implemented yet

## Suggested next improvements

1. Finish the restore implementation for PostgreSQL
2. Add proper validation for table existence and file path input
3. Add connection configuration through `.env`
4. Implement database adapters for MongoDB and Cassandra
5. Add a metadata header to each backup file (source DB, table, timestamp, row count)
6. Add tests for backup and restore behavior

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

Current behavior:

1. Select `Postgres`
2. Enter the PostgreSQL connection string
3. Enter the backup file path
4. The JSON is parsed
5. No insert is performed yet

## Notes

This project is currently designed for **PostgreSQL only**, and the codebase is already structured to expand toward other databases in the future. The documentation above reflects the current implementation and the planned restore path.