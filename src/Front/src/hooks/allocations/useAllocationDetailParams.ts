import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import { ALLOCATION_DETAIL_PRODUCT_SKU, ALLOCATION_DETAIL_REF } from 'constants/index';
import { getAllocationDetailOrderNumber } from 'utils/allocations';

export default function useAllocationDetailParams() {
  const searchParams = useSearchParams();

  const productSku = searchParams?.get(ALLOCATION_DETAIL_PRODUCT_SKU) || '';
  const ref = searchParams?.get(ALLOCATION_DETAIL_REF) || '';

  const orderNumber = useMemo(() => getAllocationDetailOrderNumber(ref), [ref]);

  return { productSku, orderNumber };
}
