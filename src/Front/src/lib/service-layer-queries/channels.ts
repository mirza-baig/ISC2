export const GET_CHANNELS = `
  query($where: String) {
    channels(where: $where) {
      results {
        id
        key
        custom {
          customFieldsRaw {
            name
            value
          }
        }
     }
    }
  }
`;
