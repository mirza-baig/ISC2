export const SERVICE_LAYER_AUTH = `
  query obtainAnonymousToken {
    obtainAnonymousToken {
      access_token
      token_type
      expires_in
      refresh_token
      anonymousId
    }
  }
`;
