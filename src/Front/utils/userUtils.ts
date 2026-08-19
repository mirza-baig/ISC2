import {
  AddressInformation,
  ContactInformation,
  EmploymentInformation,
  PersonalInformation,
  State,
  UserData,
} from 'types/index';

import { getServiceLayerAPI } from './getServiceLayerAPI';
import { QueryResponse } from 'hooks/configuration/useGetAllStates';
import { EXTERNAL_ID_LENGTH } from 'constants/index';

export const getInitials = (user: UserData) => user.firstName.charAt(0) + user.lastName.charAt(0);

export const getPersonalInformationFromUser = (
  user?: UserData
): PersonalInformation | undefined => {
  const addressInformation = getAddressInformationFromUser(user);

  if (!user || !addressInformation) {
    return undefined;
  }

  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    employer: user.employer ?? '',
    email: user.email ?? '',
    phoneNumber: user.phoneNumber ?? '',
    agreeTerms: false,
    ...addressInformation,
    isB2Bcart: false,
  };
};

export const getMailingAddress = (personalInformation: PersonalInformation | UserData) => {
  if (personalInformation.isSameAddress) {
    return personalInformation.billingAddress;
  }

  return personalInformation.mailingAddress;
};

export const getEmploymentInformationFromUser = (
  user?: UserData
): EmploymentInformation | undefined => {
  if (user) {
    return {
      employer: user?.employer || '',
      jobTitle: user?.jobTitle || '',
      workEmail: user?.workEmail || '',
      workPhone: user?.workPhone || '',
      isGovernmentContractor: user?.isGovernmentContractor || false,
      isGovernmentEmployee: user?.isGovernmentEmployee || false,
    };
  }

  return undefined;
};

export const getContactInformationFromUser = (user?: UserData): ContactInformation | undefined => {
  if (user) {
    return {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: user?.phoneNumber || '',
      prefix: user?.prefix || '',
      suffix: user?.suffix || '',
      nickname: user?.nickname || '',
      pronouns: user?.pronouns || '',
    };
  }

  return undefined;
};

export const isOldUserExternalId = (externalID: string) => {
  return externalID.length < EXTERNAL_ID_LENGTH;
};

export const getAddressInformationFromUser = (
  user?: UserData
): Required<AddressInformation> | undefined => {
  if (user) {
    return {
      mailingAddress: {
        city: user.mailingAddress?.city || '',
        countryCode: user.mailingAddress?.countryCode || '',
        postalCode: user.mailingAddress?.postalCode || '',
        stateCode: user.mailingAddress?.stateCode || '',
        street: user.mailingAddress?.street || '',
      },
      billingAddress: {
        city: user.billingAddress?.city || '',
        countryCode: user.billingAddress?.countryCode || '',
        postalCode: user.billingAddress?.postalCode || '',
        stateCode: user.billingAddress?.stateCode || '',
        street: user.billingAddress?.street || '',
      },
      isSameAddress: user.isSameAddress || false,
    };
  }

  return undefined;
};

type QueryPayload = {
  externalID: string;
  email: string;
  sync: boolean;
  userCountry?: string | undefined;
  currencyCode?: string | undefined;
};

export const getLoggedInUserSalesforceData = async ({
  externalID,
  email,
  sync,
  userCountry,
  currencyCode,
}: QueryPayload) => {
  const includeProduct = Boolean(userCountry && currencyCode);

  const api = await getServiceLayerAPI();

  if (!externalID) {
    throw `Error while fetching user data from Service Layer: externalID can't be null`;
  }

  if (!email) {
    throw `Error while fetching user data from Service Layer: email can't be null`;
  }

  const { data } = await api
    .post('', {
      query: includeProduct ? 'GET_USER_ACCOUNT' : 'GET_PARTIAL_USER_ACCOUNT',
      variables: {
        externalId: externalID,
        email,
        syncAccountData: sync,
        ...(includeProduct && {
          input: {
            country: userCountry,
            currency: currencyCode,
          },
        }),
      },
    })
    .catch((error) => {
      // Detailed logging for debugging
      console.error('Service Layer API Error Details:', {
        errorCode: error.code,
        errorMessage: error.message,
        errorName: error.name,
        errorStack: error.stack,
        requestConfig: {
          baseURL: error.config?.baseURL,
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout,
        },
        response: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        },
        requestMetadata: {
          externalID,
          email,
          includeProduct,
          userCountry,
          currencyCode,
          sync,
        },
      });

      if (error.code === 'ECONNRESET') {
        throw `Network connection lost while fetching user data. Please try again.`;
      }
      throw `Error while fetching user data from Service Layer: ${error.message || error}`;
    });

  if (!data?.data) {
    console.error('Service Layer Response Structure Error:', {
      responseExists: !!data,
      responseType: typeof data,
      responseKeys: data ? Object.keys(data) : 'N/A',
      dataProperty: data?.data,
      fullResponse: data,
      requestMetadata: {
        externalID,
        email,
        includeProduct,
        query: includeProduct ? 'GET_USER_ACCOUNT' : 'GET_PARTIAL_USER_ACCOUNT',
        userCountry,
        currencyCode,
        sync,
      },
      timestamp: new Date().toISOString(),
    });
    throw `Error while fetching user data from Service Layer: invalid response structure - Expected 'data.data' property but received: ${JSON.stringify(
      data
    )}`;
  }

  const { salesforceGetAccountData } = data.data;

  if (!salesforceGetAccountData) {
    throw 'Error while fetching user data from Service Layer: null response';
  }

  return {
    ...salesforceGetAccountData,
    fullName: `${salesforceGetAccountData?.firstName} ${salesforceGetAccountData?.lastName}`,
  };
};

export const getActiveState = (
  allStates?: QueryResponse,
  stateCode?: string,
  countryCode?: string
): string => {
  const stateList = countryCode && allStates?.[countryCode];
  const stateData = (stateList || [])?.find((item: State) => item.stateCode === stateCode);
  return stateData?.stateName || '';
};
