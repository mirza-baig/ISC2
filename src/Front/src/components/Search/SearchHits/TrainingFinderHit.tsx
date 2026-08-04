import { useMemo, useCallback } from 'react';
import type { Hit } from 'instantsearch.js';

import { SearchResultHit } from 'types/index';
import QuestionIcon from 'icons/QuestionIcon';
import Tooltip from 'ui/Tooltip';
import { formatDate } from 'utils/index';
import { useAnalyticsTracking, useBreakpoint } from 'hooks/index';

import { useCurrentRefinements } from 'react-instantsearch-hooks-web';
import { ANALYTICS_EVENTS } from 'constants/index';

interface TrainingFinderHitProps {
  hit: Hit<SearchResultHit>;
  labels: {
    trainingProviderLabel: string;
    trainingMethodLabel: string;
    startDateLabel: string;
    endDateLabel: string;
    locationLabel: string;
    buttonLabel: string;
    tooltipValue: string;
  };
}

type TrainingFinderItemProps = {
  label: string;
  value?: string;
  tooltip?: string | number;
};

type CustomLocationProps = {
  type: string;
  country: string;
  city: string;
  locationLabel: string;
};

const TrainingFinderItem = ({ label, value, tooltip }: TrainingFinderItemProps) => {
  const breakpoint = useBreakpoint();

  const tooltipPosition = useMemo(
    () => (breakpoint === 'lg' || breakpoint === 'xl' ? 'top' : 'left'),
    [breakpoint]
  );

  if (!value) {
    return null;
  }

  return (
    <li className="flex flex-row items-center md:items-baseline">
      <span className="eyebrow sm:text-right w-36 md:whitespace-nowrap">{label}</span>
      <span className="ml-4 body-s md:w-36 md:line-clamp-2" title={value}>
        {value}
      </span>
      {tooltip && (
        <Tooltip
          Component={<QuestionIcon size={18} />}
          content={tooltip!}
          position={tooltipPosition}
          className="w-52 text-center"
          containerClasses="ml-2"
        />
      )}
    </li>
  );
};

const CustomLocation = ({ type, country, city, locationLabel }: CustomLocationProps) => {
  if (type === 'Online Self-Paced') {
    return null;
  }

  return (
    <TrainingFinderItem label={locationLabel} value={city ? `${country}, ${city}` : country} />
  );
};

const TrainingFinderHit = ({ hit, labels }: TrainingFinderHitProps) => {
  const isPinned = Boolean(hit.pinned);
  const lineClampClass = useMemo(() => (isPinned ? `line-clamp-2` : 'line-clamp-4'), [isPinned]);
  const { track } = useAnalyticsTracking();
  const refinements = useCurrentRefinements();

  const searchFacets = useMemo(() => {
    if (refinements.items.length) {
      const facets = refinements.items.map((item) => item.attribute);

      return facets.join('%');
    }

    return undefined;
  }, [refinements.items]);

  const hitUrl = useMemo(() => {
    if (hit.link) {
      const url = new URL(hit.link);

      if (hit.__queryID) {
        url.searchParams.set('queryID', hit.__queryID);
      }

      return url.href;
    }

    return '';
  }, [hit.link, hit.__queryID]);

  const trackCtaClick = useCallback(() => {
    track({
      event: ANALYTICS_EVENTS.GA_EVENT,
      type: 'lead',
      subtype: 'training_finder_click',
      bo2: true,
      bo3: true,
      element_id: hit.title,
      filter_state: searchFacets,
    });
  }, [track, searchFacets, hit.title]);

  const ctaLabel = useMemo(() => {
    if (hit.link) {
      return hit.cta || hit.buttonLabel || 'Schedule Training';
    }

    return '';
  }, [hit.link, hit.cta, hit.buttonLabel]);

  return (
    <div
      className="flex flex-col py-8 border-b border-gray-20 sm:py-10 items-start"
      data-insights-object-id={hit.objectID}
      data-insights-position={hit.__position}
      data-insights-query-id={hit.__queryID}
    >
      <div className="flex flex-col sm:flex-row w-full sm:space-y-0">
        <section className="flex flex-col flex-1 space-y-4">
          {Boolean(hit.type) && <h6 className="eyebrow text-gray-70">{hit.type}</h6>}
          <h2 className={`body-l sm:headline-s text-black-100 ${lineClampClass}`}>{hit.title}</h2>
          {Boolean(hit.description) && (
            <p className={`body-m text-black-100 text-justify ${lineClampClass}`}>
              {hit.description}
            </p>
          )}
        </section>

        <ul className="w-full sm:w-auto my-6 sm:my-0 sm:ml-16 space-y-4 sm:space-y-3 md:w-96">
          <TrainingFinderItem
            label={labels.trainingProviderLabel}
            value={hit.vendorName}
            tooltip={labels.tooltipValue}
          />
          <TrainingFinderItem label={labels.trainingMethodLabel} value={hit.courseDeliveryType} />
          <TrainingFinderItem
            label={labels.startDateLabel}
            value={formatDate({ value: hit.startDate })}
          />
          <TrainingFinderItem
            label={labels.endDateLabel}
            value={formatDate({ value: hit.endDate })}
          />
          <CustomLocation
            type={hit.courseDeliveryType}
            country={hit.country}
            city={hit.city}
            locationLabel={labels.locationLabel}
          />
        </ul>
      </div>

      {Boolean(ctaLabel) && (
        <a href={hitUrl} className="sm:mt-4 secondary-cta" onClick={trackCtaClick}>
          {ctaLabel}
        </a>
      )}
    </div>
  );
};

export default TrainingFinderHit;
