/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ComponentRendering,
  Field,
  RouteData,
  withDatasourceCheck,
  LinkField,
  GetStaticComponentProps,
  useComponentProps,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { ComponentProps } from 'lib/component-props';
import { AlgoliaSettingsForInsightListing, DropLinkFieldType } from 'src/types';
import SectionTitle from 'ui/SectionTitle';
import HorizontalTabsUI from '../../ui/HorizontalTabs';
import Listing, { HorizontalTabContent } from './Listing';
import { useEffect, useMemo, useState } from 'react';
import { formatBackgroundColorCssClassName } from 'src/utils/background-color';
import { getContrastTextColor } from 'src/utils/colors';
import clsx from 'clsx';
import { getGraphQLResult } from 'utils/graphQLFunctions';
import { SEARCH_SETTINGS_QUERY_FOR_INSIGHT_LISTING } from 'queries/searchSettings';
import algoliasearch from 'algoliasearch';
import { formatDate } from 'utils/date';

type InsightsListingProps = ComponentProps & {
  rendering: ComponentRendering | RouteData;
  fields: {
    props: {
      sectionTitle: Field<string>;
      sectionDescription: Field<string>;
      sectionLink: LinkField;
      fields: tabsField[];
      backgroundGradient: DropLinkFieldType;
      chapterFinderIndex: Field<string>;
    };
    children: tabsFieldAlgolia[];
  };
};

type tabsField = {
  name: string;
  id: string;
  children: [
    {
      image: string;
      eyeBrow: string;
      heading: string;
      ctaLabel: LinkField;
    }
  ];
};

type tabsFieldAlgolia = {
  name: string;
  id: string;
  children: [];
  fields: {
    algoliaMappedField: Value;
    tabTopic: {
      fields: { name: Value };
    };
    tabName: Value;
  };
};
type Value = {
  value: string;
};
export type Topic = {
  id: string;
  name: string;
};

type TabData = {
  id: string;
  tabContent: HorizontalTabContent[];
};

type AlgoliaField = {
  objectID: string;
  title: string;
  url: string;
  createdDate: string;
  thumbnailImage: string;
  genericType: string;
};

function InsightsListing({ fields, rendering }: InsightsListingProps) {
  const [topic, setTopic] = useState<Topic>();
  const [tabData, setTabData] = useState<TabData>();
  const algoliaSettings = useComponentProps<AlgoliaSettingsForInsightListing>(rendering.uid);
  const tabsWithContent = useMemo(() => {
    if (rendering?.fields?.children) {
      const tabs = rendering?.fields?.children as unknown as HorizontalTabContent[];

      return tabs?.map((fields) => {
        if (fields.children.length === 0 && tabData && tabData.id === fields.id) {
          return {
            tabName: fields.name,
            id: fields.id,
            tabContent: tabData.tabContent,
          };
        }

        return { tabName: fields.name, id: fields.id, tabContent: fields.children };
      });
    }

    return [];
  }, [rendering?.fields, tabData]);

  const algoliaIndex = useMemo(() => {
    if (!algoliaSettings) {
      return null;
    }

    const {
      algoliaDetails: { algoliaSortDescByDateIndexName, algoliaApiKey, algoliaAppId },
    } = algoliaSettings;

    if (!algoliaApiKey?.value || !algoliaAppId?.value || !algoliaSortDescByDateIndexName?.value) {
      return null;
    }

    const client = algoliasearch(algoliaAppId.value, algoliaApiKey.value);

    return client.initIndex(algoliaSortDescByDateIndexName.value);
  }, [algoliaSettings]);

  useEffect(() => {
    if (topic && algoliaIndex) {
      const data = fields?.children;
      const filterData = data.filter((item) => item.id === topic.id);
      const { children } = filterData[0];
      if (!children.length) {
        const {
          fields: { algoliaMappedField, tabTopic },
        } = filterData[0];
        algoliaIndex
          .search('', {
            hitsPerPage: 4,
            facetFilters: [`${algoliaMappedField.value}:${tabTopic?.fields?.name.value}`],
            attributesToRetrieve: ['title', 'createdDate', 'url', 'thumbnailImage', 'genericType'],
          })
          .then(({ hits }) => {
            const tabData = {
              id: topic.id,
              tabContent: hits.map((data: AlgoliaField, i) => ({
                id: data.objectID,
                fields: {
                  heading: { value: data.title },
                  title: { value: data.title },
                  link: { value: { href: data.url, text: 'View More' } },
                  date: { value: formatDate({ value: data.createdDate }) },
                  image: {
                    value: i === 0 && {
                      src: data.thumbnailImage,
                      width: '416',
                      height: '416',
                      alt: '',
                    },
                  },
                  eyebrow: { value: data?.genericType },
                },
              })),
            };
            // @ts-ignore
            setTabData(tabData);
          });
      }
    }
  }, [topic, algoliaIndex, fields?.children]);
  if (!algoliaSettings || !fields) {
    return null;
  }

  const textColor = getContrastTextColor(fields.props?.backgroundGradient);

  return (
    <div
      className={clsx(
        formatBackgroundColorCssClassName(fields.props?.backgroundGradient),
        `pt-14 px-5 md:pt-20 md:px-16 sm:py-20 mb-14 md:mb-20 ${textColor}`
      )}
    >
      <SectionTitle
        title={fields.props?.sectionTitle}
        subtitle={fields.props?.sectionDescription}
        link={fields.props?.sectionLink}
      />
      {tabsWithContent.length > 1 ? (
        <HorizontalTabsUI
          tabs={tabsWithContent}
          getTabName={(tab) => tab?.tabName}
          getTabKey={(tab) => tab?.id}
          layout="vertical"
          className="md:h-[556px]"
          setTopic={setTopic}
          renderContent={(tab) => <Listing fields={tab?.tabContent} activeTabId={tab?.id} />}
        />
      ) : (
        tabsWithContent?.map((data) => (
          <Listing fields={data?.tabContent} activeTabId={data?.id} key={data.id} />
        ))
      )}
    </div>
  );
}

export const getStaticProps: GetStaticComponentProps = async (): Promise<unknown> => {
  return await getGraphQLResult<AlgoliaSettingsForInsightListing>(
    SEARCH_SETTINGS_QUERY_FOR_INSIGHT_LISTING
  );
};

export default withDatasourceCheck()<InsightsListingProps>(InsightsListing);
