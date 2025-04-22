import Joi from 'joi';

export const gettAllCountriesValidation = {
  query: Joi.object({
    field: Joi.string()
      .valid('code', 'name', 'region', 'languages', 'currencies')
      .optional(),
    value: Joi.string().optional(),
    pageSize: Joi.number().integer().min(1).max(100).default(50).optional(),
    page: Joi.number().integer().min(0).default(0).optional(),
  }),
};

export const createCountryValidation = {
  payload: Joi.object({
    name: Joi.string().required(),
    cca3: Joi.string().length(3).required(),
    capital: Joi.array().items(Joi.string()),
    region: Joi.string(),
    subregion: Joi.string(),
    population: Joi.number().integer().min(0),
    flagSvg: Joi.string().uri(),
    flagPng: Joi.string().uri(),
    languages: Joi.array().items(
      Joi.object({
        code: Joi.string().required(),
        name: Joi.string().required(),
      }),
    ),
    currencies: Joi.array().items(
      Joi.object({
        code: Joi.string().required(),
        name: Joi.string().required(),
        symbol: Joi.string(),
      }),
    ),
  }),
};

export const deleteCountryValidation = {
  params: Joi.object({
    id: Joi.number().integer().required(),
  }),
};

export const getCountryByIdValidation = {
  params: Joi.object({
    id: Joi.number().integer().required(),
  }),
};

export const updateCountryValidation = {
  params: Joi.object({
    id: Joi.number().integer().required(),
  }),
  payload: Joi.object({
    name: Joi.string().optional(),
    cca3: Joi.string().length(2).optional(),
    region: Joi.string().optional(),
    flagSvg: Joi.string().uri().optional(),
    flagPng: Joi.string().uri().optional(),
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
};
