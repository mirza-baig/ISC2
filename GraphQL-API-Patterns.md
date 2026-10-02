# GraphQL & API Route Patterns

Standard for API routes that talk to Sitecore Experience Edge in this repo.

Written for: frontend devs working on the GraphQL injection remediation (finding #4)
and any new API route after it.

---

## 1. Parameterize queries — never interpolate request data

This is the whole of finding #4.

### The vulnerable shape

```ts
export const getVolunteerPageFields = (path: string): string => {
  const query = `query {
    contextItem: item(path: "/sitecore/content/ISC2/Main/Home/${path}", language: "en") {
      id
      name
      fields { name jsonValue }
    }
  }`;
  return query;
};
```

A `"` in `path` escapes the string literal and re-aims the query at any item in the
tree. `fields { name jsonValue }` then returns everything on it.

### The safe shape

```ts
export const VOLUNTEER_PAGE_FIELDS = /* GraphQL */ `
  query VolunteerPageFields($path: String!, $language: String!) {
    contextItem: item(path: $path, language: $language) {
      id
      name
      fields { name jsonValue }
    }
  }
`;

// values travel in the variables bag, never in the document
getGraphQLResult(VOLUNTEER_PAGE_FIELDS, { path, language: 'en' });
```

The query is a **`const`, not a function**. That is the tell. If a query module
exports a function taking user data, it is building a document from that data.

**Schema note:** `src/Front/src/temp/GraphQLIntrospectionResult.json` confirms
`item(path:)`, `layout(routePath:)`, `layout(site:)` and `language` are all plain
`String` scalars, so every interpolated call site binds to a variable cleanly. There
is no schema blocker.

### The offenders (all fixed)

| File | Was interpolated | Reached from |
|---|---|---|
| `src/queries/volunteerSettings.ts` | `${path}` | `/api/volunteerfields` (unauthenticated) |
| `src/queries/searchSettings.ts` | `routePath: "${path}"` | `/api/middlewareFields` (unauthenticated) |
| `src/queries/votingSettings.ts` | `Voting Types/${key}` | `/api/voting/redirect` (session-gated) |
| `src/queries/searchSettings.ts` | `_name value: "${path}"` | `/api/rss/singleArticle` |
| `src/queries/searchSettings.ts` | `after: "${after}"` | `/api/rss/insights` |

### `/* GraphQL */` tag

Prefix query literals with the `/* GraphQL */` comment. Editors and lint plugins key
off it for syntax highlighting and validation. Free, and it marks intent.

---

## 2. Interpolating a constant is fine. Interpolating input is not.

Interpolating a **compile-time constant** into a query is safe — a template ID from a
constants module, or a fragment spliced in with `${SomeFragment}`. Neither is
reachable from a request.

The rule is **not** "no template literals in queries." It is:

> No value that originated in an HTTP request may become part of the query document.

Keep this distinction in mind with the lint rule below, or it will fight you on
legitimate fragment composition.

---

## 3. Validation by composition, so it can't be skipped

The routes are safe not by discipline but by construction: skipping validation
requires *removing* code, not *forgetting* to add it. The primitives live in
`src/lib/api/`.

```ts
// src/lib/api/extractors.ts
export type Extractor = (req: NextApiRequest) => unknown;

export const fromQuery: Extractor = (req) => req.query;
export const fromBody: Extractor = (req) => req.body;
export const composite =
  (extractors: Record<string, Extractor>): Extractor =>
  (req) =>
    Object.fromEntries(Object.entries(extractors).map(([k, fn]) => [k, fn(req)]));
```

```ts
// src/lib/api/validating.ts
export function validating<T>({ schema, handler, extractor }: {
  schema: ZodSchema<T>;
  handler: ValidatedHandler<T>;
  extractor: Extractor;
}) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const parsed = schema.safeParse(extractor(req));

    if (!parsed.success) {
      // RFC 9457 problem+json
      res.setHeader('Content-Type', 'application/problem+json');
      return res.status(400).json({
        type: 'https://datatracker.ietf.org/doc/html/rfc9110#section-15.5.1',
        title: 'One or more validation errors occurred',
        status: 400,
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    return handler(parsed.data, req, res);
  };
}
```

```ts
// src/lib/api/wrap.ts — router-agnostic composition
export function wrap(handler: ApiHandler) {
  return {
    in: (...wrappers: Wrapper[]): ApiHandler =>
      wrappers.reduce((prev, wrapper) => wrapper(prev), handler),
  };
}
```

Four things earn their keep:

1. **`handler` receives an already-validated typed object.** It cannot see raw
   request data, so it cannot forward it anywhere.
2. **`schema` is exported separately** — unit-testable without HTTP.
3. **`extractor` is pluggable** (`fromQuery`, `fromBody`, `composite({...})`) so the
   same handler works regardless of where input arrives.
4. **The route's default export is just `wrap(validating(...))`.** The logic lives in
   an exported `handler` a test can import directly.

### Applied to `/api/volunteerfields`

```ts
export const schema = z.object({
  pagepath: z
    .string()
    .min(1)
    .max(MAX_PAGEPATH_LENGTH)
    .transform((value) => stripQueryAndFragment(value).replace(/^\/+/, ''))
    .refine((path) => path.length > 0, 'pagepath is required')
    .refine(isUrlPath, 'pagepath contains characters that are not valid in a url path')
    .refine(
      (path) => !path.split('/').some((segment) => segment === '.' || segment === '..'),
      'pagepath may not traverse outside the Home subtree'
    ),
});

export const handler: ValidatedHandler<z.infer<typeof schema>> = async (input, _req, res) => {
  const result = await postSitecoreGraphQL(VOLUNTEER_PAGE_FIELDS, {
    path: `${VOLUNTEER_PAGE_ROOT}/${input.pagepath}`,
    language: 'en',
  });
  setAPIRouteHeaders(res, 'GET,DELETE,PATCH,POST,PUT');
  return res.status(200).send(result.data);
};

export default wrap(validating({ schema, handler, extractor: fromQuery })).in(
  errorCatching({ label: 'api/volunteerfields' })
);
```

The path prefix is still assembled here — but from a value validated to contain no
`"`, no `..`, and nothing outside a safe charset, and it goes into a **variable**,
not the document.

### Validation must stay permissive — see `src/lib/api/urlPath.ts`

`isUrlPath` allows the full RFC 3986 path charset and excludes only what could matter
if a query is ever mis-written (`" < > { } | \` `` ` ``, whitespace, control chars).
Being strict is actively harmful: `/api/middlewareFields` feeds `AccessControlPlugin`,
which treats **any** non-200 response as "no roles required" — i.e. public. A false
rejection of a legitimate URL silently de-protects a members-only page. So legal URL
characters (`' ( ) : @ , ; = +`) and real election names (`Board & Committee Election
(2025)`) must be accepted.

---

## 4. Errors: standard shape, nothing leaked

`errorCatching` turns any thrown error into a generic 500 (problem+json) and logs the
detail server-side. It replaces patterns like:

```ts
} catch (err) {
  return res.status(500).send(err);   // ships the axios error, incl. request config
}
```

That was a live information-disclosure bug, fixed in the same pass. While in these
files, also drop debug logging that echoes input or full responses (e.g. the old
`console.log(requestQuery)` and GraphQL-response dumps).

---

## 5. Keep the query, variables, and mapping together

Prefer an exported `fetchX()` plus an exported `mapX()` (or a small service object)
so the response mapping is a pure function you can pin with a captured Edge response.
That is exactly the characterization-test layer this refactor needed.

Longer term, the `axios.post` + `sc_apikey` block is hand-rolled in ~eleven files;
centralizing it behind one client is worth considering, but it is not part of
finding #4.

---

## 6. Test convention

Assert three things, mocking at the service boundary (not the network — you're
testing your mapping, not Sitecore's):

- **Schema and handler separately.** Input rules against the schema directly; the
  handler only ever gets valid input.
- **The error path**, not just the happy path.
- **The injection is closed** — the payload is rejected `400` *and* no injected field
  appears in the body.

Tests live beside the source as `*.test.ts` with jest — except the two locations
below.

---

## 6b. Where test files may NOT live

Two directories are scanned by tooling that treats every file in them as production
code. A `.test.ts` file in either breaks the build, and neither failure message
mentions tests.

**`src/lib/middleware/plugins/`** — `scripts/generate-plugins.ts` turns every file
here into an export in `src/temp/middleware-plugins.ts`. `accessControl.test.ts`
generated:

```ts
export { accessControl.testPlugin } from 'src/lib/middleware/plugins/accessControl.test';
//                  ^ Expected ',', got '.'
```

`PluginDefinition` (from `@sitecore-jss/sitecore-jss-dev-tools`) exposes no exclude
option, so the test lives outside the directory: `src/lib/middleware/accessControl.test.ts`,
importing `./plugins/accessControl`.

**`src/pages/api/`** — Next.js compiles every file here as an API route, so a test
file fails the route contract:

```
Type 'typeof import(".../volunteerfields.test")' does not satisfy 'ApiRouteConfig'.
  Property 'default' is missing
```

Route tests therefore live in `src/tests/api/`, importing `../../pages/api/<route>`.
`pageExtensions` can't express "everything except .test.ts" without renaming every
page, so relocating is the cheap fix.

After adding or moving anything under `src/lib/**/plugins/`, re-run `npm run bootstrap`
so `src/temp/` regenerates.

---

## 7. Lint rule to stop the regression

Every module in `src/queries/` now exports string constants, so a query *builder
function* is the smell. Live in `.eslintrc` as a scoped override:

```json
"overrides": [
  {
    "files": ["src/queries/**/*.ts"],
    "rules": {
      "no-restricted-syntax": [
        "error",
        {
          "selector": "ArrowFunctionExpression > TemplateLiteral",
          "message": "Query modules must export constant documents..."
        },
        {
          "selector": "FunctionDeclaration > BlockStatement TemplateLiteral",
          "message": "Query modules must export constant documents..."
        }
      ]
    }
  }
]
```

Two selectors, because the old builders came in both shapes — arrow functions
returning a literal, and function bodies assigning one to a local first.

It permits top-level `${CONSTANT}` / `${Fragment}` interpolation (§2) while flagging
functions that build documents from arguments. Verified by dropping a builder back
into `src/queries/` and confirming the rule fires.

A lint rule beats a test suite here: it fires in the editor, covers inputs nobody has
thought of, and makes the bug class hard to reintroduce rather than merely absent
today.

---

## What was delivered for finding #4

All parameterized, validated, and covered:

| Query document | Was | Reached from |
|---|---|---|
| `VOLUNTEER_PAGE_FIELDS` | `getVolunteerPageFields(path)` | `/api/volunteerfields` |
| `MIDDLEWARE_LAYOUT_FIELDS` | `middlewareApiForLayout(path)` | `/api/middlewareFields` |
| `ELECTIONS_VOTING_USER_INFO` | `getElectionsVotingUserInfo(key)` | `/api/voting/redirect` |
| `ARTICLE_RSS_FEED` | `getArticleRssFeed(path)` | `/api/rss/singleArticle` |
| `INSIGHTS_RSS_FEED` | `insightsRssFeedQuery(first, after)` | `/api/rss/insights` |
| `PUBLIC_PATH_BY_ITEM_PATH` / `_BY_ITEM_ID` | `resolvePublicPathBy*` | (no callers) |

The last three were not in the original scope; `getArticleRssFeed` takes a
user-supplied slug and was the same bug class.

Also shipped:

- zod schemas at the three route boundaries, via `src/lib/api/`.
- `getGraphQLResult(query, variables)` now forwards a variables bag.
- Fixed `res.status(500).send(err)` in `volunteerfields`, which returned the raw
  axios error — including the outbound request config — to the caller.
- Live probe suite (`security-probes.mjs`) plus jest coverage across the three routes
  and `AccessControlPlugin`.

### Still open

- **The fail-open in `accessControl.ts`.** `DEFAULT_RESPONSE` sets every role flag to
  `''`, so a failed layout query serves members-only pages to anyone. Tests in
  `accessControl.test.ts` pin this under a `fails OPEN` heading. Independent of
  finding #4; needs a product decision — hard-fail closed, or cache last-known-good.
- **Narrowing `VOLUNTEER_PAGE_FIELDS`.** It still selects `fields { name jsonValue }`
  wholesale. No longer reachable from outside the Home subtree, but selecting only the
  fields `OpportunityDetail` reads would be real defense in depth.
- **Findings #1 and #3 are not closed by this work.** The SharedKey and Algolia key
  still live in the Sitecore content tree, which Experience Edge serves to anyone
  holding the public delivery key.
