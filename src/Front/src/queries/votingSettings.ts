/**
 * Election SSO settings for a given voting type, addressed by item path.
 *
 * `path` is a GraphQL variable, never interpolated. See GraphQL-API-Patterns.md §1.
 *
 * NOTE: `SharedKey` is a secret held in the Sitecore content tree, which Experience
 * Edge serves to anyone holding the public delivery key. Parameterizing this query
 * closes the injection route through this app; it does not close the direct Edge
 * read. That requires moving the key out of the content tree (pentest finding #1).
 */
export const ELECTIONS_VOTING_USER_INFO = /* GraphQL */ `
  query ElectionsVotingUserInfo($path: String!, $language: String!) {
    votingData: item(path: $path, language: $language) {
      sharedKey: field(name: "SharedKey") {
        value
      }
      redirectUrl: field(name: "RedirectUrl") {
        value
      }
      parent {
        votingHashSuit: field(name: "VotingHashSuit") {
          value
        }
      }
    }
  }
`;

export const VOTING_TYPES_ROOT = '/sitecore/content/ISC2/Main/Data/Voting Types';
