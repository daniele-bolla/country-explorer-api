import Hapi from '@hapi/hapi';
import Boom from '@hapi/boom';
import Joi from 'joi';

import { Request, ResponseToolkit, ServerRoute } from '@hapi/hapi';
import {
  addCountry,
  getCountries,
  getCountryBy,
} from '../services/countryService.js';
import { CountryApiInput } from '../types/countryModel';

const germany = {
  name: 'Germany',
  cca3: 'DEU',
  capital: ['Berlin'],
  region: 'Europe',
  subregion: 'Western Europe',
  population: 83240525,
  flagPng: 'https://flagcdn.com/w320/de.png',
  flagSvg: 'https://flagcdn.com/de.svg',
  languages: [
    {
      code: 'deu',
      name: 'German',
    },
  ],
  currencies: [
    {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
    },
  ],
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
            query: Joi.object({
              field: Joi.string()
                .valid('code', 'name', 'region', 'languages', 'currencies')
                .required(),
              value: Joi.string().required(),
              limit: Joi.number().integer().min(1).max(100).default(50),
              offset: Joi.number().integer().min(0).default(0),
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
        handler: getCountryhandler,
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
              code: Joi.string().length(2).optional(),
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

async function getCountryhandler(request: Request, h: ResponseToolkit) {
  const { field, value } = request.params;

  try {
    const country = await getCountryBy(field, value);
    if (!country) {
      return Boom.notFound(`Country wiith ${field} ${value} not found`);
    }
    return h.response(country).code(200);
  } catch (error) {
    return Boom.internal('Failed to get country', error);
  }
}

async function getAllCountriesHandler(request: Request, h: ResponseToolkit) {
  const { limit = 50, offset = 1 } = request.query;
  const countries = await getCountries({
    pageSize: Number(limit),
    page: Number(offset),
  });
  try {
    return h.response(countries).code(200);
  } catch (error) {
    return Boom.badRequest('Failed to get country', error);
  }
}

async function createCountry(request: Request, h: ResponseToolkit) {
  const countryData = request.payload as CountryApiInput;
  try {
    const newCountry = await addCountry(countryData);
    return h.response(newCountry).code(201);
  } catch (error) {
    return Boom.internal('Failed to create country', error);
  }
}

async function updateCountryHandler(request: Request, h: ResponseToolkit) {
  const { id } = request.params;
  const countryData = request.payload;
  try {
    const updatedCountry = await updateCountry(Number(id), countryData);
    if (!updatedCountry) {
      return h.response({ error: 'Country not found' }).code(404);
    }
    return h.response(updatedCountry).code(200);
  } catch (error) {
    return Boom.internal('Failed to update country', error);
  }
}

async function deleteCountryHandler(request: Request, h: ResponseToolkit) {
  const { id } = request.params;
  try {
    const result = await deleteCountry(Number(id));
    if (!result) {
      return h.response({ error: 'Country not found' }).code(404);
    }
    return h.response({ message: 'Country deleted successfully' }).code(200);
  } catch (error) {
    return Boom.internal('Failed to delete country', error);
  }
}

export const countryRoutes: ServerRoute[] = [];
