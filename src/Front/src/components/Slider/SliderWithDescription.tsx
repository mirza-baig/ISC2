import {
  ComponentRendering,
  Field,
  RouteData,
  withDatasourceCheck,
  LinkField,
  RichTextField,
} from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';
import { ComponentProps } from 'lib/component-props';

import { usePersonalizeComponent } from 'hooks/index';
import { CardProps } from 'ui/Card';
import Slider from 'ui/Slider';

interface Fields {
  item: {
    PersonalizeID?: Field<string>;
    heading: Field<string>;
    description: RichTextField;
    linkCta: LinkField;
  };
  children: CardProps[];
}

type SliderWithDescriptionProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields: Fields;
};

const SliderWithDescription = (props: SliderWithDescriptionProps) => {
  // for any other component, same lines can be reuesed to get the personalizeId and data from CDP, and then pass it to the component that needs it.
  const personalizeId = props.fields?.item?.PersonalizeID?.value;
  const { isLoading, data } = usePersonalizeComponent(props, personalizeId);
  const { fields } = data;
  // end personalization logic

  console.log(
    '[Slider debug] SliderWithDescription raw Sitecore rendering',
    JSON.stringify(props.rendering, null, 2)
  );
  console.log('[Slider debug] SliderWithDescription PersonalizeID field', {
    isFieldComing: Boolean(props.fields?.item && 'PersonalizeID' in props.fields.item),
    rawPersonalizeID: props.fields?.item?.PersonalizeID ?? 'not in props',
    itemFieldNames: Object.keys(props.fields?.item || {}),
  });
  console.log('[Slider debug] SliderWithDescription personalize', {
    personalizeId,
    isLoading,
    source: JSON.stringify(fields) === JSON.stringify(props.fields) ? 'Sitecore props' : 'CDP data',
    cardCount: fields?.children?.length,
  });

  return (
    <section className={clsx('slider', personalizeId && isLoading && 'invisible')}>
      <Slider
        cards={fields?.children}
        heading={fields?.item?.heading}
        description={fields?.item.description}
        linkCta={fields?.item?.linkCta}
      />
    </section>
  );
};

export default withDatasourceCheck()<SliderWithDescriptionProps>(SliderWithDescription);
