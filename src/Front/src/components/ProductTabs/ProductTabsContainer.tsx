import {
  ComponentRendering,
  Field,
  LinkField,
  Placeholder,
  RouteData,
  withDatasourceCheck,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';
import { useMemo } from 'react';

import { useLayout } from 'providers/index';
import { SectionTitle } from 'ui/index';

import { ProductTabContentProps } from './ProductTabContent';
import ProductTabs from './ProductTabs';

type Fields = {
  heading: Field<string>;
  descriptions: Field<string>;
  linkCta: LinkField;
};

type ProductTabsProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields: Fields;
};

function ProductTabsContainer({ rendering, fields }: ProductTabsProps): JSX.Element {
  const { isEditing } = useLayout();

  const tabsWithContent = useMemo(() => {
    if (rendering?.placeholders) {
      const tabs = rendering?.placeholders['product-tabs'] as unknown as ProductTabContentProps[];

      if (isEditing) {
        return tabs;
      }

      return tabs?.filter(
        ({ fields }) => fields?.secondaryCards?.length || Boolean(fields?.featuredCard?.fields)
      );
    }

    return [];
  }, [rendering?.placeholders, isEditing]);
  return (
    <>
      <section className="product-tabs pb-14 sm:pb-20 px-5 sm:px-16">
        <SectionTitle
          title={fields?.heading}
          subtitle={fields?.descriptions}
          link={fields?.linkCta}
        />
        <Placeholder name="product-tabs" rendering={rendering} />
        {!isEditing && <ProductTabs tabs={tabsWithContent} />}
      </section>
    </>
  );
}

export default withDatasourceCheck()<ProductTabsProps>(ProductTabsContainer);
