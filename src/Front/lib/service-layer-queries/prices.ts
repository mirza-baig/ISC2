export const GET_STANDALONE_PRICES = `
  query prices($where: String, $limit: Int, $offset: Int) {
    standalonePrices(where: $where, limit: $limit, offset: $offset) {
      results {
        sku
        channel {
          id
          key
        }
        customerGroup {
          key
          name
        }
        value {
          centAmount
          currencyCode
          fractionDigits
        }
        discounted {
          value {
            centAmount
            currencyCode
            fractionDigits
          }
        }
        custom {
          customFieldsRaw {
            name
            value
          }
        }
      }
      total
    }
  }
`;
