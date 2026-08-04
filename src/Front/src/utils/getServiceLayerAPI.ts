import axios, { AxiosInstance } from 'axios';

import { SERVICES_AUTH_ENDPOINT, SERVICES_DATA_ENDPOINT, LOCALSTORAGE_KEYS } from 'constants/index';

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
    validateStatus: (status) => status < 500,
  });

  api.interceptors.request.use(
    async (config) => {
      if (!config.headers['authorization-isc2']) {
        const { accessToken, refreshToken } = await getAPITokens();
        config.headers['authorization-isc2'] = accessToken;
        config.headers['refresh-token-isc2'] = refreshToken;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      if (typeof window === 'undefined') {
        return response;
      }

      const { data } = response;

      if (data.errors) {
        const invalidToken = data.errors.some(
          (error: ApiError) => error.message === 'invalid_token'
        );

        if (!PERFORM_REFRESH_TOKEN && invalidToken) {
          localStorage.removeItem(LOCALSTORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(LOCALSTORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(LOCALSTORAGE_KEYS.ANONYMOUS_ID);
          localStorage.removeItem(LOCALSTORAGE_KEYS.ACTIVE_CART_ID);
        }
      }

      return response;
    },
    async (error) => {
      const config = error.config;

      if (
        config &&
        !config.__tokenRefreshAttempted &&
        (error.response?.status === 401 || error.response?.status === 403)
      ) {
        config.__tokenRefreshAttempted = true;

        if (typeof window !== 'undefined') {
          localStorage.removeItem(LOCALSTORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(LOCALSTORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(LOCALSTORAGE_KEYS.ANONYMOUS_ID);
          localStorage.removeItem(LOCALSTORAGE_KEYS.ACTIVE_CART_ID);
        }

        const newApi = await createAPIInstance();
        return newApi.request(config);
      }

      if (
        config &&
        !config.__retryCount &&
        (error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT' ||
          error.code === 'ECONNABORTED' ||
          error.code === 'ENOTFOUND' ||
          error.response?.status >= 500)
      ) {
        config.__retryCount = 1;

        await new Promise((resolve) => setTimeout(resolve, 500));

        return api.request(config);
      }

      return Promise.reject(error);
    }
  );

  return api;
};

let apiPromise: Promise<AxiosInstance>;

export const getServiceLayerAPI = () => {
  if (!apiPromise) {
    apiPromise = createAPIInstance();
  }

  return apiPromise;
};
