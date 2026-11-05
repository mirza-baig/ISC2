import axios, { AxiosInstance } from 'axios';
import { APIM_SUBSCRIPTION_KEY } from 'constants/index';

let serviceLayerClient: AxiosInstance | null = null;

export const getServiceLayerClient = (): AxiosInstance => {
  if (!serviceLayerClient) {
    const endpoint = process.env.SERVICE_LAYER_ENDPOINT;
    const subscriptionKey = process.env.APIM_SUBSCRIPTION_KEY;

    if (!endpoint) {
      throw new Error('SERVICE_LAYER_ENDPOINT environment variable is required');
    }

    if (!subscriptionKey) {
      throw new Error('APIM_SUBSCRIPTION_KEY environment variable is required');
    }

    serviceLayerClient = axios.create({
      baseURL: endpoint,
      timeout: 8000,
      headers: {
        'Content-Type': 'application/json',
        [APIM_SUBSCRIPTION_KEY]: subscriptionKey,
      },
      httpAgent: false,
      httpsAgent: false,
      family: 4,
      maxRedirects: 3,
      validateStatus: (status) => status < 500,
      transformRequest: [
        (data, headers) => {
          headers['X-Request-Timestamp'] = new Date().toISOString();
          return JSON.stringify(data);
        },
      ],
    });

    serviceLayerClient.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        const config = error.config;

        if (
          !config.__tokenRefreshAttempted &&
          (error.response?.status === 401 || error.response?.status === 403)
        ) {
          config.__tokenRefreshAttempted = true;

          delete serviceLayerClient!.defaults.headers['authorization-isc2'];
          delete serviceLayerClient!.defaults.headers['refresh-token-isc2'];

          return serviceLayerClient!.request(config);
        }

        if (
          !config.__retryCount &&
          (error.code === 'ECONNRESET' ||
            error.code === 'ETIMEDOUT' ||
            error.code === 'ENOTFOUND' ||
            error.response?.status >= 500)
        ) {
          config.__retryCount = 1;

          await new Promise((resolve) => setTimeout(resolve, 500));

          return serviceLayerClient!.request(config);
        }

        return Promise.reject(error);
      }
    );

    serviceLayerClient.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  return serviceLayerClient;
};

export const resetServiceLayerClient = () => {
  serviceLayerClient = null;
};
