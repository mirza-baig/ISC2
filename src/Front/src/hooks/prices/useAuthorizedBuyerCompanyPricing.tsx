import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from 'constants/index';
import { useUserSession } from 'providers/index';
import { decodeAuthorizedBuyerPricingVoucher } from 'lib/authorizedBuyer';

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
  const { distributionChannel } = useGetDistributionChannel();

  const enabled = Boolean(
    accountId && skuList.length && skuList.every(Boolean) && distributionChannel?.id
  );

  const { data, isPending } = useQuery({
    queryKey: [
      QUERY_KEYS.AUTHORIZED_BUYER_COMPANY_PRICE,
      accountId,
      currencyCode,
      distributionChannel?.id,
      ...skuList,
    ],
    queryFn: () =>
      fetchAllStandalonePricePages({
        skuList,
        currencyCode,
        distributionChannelId: distributionChannel?.id,
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
      const money = price.discounted?.value ?? price.value;
      if (typeof money?.centAmount === 'number') {
        map.set(price.sku, money.centAmount);
      }
    });
    return map;
  }, [data]);

  return {
    companyPriceCentsBySku,
    isGettingCompanyPrices: enabled && isPending,
  };
}
