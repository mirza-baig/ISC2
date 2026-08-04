import { Field } from '@sitecore-jss/sitecore-jss-nextjs';
import SearchModalLinksSection from 'components/Header/SearchModal/SearchModalLinks/SearchModalLinksSection';
import useAutocompleteLinks from 'hooks/useAutocompleteLinks';
import { useAutocomplete } from 'providers/index';

interface SearchNoResultsProps {
  heading: Field<string>;
  query: string;
}

const SearchNoResults = ({ heading, query }: SearchNoResultsProps) => {
  const { noResultsSection, tryTheFollowingList } = useAutocompleteLinks();
  const { algoliaDetails } = useAutocomplete();

  const triggerType = algoliaDetails?.startSearchTriggerTypes?.value;

  let displayHeading = heading?.value?.replace('{0}', query);

  if (triggerType === 'Min 3 Character Search' && query.length > 0 && query.length < 3) {
    displayHeading =
      algoliaDetails?.min3CharacterSearchLabel?.value ||
      'Enter at least 3 characters to start searching';
  }

  const getFeatureFlagLabel = () => {
    if (triggerType === 'Min 3 Character Search' && query.length > 0 && query.length < 3) {
      return (
        algoliaDetails?.min3CharacterSearchLabel?.value ||
        'Enter at least 3 characters to start searching'
      );
    }

    if (triggerType === 'Enter Key' && query.length > 0) {
      return algoliaDetails?.pressEnterKeySearchLabel?.value || 'Press Enter to search';
    }

    return null;
  };

  const featureFlagLabel = getFeatureFlagLabel();
  const enhancedTryTheFollowingList = {
    ...tryTheFollowingList,
    links: [
      ...tryTheFollowingList.links,
      ...(featureFlagLabel ? [{ value: featureFlagLabel }] : []),
    ],
  };

  return (
    <div className="flex flex-col w-full gap-10 px-5 lg:px-56 py-12 sm:py-0">
      {heading && query && <h2 className="headline-m lg:headline-l">{displayHeading}</h2>}
      <div className="w-full">
        <span
          tabIndex={0}
          className="flex eyebrow pb-2 w-full border-b text-gray-70 border-gray-30"
        >
          {enhancedTryTheFollowingList.title.value}
        </span>
        <ul className="flex flex-col gap-3 mt-3 list-circle list-inside">
          {enhancedTryTheFollowingList.links.map((item, index) => (
            <li tabIndex={0} key={`${item.value}-${index}`} className="body-m">
              {item.value}
            </li>
          ))}
        </ul>
      </div>
      <SearchModalLinksSection
        {...noResultsSection}
        className="max-md:order-3"
        numberOfColumns={1}
        asCta
        flex={false}
      />
    </div>
  );
};

export default SearchNoResults;
