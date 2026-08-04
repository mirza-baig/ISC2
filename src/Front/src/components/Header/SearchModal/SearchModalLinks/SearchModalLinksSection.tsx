import clsx from 'clsx';
import { useCallback, useMemo } from 'react';

import { useAutocomplete, useHeaderNavigation } from 'providers/index';
import { LoadingIndicator } from 'ui/index';
import { SVGIconProps, SearchModalSection } from 'types/index';

interface SearchModalLinksSectionProps extends SearchModalSection {
  className?: string;
  numberOfColumns?: number;
  asCta?: boolean;
  addToRecent?: boolean;
  isLoading?: boolean;
  Icon?: (props: SVGIconProps) => JSX.Element;
  flex?: boolean;
}

export default function SearchModalLinksSection({
  title,
  links,
  className,
  numberOfColumns = 1,
  asCta,
  addToRecent,
  isLoading,
  Icon,
  flex = true,
}: SearchModalLinksSectionProps) {
  const { closeAllNavigation } = useHeaderNavigation();
  const { addQueryToRecentSearches } = useAutocomplete();

  const onLinkClick = useCallback(
    (query?: string) => {
      if (addToRecent && query?.trim()) {
        closeAllNavigation();
        addQueryToRecentSearches(query.trim());
      }
    },
    [addQueryToRecentSearches, closeAllNavigation, addToRecent]
  );

  const LinksContent = useMemo(() => {
    if (isLoading) {
      return <LoadingIndicator className="justify-self-center" />;
    }

    return links.map((link) => (
      <a
        href={link.value.href}
        key={link.value.href}
        onClick={() => onLinkClick(link.value.text)}
        className={clsx(
          'line-clamp-2 p-0 border-0 text-dark-green flex items-center text-sm',
          asCta && 'cta with-chevron'
        )}
      >
        {Icon && <Icon size={24} className="mr-2" />}
        <span className={clsx(flex && 'flex-1')}>{link.value.text}</span>
      </a>
    ));
  }, [Icon, asCta, isLoading, links, onLinkClick, flex]);

  return (
    <div className={clsx('flex-1 flex flex-col', className)}>
      <span tabIndex={0} className="flex eyebrow pb-2 w-full border-b text-gray-70 border-gray-30">
        {title.value}
      </span>

      <ul className={clsx('grid gap-x-8 gap-y-3 mt-3', numberOfColumns === 2 && 'md:grid-cols-2')}>
        {LinksContent}
      </ul>
    </div>
  );
}
