# Database Connection Input Validation Specification

This document details the mandatory validation rules required for processing database connection settings. Every input field must undergo safety, format, and constraint checks before initializing a database connection layer.

---

## 1. Database Host (`PGHOST`)
Validates the server endpoint string. Captures formatting anomalies and protocol copy-paste errors.

* **Presence Check:** Must not be empty or whitespace-only.
* **Protocol Exclusion:** Must **not** contain protocol prefixes (e.g., `postgres://`, `http://`, `https://`).
* **Port Separation:** Must **not** contain an inline port mapping (e.g., `:` delimiter followed by numbers like `localhost:5432`).
* **Format Check:** Must match a valid hostname, Fully Qualified Domain Name (FQDN), or IP address format (alphanumeric characters, hyphens, and periods only).
  > **Allowed characters regex:** `/^[a-zA-Z0-9.-]+$/`

---

## 2. Port (`PGPORT`)
Validates the TCP network port routing destination.

* **Presence Check:** Must not be empty or whitespace-only.
* **Data Type Check:** Must consist strictly of numerical digits. No decimals, signs (`+`/`-`), or alpha characters allowed.
* **Range Boundaries:** Must evaluate to an integer value greater than or equal to `1` and less than or equal to `65535`.

---

## 3. Database User (`PGUSER`)
Validates the database role identifier against default PostgreSQL architectural naming constraints.

* **Presence Check:** Must not be empty or whitespace-only.
* **Whitespace Exclusion:** Must not contain interior, leading, or trailing spaces.
* **Length Constraints:** Must not exceed a maximum length of **63 characters** (PostgreSQL’s default identifier limit).
* **Character Structure:** Must begin with a letter (`a-z`, `A-Z`) or an underscore (`_`). Subsequent characters must be restricted strictly to alphanumeric symbols or underscores.
  > **Allowed structure regex:** `/^[a-zA-Z_][a-zA-Z0-9_]*$/`

---

## 4. Database Name (`PGDATABASE`)
Validates the target database system catalog identifier.

* **Presence Check:** Must not be empty or whitespace-only.
* **Whitespace Exclusion:** Must not contain interior, leading, or trailing spaces.
* **Length Constraints:** Must not exceed a maximum length of **63 characters** (PostgreSQL’s default identifier limit).
* **Character Structure:** Must begin with a letter (`a-z`, `A-Z`) or an underscore (`_`). Subsequent characters must be restricted strictly to alphanumeric symbols or underscores.
  > **Allowed structure regex:** `/^[a-zA-Z_][a-zA-Z0-9_]*$/`

---

## 5. Password (`PGPASSWORD`)
Validates the authentication pass-phrase credential.

* **Presence Check:** Must not be empty.
* **Whitespace Exclusion:** Must not contain leading or trailing spaces (to eliminate copy-paste trailing newlines), and must not contain interior spaces depending on organizational policy requirements.

---

## Quick Reference Summary Table

| Field | Required? | Max Length | Format Constraints |
| :--- | :---: | :---: | :--- |
| **Host** | Yes | None | No protocol (`https://`), no inline port (`:5432`), domain/IP chars only. |
| **Port** | Yes | 5 digits | Numeric only, range `1` to `65535`. |
| **User** | Yes | 63 chars | No spaces, alphanumeric + `_` only, must start with alpha/`_`. |
| **Database** | Yes | 63 chars | No spaces, alphanumeric + `_` only, must start with alpha/`_`. |
| **Password** | Yes | None | No leading, trailing, or internal spaces. |