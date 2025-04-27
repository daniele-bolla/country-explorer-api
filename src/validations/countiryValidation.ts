import Joi from 'joi';

/**
 * Validations
 */
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
  Joi.object({
    code: Joi.string().required(),
    name: Joi.string().required(),
  }),
);
const currencies = Joi.array().items(
  Joi.object({
    code: Joi.string().required(),
    name: Joi.string().required(),
  }),
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
  payload: Joi.object({
    name,
    cca3,
    capital,
    region,
    subregion,
    population,
    flagSvg,
    flagPng,
    languages,
    currencies,
  }).options({ stripUnknown: true }),
};

/**
 * Responses
 */
export const languageSchema = Joi.object({
  id: Joi.number().integer().required(),
  code: Joi.string().required(),
  name: Joi.string().required(),
  createdAt: Joi.date().iso().required(),
  updatedAt: Joi.date().iso().required(),
}).label('Language');

export const countryLanguageSchema = Joi.object({
  countryId: Joi.number().integer().required(),
  languageId: Joi.number().integer().required(),
  language: languageSchema.required(),
}).label('CountryLanguage');

export const regionSchema = Joi.object({
  id: Joi.number().integer().required(),
  name: Joi.string().required(),
  createdAt: Joi.date().iso().required(),
  updatedAt: Joi.date().iso().required(),
}).label('Region');

export const subregionSchema = Joi.object({
  id: Joi.number().integer().required(),
  name: Joi.string().required(),
  regionId: Joi.number().integer().required(),
  createdAt: Joi.date().iso().required(),
  updatedAt: Joi.date().iso().required(),
}).label('Subregion');

export const countrySchema = Joi.object({
  id: Joi.number().integer().required(),
  name: Joi.string().required(),
  cca3: Joi.string().length(3).required(),
  capital: Joi.array().items(Joi.string()).required(),
  regionId: Joi.number().integer().required(),
  subregionId: Joi.number().integer().required(),
  population: Joi.number().integer().min(0).required(),
  flagSvg: Joi.string().uri().required(),
  flagPng: Joi.string().uri().required(),
  createdAt: Joi.date().iso().required(),
  updatedAt: Joi.date().iso().required(),
  region: regionSchema.required(),
  subregion: subregionSchema.required(),
  languages: Joi.array().items(countryLanguageSchema).required(),
}).label('Country');

export const countryResponseSchema = Joi.object({
  data: countrySchema,
}).label('CountryResponse');

export const countryListResponseSchema = Joi.object({
  data: Joi.array().items(countrySchema).required(),
  meta: Joi.object({
    page: Joi.number().integer().min(1).required(),
    pageCount: Joi.number().integer().min(1).required(),
    pageSize: Joi.number().integer().min(1).required(),
    total: Joi.number().integer().min(0).required(),
  }).required(),
});

const deleteResultSchema = Joi.object({
  country: Joi.object({
    id: Joi.number().integer().required(),
    name: Joi.string().required(),
  }).optional(),
  cleanup: Joi.object({
    regions: Joi.number().integer().required(),
    subregions: Joi.number().integer().required(),
  }).required(),
});

export const deleteResponseSchema = Joi.object({
  data: deleteResultSchema,
});
