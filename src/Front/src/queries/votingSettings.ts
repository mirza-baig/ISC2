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
