import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { Topic } from '../components/InsightsListing/InsightsListing';
import { useAnalyticsTracking, useToggle } from 'hooks/index';
import { ANALYTICS_EVENTS } from 'constants/index';

interface HorizontalTabsProps<T> {
  tabs: T[];
  getTabKey: (tab: T) => string;
  getTabName: (tab: T) => string;
  renderContent: (tab: T) => JSX.Element | JSX.Element[];
  className?: string;
  layout?: 'vertical' | 'horizontal';
  setTopic?: (value: Topic) => void;
}

export default function HorizontalTabs<T>({
  tabs,
  className,
  layout = 'horizontal',
  getTabName,
  getTabKey,
  renderContent,
  setTopic,
}: HorizontalTabsProps<T>) {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const { track } = useAnalyticsTracking();
  const [offsetTab, toggleOffsetTab] = useToggle(false);

  useEffect(() => {
    const hashValue = window?.location?.hash?.slice(1);

    if (hashValue) {
      try {
        const decodedTabName = decodeURIComponent(hashValue);
        const tabIndex = tabs.findIndex((tab) => getTabName(tab) === decodedTabName);

        if (tabIndex !== -1 && !offsetTab) {
          const offsetTabPosition = 320;
          const contentRef = document.getElementById(`${decodedTabName}`);

          setActiveTabIndex(tabIndex);

          if (contentRef) {
            setTimeout(
              () =>
                window.scrollTo({
                  top: contentRef.offsetTop - offsetTabPosition,
                  behavior: 'smooth',
                }),
              25
            );

            toggleOffsetTab();
          }
        }
      } catch (error) {
        console.log('Error', error);
      }
    }
  }, [getTabName, offsetTab, tabs, toggleOffsetTab]);

  const activeTabId = useMemo(
    () => getTabKey(tabs[activeTabIndex]),
    [tabs, activeTabIndex, getTabKey]
  );

  return (
    <section
      className={clsx(
        layout === 'vertical' && 'flex flex-col sm:flex-row sm:space-x-5 w-full',
        className
      )}
    >
      <nav
        className={clsx(
          'py-6 border-y border-gray-30 space-x-8 overflow-auto overscroll-x-auto flex flex-nowrap px-1',
          layout === 'vertical' && 'sm:flex-col sm:border-y-0 sm:w-80 sm:!py-1'
        )}
        role="tablist"
      >
        {tabs?.map((tab, index) => {
          const isActive = index === activeTabIndex;
          const tabId = getTabKey(tab);

          return (
            <button
              key={tabId}
              className={clsx(
                'cta rounded-tag focus-dark-green border-2 border-transparent py-1 px-3 focus:border-gray-50 whitespace-nowrap',
                layout === 'vertical' && 'sm:!ml-0 sm:mb-4 sm:w-fit',
                isActive && '!border-isc2-green'
              )}
              disabled={isActive}
              onClick={() => {
                setActiveTabIndex(index);
                window?.history?.pushState(null, '', `#${getTabName(tab)}`);
                if (setTopic) {
                  setTopic({ name: getTabName(tab), id: tabId });
                }
                track({
                  type: 'engagement',
                  subtype: 'horizontal_tab_impression',
                  bo1: true,
                  element_id: getTabName(tab),
                  event: ANALYTICS_EVENTS.GA_EVENT,
                });
              }}
              role="tab"
              aria-label={getTabName(tab)}
              id={getTabName(tab)}
              aria-controls={isActive ? `horizontal-tab-${tabId}` : ''}
            >
              {getTabName(tab)}
            </button>
          );
        })}
      </nav>

      <section
        role="tabpanel"
        id={`horizontal-tab-${activeTabId}`}
        aria-labelledby={activeTabId}
        className={layout === 'vertical' ? 'sm:grow w-full' : ''}
      >
        {renderContent(tabs[activeTabIndex])}
      </section>
    </section>
  );
}
