import axios, { AxiosInstance } from 'axios';

import { SERVICES_AUTH_ENDPOINT, SERVICES_DATA_ENDPOINT, LOCALSTORAGE_KEYS } from 'constants/index';

import { clearAnonymousCartId } from './cartIdStore';

const PERFORM_REFRESH_TOKEN = false;

type ApiError = {
  message: string;
};

const getNewAPITokens = async () => {
  const res = await fetch(SERVICES_AUTH_ENDPOINT);

  if (!res.ok) {
    throw new Error(`Auth endpoint failed: ${res.status}`);
  }

  return await res.json();
};

const getAPITokens = async () => {
  // This handles requests made from the server side
  if (typeof window === 'undefined') {
    return getNewAPITokens();
  }

  const storedAccessToken = localStorage.getItem(LOCALSTORAGE_KEYS.ACCESS_TOKEN);
  const storedRefreshToken = localStorage.getItem(LOCALSTORAGE_KEYS.REFRESH_TOKEN);

  if (storedAccessToken && storedRefreshToken) {
    return {
      accessToken: storedAccessToken,
      refreshToken: storedRefreshToken,
    };
  }

  const data = await getNewAPITokens();

  localStorage.setItem(LOCALSTORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
  localStorage.setItem(LOCALSTORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
  localStorage.setItem(LOCALSTORAGE_KEYS.ANONYMOUS_ID, data.anonymousId);

  return data;
};

const createAPIInstance = async () => {
  const api = axios.create({
    baseURL: SERVICES_DATA_ENDPOINT,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
    maxRedirects: 5,
    validateStatus: (status) => status < 500, // Don't throw on 4xx errors
  });

  api.interceptors.request.use(
    async (config) => {
      const { accessToken, refreshToken } = await getAPITokens();

      config.headers['authorization-isc2'] = accessToken;
      config.headers['refresh-token-isc2'] = refreshToken;

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(async (response) => {
    // This handles requests made from the server side
    if (typeof window === 'undefined') {
      return response;
    }

    const { data, config } = response;
    const retryConfig = config as typeof config & { __invalidTokenRetried?: boolean };

    if (data.errors) {
      const invalidToken = data.errors.some((error: ApiError) => error.message === 'invalid_token');

      if (!PERFORM_REFRESH_TOKEN && invalidToken && !retryConfig.__invalidTokenRetried) {
        localStorage.removeItem(LOCALSTORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(LOCALSTORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(LOCALSTORAGE_KEYS.ANONYMOUS_ID);
        clearAnonymousCartId();

        retryConfig.__invalidTokenRetried = true;

        const newApi = await createAPIInstance();

        return newApi(retryConfig);
      }
    }

    return response;
  });

  return api;
};

let apiPromise: Promise<AxiosInstance>;

export const getServiceLayerAPI = () => {
  if (!apiPromise) {
    apiPromise = createAPIInstance();
  }

  return apiPromise;
};
