import { useMemo } from 'react';
import { useAutocomplete } from 'providers/index';
import { RepeatIcon, SearchIcon } from 'icons/index';
import { useAutocompleteLinks } from 'hooks/index';

import SearchModalLinksSection from './SearchModalLinksSection';
import SearchModalProducts from './SearchModalProducts';

export default function SearchModalLinks() {
  const {
    autocompleteState,
    isQueryEmpty,
    suggestions,
    noResultsFound,
    recentSearches,
    isLoading,
    showNoResultsContent,
    algoliaDetails,
  } = useAutocomplete();

  const {
    quickAccessSection,
    noResultsSection,
    recentSearchesSection,
    userShouldSeeRecentSearches,
    isc2RecommendsSection,
    noResultsMessage,
    tryTheFollowingList,
  } = useAutocompleteLinks();

  const NoResultsMessage = useMemo(() => {
    const query = autocompleteState.query;
    const triggerType = algoliaDetails?.startSearchTriggerTypes?.value;

    if (triggerType === 'Enter Key' && query.length > 0) {
      return algoliaDetails?.pressEnterKeySearchLabel?.value || 'Press Enter to search';
    }

    if (triggerType === 'Min 3 Character Search' && query.length > 0 && query.length < 3) {
      return (
        algoliaDetails?.min3CharacterSearchLabel?.value ||
        'Enter at least 3 characters to start searching'
      );
    }

    return noResultsMessage?.replace('{searchTerm}', `'${query}'`);
  }, [autocompleteState.query, noResultsMessage, algoliaDetails]);

  const SuggestionsLinksContent = useMemo(() => {
    if (isQueryEmpty && userShouldSeeRecentSearches && recentSearches.length) {
      return (
        <SearchModalLinksSection
          key="recent-searches"
          title={recentSearchesSection.title}
          links={recentSearches}
          Icon={RepeatIcon}
          addToRecent
          className="max-md:order-3"
        />
      );
    }

    if (suggestions.length) {
      return (
        <SearchModalLinksSection
          key="suggestions"
          title={isc2RecommendsSection.title}
          links={suggestions}
          Icon={SearchIcon}
          addToRecent
          className="max-md:order-3"
        />
      );
    }

    const getFeatureFlagLabel = () => {
      const triggerType = algoliaDetails?.startSearchTriggerTypes?.value;
      const query = autocompleteState.query;

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

    return (
      <>
        <span
          tabIndex={0}
          className="flex eyebrow pb-2 w-full border-b text-gray-70 border-gray-30"
        >
          {tryTheFollowingList.title.value}
        </span>

        <ul className="flex flex-col gap-3 mt-3 list-circle list-inside">
          {tryTheFollowingList.links.map((item) => (
            <li tabIndex={0} key={item.value} className="body-m">
              {item.value}
            </li>
          ))}
          {featureFlagLabel && (
            <li tabIndex={0} className="body-m">
              {featureFlagLabel}
            </li>
          )}
        </ul>
      </>
    );
  }, [
    isQueryEmpty,
    userShouldSeeRecentSearches,
    recentSearches,
    recentSearchesSection,
    suggestions,
    isc2RecommendsSection,
    tryTheFollowingList,
    algoliaDetails,
    autocompleteState.query,
  ]);

  const RightContent = useMemo(() => {
    if (noResultsFound) {
      return (
        <SearchModalLinksSection
          {...noResultsSection}
          className="max-md:order-3"
          numberOfColumns={2}
          asCta
        />
      );
    }

    if (!isQueryEmpty || isLoading) {
      return <SearchModalProducts />;
    }

    return (
      <>
        <SearchModalLinksSection className="max-md:order-3 xl:w-304" {...isc2RecommendsSection} />
        <SearchModalLinksSection
          {...quickAccessSection}
          className="max-md:order-1"
          numberOfColumns={2}
          asCta
        />
      </>
    );
  }, [
    noResultsFound,
    isQueryEmpty,
    isLoading,
    isc2RecommendsSection,
    quickAccessSection,
    noResultsSection,
  ]);

  const query = autocompleteState.query;
  const triggerType = algoliaDetails?.startSearchTriggerTypes?.value;
  const isBlockedByFeatureFlags =
    (triggerType === 'Min 3 Character Search' && query.length > 0 && query.length < 3) ||
    (triggerType === 'Enter Key' && query.length > 0);

  if (noResultsFound && !showNoResultsContent && !isBlockedByFeatureFlags) {
    return null;
  }

  return (
    <>
      {noResultsFound && (
        <span
          className="headline-s px-5 mb-10 w-full md:justify-center flex"
          aria-label={NoResultsMessage}
          tabIndex={0}
        >
          {NoResultsMessage}
        </span>
      )}

      <section className="w-full flex px-5 max-md:flex-col md:px-30 xl:px-36 gap-8 pb-14 lg:pb-17.5">
        <div className="flex-1 md:max-w-247 lg:max-w-304 max-md:order-2">
          {SuggestionsLinksContent}
        </div>

        {RightContent}
      </section>
    </>
  );
}
