import { Field, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, Hits, Configure } from 'react-instantsearch-dom';
import { CustomMenuSelect } from './MenuSelect';
import StateResults from './StateResults';
import { AlgoliaSettingsForChapterFinder } from 'src/types';
import { useMemo, useState, useContext, useEffect } from 'react';
import { useLayout } from 'providers/index';
import LocationDetector from './LocationDetector';
import { LocationContext } from 'providers/userLocation';

interface ChapterFinderProps {
  fields: Fields;
  isSelect: string;
  setIsselect: (value: string) => void;
  textColor: string;
  algoliaSettings: AlgoliaSettingsForChapterFinder;
}
interface Fields {
  heading: Field<string>;
  countryDropdownLabel: Field<string>;
  stateDropdownLabel: Field<string>;
  ctaLabel: valueField;
}
type valueField = {
  value: string;
};

const ChapterFinder = ({
  fields,
  isSelect,
  setIsselect,
  textColor,
  algoliaSettings,
}: ChapterFinderProps): JSX.Element => {
  const [isClear, setIsclear] = useState(false);
  const [country, setCountry] = useState('');
  const { isEditing } = useLayout();
  const { locationDetectionInitiated, chaptersInRange, setChaptersInRange } =
    useContext(LocationContext);

  const {
    algoliaDetails: { algoliaChapterFilderIndexName, algoliaApiKey, algoliaAppId },
  } = algoliaSettings;
  const searchClient = useMemo(() => {
    if (!algoliaAppId || !algoliaApiKey || isEditing || !algoliaChapterFilderIndexName) {
      return null;
    }

    return algoliasearch(algoliaAppId?.value, algoliaApiKey?.value);
  }, [algoliaApiKey, algoliaAppId, isEditing, algoliaChapterFilderIndexName]);

  const locationResultsText = 'Showing results near you';
  const noChaptersText = 'No Chapters found near your location.';

  useEffect(() => {
    if (locationDetectionInitiated) {
      setChaptersInRange(0);
    }
  }, [locationDetectionInitiated, setChaptersInRange]);

  return (
    <InstantSearch searchClient={searchClient} indexName={algoliaChapterFilderIndexName?.value}>
      <Configure hitsPerPage={1000} />
      <div className="flex flex-col w-full md:flex-row px-6 sm:px-16">
        <div className="flex flex-col">
          {fields.heading && (
            <Text
              tag="h2"
              className={`headline-l font-light ${textColor}`}
              field={fields.heading}
            />
          )}
          {fields.countryDropdownLabel && locationDetectionInitiated === false && (
            <Text
              tag="h4"
              className={`body-m mt-6 mb-1 ${textColor}`}
              field={fields.countryDropdownLabel}
            />
          )}
          <div style={{ display: locationDetectionInitiated ? 'none' : 'block' }}>
            <CustomMenuSelect
              attribute="country"
              setIsselect={setIsselect}
              isSelect={isSelect}
              isClear={isClear}
              setIsclear={setIsclear}
              setCountry={setCountry}
              country={country}
              limit={100}
              fields={fields}
            />
          </div>
          {isSelect !== '' && locationDetectionInitiated === false && (
            <CustomMenuSelect
              attribute="stateProvince"
              setIsselect={setIsselect}
              isSelect={isSelect}
              isClear={isClear}
              setIsclear={setIsclear}
              setCountry={setCountry}
              country={country}
              limit={100}
              fields={fields}
            />
          )}
          {locationDetectionInitiated && (
            <>
              <p className="block font-normal mt-4">{locationResultsText}</p>
            </>
          )}
          <div className="flex flex-row w-full self-start">
            <LocationDetector setIsselect={setIsselect} setIsclear={setIsclear} />
          </div>
        </div>
        {isSelect !== '' && (
          <div className="md:h-[500px] md:overflow-auto overflow-hidden slider-scrollbar">
            <div
              className={`border-0 lg:px-11 md:ml-24 border-gray-20 border-solid md:border-l cursor-default ${textColor}`}
            >
              <Hits hitComponent={StateResults} />
              {chaptersInRange === 0 && locationDetectionInitiated && (
                <p className="w-auto lg:w-[512px] text-center">{noChaptersText}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </InstantSearch>
  );
};

export default ChapterFinder;
