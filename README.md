# Database Backup Tool

### Project URL :
https://roadmap.sh/projects/database-backup-utility

A small CLI utility for backing up and restoring PostgreSQL data. The project supports compressed table dumps plus PostgreSQL physical full, incremental, and differential backup workflows when WAL archiving is already enabled and available from a local or mounted archive directory.

## Repository

- GitHub: https://github.com/TusharGupta012735/database-backup.git

## Overview

This tool helps you:

- Select the database type from the CLI
- Enter a PostgreSQL connection string
- Choose a backup type
- Create a compressed table-level dump with `pg_dump`
- Create a full physical base backup with `pg_basebackup`
- Create incremental or differential WAL archive backups from an existing full backup metadata file
- Choose the directory where backup artifacts should be saved
- Restore compressed custom-format dumps with `pg_restore`

The active implementation is focused on **PostgreSQL**, with placeholders for MongoDB and Cassandra support in the future.

## Current status

### Working today

- Backup flow for **PostgreSQL**
- Restore flow for **PostgreSQL** compressed dumps
- Interactive CLI prompts using `@clack/prompts`
- Compressed table backups using `pg_dump --format=custom`
- Full physical PostgreSQL backups using `pg_basebackup`
- WAL-archive incremental backups that copy archived WAL files since the previous full or incremental backup
- WAL-archive differential backups that copy archived WAL files since the previous full backup

### Still planned / future work

- MongoDB and Cassandra are listed as selectable options, but their connection and restore logic are not implemented yet
- `.env` support is not yet wired into the restore flow
- Physical recovery orchestration for full + WAL backup chains is not yet automated

## Project structure

- `src/index.ts` – CLI entry point and command registration
- `src/command/backupCommand.ts` – backup workflow
- `src/command/restoreCommand.ts` – restore workflow
- `src/connection/postgres.ts` – PostgreSQL connection logic
- `src/helper/postgresBackupUtils.ts` – PostgreSQL dump, base backup, WAL archive backup, and metadata helpers
- `src/helper/getBackupType.ts` – prompt for table, full, incremental, or differential backups
- `src/helper/getWalArchivePath.ts` – prompts for WAL archive and previous metadata paths
- `src/helper/*.ts` – prompt helpers, directory selection, file writing, and database-specific utilities
- `src/constants/*.ts` – database list and package mappings

## Dependencies

### Runtime dependencies

- `@clack/prompts` – interactive CLI prompts
- `dotenv` – loads environment variables from `.env`
- `execa` – runs shell commands such as `pg_dump`, `pg_restore`, `pg_basebackup`, and `npm install`
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

## PostgreSQL backup types

### Table dump

Creates one compressed custom-format table backup with `pg_dump`.

Output file:

```text
backup_<table_name>.dump
```

This is the best option when you need a portable logical backup of one table.

### Full backup

Creates a physical PostgreSQL base backup with `pg_basebackup` and writes metadata next to the backup artifacts.

The command uses:

```text
pg_basebackup --format=tar --gzip --wal-method=fetch
```

Output directory example:

```text
full_2026-06-04T12-00-00-000Z/
  base.tar.gz
  postgres-backup-metadata.json
```

The metadata records the current WAL file at backup time. Incremental and differential backups use that marker to decide which archived WAL files to copy.

### Incremental backup

Creates a WAL-only backup by copying files from the configured WAL archive directory. Incremental backups start from the `currentWalFile` in the previous full or incremental backup metadata and copy through the server's current WAL file.

Use this when you want a backup containing only WAL generated since the latest backup in the chain.

Required prompts:

- PostgreSQL connection string
- Backup output directory
- Local or mounted WAL archive directory
- Previous backup metadata file or directory

### Differential backup

Creates a WAL-only backup by copying files from the configured WAL archive directory. Differential backups start from the `fullBackupWalFile` in the previous full backup metadata and copy through the server's current WAL file.

Use this when you want each differential backup to be restorable with the original full backup without applying earlier incrementals.

Required prompts:

- PostgreSQL connection string
- Backup output directory
- Local or mounted WAL archive directory
- Previous full backup metadata file or directory

## WAL archive requirements

Incremental and differential backup options assume PostgreSQL WAL archiving is already enabled on the database server and that archived WAL files are readable from the machine running this CLI. For example, the archive may be mounted locally from network storage.

