export const getCreditHoldLabelsQuery = (): string => {
  const query = `
    query GetCreditHoldLabels {
      item(path: "/sitecore/content/ISC2/Main/Data/My Account/Payment Information", language: "en") {
        field(name: "labelsMessagesAndMore") {
          value
        }
      }
    }
  `;
  return query;
};
