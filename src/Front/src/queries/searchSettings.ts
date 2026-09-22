export const SEARCH_SETTINGS_QUERY = `
  query {
    algoliaDetails: item(path:"/sitecore/content/ISC2/Main/Settings/Algolia Search Settings", language:"en") {
      algoliaApiKey :field(name:"algoliaApiKey") {
        value
      }
      algoliaAppId: field(name:"algoliaAppId") {
        value
      }
      algoliaIndexName: field(name:"algoliaIndexName") {
        value
      }
      algoliaAutosuggestIndexName: field(name:"algoliaAutosuggestIndexName") {
        value
      }
      placeholderText: field(name:"placeholderText") {
        value
      }
      algoliaProductRecommendationIndexName: field(name:"algoliaProductRecommendationIndexName") {
        value
      }
      startSearchTriggerTypes: field(name:"startSearchTriggerTypes") {
        value
      }
      pressEnterKeySearchLabel: field(name:"pressEnterKeySearchLabel") {
        value
      }
      min3CharacterSearchLabel: field(name:"min3CharacterSearchLabel") {
        value
      }
      searchModalNavigationItems: field(name:"searchModalNavigationItems") {
        ... on LookupField {
          navigationItemsDataSource: targetItem {
            name
            navigationItemsList: children {
              items: results {
                sectionTitle: field(name:"sectionTitle") {
                  value
                }
                sectionType: field(name:"sectionType") {
                  ... on LookupField {
                    item: targetItem {
                      type: field(name:"Value") {
                        value
                      }
                    }
                  }
                }
                sectionOtherProperties: field(name:"sectionOtherProperties") {
                  value
                }
                sectionFallbackProductsList: field(name:"sectionFallbackProductsList") {
                  ... on MultilistField {
                    targetItems {
                      url {
                        path
                      }
                      ... on ProductDetailPage {
                        productName: field(name:"headline") {
                          value
                        }
                        productImage: field(name:"logoImage") {
                          item: jsonValue
                        }
                        productType: field(name:"formType") {
                          ... on LookupField {
                            item: targetItem {
                              type: field(name:"Value") {
                                value
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
                sectionLinks: children (includeTemplateIDs: ["{89F1877D-4421-4093-BC7D-51263572BBEF}"]) {
                  items: results {
                    link: field(name:"link") {
                      item: jsonValue
                    }
                  }
                }
                sectionListItems: children (includeTemplateIDs: ["{D2923FEE-DA4E-49BE-830C-E27764DFA269}"]) {
                  items: results {
                    value: field(name:"Value") {
                      value
                    }
                  }
                }
                userProfileSections: children (includeTemplateIDs: ["{D46DEF33-53B2-4AC2-8105-0C5059557606}"]) {
                  items: results {
                    type: name
                    userSectionName: field(name:"userSectionName") {
                      value
                    }
                    userSectionLinks: children (includeTemplateIDs: ["{89F1877D-4421-4093-BC7D-51263572BBEF}"]) {
                      items: results {
                        link: field(name:"link") {
                          item: jsonValue
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const SEARCH_SETTINGS_QUERY_FOR_ALGOLIA = `
  query {
    algoliaDetails: item(path:"/sitecore/content/ISC2/Main/Settings/Algolia Search Settings", language:"en") {
      algoliaApiKey :field(name:"algoliaApiKey") {
        value
      }
      algoliaAppId: field(name:"algoliaAppId") {
        value
      }
      algoliaIndexName: field(name:"algoliaIndexName") {
        value
      }
    }
  }
`;

export const SEARCH_SETTINGS_QUERY_FOR_INSIGHT_LISTING = `
  query {
    algoliaDetails: item(path:"/sitecore/content/ISC2/Main/Settings/Algolia Search Settings", language:"en") {
      algoliaApiKey :field(name:"algoliaApiKey") {
        value
      }
      algoliaAppId: field(name:"algoliaAppId") {
        value
      }
      algoliaSortDescByDateIndexName: field(name:"algoliaSortDescByDateIndexName") {
        value
      }
    }
  }
`;

export const SEARCH_SETTINGS_QUERY_FOR_CHAPTER_FINDER = `
  query {
    algoliaDetails: item(path:"/sitecore/content/ISC2/Main/Settings/Algolia Search Settings", language:"en") {
      algoliaApiKey :field(name:"algoliaApiKey") {
        value
      }
      algoliaAppId: field(name:"algoliaAppId") {
        value
      }
      algoliaChapterFilderIndexName: field(name:"algoliaChapterFilderIndexName") {
        value
      }
    }
  }
`;

export const HEADER_API_CONTENT_FOR_SALESFORCE_PAGE = `
    query {
      layout(site: "main", routePath: "salesforce/headeronly", language: "en") {
        item {
          rendered
        }
      }
    }
  `;
export const FOOTER_API_CONTENT_FOR_SALESFORCE_PAGE = `
  query result {
    layout(site: "main", routePath: "salesforce/footeronly", language: "en") {
      item {
        rendered
      }
    }
  }
