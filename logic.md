# Logic and Flow Document

This document explains the current backup and restore logic for the CLI tool, including the high-level flow, helper responsibilities, data format, and the current assumptions for PostgreSQL support.

## Project goal

The CLI currently supports:

- Backing up rows from a PostgreSQL table into a JSON file
- Restoring the saved JSON rows back into a PostgreSQL table

The project is intentionally **PostgreSQL-first**. MongoDB and Cassandra are listed as selectable options, but they are not implemented yet.

## Entry point

The CLI starts in `src/index.ts`.

### What happens in `src/index.ts`

1. `yargs` is initialized with `hideBin(process.argv)`
2. Two commands are registered:
   - `backup`
   - `restore`
3. A `--verbose` option is available
4. Each command calls the relevant function:
   - `backupCommand()`
   - `restoreCommand()`

## Backup command logic

The backup workflow lives in `src/command/backupCommand.ts`.

### Step-by-step flow

1. Show the intro banner with `@clack/prompts`
2. Ask the user to choose the database using `getDatabaseName()`
3. Resolve the database-specific package list using `databasePackages`
4. Run `downloadDependecies()` to install the required package(s)
5. Ask the user for the PostgreSQL connection string using `getConnectionString()`
6. Connect to PostgreSQL using `connectPostgres()`
7. Ask the user for the table name using `getTableName()`
8. Fetch all rows from the chosen table using `getTableData()`
9. Ask the user for the absolute output directory using `getDirectoryPath()`
10. Save the data using `saveBackup()`
11. Show the completion message and exit

### Details of each helper

#### `getDatabaseName()`

- Uses `select()` from `@clack/prompts`
- Shows the database options
- Uses `cancelCheck()` to stop cleanly if the user cancels

#### `downloadDependecies()`

- Calls `execa("npm", ["install", ...packages])`
- Runs in the current working directory
- Uses `stdio: "inherit"` so the install logs appear in the terminal

#### `getConnectionString()`

- Prompts the user to type a connection string
- Returns the string as plain text

#### `connectPostgres()`

- Creates a new `pg.Client`
- Passes the connection string
- Sets `ssl.rejectUnauthorized = false`
- Calls `await client.connect()`
- Runs `SELECT now()` to confirm the connection
- If anything fails, it logs the error and exits the process

#### `getTableName()`

- Prompts the user for the target table name
- Exits if the value is empty

#### `getTableData()`

- Builds the query as `SELECT * FROM <tableName>`
- Executes the query using the connected client
- Exits if no rows are returned

#### `getDirectoryPath()`

- Prompts the user for an absolute directory path
- Exits if the path is empty

#### `saveBackup()`

- Creates the directory using `fs.mkdir(dir, { recursive: true })`
- Writes a file named `backup_<tableName>.json`
- Stores the rows as pretty-printed JSON

## Backup file format

The backup is saved as a JSON array.

Example:

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

### Important notes

- The JSON file contains the full table row objects
- It is not a SQL dump
- Restore uses the saved row objects directly
- The current format does not include metadata like source table, timestamp, or row count

## Restore command logic

The restore workflow lives in `src/command/restoreCommand.ts`.

### Step-by-step flow

1. Show the intro banner
2. Ask the user to choose the database
3. Resolve the database-specific package list
4. Run `downloadDependecies()`
5. Ask the user for the PostgreSQL connection string
6. Connect to PostgreSQL using `connectPostgres()`
7. Ask the user for the backup file directory
8. Read the file contents using `fs.readFile()`
9. Parse the JSON into `records`
10. Check that the data is not empty
11. Ask the user for the target table name using `getTableName()`
12. For each record:
    - extract column names and values
    - build placeholders like `$1`, `$2`, ...
    - build an `INSERT ... ON CONFLICT (user_id) DO UPDATE` query
    - execute the query using the PostgreSQL client
13. Print a success message
14. End the client connection

## Restore query behavior

The current restore query is generated dynamically for each row.

### How the query is built

For every record:

1. `columns` = all keys in the object
2. `values` = all values in the object
3. `placeholders` = `$1`, `$2`, ... for each value
4. `updateClause` = all columns except `user_id`, using `EXCLUDED.<column>`

### Current SQL shape

```sql
INSERT INTO <table_name> (column_a, column_b, ...)
VALUES ($1, $2, ...)
ON CONFLICT (user_id)
DO UPDATE SET
  column_a = EXCLUDED.column_a,
  column_b = EXCLUDED.column_b
```

### Current assumptions

- The table has a `user_id` column
- `user_id` is the unique conflict target
- The backup file matches the destination table shape
- Each object in the JSON array is valid for the target table

### Important behavior

- Rows with an existing `user_id` are updated
- Rows without a matching `user_id` are inserted
- The restore is row-by-row and not wrapped in a transaction

## Why restore works today

The restore logic now works because `restoreCommand.ts` performs the actual database update/insert work:

- It reads the backup JSON
- It parses every row
- It builds a PostgreSQL insert/update query per row
- It executes that query against the connected client
- It closes the client after completion

## Error handling and current limitations

### Current handling

- Empty table backups stop the process
- Connection errors stop the process
- Empty table name input stops the process
- Empty directory input stops the process

### Current limitations

- Restore does not validate the JSON schema before inserting
- There is no transaction handling
- The conflict target is hardcoded to `user_id`
- There is no generic adapter for MongoDB or Cassandra
- `.env` is not yet integrated into restore connection setup

## Future expansion plan

To support more databases cleanly, the current logic should be refactored into a shared abstraction:

1. Add a database adapter interface
2. Move Postgres-specific code into a Postgres connector
3. Add MongoDB and Cassandra connectors
4. Add database-specific restore strategies
5. Add metadata to backup files
6. Add validation and transaction support

## Suggested improvement roadmap

1. Validate backup file structure and required columns
2. Add transaction support for restore
3. Load connection string from `.env`
4. Make conflict key configurable
5. Introduce database adapters for MongoDB and Cassandra
6. Add automated tests for backup and restore

## Summary

- Backup is currently implemented and uses JSON output
- Restore is currently implemented for PostgreSQL and performs insert/update operations
- The restore logic currently depends on `user_id` as the conflict key
- Future database support is planned but not yet implemented
