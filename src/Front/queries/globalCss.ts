export const getGlobalCSSQuery = (): string => {
  const query = `
    query GetGlobalCSS {
      item(path: "/sitecore/content/ISC2/Main/Settings", language: "en") {
        id
        name
        path
        field(name: "Global CSS") {
          name
          value
        }
      }
    }
  `;
  return query;
};