`;

/**
 * Paged insights articles for the RSS feed. `first` and `after` are GraphQL
 * variables, never interpolated. A null `after` requests the first page.
 * See GraphQL-API-Patterns.md §1.
 */
export const INSIGHTS_RSS_FEED = /* GraphQL */ `
  fragment Insights on Item {
    name
    ... on ArticlePage {
      fields(ownFields: false) {
        name
        value
      }
      thumbnailImage {
        src
      }
      showInRSSFeed {
        value
      }
    }
    url {
      path
    }
  }
  query InsightsRssFeed($first: Int!, $after: String) {
    search(
      where: {
        AND: [
          { name: "_templates", value: "fbd3dc07-032e-46db-b33e-8d08469cbec2", operator: CONTAINS }
          { name: "_path", value: "cc67ceec-e8fb-4028-906f-57cd2d198376", operator: CONTAINS }
        ]
      }
      first: $first
      after: $after
      orderBy: { name: "articleDate", direction: DESC }
    ) {
      results {
        ...Insights
      }
      pageInfo {
        endCursor
        hasNext
      }
      total
    }
  }
`;

/**
 * Single article for the RSS feed, matched by item name. `name` is a GraphQL
 * variable, never interpolated. See GraphQL-API-Patterns.md §1.
 */
export const ARTICLE_RSS_FEED = /* GraphQL */ `
  query ArticleRssFeed($name: String!) {
    search(
      where: {
        AND: [
          { name: "_templates", value: "fbd3dc07-032e-46db-b33e-8d08469cbec2", operator: CONTAINS }
          { name: "_name", value: $name, operator: CONTAINS }
        ]
      }
      first: 1
    ) {
      results {
        name
        ... on ArticlePage {
          fields(ownFields: false) {
            name
            value
          }
          id
          name
          thumbnailImage {
            src
          }
          showInRSSFeed: field(name: "Show in RSS Feed") {
            value
          }
        }
        url {
          path
        }
      }
      pageInfo {
        endCursor
        hasNext
      }
      total
    }
  }
`;

/**
 * Role flags the access-control middleware reads for a route.
 *
 * `routePath` is a GraphQL variable, never interpolated. See GraphQL-API-Patterns.md §1.
 *
 * Every field selected here is consumed by AccessControlPlugin, which treats a
 * missing flag as "not required", i.e. public. Do not drop a field from this
 * selection without changing the plugin to match.
 */
export const MIDDLEWARE_LAYOUT_FIELDS = /* GraphQL */ `
  query MiddlewareLayoutFields($site: String!, $routePath: String!, $language: String!) {
    layout(site: $site, routePath: $routePath, language: $language) {
      item {
        membersOnly: field(name: "MembersOnly") {
          value
        }
        candidateOnly: field(name: "CandidateOnly") {
          value
        }
        associateOnly: field(name: "AssociateOnly") {
          value
        }
        b2bAdminOnly: field(name: "B2BAdminOnly") {
          value
        }
        nonMemberOnly: field(name: "NonMembersOnly") {
          value
        }
        b2bAccount: field(name: "b2bAccount") {
          value
        }
        hideForB2B: field(name: "hideForB2B") {
          value
        }
      }
    }
  }
`;

export const MIDDLEWARE_LAYOUT_SITE = 'main';

/**
 * Public URL for an item, addressed by item path. `path` is a GraphQL variable,
 * never interpolated. See GraphQL-API-Patterns.md §1.
 */
export const PUBLIC_PATH_BY_ITEM_PATH = /* GraphQL */ `
  query PublicPathByItemPath($path: String!, $language: String!) {
    item(path: $path, language: $language) {
      url {
        path
      }
    }
  }
`;

/**
 * Public URL for an item, addressed by GUID. `id` is a GraphQL variable, never
 * interpolated. Callers pass a bare GUID; the braces are added by the query.
 * See GraphQL-API-Patterns.md §1.
 */
export const PUBLIC_PATH_BY_ITEM_ID = /* GraphQL */ `
  query PublicPathByItemId($id: String!, $language: String!) {
    item(path: $id, language: $language) {
      url {
        path
      }
      path: path
      name: name
    }
  }
`;

// B2B Product List labels — grouped, editable in Sitecore under
// /sitecore/content/ISC2/Main/Data/B2B Product List Labels. Each child item holds a Name Value
// List `labels` field (key=value&key=value); the api route parses them by group. See
// docs/B2B-EnvLocal-Sitecore-Items.md.
export const B2B_PRODUCT_LIST_LABELS = `
  query {
    b2bLabels: item(
      path: "/sitecore/content/ISC2/Main/Data/B2B Product List Labels",
      language: "en"
    ) {
      children {
        results {
          name
          labels: field(name: "labels") {
            value
          }
        }
      }
    }
    # The SAME authored item the PDP's purchase-option radios open (its Form Labels And Tooltips
    # datasource points a "peaceOfMindTermsModal" droplink at this popup). Read by path rather than
    # duplicated into a label group so the listing can never drift from the PDP's terms copy.
    productMessageModal: item(
      path: "/sitecore/content/ISC2/Main/Data/Popups Folder/Peace Of Mind Terms Modal Popup",
      language: "en"
    ) {
      heading: field(name: "heading") {
        value
      }
      description: field(name: "description") {
        value
      }
      primaryCtaLabel: field(name: "primaryCtaLabel") {
        value
      }
      secondaryCtaLabel: field(name: "secondaryCtaLabel") {
        value
      }
    }
  }
`;

export const TRAINING_FINDER_SEARCH_SETTINGS = `
  query {
    searchWrapperSettings: item(
      path: "/sitecore/content/ISC2/Main/Settings/Training Finder Algolia Settings",
      language: "en"
    ) {
      id
      name
      fields {
        name
        jsonValue
      }
    }
  }
`;

export const SEARCH_WRAPPER_SETTINGS_BY_PATH = `
  query SearchWrapperSettings($path: String!) {
    searchWrapperSettings: item(path: $path, language: "en") {
      id
      name
      fields {
        name
        jsonValue
      }
    }
  }
`;
