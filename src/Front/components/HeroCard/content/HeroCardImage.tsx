import { ImageField, NextImage } from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';

import { HeroCardBaseProps } from '../types';

interface HeroCardImageProps extends HeroCardBaseProps {
  isLoading?: boolean;
  withGradient?: boolean;
  logoImage?: ImageField;
}

const LoadingSkeleton = () => (
  <div className="object-cover absolute inset-0 animate-pulse bg-gray-300" />
);

const HeroCardImage = ({
  withGradient,
  logoImage,
  alignment,
  fields,
  isLoading,
}: HeroCardImageProps) => (
  <>
    {withGradient && !isLoading && (
      <span className="absolute inset-0 bg-gradient-to-t from-black-50 z-1" />
    )}
    {isLoading ? (
      <LoadingSkeleton />
    ) : (
      <NextImage field={fields.image} className="w-full h-full object-cover" fill />
    )}
    {Boolean(logoImage?.value?.src) && !isLoading && (
      <span
        className={clsx(
          'absolute object-cover -translate-x-2/4 -translate-y-2/4',
          'top-full left-2/4 h-56 w-56',
          alignment === 'left' ? 'sm:left-0' : 'sm:left-full',
          'sm:top-2/4 sm:h-494 sm:mt-4 sm:w-494',
          'md:mt-12 mt:pt-0',
          'xl:h-719 xl:w-719 xl:mt-8'
        )}
      >
        <NextImage field={logoImage} fill />
      </span>
    )}
  </>
);

export default HeroCardImage;
