import { CardProps } from 'ui/Card';
import Slider from 'ui/Slider';

interface Fields {
  children: CardProps[];
}

export type SliderWithoutDescriptionProps = {
  fields: Fields;
};

const SliderWithDescription = ({ fields }: SliderWithoutDescriptionProps) => (
  <section className="slider">
    <Slider cards={fields?.children} />
  </section>
);

export default SliderWithDescription;
