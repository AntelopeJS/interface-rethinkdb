import { equal } from "@antelopejs/tooling-configs/verify";
import type { Journey, JourneyContext, VerifyConfig } from "@antelopejs/tooling-configs/verify";

import type * as RethinkInterface from "../../../src/index.ts";

const READY_POLLS = 60;
const SETTLE_MS = 500;

/** Starts a disposable RethinkDB in Docker on a free loopback port, hands its host and port to `use`, and removes the container whatever happens: the interface kind starts no services of its own. */
async function withRethinkdb(context: JourneyContext, use: (host: string, port: string) => Promise<void>): Promise<void> {
  const name = `${process.env.VERIFY_CONTAINER_PREFIX ?? "h6"}-interface-rethinkdb-db-${Date.now().toString(36)}`;
  const started = await context.command("start rethinkdb", "docker", ["run", "-d", "--name", name, "-p", "127.0.0.1::28015", "rethinkdb:2.4"], {
    timeoutMs: 120_000,
  });
  try {
    context.expect(started.folder, [{ name: "rethinkdb container started", pass: started.exitCode === 0, detail: started.stderr.slice(-300) }], {
      critical: true,
    });
    let ready = false;
    for (let poll = 0; poll < READY_POLLS && !ready; poll += 1) {
      const logs = await context.command("rethinkdb logs", "docker", ["logs", name]);
      ready = `${logs.stdout}${logs.stderr}`.includes("Server ready");
      if (!ready) await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
    }
    const mapped = await context.command("rethinkdb port", "docker", ["port", name, "28015/tcp"]);
    const port = /:(\d+)$/m.exec(mapped.stdout)?.[1];
    context.expect(mapped.folder, [{ name: "rethinkdb reported ready on a published port", pass: ready && port !== undefined, detail: mapped.stdout }], {
      critical: true,
    });
    await use("127.0.0.1", String(port));
  } finally {
    await context.command("remove rethinkdb", "docker", ["rm", "-f", name]);
  }
}

/** The setup every scenario shares: the packed interface, a native connection pool, and a provider that runs each query on that pool and records the run options. */
const SCENARIO_PRELUDE = `
const [dist, repo, host, port] = process.argv.slice(2);
const { createRequire } = require("node:module");
const driver = createRequire(repo + "/")("rethinkdb-ts");
const rdb = require(dist);
const { r } = rdb;
const seen = [];
const rejection = async (promise) => { try { await promise; return null; } catch (error) { return error.message; } };
const pick = (value, keys) => Object.fromEntries(keys.map((key) => [key, value[key] ?? null]));
let pool;
async function connect() {
  pool = await driver.r.connectPool({ host, port: Number(port), db: "test" });
  rdb.RunQuery.proxy.onCall(async (query, options) => { seen.push(options ?? null); return options === undefined ? query.run() : query.run(options); }, true);
}
`;

const SCENARIO_TAIL = `
connect().then(main).then(async (out) => { console.log(JSON.stringify(out, (key, value) => (value === undefined ? null : value))); await pool.drain(); process.exit(0); }, (error) => { console.error(error); process.exit(1); });
`;

/** Reads the table back with the native driver on a fresh connection, without the interface: the second view. */
const READBACK = `
const [repo, host, port, table] = process.argv.slice(2);
const { r } = require("node:module").createRequire(repo + "/")("rethinkdb-ts");
(async () => {
  const pool = await r.connectPool({ host, port: Number(port), db: "test" });
  const rows = await r.table(table).orderBy("id").run();
  console.log(JSON.stringify(rows.map((row) => ({ ...row, id: /^[0-9a-f]{8}-/.test(row.id) ? "generated" : row.id, createdAt: row.createdAt instanceof Date ? "date" : row.createdAt }))));
  await pool.drain();
  process.exit(0);
})();
`;

/** The probe header: `Assert<Identical<A, B>>` fails to compile unless A and B are the same type, so an added optional field or a widening to `any` is caught. */
const PROBE_HEADER = `
type Identical<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type NotAny<T> = 0 extends 1 & T ? false : true;
type Assert<T extends true> = T;
`;

interface Scenario {
  title: string;
  body: string;
  printed: string;
  table?: string;
  stored?: string;
}

