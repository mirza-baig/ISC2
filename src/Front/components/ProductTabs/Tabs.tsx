import {
  ComponentRendering,
  RouteData,
  withDatasourceCheck,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';

import { ProductTabContentProps } from './ProductTabContent';
import ProductTabs from './ProductTabs';
import { useLayout } from 'src/providers/layout';

type TabsProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields: ProductTabContentProps['fields'];
};

function ProductTab({ rendering, fields }: TabsProps) {
  const { isEditing } = useLayout();

  if (isEditing) {
    return <ProductTabs tabs={[{ fields, uid: rendering?.uid || '' }]} className="mb-10" />;
  }

  return null;
}

export default withDatasourceCheck()<TabsProps>(ProductTab);
