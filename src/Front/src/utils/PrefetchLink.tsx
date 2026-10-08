import React from 'react';
import { useRouter } from 'next/router';
import { LinkField } from '@sitecore-jss/sitecore-jss-nextjs';

import { hasPrefetched, markPrefetched } from 'utils/index';

export type PrefetchLinkProps = {
  field?: LinkField;
  href?: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: (evt: React.MouseEvent<HTMLAnchorElement>) => void;
  [key: string]: unknown;
};

const PrefetchLink: React.FC<PrefetchLinkProps> = ({
  field,
  href: hrefProp,
  className,
  children,
  onClick,
  ...rest
}) => {
  const router = useRouter();

  const href = hrefProp ?? field?.value?.href;
  const target = field?.value?.target;
  const title = field?.value?.title;
  const text = field?.value?.text;

  const shouldPrefetch = href ? href.startsWith('/') && !href.startsWith('//') : false;

  const handlePrefetch = (): void => {
    if (href && shouldPrefetch && !hasPrefetched(href)) {
      markPrefetched(href);
      router.prefetch(href);
    }
  };

  if (!href) {
    return null;
  }

  return (
    <a
      className={className}
      href={href}
      target={target}
      title={title}
      onClick={onClick}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      {...rest}
    >
      {children ?? text}
    </a>
  );
};

export default PrefetchLink;
