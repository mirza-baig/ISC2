export const GET_INVENTORY = `
  query($where: String, $limit: Int, $offset: Int) {
    inventoryEntries(where: $where, limit: $limit, offset: $offset) {
      results {
        sku
        quantityOnStock
      }
      total
    }
  }
`;
