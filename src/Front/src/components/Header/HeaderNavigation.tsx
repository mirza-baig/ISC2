import React, { useEffect } from 'react';
import clsx from 'clsx';
import {
  ComponentRendering,
  GetStaticComponentProps,
  Image,
  useComponentProps,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { getGraphQLResult } from 'utils/graphQLFunctions';
import { useAnalyticsTracking } from 'hooks/index';

import { HeaderNavigationFields, SearchModalAlgoliaSettings } from 'types/index';
import { AutocompleteProvider, useHeaderNavigation } from 'providers/index';
import { SearchIcon } from 'icons/index';
import { SEARCH_SETTINGS_QUERY } from 'queries/index';
import ContainerLayout from 'components/Header/HeaderLayouts/ContainerLayout';
import HamburgerButton from 'components/Header/HamburgerButton';
import NavigationLinks from 'components/Header/NavigationLinks';
import SearchModal from './SearchModal/SearchModal';
import { ANALYTICS_EVENTS } from 'constants/index';

interface HeaderNavigationProps {
  rendering: ComponentRendering;
  fields: HeaderNavigationFields;
}

const HeaderNavigation = ({ fields, rendering }: HeaderNavigationProps) => {
  const algoliaSettings = useComponentProps<SearchModalAlgoliaSettings>(rendering.uid) ?? null;

  const {
    isOpen,
    menuItems,
    selectedMenuItem,
    setIsHovered,
    setIsOpen,
    setMenuItems,
    isSearchOpen,
    setMenuItemActive,
    toggleSearchOpen,
    closeAllNavigation,
  } = useHeaderNavigation();
  const { track } = useAnalyticsTracking();

  const navigationItems = fields?.navigationItems;
  const isNavigationOpen = isOpen || isSearchOpen;

  useEffect(() => {
    if (navigationItems) {
      setMenuItems(navigationItems);
    }
  }, [navigationItems, setMenuItems]);

  const headerNavigationStyles = clsx(
    'absolute m-auto bg-white-00 shadow-md backdrop-filter backdrop-blur-md bg-opacity-90',
    'sm:top-6 sm:left-8 sm:right-8 sm:bg-opacity-100 sm:bg-white sm:shadow-md',
    isNavigationOpen &&
      'top-0 left-0 right-0 rounded-none h-dynamic-screen pb-8 sm:pb-0 sm:max-h-[calc(100vh-3rem)] overflow-y-auto sm:h-auto sm:rounded-lg',
    !isNavigationOpen && 'max-sm:top-11 top-6 left-4 right-4 rounded-lg'
  );

  const handleMenuToggle = () => {
    if (isOpen) {
      return closeAllNavigation();
    }

    setIsOpen(!isOpen);
  };

  const handleMainNavigationLinkEnter = () => {
    if (!isOpen) {
      setIsHovered(true);
    }
  };

  return (
    <nav className={headerNavigationStyles}>
      <div
        className={clsx(
          'py-5 px-4 mx-auto lg:p-8',
          isNavigationOpen && 'max-sm:px-8 max-sm:pt-16 lg:p-8'
        )}
      >
        <div className="flex justify-between items-center">
          <div className="flex-shrink-0 flex items-center">
            {Boolean(fields?.logo) && (
              <a
                className="focus-isc2-green rounded"
                href="https://www.isc2.org/"
                onClick={() =>
                  track({
                    event: ANALYTICS_EVENTS.VT_INTERRUPTION,
                    interruption_type: 'navigation_logo_click',
                  })
                }
              >
                <Image field={fields?.logo} width={76} height={28} />
              </a>
            )}
          </div>
          <div className="flex-grow-1 hidden md:flex md:items-center">
            <NavigationLinks
              containerClassName="hidden md:mx-1 md:flex md:items-center"
              items={menuItems}
              onClick={setMenuItemActive}
              onMouseEnter={handleMainNavigationLinkEnter}
            />
          </div>
          <div className="space-x-6 flex items-center md:hidden">
            <button
              title="Open Search"
              onClick={toggleSearchOpen}
              className="sm:hidden"
              aria-label="Open Search"
            >
              <SearchIcon size={24} />
            </button>
            <HamburgerButton isOpen={isOpen} onClick={handleMenuToggle} />
          </div>
        </div>
      </div>

      {isSearchOpen && algoliaSettings && (
        <AutocompleteProvider algoliaSettings={algoliaSettings} showNoResultsContent>
          <SearchModal />
        </AutocompleteProvider>
      )}
      {isOpen && !selectedMenuItem && (
        <div className="px-8 py-0 sm:px-6">
          <NavigationLinks
            containerClassName="flex items-center justify-between border-b border-gray-30 sm:border-none w-full sm:w-6/12 md:hidden"
            items={menuItems}
            onClick={setMenuItemActive}
          />
        </div>
      )}
      <ContainerLayout />
    </nav>
  );
};

export const getStaticProps: GetStaticComponentProps = async (): Promise<unknown> => {
  return await getGraphQLResult<SearchModalAlgoliaSettings>(SEARCH_SETTINGS_QUERY);
};

export default HeaderNavigation;
