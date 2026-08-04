import {
  ComponentRendering,
  Field,
  RouteData,
  withDatasourceCheck,
  LinkField,
  RichTextField,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';

import { CardProps } from 'ui/Card';
import Slider from 'ui/Slider';

interface Fields {
  item: {
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

const SliderWithDescription = ({ fields }: SliderWithDescriptionProps) => (
  <section className="slider">
    <Slider
      cards={fields?.children}
      heading={fields?.item?.heading}
      description={fields?.item.description}
      linkCta={fields?.item?.linkCta}
    />
  </section>
);

export default withDatasourceCheck()<SliderWithDescriptionProps>(SliderWithDescription);
