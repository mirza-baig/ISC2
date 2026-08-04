import {
  ComponentRendering,
  Field,
  GetStaticComponentProps,
  RichTextField,
  useComponentProps,
  withDatasourceCheck,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { useSearchParams } from 'next/navigation';

import { useGetOrder } from 'hooks/index';
import { LoadingIndicator, RichTextUI } from 'ui/index';
import { CartProvider, LineItemsProvider } from 'providers/index';
import { AlgoliaSettings } from 'types/index';
import { SEARCH_SETTINGS_QUERY_FOR_ALGOLIA } from 'queries/index';
import { getGraphQLResult } from 'utils/index';

import OrderDetailsContent from './OrderDetailsContent';
import { LOCALSTORAGE_KEYS } from 'constants/index';
import { useMemo } from 'react';

export type OrderDetailsFields = {
  appreciationMessage: RichTextField;
  examPurchasedMessage: RichTextField;
  purchaseConfirmationCopy: RichTextField;
  labelsTooltipsAndMore: Field<string>;
  checkoutErrorMessage?: RichTextField | null;
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

  if (isGettingOrder || (searchParams?.size ?? 0) === 0) {
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
          <OrderDetailsContent fields={fields} rendering={rendering} order={order} />
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
