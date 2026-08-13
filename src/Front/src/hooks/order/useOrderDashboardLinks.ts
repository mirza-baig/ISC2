import { useQuery } from '@tanstack/react-query';

import { getGraphQLResult } from 'utils/graphQLFunctions';
import { getOrderSummaryDashboardLinksQuery } from 'queries/orderSummaryDashboardLinks';

type LinkFieldResult = { url?: string; text?: string } | null;

type DashboardLinksResponse = {
  item: {
    orderAllocationUrl: LinkFieldResult;
    openDashboardUrl: LinkFieldResult;
  } | null;
} | null;

export type OrderDashboardLinks = {
  /** Where an allocator is sent from the confirmation screen. */
  allocationsUrl?: string;
  /** Where everyone else is sent. */
  dashboardUrl?: string;
};

/**
 * Dashboard CTA destinations for the business order confirmation.
 *
 * Authored as General Link fields on the Order Summary datasource — a checkout-page
 * component the confirmation page does not render — so they are fetched by item ID rather
 * than arriving in `OrderDetailsFields`. Cached indefinitely: these are authored links
 * that do not change within a session.
 */
export default function useOrderDashboardLinks(): OrderDashboardLinks {
  const { data } = useQuery({
    queryKey: ['order-dashboard-links'],
    staleTime: Infinity,
    queryFn: async () => {
      const result = await getGraphQLResult<DashboardLinksResponse>(
        getOrderSummaryDashboardLinksQuery()
      );

      return {
        allocationsUrl: result?.item?.orderAllocationUrl?.url,
        dashboardUrl: result?.item?.openDashboardUrl?.url,
      };
    },
  });

  return data ?? {};
}
