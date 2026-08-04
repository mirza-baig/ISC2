import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from 'constants/index';

type Product = {
  copyName: string;
  isMasterVariant: boolean;
  objectID: string;
  productID: string;
  sku: string;
  title: string;
  variantId: number;
};

export const getProduct = async (sku: string) => {
  if (!sku) {
    return null;
  }

  const response = await fetch(
    `${process.env.PUBLIC_URL}/${process.env.NEXT_PUBLIC_ALGOLIA_API_PATH}/product?sku=${sku}`
  );

  const data = await response.json();

  if (data.error) {
    console.error('Error while fetching product:', data.error);
    throw data.error;
  }

  return data;
};

export default function useGetProduct({ sku }: { sku: string }) {
  const { data, isLoading, error } = useQuery<Product>({
    queryKey: [QUERY_KEYS.PRODUCT, sku],
    queryFn: () => getProduct(sku),
    enabled: Boolean(sku),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  });

  return {
    product: data,
    isGettingProduct: isLoading,
    getProductError: error,
  };
}
