import { Field, LinkField, RichTextField, TextField } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';
import { ProductCardFields } from 'components/ProductTabs/ProductCard/ProductCard.types';
import { usePersonalizeComponent } from 'hooks/index';
import { Slider } from 'ui/index';

interface CartRecommendationsProps {
  fields: {
    PersonalizeID?: Field<string>;
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

const CartRecommendations = (props: CartRecommendationsProps) => {
  const personalizeId = props.fields?.PersonalizeID?.value;
  const { isLoading, data } = usePersonalizeComponent(props, personalizeId);
  const { fields } = data;

  // console.log('[Slider debug] CartRecommendations PersonalizeID field', {
  //   isFieldComing: Boolean(props.fields && 'PersonalizeID' in props.fields),
  //   rawPersonalizeID: props.fields?.PersonalizeID ?? 'not in props',
  //   fieldNames: Object.keys(props.fields || {}),
  // });
  // console.log('[Slider debug] CartRecommendations personalize', {
  //   personalizeId,
  //   isLoading,
  //   source: JSON.stringify(fields) === JSON.stringify(props.fields) ? 'Sitecore props' : 'CDP data',
  //   productCount: fields?.productPagesList?.length,
  // });

  if (!fields?.productPagesList) {
    return null;
  }

  return (
    <section
      className={clsx(
        'cart-recommendations pl-5 pr-0 md:pl-16 py-10 md:py-20 space-y-4',
        personalizeId && isLoading && 'invisible'
      )}
    >
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
