import {
  ComponentRendering,
  withDatasourceCheck,
  useComponentProps,
  GetStaticComponentProps,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { getGraphQLResult } from 'utils/graphQLFunctions';
import { useRouter } from 'next/router';

import { LineItemsProvider, CartProvider, CartFieldsProvider } from 'providers/index';
import { AlgoliaSettings, CartFields } from 'types/index';
import { SEARCH_SETTINGS_QUERY_FOR_ALGOLIA } from 'queries/index';
import { CART_ID_PARAM_NAME } from 'constants/index';

import ShoppingCart from './ShoppingCart';

interface CartContentProps {
  rendering: ComponentRendering;
  fields: CartFields;
}

const CartContent = ({ fields, rendering }: CartContentProps) => {
  const { query } = useRouter();
  const algoliaSettings = useComponentProps<AlgoliaSettings>(rendering.uid);

  const rawCartId = Object.entries(query).find(
    ([k]) => k.toLowerCase() === CART_ID_PARAM_NAME.toLowerCase()
  )?.[1];
  const cartIdParam = (Array.isArray(rawCartId) ? rawCartId[0] : rawCartId) || '';

  if (!algoliaSettings) {
    return null;
  }

  return (
    <>
      {/* This overrides the default global B2B cart in case cart id param is defined */}
      <CartProvider id={cartIdParam}>
        <CartFieldsProvider fields={fields}>
          <LineItemsProvider algoliaSettings={algoliaSettings}>
            <ShoppingCart rendering={rendering} />
          </LineItemsProvider>
        </CartFieldsProvider>
      </CartProvider>
    </>
  );
};

export default withDatasourceCheck()<CartContentProps>(CartContent);

export const getStaticProps: GetStaticComponentProps = async (): Promise<AlgoliaSettings> => {
  return await getGraphQLResult<AlgoliaSettings>(SEARCH_SETTINGS_QUERY_FOR_ALGOLIA);
};
