import Joi from 'joi';

const id = Joi.number().integer().required();
const name = Joi.string();
const cca3 = Joi.string().length(3);
const capital = Joi.array().items(Joi.string());
const region = Joi.string();
const subregion = Joi.string();
const population = Joi.number().integer().min(0);
const flagSvg = Joi.string().uri();
const flagPng = Joi.string().uri();
const languages = Joi.array().items(
  Joi.alternatives().try(
    Joi.string(),
    Joi.object({
      code: Joi.string().required(),
      name: Joi.string().required(),
    }),
  ),
);
const currencies = Joi.array().items(
  Joi.alternatives().try(
    Joi.string(),
    Joi.object({
      code: Joi.string().required(),
      name: Joi.string().required(),
    }),
  ),
);
const language = Joi.string();
const currency = Joi.string();
const populationMin = Joi.number().integer().min(0);
const populationMax = Joi.number().integer().min(0);
const sortField = Joi.string()
  .valid('name', 'population', 'region', 'cca3', 'capital')
  .default('name');
const sortDirection = Joi.string().valid('asc', 'desc').default('asc');

const includeRelations = Joi.boolean().default(true);
const pageSize = Joi.number().integer().min(1).max(100).default(25).optional();
const page = Joi.number().integer().min(1).default(1).optional();

export const gettAllCountriesValidation = {
  query: Joi.object({
    name,
    cca3,
    region,
    subregion,
    language,
    currency,
    populationMin,
    populationMax,
    sortField,
    sortDirection,
    includeRelations,
    pageSize,
    page,
  }).options({ stripUnknown: true }),
};

export const createCountryValidation = {
  payload: Joi.object({
    name,
    cca3: cca3.required(),
    capital,
    region,
    subregion,
    population,
    flagSvg,
    flagPng,
    languages,
    currencies,
  }),
};

export const deleteCountryValidation = {
  params: Joi.object({
    id,
  }),
};

export const getCountryByIdValidation = {
  params: Joi.object({
    id,
  }),
};

export const updateCountryValidation = {
  params: Joi.object({
    id,
  }),
  payload: createCountryValidation.payload.options({ stripUnknown: true }),
};
