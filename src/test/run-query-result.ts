import { RunQuery, type QueryResult, r } from "../index";

type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

type User = { id: string; name: string };

const readUser = () => RunQuery(r.table<User>("users").get("u1"));

/** Fails when RunQuery again promises the query's own run() result, which no provider is checked against. */
export const resolvesToQueryResult: Equals<
  Awaited<ReturnType<typeof readUser>>,
  QueryResult
> = true;

/** Fails when RunQuery promises a `get` query the row type of its own run(), which no provider is checked against. */
export const doesNotPromiseTheRowType: Equals<
  Awaited<ReturnType<typeof readUser>>,
  User | null
> = false;