/** Runs a scenario against the packed interface with a provider that executes on a live RethinkDB, then reads the table back through the native driver. */
function live({ title, body, printed, table, stored }: Scenario): Journey {
  return {
    title,
    entryPoint: "the packed interface driven from a Node process with a provider that runs queries on a RethinkDB container",
    async run(context) {
      await withRethinkdb(context, async (host, port) => {
        const file = `${context.work}/scenario.js`;
        context.edit("write the scenario", file, `${SCENARIO_PRELUDE}\nasync function main() {\n${body}\n}\n${SCENARIO_TAIL}`);
        const ran = await context.command("run the scenario", "node", [file, `${context.repo}/dist/index.js`, context.repo, host, port], { timeoutMs: 90_000 });
        context.expect(ran.folder, [
          { name: "the scenario ended cleanly", pass: ran.exitCode === 0, detail: ran.stderr.slice(-300) },
          equal("the scenario printed what docs/1.introduction.md promises", ran.stdout.trim().split("\n").at(-1) ?? "", printed),
        ]);
        if (table === undefined) return;
        const readback = `${context.work}/readback.js`;
        context.edit("write the read-back", readback, READBACK);
        const read = await context.command("read the table back natively", "node", [readback, context.repo, host, port, table], { timeoutMs: 60_000 });
        context.expect(read.folder, [equal("RethinkDB holds the records the scenario left", read.stdout.trim(), stored ?? "")]);
      });
    },
  };
}

/** Runs a scenario that needs no database: only the packed interface and a recording provider. */
function offline(title: string, body: string, printed: string): Journey {
  return {
    title,
    entryPoint: "the packed interface driven from a Node process",
    async run(context) {
      const file = `${context.work}/scenario.js`;
      const prelude = `
const [dist, repo] = process.argv.slice(2);
const { createRequire } = require("node:module");
const driver = createRequire(repo + "/")("rethinkdb-ts");
const rdb = require(dist);
const { r } = rdb;
const calls = [];
rdb.RunQuery.proxy.onCall(async (query, options) => { calls.push([query, options ?? null]); return "ran"; }, true);
`;
      context.edit("write the scenario", file, `${prelude}\nasync function main() {\n${body}\n}\nmain().then((out) => { console.log(JSON.stringify(out)); process.exit(0); }, (error) => { console.error(error); process.exit(1); });\n`);
      const ran = await context.command("run the scenario", "node", [file, `${context.repo}/dist/index.js`, context.repo], { timeoutMs: 60_000 });
      context.expect(ran.folder, [
        { name: "the scenario ended cleanly", pass: ran.exitCode === 0, detail: ran.stderr.slice(-300) },
        equal("the answers are what the docs promise", ran.stdout.trim().split("\n").at(-1) ?? "", printed),
      ]);
    },
  };
}

/** Compiles a probe against the packed declarations in the consumer's strict mode. */
function declared(title: string, probe: string): Journey {
  return {
    title,
    entryPoint: "a TypeScript consumer compiling against the packed declarations",
    async run(context) {
      const file = `${context.work}/probe.ts`;
      await context.command("link the repository's dependencies", "ln", ["-s", `${context.repo}/node_modules`, `${context.work}/node_modules`]);
      context.edit("write the shape probe", file, `import * as Api from "${context.repo}/dist/index";\nimport type { RQuery, RunOptions } from "rethinkdb-ts";\nimport { r as driverR } from "rethinkdb-ts";\n${PROBE_HEADER}\n${probe}`);
      const compiled = await context.command("compile the shape probe", "node", [
        `${context.repo}/node_modules/typescript/bin/tsc`,
        "--noEmit",
        "--strict",
        "--skipLibCheck",
        "--target",
        "es2022",
        "--module",
        "commonjs",
        "--moduleResolution",
        "node",
        "--typeRoots",
        `${context.repo}/node_modules/@types`,
        "--types",
        "node",
        file,
      ]);
      context.expect(compiled.folder, [{ name: "every export has the documented shape", pass: compiled.exitCode === 0, detail: compiled.stdout.slice(0, 600) }]);
    },
  };
}

const BUILDER_BODY = `
  const query = r.table("users").filter({ active: true });
  const before = calls.length;
  const answer = await rdb.RunQuery(query);
  return {
    sameAsDriver: r === driver.r,
    exports: Object.keys(rdb).sort(),
    buildingRanNothing: before === 0,
    runQueryReachedTheProvider: calls.length === 1 && calls[0][0] === query,
    answer,
  };
`;

