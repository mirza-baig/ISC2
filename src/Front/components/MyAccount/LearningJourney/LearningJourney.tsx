import {
  ComponentRendering,
  Field,
  GetStaticComponentProps,
  LinkField,
  useComponentProps,
  withDatasourceCheck,
} from '@sitecore-jss/sitecore-jss-nextjs';
import { parseFieldsFromURLString } from 'utils/fields';
import { useMemo, useState } from 'react';
import MyAccountSectionContainer from '../MyAccountSectionContainer';
import LearningJourneyFilters from './LearningJourneyFilters';
import LearningJourneyContent from './LearningJourneyContent';
import MyAccountSectionFooter from '../MyAccountSectionFooter';
import { LineItemsProvider } from 'providers/index';
import { useGetLearningJourney } from 'hooks/index';
import { LoadingIndicator } from 'ui/index';
import { AlgoliaSettings } from 'types/index';
import { SEARCH_SETTINGS_QUERY_FOR_ALGOLIA } from 'queries/index';
import { getGraphQLResult } from 'utils/index';

interface LeaningJourneyProps {
  fields: {
    isCompactComponent: Field<boolean>;
    labelsTitlesAndMore: Field<string>;
    seeAllLink: LinkField;
  };
  rendering: ComponentRendering;
}

export interface LeaningJourneyLabels {
  title: string;
  assignedBy: string;
  accessPeriod: string;
  schedulePeriod: string;
  date: string;
  buttonLabel: string;
  failed: string;
  availableLabel: string;
  expiredLabel: string;
  expirationDateLabel: string;
  filterOptionAllLabel: string;
  filterOptionTrainingsLabel: string;
  filterOptionExamsLabel: string;
  filterOptionCoursesLabel: string;
  filterOptionCertificatesLabel: string;
  filterOptionSkillBuildersLabel: string;
  specialAccommodationsTitle: string;
  saExpirationDateLabel: string;
  callToScheduleLabel: string;
  callToScheduleSupportingText: string;
  callToScheduleLinkText: string;
  callToScheduleLinkUrl: string;
  callToScheduleLinkPostText: string;
}

const MAX_LEARNING_JOURNEY_ELEMENTS = 3;

const LearningJourney = ({ fields, rendering }: LeaningJourneyProps) => {
  const algoliaSettings = useComponentProps<AlgoliaSettings>(rendering.uid);
  const {
    learningJourneyProducts,
    isGettingLearningJourneyProducts,
    getLearningJourneyProductsError,
  } = useGetLearningJourney();
  const [selectedFilter, setSelectedFilter] = useState<string | undefined>(undefined);

  const labels = useMemo(
    () => parseFieldsFromURLString<LeaningJourneyLabels>(fields?.labelsTitlesAndMore),
    [fields.labelsTitlesAndMore]
  );

  const filters = learningJourneyProducts
    .map((data) => {
      return data.productType;
    })
    .filter((value, index, array) => array.indexOf(value) === index);

  if (isGettingLearningJourneyProducts) {
    return <LoadingIndicator className="self-center" />;
  }

  if (!learningJourneyProducts.length || !algoliaSettings || getLearningJourneyProductsError) {
    return null;
  }

  if (fields?.isCompactComponent?.value) {
    return (
      <MyAccountSectionContainer fields={{ title: labels?.title }}>
        <LineItemsProvider algoliaSettings={algoliaSettings}>
          <LearningJourneyContent
            fields={{
              elements: learningJourneyProducts.slice(0, MAX_LEARNING_JOURNEY_ELEMENTS),
              labels,
            }}
          />
        </LineItemsProvider>
        <MyAccountSectionFooter
          primaryCTA={{
            href: fields.seeAllLink?.value?.href,
            label: fields.seeAllLink?.value?.text,
          }}
        />
      </MyAccountSectionContainer>
    );
  }

  return (
    <section>
      <LearningJourneyFilters fields={{ filters, selectedFilter, setSelectedFilter, labels }} />
      <LineItemsProvider algoliaSettings={algoliaSettings}>
        <LearningJourneyContent
          fields={{
            elements: learningJourneyProducts.filter(
              (element) => selectedFilter === undefined || selectedFilter === element.productType
            ),
            labels,
          }}
        />
      </LineItemsProvider>
    </section>
  );
};

export default withDatasourceCheck()<LeaningJourneyProps>(LearningJourney);

export const getStaticProps: GetStaticComponentProps = async (): Promise<AlgoliaSettings> => {
  return await getGraphQLResult<AlgoliaSettings>(SEARCH_SETTINGS_QUERY_FOR_ALGOLIA);
};
