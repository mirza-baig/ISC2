import clsx from 'clsx';

import HeroBase from './content/HeroBase';
import HeroCardImage from './content/HeroCardImage';
import HeroCardText from './content/HeroCardText';

import { HeroCardBaseProps } from './types';

export interface HeroCardDefaultProps extends HeroCardBaseProps {
  alignment: 'left' | 'right';
  slidesCount: number;
  isLoading: boolean;
}

const HeroCardDefault = ({
  id,
  fields,
  alignment,
  isLoading,
  slidesCount,
}: HeroCardDefaultProps) => (
  <HeroBase>
    <div
      className={clsx(
        'relative h:auto w-full aspect-square sm:h-full sm:w-3.6/12 md:w-auto md:aspect-3/4',
        alignment === 'left' && 'sm:order-1'
      )}
    >
      <HeroCardImage id={id} fields={fields} isLoading={isLoading} />
    </div>

    <HeroCardText
      id={id}
      fields={fields}
      slidesCount={slidesCount}
      padding="pb-27 pt-8 px-5 sm:py-0 sm:px-16 md:px-32 xl:px-44"
      isLoading={isLoading}
    />
  </HeroBase>
);

export default HeroCardDefault;
