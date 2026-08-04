import {
  ComponentRendering,
  GetStaticComponentProps,
  useComponentProps,
  withDatasourceCheck,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { useSearchParams } from 'next/navigation';
import { getGraphQLResult } from 'utils/graphQLFunctions';

import { CartProvider, CheckoutProcessProvider } from 'providers/index';
import { AlgoliaSettings, CheckoutFields } from 'types/index';
import { SEARCH_SETTINGS_QUERY_FOR_ALGOLIA } from 'queries/index';
import { CART_ID_PARAM_NAME } from 'constants/index';

import CheckoutContent from './CheckoutContent';

type CheckoutProps = {
  rendering: ComponentRendering;
  fields: CheckoutFields;
};

const Checkout = ({ fields, rendering }: CheckoutProps) => {
  const algoliaSettings = useComponentProps<AlgoliaSettings>(rendering.uid);

  const searchParams = useSearchParams();
  const cartIdParam = searchParams?.get(CART_ID_PARAM_NAME) || '';

  return (
    <>
      {/* This overrides the default global B2B cart in case cart id param is defined */}
      <CartProvider id={cartIdParam}>
        <CheckoutProcessProvider fields={fields}>
          <CheckoutContent rendering={rendering} algoliaSettings={algoliaSettings} />
        </CheckoutProcessProvider>
      </CartProvider>
    </>
  );
};

export default withDatasourceCheck()<CheckoutProps>(Checkout);

export const getStaticProps: GetStaticComponentProps = async (): Promise<unknown> => {
  return await getGraphQLResult<AlgoliaSettings>(SEARCH_SETTINGS_QUERY_FOR_ALGOLIA);
};
