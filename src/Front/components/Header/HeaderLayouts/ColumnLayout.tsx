import React, { useMemo } from 'react';
import clsx from 'clsx';

import { useHeaderNavigation } from 'providers/index';
import { NavigationLayoutProps } from 'types/index';

import Caption from 'components/Header/Caption';
import ColumnLinksList from 'components/Header/ColumnLinksList';
import NavigationLink from 'components/Header/NavigationLink';

import PromoBanner from '../PromoBanner';

const ColumnLayout = ({ onBackButtonClick }: NavigationLayoutProps) => {
  const { isOpen, selectedMenuItem } = useHeaderNavigation();

  const columnsCount = useMemo(() => {
    if (!selectedMenuItem) {
      return 0;
    }

    let base = selectedMenuItem?.columnLinks.length;

    if (selectedMenuItem?.mainHeadline?.value) {
      base = base + 1;
    }

    if (selectedMenuItem.promoCard) {
      base = base + 1;
    }

    return base > 4 ? base : 4;
  }, [selectedMenuItem]);

  if (!selectedMenuItem) {
    return null;
  }

  return (
    <>
      {/* Mobile layout */}
      <div className={clsx('md:hidden', isOpen ? 'block' : 'hidden')}>
        <div className="flex flex-col items-start px-5 py-0">
          <div className="block w-full flex items-center border-b border-gray-30">
            <NavigationLink
              className="!px-0"
              fields={{
                link: {
                  value: {
                    text: selectedMenuItem?.menuDisplayName?.value?.toString() ?? '',
                  },
                },
              }}
              displayAs="MainNavigationLink"
              isActive={true}
              onClick={onBackButtonClick}
            />
          </div>
          {selectedMenuItem?.mainHeadline?.value && (
            <div className="w-full px-7">
              <div className="py-6 border-b border-gray-30">
                <Caption
                  title={selectedMenuItem?.mainHeadline}
                  content={selectedMenuItem?.mainDescription}
                />
              </div>
            </div>
          )}
          <div className="w-full px-7">
            <ColumnLinksList
              columnLinks={selectedMenuItem?.columnLinks}
              containerClassName="py-6 border-b border-gray-30"
              subContainerClassName="flex items-center"
            />
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex">
        <div
          className="grid gap-5 p-8 pt-0 w-full"
          style={{ gridTemplateColumns: `repeat(${columnsCount}, 1fr)` }}
        >
          {Boolean(selectedMenuItem.mainHeadline) && (
            <Caption
              title={selectedMenuItem.mainHeadline}
              content={selectedMenuItem.mainDescription}
            />
          )}
          <ColumnLinksList
            columnLinks={selectedMenuItem?.columnLinks}
            containerClassName="inline-block whitespace-nowrap"
            subContainerClassName="flex items-center"
          />
          <div className="flex justify-end" style={{ gridColumn: columnsCount }}>
            {Boolean(selectedMenuItem.promoCard) && (
              <PromoBanner promoCard={selectedMenuItem.promoCard} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ColumnLayout;
