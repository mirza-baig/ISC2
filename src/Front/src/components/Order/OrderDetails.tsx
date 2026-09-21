import {
  ComponentRendering,
  Field,
  GetStaticComponentProps,
  LinkField,
  RichTextField,
  useComponentProps,
  withDatasourceCheck,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { useSearchParams } from 'next/navigation';

import { useGetOrder, useBusinessBuyerStatus } from 'hooks/index';
import { LoadingIndicator, RichTextUI } from 'ui/index';
import { CartProvider, LineItemsProvider } from 'providers/index';
import { AlgoliaSettings } from 'types/index';
import { SEARCH_SETTINGS_QUERY_FOR_ALGOLIA } from 'queries/index';
import { getGraphQLResult } from 'utils/index';

import OrderDetailsContent from './OrderDetailsContent';
import BusinessOrderDetailsContent from './BusinessOrderDetailsContent';
import { LOCALSTORAGE_KEYS } from 'constants/index';
import { useMemo } from 'react';

export type OrderDetailsFields = {
  appreciationMessage: RichTextField;
  examPurchasedMessage: RichTextField;
  purchaseConfirmationCopy: RichTextField;
  labelsTooltipsAndMore: Field<string>;
  checkoutErrorMessage?: RichTextField | null;
  /** Dashboard CTA destinations on the business confirmation screen. */
  orderAllocationUrl?: LinkField;
  orderHistoryUrl?: LinkField;
};

interface OrderDetailsProps {
  rendering: ComponentRendering;
  fields: OrderDetailsFields;
}

const OrderDetails = ({ fields, rendering }: OrderDetailsProps): JSX.Element => {
  const algoliaSettings = useComponentProps<AlgoliaSettings>(rendering.uid);
  const searchParams = useSearchParams();
  const redirectStatus = searchParams?.get('redirect_status');

  const checkoutErrorMessageHtml = useMemo(
    () => fields.checkoutErrorMessage?.value?.trim() ?? '',
    [fields.checkoutErrorMessage]
  );

  const orderNumber = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    return localStorage.getItem(LOCALSTORAGE_KEYS.ORDER_NUMBER) ?? '';
  }, []);

  const status = redirectStatus === 'succeeded' && Boolean(orderNumber) ? 'succeeded' : 'failed';

  const { order, orderCart, isGettingOrder } = useGetOrder(orderNumber);

  // Judged from the ordered cart, not the live one: by the time this screen renders,
  // the live cart is the empty cart checkout just created. The buyer's B2B admin role
  // and selected organization still come from the session and shopper context, which is
  // why this is read outside the CartProvider override below.
  const { isBusinessBuyer, isResolvingBusinessBuyer } = useBusinessBuyerStatus({
    cart: orderCart,
  });

  // The shopper context arrives on its own request, independent of the order. Without
  // it in this gate the screen renders as soon as the order lands and then swaps
  // variants underneath the buyer once the context catches up.
  if (isGettingOrder || isResolvingBusinessBuyer || (searchParams?.size ?? 0) === 0) {
    return (
      <div className="flex justify-center">
        <LoadingIndicator />
      </div>
    );
  }

  if (status === 'succeeded' && order && algoliaSettings) {
    return (
      <CartProvider overrideWithCart={orderCart}>
        <LineItemsProvider algoliaSettings={algoliaSettings}>
          {isBusinessBuyer ? (
            <BusinessOrderDetailsContent fields={fields} order={order} />
          ) : (
            <OrderDetailsContent fields={fields} rendering={rendering} order={order} />
          )}
        </LineItemsProvider>
      </CartProvider>
    );
  }

  return (
    <div className="flex w-full items-center justify-center py-12">
      {checkoutErrorMessageHtml ? (
        <RichTextUI
          value={checkoutErrorMessageHtml}
          className="!overflow-visible min-w-0 break-words w-full"
        />
      ) : null}
    </div>
  );
};

export default withDatasourceCheck()<OrderDetailsProps>(OrderDetails);

export const getStaticProps: GetStaticComponentProps = async (): Promise<AlgoliaSettings> => {
  return await getGraphQLResult<AlgoliaSettings>(SEARCH_SETTINGS_QUERY_FOR_ALGOLIA);
};
