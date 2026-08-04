export const API_URL = `${process.env.PUBLIC_URL}/api`;

export const SERVICES_URL = `${API_URL}/services`;
export const EDGE_FUNCTIONS_URL = `${API_URL}/edge`;

export const SERVICES_AUTH_ENDPOINT = `${SERVICES_URL}/auth`;

export const SERVICES_DATA_ENDPOINT =
  process.env.NEXT_PUBLIC_USE_EDGE_FUNCTIONS === 'true'
    ? `${EDGE_FUNCTIONS_URL}/data`
    : `${SERVICES_URL}/data`;

export const INTERNAL_MULESOFT_URL = `${process.env.PUBLIC_URL}/api/salesforce`;
export const EXTERNAL_MULESOFT_PROFILE_PICTURE_URL = `${process.env.SALESFORCE_CLOUDHUB_URL}/v1/profilePhoto`;
