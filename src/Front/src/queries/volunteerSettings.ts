/**
 * Volunteer page fields, addressed by item path.
 *
 * `path` is a GraphQL variable, never interpolated — callers pass the resolved item
 * path in the variables bag. See GraphQL-API-Patterns.md §1.
 */
export const VOLUNTEER_PAGE_FIELDS = /* GraphQL */ `
  query VolunteerPageFields($path: String!, $language: String!) {
    contextItem: item(path: $path, language: $language) {
      id
      name
      fields {
        name
        jsonValue
      }
    }
  }
`;

export const VOLUNTEER_PAGE_ROOT = '/sitecore/content/ISC2/Main/Home';
