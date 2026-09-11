import { getServiceLayerAPI } from 'utils/index';
import { ServiceLayerError, UpdateCartResponse } from 'types/index';

type CartUpdateVariables = {
  cartId?: string;
  country?: string;
  actions: unknown[];
  authorizedBuyerPricingVoucher?: string;
};

export default async function postCartUpdate(
  variables: CartUpdateVariables,
  onErrors: (errors: ServiceLayerError[]) => never
) {
  const api = await getServiceLayerAPI();

  const { data } = await api.post<UpdateCartResponse>('', {
    query: 'UPDATE_CART',
    variables,
  });

  if ((data.errors || []).length) {
    onErrors(data.errors);
  }

  return data.data.isc2CartUpdate;
}
