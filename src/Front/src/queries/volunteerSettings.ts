export const getVolunteerPageFields = (path: string): string => {
  const query = `query {
          contextItem: item(path: "/sitecore/content/ISC2/Main/Home/${path}", language: "en") {
            id
            name
            fields {
              name
              jsonValue
            }
          }
        }`;
  return query;
};
