import { useSitecoreContext } from '@sitecore-jss/sitecore-jss-nextjs';
import { useMemo } from 'react';
import Image from 'next/image';

export namespace ProductThumbnail {
  export type Props = {
    src?: string;
    alt?: string;
    className: string;
    width?: number;
    height?: number;
  };
}

export function ProductThumbnail({ src, alt, className, width, height }: ProductThumbnail.Props) {
  const { sitecoreContext } = useSitecoreContext();

  const imageSrc = useMemo(() => {
    return src || sitecoreContext.globalFallbackImage?.toString();
  }, [sitecoreContext.globalFallbackImage, src]);

  if (!imageSrc) {
    return null;
  }

  return (
    <Image
      key={imageSrc}
      src={imageSrc}
      alt={alt || 'ISC2 logo'}
      className={className}
      width={width || 120}
      height={height || 120}
      placeholder="empty"
    />
  );
}
