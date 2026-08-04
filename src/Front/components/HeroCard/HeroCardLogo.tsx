import { ImageField } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';

import HeroBase from './content/HeroBase';
import HeroCardImage from './content/HeroCardImage';
import HeroCardText from './content/HeroCardText';

import { HeroCardBaseProps } from './types';

interface HeroCardLogoProps extends HeroCardBaseProps {
  logoImage: ImageField;
  slidesCount: number;
}

const HeroCardLogo = ({ id, fields, alignment, logoImage, slidesCount }: HeroCardLogoProps) => (
  <HeroBase>
    <div
      className={clsx(
        'relative h:auto w-full aspect-square sm:h-full sm:w-3.6/12 md:w-auto md:aspect-3/4',
        alignment === 'left' && 'sm:order-1'
      )}
    >
      <HeroCardImage id={id} fields={fields} alignment={alignment} logoImage={logoImage} />
    </div>

    <HeroCardText
      id={id}
      fields={fields}
      slidesCount={slidesCount}
      padding={clsx(
        'pb-27 pt-20 px-5 sm:py-0 md:pt-12 lg:pt-0',
        alignment === 'left'
          ? 'sm:pl-8 sm:pr-40 lg:pr-44 xl:pl-12 xl:pr-60'
          : 'sm:pr-8 sm:pl-40 lg:pl-44 xl:pr-12 xl:pl-60'
      )}
    />
  </HeroBase>
);

export default HeroCardLogo;