const CRUD_BODY = `
  await r.tableCreate("users").run();
  const inserted = await rdb.RunQuery(r.table("users").insert({ name: "Ada", email: "ada@example.com", active: true, createdAt: r.now() }));
  const id = inserted.generated_keys[0];
  await rdb.RunQuery(r.table("users").insert([{ id: "u2", name: "Bob", active: false }, { id: "u3", name: "Cy", active: true }]));
  const got = await rdb.RunQuery(r.table("users").get(id));
  const missing = await rdb.RunQuery(r.table("users").get("nope"));
  const active = (await rdb.RunQuery(r.table("users").filter({ active: true }))).map((user) => user.name).sort();
  const updated = await rdb.RunQuery(r.table("users").get("u2").update({ email: "bob@example.com" }));
  const unchanged = await rdb.RunQuery(r.table("users").get("u2").update({ email: "bob@example.com" }));
  const skipped = await rdb.RunQuery(r.table("users").get("ghost").update({ email: "x" }));
  const duplicate = await rdb.RunQuery(r.table("users").insert({ id: "u2", name: "Dup" }));
  const deleted = await rdb.RunQuery(r.table("users").get("u3").delete());
  const deletedAgain = await rdb.RunQuery(r.table("users").get("u3").delete());
  const absentTable = await rejection(rdb.RunQuery(r.table("absent").get("1")));
  return {
    keyIsAString: typeof id === "string",
    inserted: pick(inserted, ["inserted", "errors"]),
    got: [got.name, got.email, got.createdAt instanceof Date],
    missingIsNull: missing === null,
    active,
    updated: pick(updated, ["replaced", "unchanged", "skipped", "errors"]),
    unchanged: pick(unchanged, ["replaced", "unchanged", "skipped", "errors"]),
    skipped: pick(skipped, ["replaced", "unchanged", "skipped", "errors"]),
    duplicate: [duplicate.errors, duplicate.inserted, String(duplicate.first_error).startsWith("Duplicate primary key")],
    deleted: pick(deleted, ["deleted", "errors"]),
    deletedAgain: pick(deletedAgain, ["deleted", "skipped", "errors"]),
    absentTable: String(absentTable).includes("does not exist"),
  };
`;

const OPTIONS_BODY = `
  await r.tableCreate("items").run();
  await r.table("items").insert([{ id: 1, tag: "a" }, { id: 2, tag: "b" }]).run();
  const plain = await rdb.RunQuery(r.table("items").count());
  const outdated = await rdb.RunQuery(r.table("items").filter({ tag: "a" }), { readMode: "outdated" });
  const soft = await rdb.RunQuery(r.table("items").insert({ id: 3, tag: "c" }), { durability: "soft" });
  const refused = await rejection(rdb.RunQuery(r.table("items").count(), { readMode: "invalid" }));
  return { plain, outdated: outdated.map((item) => item.id), soft: pick(soft, ["inserted", "errors"]), refused: refused !== null, seen };
`;

const ADVANCED_BODY = `
  await r.tableCreate("users").run();
  await r.tableCreate("posts").run();
  await r.table("posts").indexCreate("authorId").run();
  await r.table("posts").indexWait("authorId").run();
  await r.table("users").insert([{ id: "u1", role: "admin" }, { id: "u2", role: "member" }, { id: "u3", role: "member" }]).run();
  await r.table("posts").insert([{ id: "p1", authorId: "u1" }, { id: "p2", authorId: "u1" }, { id: "p3", authorId: "u2" }]).run();
  const joined = await rdb.RunQuery(r.table("users").eqJoin("id", r.table("posts"), { index: "authorId" }));
  const grouped = await rdb.RunQuery(r.table("users").group("role").count());
  const count = await rdb.RunQuery(r.table("users").count());
  return {
    joined: joined.map((row) => [row.left.id, row.right.id]).sort(),
    grouped: grouped.map((entry) => [entry.group, entry.reduction]).sort(),
    count,
  };
`;

const BUILDER_TYPES = `
type _R = Assert<Identical<typeof Api.r, typeof driverR>>;
type _Exports = Assert<Identical<keyof typeof Api, "RunQuery" | "r">>;
`;

