import React from 'react';
import clsx from 'clsx';

import { NavigationLayoutProps, Tab } from 'types/index';
import { useHeaderNavigation } from 'providers/index';

import Caption from 'components/Header/Caption';
import ColumnLinksList from 'components/Header/ColumnLinksList';
import NavigationLink from 'components/Header/NavigationLink';

const VerticalTabLayout = ({ onBackButtonClick }: NavigationLayoutProps) => {
  const { isOpen, selectedMenuItem, selectedTab, setSelectedTab, tabs } = useHeaderNavigation();

  function handleSelectedTabBackButtonClick() {
    setSelectedTab(null);
  }

  const handleNavigationLinkClick = (item: Tab) => {
    if (selectedTab !== item) {
      setSelectedTab(item);
    }
  };

  if (!selectedMenuItem) {
    return null;
  }

  return (
    <>
      {/* Mobile layout */}
      <div className={clsx('md:hidden', isOpen ? 'block' : 'hidden')}>
        <div className="flex flex-col items-start px-5 py-0">
          {!selectedTab && (
            <>
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
              <div className="w-full px-0">
                {tabs?.map((item, i) => (
                  <div
                    key={i}
                    className="w-full px-0 flex items-center justify-between border-b border-gray-30 md:hidden"
                  >
                    <NavigationLink
                      displayAs="MainNavigationLink"
                      fields={{
                        link: {
                          value: {
                            text: item?.tabName?.value?.toString() ?? '',
                          },
                        },
                      }}
                      isActive={false}
                      onClick={() => handleNavigationLinkClick(item)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {selectedTab && (
            <>
              <div className="block w-full flex items-center border-b border-gray-30">
                <NavigationLink
                  className="!px-0"
                  fields={{
                    link: {
                      value: {
                        text: selectedTab?.tabName?.value?.toString() ?? '',
                      },
                    },
                  }}
                  displayAs="MainNavigationLink"
                  isActive={true}
                  onClick={handleSelectedTabBackButtonClick}
                />
              </div>
              {selectedTab?.tabHeading?.value && (
                <div className="w-full px-7">
                  <div className="py-6 border-b border-gray-30">
                    <Caption
                      title={selectedTab?.tabHeading}
                      content={selectedTab?.tabDescription}
                    />
                  </div>
                </div>
              )}
              <div className="w-full px-7">
                <ColumnLinksList
                  columnLinks={selectedTab?.columnLinks}
                  containerClassName="py-6 border-b border-gray-30"
                  subContainerClassName="flex items-center"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex">
        <div className="flex pb-8 px-8 w-full">
          <div className="w-218">
            {tabs?.map((item, i) => (
              <div key={i} className="w-full flex items-center justify-between">
                <NavigationLink
                  className="w-full !px-0 !pb-0"
                  displayAs="TextLink"
                  fields={{
                    link: {
                      value: {
                        text: item?.tabName?.value?.toString() ?? '',
                      },
                    },
                  }}
                  isActive={selectedTab === item}
                  onClick={() => handleNavigationLinkClick(item)}
                />
              </div>
            ))}
          </div>
          <div className="w-4/5">
            {selectedTab && (
              <div className="flex flex-col">
                <div className="flex-1">
                  {selectedTab?.tabHeading?.value && (
                    <div className="w-full pl-14 pt-0 pb-8">
                      <Caption
                        title={selectedTab?.tabHeading}
                        content={selectedTab?.tabDescription}
                      />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div
                    className={clsx('flex flex-row gap-14 w-full pl-14 pb-8', {
                      'gap-10': selectedTab?.columnLinks.length > 3,
                    })}
                  >
                    <ColumnLinksList
                      columnLinks={selectedTab?.columnLinks}
                      containerClassName="flex flex-col"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default VerticalTabLayout;
