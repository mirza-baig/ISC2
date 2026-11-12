import { Field } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';

import { usePersonalizeComponent } from 'hooks/index';
import { CardProps } from 'ui/Card';
import Slider from 'ui/Slider';

interface Fields {
  item?: {
    PersonalizeID?: Field<string>;
  };
  children: CardProps[];
}

export type SliderWithoutDescriptionProps = {
  fields: Fields;
};

const SliderWithDescription = (props: SliderWithoutDescriptionProps) => {
  const personalizeId = props.fields?.item?.PersonalizeID?.value;
  const { isLoading, data } = usePersonalizeComponent(props, personalizeId);
  const { fields } = data;

  console.log(
    '[Slider debug] SliderWithoutDescription raw Sitecore rendering',
    JSON.stringify((props as { rendering?: unknown }).rendering, null, 2)
  );
  console.log('[Slider debug] SliderWithoutDescription PersonalizeID field', {
    isFieldComing: Boolean(props.fields?.item && 'PersonalizeID' in props.fields.item),
    rawPersonalizeID: props.fields?.item?.PersonalizeID ?? 'not in props',
    itemFieldNames: Object.keys(props.fields?.item || {}),
  });
  console.log('[Slider debug] SliderWithoutDescription personalize', {
    personalizeId,
    isLoading,
    source: JSON.stringify(fields) === JSON.stringify(props.fields) ? 'Sitecore props' : 'CDP data',
    cardCount: fields?.children?.length,
  });

  return (
    <section className={clsx('slider', personalizeId && isLoading && 'invisible')}>
      <Slider cards={fields?.children} />
    </section>
  );
};

export default SliderWithDescription;
