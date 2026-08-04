import { HorizontalTabsUI } from 'ui/index';
import { useStandalonePrices } from 'providers/index';
import ProductTabContent, { ProductTabContentProps } from './ProductTabContent';

type ProductTabsProps = {
  tabs: ProductTabContentProps[];
  className?: string;
};

const ProductTabs = ({ tabs, className }: ProductTabsProps): JSX.Element => {
  const { productPrices } = useStandalonePrices();

  return (
    <HorizontalTabsUI
      tabs={tabs}
      className={className}
      getTabKey={(tab) => tab?.uid}
      getTabName={(tab) => tab?.fields?.tabHeading?.value}
      renderContent={(tab) => (
        <ProductTabContent
          uid={tab?.uid}
          fields={{
            ...tab?.fields,
            prices: productPrices,
          }}
        />
      )}
    />
  );
};

export default ProductTabs;
