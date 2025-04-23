import Hapi from '@hapi/hapi';
import { ServerRoute } from '@hapi/hapi';

import {
  createCountryHandler,
  deleteCountryHandler,
  getAllCountriesHandler,
  getCountryHandler,
  updateCountryHandler,
} from '../handlers/countryHandlers';
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
        path: '/api/countries',
        handler: getAllCountriesHandler,
        options: {
          validate: {
            ...gettAllCountriesValidation,
            ...errorValidationHandler,
          },
          description: 'Get all countries',
        },
      },
      {
        method: 'POST',
        path: '/api/countries',
        handler: createCountryHandler,
        options: {
          validate: {
            ...createCountryValidation,
            ...errorValidationHandler,
          },
          description: 'Create a countries',
        },
      },
      {
        method: 'PUT',
        path: '/countries/{id}',
        handler: updateCountryHandler,
        options: {
          validate: {
            ...updateCountryValidation,
            ...errorValidationHandler,
          },
          description: 'Update a country',
        },
      },
      {
        method: 'DELETE',
        path: '/api/countries/{id}',
        handler: deleteCountryHandler,
        options: {
          validate: {
            ...deleteCountryValidation,
            ...errorValidationHandler,
          },
          description: 'Delete a country',
        },
      },
      {
        method: 'GET',
        path: '/api/countries/{id}',
        handler: getCountryHandler,
        options: {
          validate: {
            ...getCountryByIdValidation,
            ...errorValidationHandler,
          },
          description: 'Get a country',
        },
      },
    ]);
  },
};

export const countryRoutes: ServerRoute[] = [];
