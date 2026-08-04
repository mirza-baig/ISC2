import {
  ComponentRendering,
  withDatasourceCheck,
  GetStaticComponentProps,
  useComponentProps,
} from '@sitecore-jss/sitecore-jss-nextjs';

import { getGraphQLResult } from 'utils/index';
import { SEARCH_SETTINGS_QUERY_FOR_ALGOLIA } from 'queries/searchSettings';
import { AlgoliaSettings, AllocationDetailsFields } from 'types/index';
import { AllocationDetailsProvider, LineItemsProvider, useUserSession } from 'providers/index';
import { useGetAllocationDetails } from 'hooks/index';

import AllocationDetailsContent from './AllocationDetailsContent';

type AllocationDetailsProps = {
  fields?: AllocationDetailsFields;
  rendering: ComponentRendering;
};

const AllocationDetails = ({ fields, rendering }: AllocationDetailsProps) => {
  const algoliaSettings = useComponentProps<AlgoliaSettings>(rendering.uid);
  const { isConsentAllocation } = useUserSession();
  const { allocationDetails, allocationKey } = useGetAllocationDetails();

  if (!fields || !algoliaSettings || !allocationKey || !isConsentAllocation) {
    return null;
  }

  return (
    <AllocationDetailsProvider
      key={allocationKey.toString()}
      fields={fields}
      allocation={allocationDetails}
    >
      <LineItemsProvider algoliaSettings={algoliaSettings}>
        <AllocationDetailsContent fields={fields} />
      </LineItemsProvider>
    </AllocationDetailsProvider>
  );
};

export default withDatasourceCheck()<AllocationDetailsProps>(AllocationDetails);

export const getStaticProps: GetStaticComponentProps = async (): Promise<AlgoliaSettings> => {
  return await getGraphQLResult<AlgoliaSettings>(SEARCH_SETTINGS_QUERY_FOR_ALGOLIA);
};
