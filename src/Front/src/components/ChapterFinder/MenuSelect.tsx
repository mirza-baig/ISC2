import { useEffect, useContext, useRef } from 'react';
import { connectMenu } from 'react-instantsearch-dom';
import { useAnalyticsTracking } from 'hooks/index';
import { Text, Field } from '@sitecore-jss/sitecore-jss-nextjs';
import { LocationContext } from 'providers/userLocation';
import { ANALYTICS_EVENTS } from 'constants/index';

interface MenuSelectProps {
  items: [];
  setIsselect: (value: string) => void;
  attribute: string;
  currentRefinement: string;
  refine: (value: string) => void;
  isSelect: string;
  isClear: boolean;
  setIsclear: (value: boolean) => void;
  setCountry: (value: string) => void;
  country: string;
  limit: number;
  fields: Fields;
}

type item = {
  label: number;
  isRefined: boolean;
  value: string;
};

interface Fields {
  heading: Field<string>;
  countryDropdownLabel: Field<string>;
  stateDropdownLabel: Field<string>;
  ctaLabel: valueField;
}
type valueField = {
  value: string;
};

const MenuSelect = ({
  items,
  currentRefinement,
  refine,
  attribute,
  setIsselect,
  isSelect,
  isClear,
  setIsclear,
  country,
  setCountry,
  fields,
}: MenuSelectProps) => {
  const { track } = useAnalyticsTracking();
  const { locationDetectionInitiated, setLocationDetectionInitiated } = useContext(LocationContext);
  const dropdownRef = useRef<HTMLSelectElement>(null);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (setLocationDetectionInitiated) {
      setLocationDetectionInitiated(false);
    }
    refine(e.currentTarget.value);

    if (attribute === 'country') {
      setIsselect(attribute);
      setCountry(e.currentTarget.value);
    }

    if (attribute === 'stateProvince') {
      setIsselect(attribute);
      track({
        event: ANALYTICS_EVENTS.GA_EVENT,
        type: 'engagement',
        subtype: 'chapter_finder_search',
        chapter_finder_form_country: country,
        chapter_finder_form_state: e.currentTarget.value,
        bo1: true,
        bo3: true,
      });
    }
  };

  const handleClick = () => {
    if (currentRefinement !== null && isSelect === 'stateProvince' && attribute === 'country') {
      refine('');
      setIsselect('');
    }
  };

  useEffect(() => {
    if (isClear) {
      refine('');
      setIsclear(false);
    }
  }, [isClear, refine, setIsclear]);

  useEffect(() => {
    if (locationDetectionInitiated) {
      setCountry('');
      setIsselect('country');
      setIsclear(true);
      refine('');
      if (dropdownRef.current) {
        const event = new Event('change', { bubbles: true });
        dropdownRef.current.dispatchEvent(event);
      }
    }
  }, [locationDetectionInitiated, refine, setIsselect, setCountry, setIsclear]);

  if (!items.length) {
    return null;
  }
  return (
    <>
      {attribute === 'stateProvince' && (
        <Text tag="h4" className="body-m mt-6  mb-1" field={fields.stateDropdownLabel} />
      )}
      <select
        className="px-4 py-6 border border-gray-70 rounded-lg border-solid w-full max-w-64 md:w-96 md:max-w-none appearance-none bg-no-repeat bg-[size:1.5em] select-pos text-gray-70"
        value={currentRefinement || ''}
        onChange={(event) => handleSelect(event)}
        onClick={() => handleClick()}
      >
        <option value="">See all options</option>
        {items.map((item: item) => (
          <option key={item.label} value={item.isRefined ? currentRefinement : item.value}>
            {item.label}
          </option>
        ))}
      </select>
      {attribute === 'stateProvince' && (
        <span
          className="text-dark-green text-sm mt-4 cursor-pointer"
          onClick={() => {
            setIsselect('');
            setIsclear(true);
          }}
        >
          {fields.ctaLabel.value}
        </span>
      )}
    </>
  );
};

export const CustomMenuSelect = connectMenu(MenuSelect);
