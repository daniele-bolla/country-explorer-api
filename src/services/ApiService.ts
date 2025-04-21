import axios, {
  type AxiosResponse,
  type AxiosInstance,
  type AxiosRequestConfig,
  AxiosError,
} from 'axios';
import config from '../config';

export const baseURL = config.api.countriesBaseUrl;

const axiosConfig: AxiosRequestConfig = {
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
};

function apiError(error: AxiosError): unknown {
  if (error && 'isAxiosError' in error && error.isAxiosError) {
    const { response } = error;
    return { ...response };
  }
}
const apiService: AxiosInstance = axios.create(axiosConfig);

const errorHandler = (error: AxiosError) => {
  const isRespError = apiError(error);
  if (isRespError) {
    console.error(error);
  }
  return Promise.reject({ ...error });
};

const successHandler = (response: AxiosResponse) => {
  const { data } = response;
  return data;
};

apiService.interceptors.response.use(
  (response) => successHandler(response),
  (error) => errorHandler(error),
);

export default apiService;