The utility does not enable PostgreSQL archive mode for you. It copies files from the archive directory whose names fall between the stored backup WAL marker and the current WAL file reported by PostgreSQL.

Each full, incremental, and differential backup writes:

```text
postgres-backup-metadata.json
```

That metadata file tracks:

- Backup type
- Creation time
- Backup path
- WAL archive path for WAL-only backups
- Full backup WAL marker
- Previous WAL marker
- Current WAL marker
- Copied WAL file names

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

### 4. Backup type selection

`getBackupType()` asks whether to create a table dump, full backup, incremental backup, or differential backup.

### 5. Connection setup

`getConnectionString()` asks the user to enter a PostgreSQL connection string.

For WAL-aware backup modes, `connectPostgres()` opens a PostgreSQL connection and `getCurrentWalFile()` runs:

```sql
SELECT pg_walfile_name(pg_current_wal_lsn()) AS wal_file
```

### 6. Backup execution

Depending on the selected backup type:

- Table dump: runs `pg_dump` for the selected table
- Full backup: runs `pg_basebackup`
- Incremental backup: copies archived WAL files since the previous backup metadata marker
- Differential backup: copies archived WAL files since the full backup metadata marker

## How the restore flow works

The restore flow is implemented in `src/command/restoreCommand.ts`.

### Restore steps

1. Ask the user to select the database
2. Download database-specific dependencies
3. Ask for the PostgreSQL connection string
4. Ask for the backup file path
5. Run `pg_restore --clean --if-exists --no-owner`
6. Print a success message

### Restore behavior

For PostgreSQL, the current restore logic restores compressed custom-format dump files created by the table dump option. Full physical backup and WAL replay recovery still require PostgreSQL recovery tooling outside this CLI.

## Current limitations

- MongoDB and Cassandra are not functionally implemented yet
- The restore command currently handles compressed custom-format dumps, not full physical recovery chains
- Incremental and differential backups require a readable local or mounted WAL archive directory
- Incremental and differential backups depend on metadata generated by this tool
- The utility does not configure `archive_mode` or `archive_command` on PostgreSQL

## Suggested next improvements

1. Add automated restore orchestration for full + WAL backup chains
2. Add validation that the supplied WAL archive contains every required segment
3. Add timeline-aware WAL chain validation for point-in-time recovery
4. Add table existence validation before table dump restore
5. Add a proper `.env`-based connection configuration flow
6. Implement database adapters for MongoDB and Cassandra
7. Add metadata checksums for backup integrity validation

## Example workflows

### Table backup

```bash
npm run backup
```

CLI flow:

1. Select `Postgres`
2. Select `Table dump`
3. Enter an absolute directory path
4. Enter your PostgreSQL connection string
5. Enter the table name
6. The tool saves `backup_<table>.dump`

### Full backup

```bash
npm run backup
```

CLI flow:

1. Select `Postgres`
2. Select `Full backup`
3. Enter an absolute directory path
4. Enter your PostgreSQL connection string
5. The tool saves a `full_<timestamp>` directory with `pg_basebackup` output and metadata

### Incremental backup

```bash
npm run backup
```

CLI flow:

1. Select `Postgres`
2. Select `Incremental backup`
3. Enter an absolute directory path
4. Enter your PostgreSQL connection string
5. Enter the WAL archive directory
6. Enter the previous full or incremental backup metadata path
7. The tool saves an `incremental_<timestamp>` directory with copied WAL files and metadata

### Differential backup

```bash
npm run backup
```

CLI flow:

1. Select `Postgres`
2. Select `Differential backup`
3. Enter an absolute directory path
4. Enter your PostgreSQL connection string
5. Enter the WAL archive directory
6. Enter the previous full backup metadata path
7. The tool saves a `differential_<timestamp>` directory with copied WAL files and metadata

### Restore compressed table dump

```bash
npm run restore
```

CLI flow:

1. Select `Postgres`
2. Enter your PostgreSQL connection string
3. Enter the backup file path
4. The tool runs `pg_restore`
5. The tool prints `Database restored succesfully`

## Notes

This project is currently designed for **PostgreSQL only**, and the codebase is structured to expand toward other databases in the future. WAL-aware incremental and differential backup options now exist for PostgreSQL installations that already archive WAL files, while physical recovery automation remains a future enhancement.
