import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import type { Client } from "pg";

import { establishConnection } from "../src/components/establishConnection.ts";
import { connectPostgres } from "../src/connection/postgres.ts";

class FakePgClient {
  public connected = false;
  public queries: string[] = [];

  async connect() {
    this.connected = true;
  }

  async query(sql: string) {
    this.queries.push(sql);
    return { rows: [{ now: new Date("2026-05-27T00:00:00.000Z") }] };
  }
}

describe("database connectivity", () => {
  it("opens a PostgreSQL client and verifies the connection with a simple query", async () => {
    const fakeClient = new FakePgClient();

    const client = await connectPostgres(
      "postgres://user:pass@localhost:5432/app",
      () => fakeClient as unknown as Client,
    );

    assert.equal(client, fakeClient);
    assert.equal(fakeClient.connected, true);
    assert.deepEqual(fakeClient.queries, ["Select now()"]);
  });

  it("uses a pasted connection string when that connection method is selected", async () => {
    const fakeClient = new FakePgClient();
    const connect = mock.fn(async (connectionString: string) => {
      assert.equal(connectionString, "postgres://user:pass@localhost:5432/app");
      return fakeClient as unknown as Client;
    });

    const client = await establishConnection("postgres", {
      selectConnectionMethod: mock.fn(
        async () => "cs",
      ) as typeof import("@clack/prompts").select,
      requestConnectionString: mock.fn(
        async () => "postgres://user:pass@localhost:5432/app",
      ),
      requestDbCredentials: mock.fn(async () => {
        throw new Error("credentials prompt should not be called");
      }),
      connect,
    });

    assert.equal(client, fakeClient);
    assert.equal(connect.mock.callCount(), 1);
  });

  it("builds a connection string from prompted credentials", async () => {
    const fakeClient = new FakePgClient();
    const connect = mock.fn(async (connectionString: string) => {
      assert.equal(connectionString, "postgres://db_user:s3cret@localhost:5432/app");
      return fakeClient as unknown as Client;
    });

    const client = await establishConnection("postgres", {
      selectConnectionMethod: mock.fn(
        async () => "manual",
      ) as typeof import("@clack/prompts").select,
      requestConnectionString: mock.fn(async () => {
        throw new Error("connection string prompt should not be called");
      }),
      requestDbCredentials: mock.fn(async () => ({
        host: "localhost",
        port: "5432",
        user: "db_user",
        database: "app",
        password: "s3cret",
      })),
      connect,
    });

    assert.equal(client, fakeClient);
    assert.equal(connect.mock.callCount(), 1);
  });
});
