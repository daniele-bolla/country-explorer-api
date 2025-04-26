import Hapi from '@hapi/hapi';
import { ServerRoute } from '@hapi/hapi';

import {
  createCountryHandler,
  deleteCountryHandler,
  getAllCountriesHandler,
  getCountryHandler,
  updateCountryHandler,
} from '../handlers/countriesHandlers';
import {
  createCountryValidation,
  deleteCountryValidation,
  getCountryByIdValidation,
  gettAllCountriesValidation,
  updateCountryValidation,
} from '../validations/countiryValidation';
import { errorValidationHandler } from '../handlers/errorValidationHandler';

export default {
  name: 'countries',
  register: async (server: Hapi.Server) => {
    server.route([
      {
        method: 'GET',
        path: '/api/regions',
        handler: getAllCountriesHandler,
        options: {
          validate: {
            ...gettAllCountriesValidation,
            ...errorValidationHandler,
          },
          description: 'Get all regions',
        },
      },
    ]);
  },
};

export const countryRoutes: ServerRoute[] = [];