const RUN_TYPES = `
type _Signature = Assert<Identical<typeof Api.RunQuery, <T extends RQuery>(query: T, options?: RunOptions) => Promise<Awaited<ReturnType<T["run"]>>>>>;
const get = Api.r.table("users").get("1");
const insert = Api.r.table("users").insert({ name: "a" });
const filter = Api.r.table("users").filter({ active: true });
const grouped = Api.r.table("users").group("role").count();
async function answers() {
  const one = await Api.RunQuery(get);
  const written = await Api.RunQuery(insert);
  const many = await Api.RunQuery(filter);
  const counts = await Api.RunQuery(grouped);
  type _One = Assert<Identical<typeof one, Awaited<ReturnType<typeof get.run>>>>;
  type _Written = Assert<Identical<typeof written, Awaited<ReturnType<typeof insert.run>>>>;
  type _Many = Assert<Identical<typeof many, Awaited<ReturnType<typeof filter.run>>>>;
  type _Counts = Assert<Identical<typeof counts, Awaited<ReturnType<typeof grouped.run>>>>;
  type _WrittenKnown = Assert<NotAny<typeof written>>;
  type _ManyKnown = Assert<NotAny<typeof many>>;
  type _Options = Assert<Identical<Parameters<typeof Api.RunQuery>[1], RunOptions | undefined>>;
}
void answers;
`;

const config: VerifyConfig<typeof RethinkInterface> = {
  doors: {
    data: null,
    format: null,
    contract: {
      globs: ["src/index.ts", "package.json"],
      funnels: [],
      containments: [],
      why: "RunQuery, its answer type and the re-exported `r` are what every module that runs native queries imports",
    },
    outbound: {
      globs: ["src/index.ts"],
      funnels: [],
      containments: [],
      why: "RunQuery hands every query and its run options to the database provider; what is sent, and what comes back, is decided at this file",
    },
    exposure: null,
    publish: {
      globs: ["package.json", ".release-it.json", "changelogen.config.json", ".github/workflows/release.yml"],
      funnels: [],
      containments: [],
      why: "the package name and release workflow claim @antelopejs/interface-rethinkdb on npm",
    },
  },
  interface: {
    calls: {
      ".:r": { call: (api) => "table" in api.r && "now" in api.r, expect: true },
    },
  },
  journeys: {
    "builder-reexport": offline("`r` is the rethinkdb-ts builder itself, building a query runs nothing and RunQuery is the only way to execute it", BUILDER_BODY, '{"sameAsDriver":true,"exports":["RunQuery","r"],"buildingRanNothing":true,"runQueryReachedTheProvider":true,"answer":"ran"}'),
    "builder-types": declared("`r` has the driver's type and the package exports exactly `r` and `RunQuery`", BUILDER_TYPES),
    "crud-roundtrip": live({
      title: "RunQuery inserts, reads, updates and deletes documents and returns the driver's own results, write errors included, then the table is read back natively",
      body: CRUD_BODY,
      printed: '{"keyIsAString":true,"inserted":{"inserted":1,"errors":0},"got":["Ada","ada@example.com",true],"missingIsNull":true,"active":["Ada","Cy"],"updated":{"replaced":1,"unchanged":0,"skipped":0,"errors":0},"unchanged":{"replaced":0,"unchanged":1,"skipped":0,"errors":0},"skipped":{"replaced":0,"unchanged":0,"skipped":1,"errors":0},"duplicate":[1,0,true],"deleted":{"deleted":1,"errors":0},"deletedAgain":{"deleted":0,"skipped":1,"errors":0},"absentTable":true}',
      table: "users",
      stored: '[{"active":true,"createdAt":"date","email":"ada@example.com","id":"generated","name":"Ada"},{"active":false,"email":"bob@example.com","id":"u2","name":"Bob"}]',
    }),
    "run-types": declared("RunQuery has the documented generic signature and answers each query with the type of its own `run()`", RUN_TYPES),
    "run-options": live({ title: "RunQuery hands the run options to the provider untouched and the database honours them", body: OPTIONS_BODY, printed: '{"plain":2,"outdated":[1],"soft":{"inserted":1,"errors":0},"refused":true,"seen":[null,{"readMode":"outdated"},{"durability":"soft"},{"readMode":"invalid"}]}', table: "items", stored: '[{"id":1,"tag":"a"},{"id":2,"tag":"b"},{"id":3,"tag":"c"}]' }),
    "joins-and-aggregates": live({ title: "RunQuery returns the joined rows and the grouped counts the driver builds", body: ADVANCED_BODY, printed: '{"joined":[["u1","p1"],["u1","p2"],["u2","p3"]],"grouped":[["admin",1],["member",2]],"count":3}' }),
  },
};

export default config;
