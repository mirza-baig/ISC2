import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from 'constants/index';
import { useShopperContext } from 'providers/index';
import { useFeatureFlag } from 'providers/featureFlags';

type PricingVoucherResponse = {
  voucher: string;
  exp: number;
};

type UseAuthorizedBuyerPricingVoucherResult = {
  voucher: string | undefined;
  isLoading: boolean;
};

const VOUCHER_REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export default function useAuthorizedBuyerPricingVoucher(): UseAuthorizedBuyerPricingVoucherResult {
  const { shopperContext } = useShopperContext();
  const isB2BFlowEnabled = useFeatureFlag('B2B_Company_Flow');

  const accountId =
    isB2BFlowEnabled && shopperContext?.type === 'organization'
      ? shopperContext.organization?.id
      : undefined;

  const { data, isLoading } = useQuery<PricingVoucherResponse>({
    queryKey: [QUERY_KEYS.AUTHORIZED_BUYER_PRICING_VOUCHER, accountId],
    queryFn: async () => {
      const response = await fetch('/api/salesforce/b2b/pricingVoucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      if (!response.ok) {
        throw new Error('Failed to mint authorized-buyer pricing voucher');
      }

      return response.json();
    },
    enabled: Boolean(accountId),
    staleTime: VOUCHER_REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: false,
    retry: false,
  });

  return { voucher: data?.voucher, isLoading };
}
