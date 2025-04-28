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
const code = Joi.string();
const createdAt = Joi.date().iso();
const updatedAt = Joi.date().iso();
export const languageSchema = Joi.object({
  code,
  name,
  createdAt,
  updatedAt,
});

export const currencychema = Joi.object({
  code,
  name,
  createdAt,
  updatedAt,
});

export const regionSchema = Joi.object({
  id,
  name,
  createdAt,
  updatedAt,
});

export const subregionSchema = Joi.object({
  id,
  name,
  // regionId: Joi.number().integer(),
  createdAt,
  updatedAt,
});

export const countrySchema = Joi.object({
  id,
  name,
  cca3,
  capital,
  // regionId: Joi.number().integer(),
  // subregionId: Joi.number().integer(),
  population,
  flagSvg,
  flagPng,
  createdAt,
  updatedAt,
  region: regionSchema.allow(null),
  subregion: subregionSchema.allow(null),
  languages: Joi.array().items(languageSchema).allow(null),
  currenciess: Joi.array().items(currencychema).allow(null),
});

export const countryResponseSchema = Joi.object({
  data: countrySchema,
});

export const updataeCountryResponseSchema = Joi.object({
  data: countrySchema.optional(),
});

export const countryListResponseSchema = Joi.object({
  data: Joi.array().items(countrySchema),
  meta: Joi.object({
    page,
    pageCount: Joi.number().integer().min(1),
    pageSize: Joi.number().integer().min(1),
    total: Joi.number().integer().min(0),
  }),
});

const deleteResultSchema = Joi.object({
  country: Joi.object({
    id: Joi.number().integer(),
    name: Joi.string(),
  }).optional(),
  cleanup: Joi.object({
    regions: Joi.number().integer(),
    subregions: Joi.number().integer(),
  }),
});

export const deleteResponseSchema = Joi.object({
  data: deleteResultSchema,
});
