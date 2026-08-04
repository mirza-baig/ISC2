import {
  ComponentRendering,
  Field,
  RouteData,
  GetStaticComponentProps,
  useComponentProps,
  withDatasourceCheck,
} from '@sitecore-jss/sitecore-jss-nextjs';
import clsx from 'clsx';
import { ComponentProps } from 'lib/component-props';
import ChapterFinder from './ChapterFinder';
import { useState } from 'react';
import { formatBackgroundColorCssClassName } from 'src/utils/background-color';
import { getContrastTextColor } from 'src/utils/colors';
import { DropLinkFieldType, AlgoliaSettingsForChapterFinder } from 'src/types';
import { getGraphQLResult } from 'utils/graphQLFunctions';
import { SEARCH_SETTINGS_QUERY_FOR_CHAPTER_FINDER } from 'queries/searchSettings';
import useBreakpoint from 'hooks/useBreakpoint';
import { LocationProvider } from 'providers/userLocation';

type ChapterFinderContainerProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields: {
    heading: Field<string>;
    countryDropdownLabel: Field<string>;
    stateDropdownLabel: Field<string>;
    ctaLabel: valueField;
    backgroundImage: imageField;
    backgroundGradient: DropLinkFieldType;
  };
};

type imageField = {
  value: {
    src: string;
  };
};
type valueField = {
  value: string;
};

function ChapterFinderContainer({ fields, rendering }: ChapterFinderContainerProps): JSX.Element {
  const algoliaSettings = useComponentProps<AlgoliaSettingsForChapterFinder>(rendering.uid);
  const [isSelect, setIsselect] = useState('');
  const breakpoint = useBreakpoint();
  const image =
    isSelect === '' || (isSelect === '' && breakpoint !== 'sm')
      ? fields?.backgroundImage?.value?.src
      : 'none';
  const textColor = getContrastTextColor(fields.backgroundGradient);

  return (
    <LocationProvider>
      <section className="chapterFinder flex mb-14 md:mb-20">
        <div
          style={{ backgroundImage: `url(${image})` }}
          className={clsx(
            formatBackgroundColorCssClassName(fields.backgroundGradient),
            'w-full flex h-[563px] bg-[0em_14em] bg-contain items-top pt-6 md:items-center md:h-[571px] md:w-full bg-no-repeat md:bg-center'
          )}
        >
          <ChapterFinder
            fields={fields}
            isSelect={isSelect}
            setIsselect={setIsselect}
            textColor={textColor}
            algoliaSettings={algoliaSettings!}
          />
        </div>
      </section>
    </LocationProvider>
  );
}

export const getStaticProps: GetStaticComponentProps = async (): Promise<unknown> => {
  return await getGraphQLResult<AlgoliaSettingsForChapterFinder>(
    SEARCH_SETTINGS_QUERY_FOR_CHAPTER_FINDER
  );
};

export default withDatasourceCheck()<ChapterFinderContainerProps>(ChapterFinderContainer);
