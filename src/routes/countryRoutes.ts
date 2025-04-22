import Hapi from '@hapi/hapi';
import Boom from '@hapi/boom';
import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import {
  createCountry,
  deleteCountryHandler,
  getAllCountriesHandler,
  updateCountryHandler,
} from '../handlers/countryHandlers.js';

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
            query: Joi.object({
              field: Joi.string()
                .valid('code', 'name', 'region', 'languages', 'currencies')
                .optional(),
              value: Joi.string().optional(),
              pageSize: Joi.number()
                .integer()
                .min(1)
                .max(100)
                .default(50)
                .optional(),
              page: Joi.number().integer().min(0).default(0).optional(),
            }),
            options: {
              stripUnknown: true,
              abortEarly: false,
            },
            failAction: (request, h, err) => {
              const error = Boom.badRequest('Invalid request query parameters');
              error.output.payload.validation = {
                source: 'query',
                errors: (err as Joi.ValidationError).details.map((detail) => ({
                  message: detail.message,
                  path: detail.path,
                  type: detail.type,
                  context: detail.context,
                })),
              };
              throw error;
            },
          },
          description: 'Get all countries',
          tags: ['api', 'countries'],
        },
      },
      {
        method: 'GET',
        path: '/countries/{field}/{value}',
        handler: deleteCountryHandler,
        options: {
          validate: {
            params: Joi.object({
              field: Joi.string().valid('id', 'code', 'name').required(),
              value: Joi.string().required(),
            }),
          },
          description: 'Get country by field and value',
          tags: ['api', 'countries'],
        },
      },
      {
        method: 'POST',
        path: '/countries',
        handler: createCountry,
        options: {
          validate: {
            payload: Joi.object({
              name: Joi.string().required(),
              code: Joi.string().length(2).required(),
              region: Joi.string().optional(),
              subregion: Joi.string().optional(),
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
          description: 'Create a new country',
          tags: ['api', 'countries'],
        },
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
          tags: ['api', 'countries'],
        },
      },
      {
        method: 'DELETE',
        path: '/countries/{id}',
        handler: deleteCountryHandler,
        options: {
          validate: {
            params: Joi.object({
              id: Joi.number().integer().required(),
            }),
          },
          description: 'Delete a country',
          tags: ['api', 'countries'],
        },
      },
    ]);
  },
};

export const countryRoutes: ServerRoute[] = [];
