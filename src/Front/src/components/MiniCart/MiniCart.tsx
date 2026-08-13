import {
  ComponentRendering,
  RouteData,
  withDatasourceCheck,
  useComponentProps,
  GetStaticComponentProps,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';
import { useEffect } from 'react';
import clsx from 'clsx';

import { LineItemsProvider, MiniCartFieldsProvider, useCart, useLayout } from 'providers/index';
import { useDisableScroll, useRecalculateCart } from 'hooks/index';
import { AlgoliaSettings, MiniCartFields } from 'types/index';
import { SEARCH_SETTINGS_QUERY_FOR_ALGOLIA } from 'queries/index';
import { getGraphQLResult } from 'utils/index';
import { RichTextUI } from 'ui/index';

import MiniCartSummary from './MiniCartSummary';
import EmptyMiniCartHeader from './EmptyMiniCartHeader';
import MiniCartHeader from './MiniCartHeader';
import { MiniCartLineItems } from './MiniCartLineItems';

type MiniCartProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields: MiniCartFields;
};

const MiniCart = ({ fields, rendering }: MiniCartProps) => {
  const algoliaSettings = useComponentProps<AlgoliaSettings>(rendering.uid);

  const { isMiniCartOpen } = useLayout();
  const { activeCart } = useCart();
  const { recalculateCart } = useRecalculateCart();

  useEffect(() => {
    if (isMiniCartOpen && !activeCart.computed.isEmpty) {
      recalculateCart();
    }
  }, [activeCart.computed.isEmpty, isMiniCartOpen, recalculateCart]);

  useDisableScroll({ disable: isMiniCartOpen });

  if (!fields || !algoliaSettings) {
    return null;
  }

  return (
    <LineItemsProvider algoliaSettings={algoliaSettings}>
      <MiniCartFieldsProvider fields={fields}>
        <div
          className={clsx(
            'modal modal-overlay max-w-8xl !mx-auto transition-opacity duration-500',
            isMiniCartOpen
              ? 'z-modal-overlay opacity-100'
              : '-z-1 opacity-0 pointer-events-none invisible'
          )}
          role="dialog"
          aria-label="Mini cart"
        >
          <section
            className={clsx(
              'h-dynamic-screen w-[calc(100dvw-2.5rem)] border-r border-gray-30 absolute transition-all duration-500 bg-gray-10 right-0 bottom-0 top-0 sm:w-547 translate-x-0 flex flex-col',
              !isMiniCartOpen && '!translate-x-full'
            )}
          >
            <MiniCartHeader />

            {activeCart.computed.isEmpty && <EmptyMiniCartHeader />}

            <section className="flex flex-col flex-1 bg-white overflow-hidden">
              {activeCart.computed.isEmpty && (
                <RichTextUI
                  value={fields.richText.value}
                  className="pl-4 pr-3 sm:px-4 pt-10 !ml-0 md:w-350"
                />
              )}

              {!activeCart.computed.isEmpty && (
                <>
                  <MiniCartLineItems />
                  <MiniCartSummary />
                </>
              )}
            </section>
          </section>
        </div>
      </MiniCartFieldsProvider>
    </LineItemsProvider>
  );
};

export default withDatasourceCheck()<MiniCartProps>(MiniCart);

export const getStaticProps: GetStaticComponentProps = async (): Promise<unknown> => {
  return await getGraphQLResult<AlgoliaSettings>(SEARCH_SETTINGS_QUERY_FOR_ALGOLIA);
};
