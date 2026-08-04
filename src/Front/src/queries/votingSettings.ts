export const getElectionsVotingUserInfo = (key: string): string => {
  const query = `query result{
      votingData: item(path:"/sitecore/content/ISC2/Main/Data/Voting Types/${key}", language:"en") {
        sharedKey: field(name:"SharedKey") {
          value
        }
        redirectUrl: field(name:"RedirectUrl") {
          value
        }
        parent {
          votingHashSuit: field(name:"VotingHashSuit") {
            value
          }
        }
      }
    }`;
  return query;
};
