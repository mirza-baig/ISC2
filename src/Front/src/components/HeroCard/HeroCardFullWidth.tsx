import clsx from 'clsx';

import HeroBase from './content/HeroBase';
import HeroCardImage from './content/HeroCardImage';
import HeroCardText from './content/HeroCardText';

import { HeroCardBaseProps } from './types';

export interface HeroCardFullWidthProps extends HeroCardBaseProps {
  alignment: 'left' | 'right';
  slidesCount: number;
}

const HeroCardFullWidth = ({ id, fields, alignment, slidesCount }: HeroCardFullWidthProps) => (
  <HeroBase>
    <HeroCardImage id={id} fields={fields} withGradient />

    <div
      className={clsx(
        'flex sm:h-full sm:w-3.6/12 md:w-auto md:aspect-3/4',
        alignment === 'left' && 'sm:order-1'
      )}
    />

    <HeroCardText
      id={id}
      fields={fields}
      slidesCount={slidesCount}
      padding="pb-27 pt-50 px-5 sm:py-0 sm:px-16 md:px-32 xl:px-44"
      color="text-white-00"
      ctaColor="light"
    />
  </HeroBase>
);

export default HeroCardFullWidth;
