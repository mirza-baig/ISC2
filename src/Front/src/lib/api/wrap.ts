import type { ApiHandler } from './validating';

/**
 * Composes cross-cutting wrappers around a route handler:
 *
 *   export default wrap(validating({ schema, handler, extractor })).in(errorCatching());
 *
 * Router-agnostic. See GraphQL-API-Patterns.md §3.
 */
export type Wrapper = (handler: ApiHandler) => ApiHandler;

export function wrap(handler: ApiHandler) {
  return {
    in: (...wrappers: Wrapper[]): ApiHandler =>
      wrappers.reduce((prev, wrapper) => wrapper(prev), handler),
  };
}
