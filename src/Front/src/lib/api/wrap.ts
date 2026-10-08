import type { ApiHandler } from './validating';

export type Wrapper = (handler: ApiHandler) => ApiHandler;

export function wrap(handler: ApiHandler) {
  return {
    in: (...wrappers: Wrapper[]): ApiHandler =>
      wrappers.reduce((prev, wrapper) => wrapper(prev), handler),
  };
}
