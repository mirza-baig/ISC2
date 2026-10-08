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
