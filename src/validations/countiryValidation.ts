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

const pageSize = Joi.number().integer().min(1).max(100).default(50).optional();
const page = Joi.number().integer().min(0).default(0).optional();
export const gettAllCountriesValidation = {
  query: Joi.object({
    field: Joi.string()
      .valid('code', 'name', 'region', 'languages', 'currencies')
      .optional(),
    value: Joi.string().optional(),
    pageSize,
    page,
  }),
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
  payload: Joi.object({
    name: name.optional(),
    cca3: cca3.optional(),
    capital: capital.optional(),
    region: region.optional(),
    subregion: subregion.optional(),
    flagSvg: flagSvg.optional(),
    flagPng: flagPng.optional(),
    population: population.optional(),
    languages: languages.optional(),
    currencies: currencies.optional(),
  }),
};
