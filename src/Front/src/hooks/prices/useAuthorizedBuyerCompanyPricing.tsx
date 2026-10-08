import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from 'constants/index';
import { useUserSession } from 'providers/index';
import { decodeAuthorizedBuyerPricingVoucher } from 'lib/authorizedBuyer';
import { CT_DEFAULT_TIER } from 'types/pricing';

import useAuthorizedBuyerPricingVoucher from '../cart/useAuthorizedBuyerPricingVoucher';
import useGetDistributionChannel from './useGetDistributionChannel';
import { fetchAllStandalonePricePages } from './standalonePriceQueryHelpers';

interface UseAuthorizedBuyerCompanyPricingResult {
  companyPriceCentsBySku: Map<string, number>;
  isGettingCompanyPrices: boolean;
}

export default function useAuthorizedBuyerCompanyPricing(
  skuList: string[]
): UseAuthorizedBuyerCompanyPricingResult {
  const { voucher } = useAuthorizedBuyerPricingVoucher();
  const accountId = decodeAuthorizedBuyerPricingVoucher(voucher)?.accountId;

  const { currencyCode } = useUserSession();
  const { distributionChannel, distributionChannels } = useGetDistributionChannel();
  const channelId =
    distributionChannels?.find(({ key }) => key === CT_DEFAULT_TIER)?.id ?? distributionChannel?.id;

  const enabled = Boolean(accountId && skuList.length && skuList.every(Boolean) && channelId);

  const { data, isPending } = useQuery({
    queryKey: [
      QUERY_KEYS.AUTHORIZED_BUYER_COMPANY_PRICE,
      accountId,
      currencyCode,
      channelId,
      ...skuList,
    ],
    queryFn: () =>
      fetchAllStandalonePricePages({
        skuList,
        currencyCode,
        distributionChannelId: channelId,
        customerGroupKey: accountId,
        limit: 500,
      }),
    enabled,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const companyPriceCentsBySku = useMemo(() => {
    const map = new Map<string, number>();
    if (!data) {
      return map;
    }

    data.forEach((price) => {
      if (typeof price.value?.centAmount === 'number') {
        map.set(price.sku, price.value.centAmount);
      }
    });
    return map;
  }, [data]);

  return {
    companyPriceCentsBySku,
    isGettingCompanyPrices: enabled && isPending,
  };
}
