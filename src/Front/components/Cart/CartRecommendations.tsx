import { LinkField, RichTextField, TextField } from '@sitecore-jss/sitecore-jss-nextjs';
import { ProductCardFields } from 'components/ProductTabs/ProductCard/ProductCard.types';
import { Slider } from 'ui/index';

interface CartRecommendationsProps {
  fields: {
    heading: TextField;
    descriptiveCopy: RichTextField;
    linkCta: LinkField;
    productPagesList: ProductCardFields[] | undefined;
  };
}

const getProductsCardsProps = (products?: ProductCardFields[]) => {
  return (products || []).map((product) => ({
    product,
    isFeatured: false,
    classNames: 'min-w-[272px] md:min-w-[400px]',
  }));
};

const CartRecommendations = ({ fields }: CartRecommendationsProps) => {
  if (!fields?.productPagesList) {
    return null;
  }

  return (
    <section className="cart-recommendations pl-5 pr-0 md:pl-16 py-10 md:py-20 space-y-4">
      <Slider
        cards={getProductsCardsProps(fields?.productPagesList)}
        heading={fields.heading}
        description={fields.descriptiveCopy}
        linkCta={fields.linkCta}
        wrapperClassNames="!pb-0 !pl-0"
        cardsClassNames="!pt-0 !pb-8"
      />
    </section>
  );
};

export default CartRecommendations;
