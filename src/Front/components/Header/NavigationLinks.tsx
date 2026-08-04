import React, { useCallback, useEffect, useState } from 'react';

import { useHeaderNavigation } from 'providers/index';
import { MenuItem } from 'types/index';

import NavigationLink from 'components/Header/NavigationLink';

type NavigationLinks = {
  containerClassName?: string;
  items: MenuItem[];
  onClick: (item: MenuItem) => void;
  onMouseEnter?: (item: MenuItem) => void;
  onMouseLeave?: () => void;
  subContainerClassName?: string;
};

const NavigationLinks = ({
  containerClassName,
  items,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: NavigationLinks) => {
  const { selectedMenuItem, isOpen, isHovered } = useHeaderNavigation();
  const [activeNavigationItemId, setActiveNavigationItemId] = useState('');

  const onEscKeyPressed = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && activeNavigationItemId) {
        const activeNavigationItemElement = window.document.getElementById(activeNavigationItemId);

        if (activeNavigationItemElement) {
          activeNavigationItemElement.focus();
        }
      }
    },
    [isOpen, activeNavigationItemId]
  );

  useEffect(() => {
    document.addEventListener('keydown', onEscKeyPressed, false);

    return () => {
      document.removeEventListener('keydown', onEscKeyPressed, false);
    };
  }, [onEscKeyPressed]);

  if (!items?.length) return null;

  return (
    <>
      {items.map((item, i) => (
        <div key={i} className={containerClassName}>
          <NavigationLink
            className="!px-0 sm:!px-4"
            tabIndex={isOpen ? -1 : 0}
            id={`navigation-item-${i}`}
            displayAs="MainNavigationLink"
            fields={{
              link: {
                value: {
                  text: item?.menuDisplayName?.value?.toString() ?? '',
                },
              },
            }}
            isActive={isOpen && selectedMenuItem === item}
            isHovered={isHovered && selectedMenuItem === item}
            onClick={() => {
              onClick(item);
              setActiveNavigationItemId(`navigation-item-${i}`);
            }}
            onMouseEnter={onMouseEnter && (() => onMouseEnter(item))}
            onMouseLeave={onMouseLeave && (() => onMouseLeave())}
          />
        </div>
      ))}
    </>
  );
};

export default NavigationLinks;
