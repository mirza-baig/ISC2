import { useMemo } from 'react';

import HeroCardDefault from './HeroCardDefault';
import HeroCardFullWidth from './HeroCardFullWidth';
import HeroCardLogo from './HeroCardLogo';

import { HeroCardBaseProps } from './types';

export type HeroCardProps = Pick<HeroCardBaseProps, 'id' | 'fields'> & {
  isLoading: boolean;
  slidesCount: number;
};

const HeroCard = ({ id, fields, isLoading, slidesCount }: HeroCardProps) => {
  const imageFullWidth = useMemo(
    () => fields.imageFullWidth?.value,
    [fields.imageFullWidth?.value]
  );

  const hasLogoImage = useMemo(
    () => fields.logoImage?.value?.src && !imageFullWidth,
    [fields.logoImage?.value?.src, imageFullWidth]
  );

  const alignment = useMemo(
    () => (fields.contentOnLeft?.value ? 'left' : 'right'),
    [fields.contentOnLeft?.value]
  );

  if (imageFullWidth && !isLoading) {
    return (
      <HeroCardFullWidth id={id} fields={fields} alignment={alignment} slidesCount={slidesCount} />
    );
  }

  if (hasLogoImage && !isLoading) {
    return (
      <HeroCardLogo
        id={id}
        fields={fields}
        alignment={alignment}
        logoImage={fields.logoImage}
        slidesCount={slidesCount}
      />
    );
  }

  return (
    <HeroCardDefault
      id={id}
      fields={fields}
      alignment={alignment}
      isLoading={isLoading}
      slidesCount={slidesCount}
    />
  );
};

export default HeroCard;
