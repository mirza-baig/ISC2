/**
 * The business order confirmation's dashboard CTA links.
 *
 * They are authored as General Link fields on the Order Summary datasource, which is a
 * checkout-page component — the confirmation page does not render it, so its fields never
 * reach `OrderDetailsFields` and have to be fetched by item ID instead.
 *
 * Queried through `LinkField` rather than `field { value }` because the stored value is
 * raw link XML carrying only the target item's ID; `url` is the resolved path.
 */
export const ORDER_SUMMARY_DATASOURCE_ID = '{ACBE4C28-49A2-4C34-84EC-C96AEDF3F465}';

export const getOrderSummaryDashboardLinksQuery = (
  itemId: string = ORDER_SUMMARY_DATASOURCE_ID
): string => `
  query GetOrderSummaryDashboardLinks {
    item(path: "${itemId}", language: "en") {
      orderAllocationUrl: field(name: "orderAllocationUrl") {
        ... on LinkField {
          url
          text
        }
      }
      openDashboardUrl: field(name: "openDashboardUrl") {
        ... on LinkField {
          url
          text
        }
      }
    }
  }
`;
