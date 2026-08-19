export const GET_CERTIFICATION_DETAILS_QUERY = `
  query GetCertificationDetails($itemId: String!) {
    item(path: $itemId, language: "en") {
      id
      name
      displayName
      sku: field(name: "sku") {
        value
      }
      headline: field(name: "headline") {
        value
      }
      formType: field(name: "formType") {
        ... on LookupField {
          targetItem {
            value: field(name: "Value") {
              value
            }
          }
        }
      }
      formLabelsAndTooltips: field(name: "formLabelsAndTooltips") {
        ... on LookupField {
          targetItem {
            id
            name
          }
        }
      }
      registerForExamLink: field(name: "registerForExamLink") {
        value
      }
    }
  }
`;
