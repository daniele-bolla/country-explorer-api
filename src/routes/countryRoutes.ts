import Hapi from '@hapi/hapi';
import Boom from '@hapi/boom';
import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import {
  createCountryHandler,
  deleteCountryHandler,
  getAllCountriesHandler,
  getCountryHandler,
  updateCountryHandler,
} from '../handlers/countryHandlers.js';
import {
  createCountryValidation,
  deleteCountryValidation,
  getCountryByIdValidation,
  gettAllCountriesValidation,
} from '../validations/countiryValidation.js';

const errorValidationHandler = {
  options: {
    stripUnknown: true,
    abortEarly: false,
  },
  failAction: (request: any, h: any, err: any) => {
    const error = Boom.badRequest('Invalid request query parameters');
    error.output.payload.validation = {
      source: 'query',
      errors: err.details.map((detail: any) => ({
        message: detail.message,
        path: detail.path,
        type: detail.type,
        context: detail.context,
      })),
    };
    throw error;
  },
};

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
        options: {
          validate: {
            ...createCountryValidation,
            ...errorValidationHandler,
          },
        },
        handler: createCountryHandler,
      },
      {
        method: 'PUT',
        path: '/countries/{id}',
        handler: updateCountryHandler,
        options: {
          validate: {
            params: Joi.object({
              id: Joi.number().integer().required(),
            }),
            payload: Joi.object({
              name: Joi.string().optional(),
              cca3: Joi.string().length(2).optional(),
              region: Joi.string().optional(),
              flag: Joi.string().optional(),
              population: Joi.number().integer().optional(),
              languages: Joi.array()
                .items(
                  Joi.alternatives().try(
                    Joi.string(),
                    Joi.object({
                      code: Joi.string().required(),
                      name: Joi.string().required(),
                    }),
                  ),
                )
                .optional(),
              currencies: Joi.array()
                .items(
                  Joi.alternatives().try(
                    Joi.string(),
                    Joi.object({
                      code: Joi.string().required(),
                      name: Joi.string().required(),
                    }),
                  ),
                )
                .optional(),
            }),
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
