import { InterfaceFunction } from "@antelopejs/interface-core";
import { type RQuery, type RunOptions, r } from "rethinkdb-ts";

export { r };

/**
 * A value a RethinkDB query can resolve to with the default run options: a JSON value, a `Date`
 * for a time, bytes for binary data, or `undefined` when the server sends no result.
 */
export type QueryResult =
  | null
  | undefined
  | boolean
  | number
  | string
  | Date
  | Uint8Array
  | QueryResult[]
  | { [key: string]: QueryResult };

/**
 * Executes a RethinkDB query with optional configuration options.
 *
 * The implementing module runs the query, and the interface cannot check that its result matches
 * the query, so the result is a {@link QueryResult}. Narrow it before you read a field.
 *
 * @param query - The RethinkDB query to execute
 * @param options - Optional configuration for query execution (e.g., read mode, durability)
 * @returns A promise that resolves to the result the implementing module returns
 * @example
 * ```typescript
 * const result = await RunQuery(r.table('users').get('123'), { readMode: 'outdated' });
 * ```
 */
export const RunQuery =
  InterfaceFunction<
    (query: RQuery, options?: RunOptions) => Promise<QueryResult>
  >();
