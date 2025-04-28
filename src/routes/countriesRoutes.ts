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
  countryListResponseSchema,
  countryResponseSchema,
  createCountryValidation,
  deleteCountryValidation,
  deleteResponseSchema,
  getCountryByIdValidation,
  gettAllCountriesValidation,
  updataeCountryResponseSchema,
  updateCountryValidation,
} from '../validations/countiryValidation';
import { errorValidationHandler } from '../handlers/errorValidationHandler';

export default {
  name: 'countries',
  register: async (server: Hapi.Server) => {
    server.route([
      {
        method: 'GET',
        path: '/countries',
        handler: getAllCountriesHandler,

        options: {
          validate: {
            ...gettAllCountriesValidation,
            ...errorValidationHandler,
          },
          response: {
            schema: countryListResponseSchema,
            ...errorValidationHandler,
          },
          description: 'Get all countries',
          tags: ['api'],
        },
      },
      {
        method: 'POST',
        path: '/countries',
        handler: createCountryHandler,
        options: {
          validate: {
            ...createCountryValidation,
            ...errorValidationHandler,
          },
          response: {
            schema: countryResponseSchema,
            ...errorValidationHandler,
          },
          description: 'Create a countries',
          tags: ['api'],
        },
      },
      {
        method: 'PATCH',
        path: '/countries/{id}',
        handler: updateCountryHandler,
        options: {
          validate: {
            ...updateCountryValidation,
            ...errorValidationHandler,
          },
          response: {
            schema: updataeCountryResponseSchema,
            ...errorValidationHandler,
          },
          description: 'Update a country',
          tags: ['api'],
        },
      },
      {
        method: 'DELETE',
        path: '/countries/{id}',
        handler: deleteCountryHandler,
        options: {
          validate: {
            ...deleteCountryValidation,
            ...errorValidationHandler,
          },
          description: 'Delete a country',
          response: {
            schema: deleteResponseSchema,
            ...errorValidationHandler,
          },
          tags: ['api'],
        },
      },
      {
        method: 'GET',
        path: '/countries/{id}',
        handler: getCountryHandler,
        options: {
          validate: {
            ...getCountryByIdValidation,
            ...errorValidationHandler,
          },
          response: {
            schema: countryResponseSchema,
            ...errorValidationHandler,
          },
          description: 'Get a country',
          tags: ['api'],
        },
      },
    ]);
  },
};

export const countryRoutes: ServerRoute[] = [];
