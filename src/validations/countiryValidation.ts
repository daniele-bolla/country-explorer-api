import Joi from 'joi';

// Validation schemas for routes
export const schemas = {
  // Query parameters for listing countries
  listCountries: Joi.object({
    name: Joi.string().optional().description('Filter by country name'),
    region: Joi.string().optional().description('Filter by region'),
    subregion: Joi.string().optional().description('Filter by subregion'),
    populationGt: Joi.number()
      .optional()
      .description('Filter by population greater than'),
    populationLt: Joi.number()
      .optional()
      .description('Filter by population less than'),
  }),

  // Path parameter validation for country ID
  countryId: Joi.object({
    id: Joi.number().required().description('Country ID'),
  }),

  // Path parameter validation for country code
  countryCode: Joi.object({
    code: Joi.string()
      .length(3)
      .required()
      .description('3-letter country code (cca3)'),
  }),

  // Payload validation for creating a country
  createCountry: Joi.object({
    name: Joi.string().required().description('Country name'),
    cca3: Joi.string()
      .length(3)
      .required()
      .description('3-letter country code'),
    capital: Joi.array()
      .items(Joi.string())
      .default([])
      .description('Capital cities'),
    region: Joi.string()
      .allow('', null)
      .optional()
      .description('Geographic region'),
    subregion: Joi.string()
      .allow('', null)
      .optional()
      .description('Geographic subregion'),
    population: Joi.number()
      .integer()
      .min(0)
      .default(0)
      .description('Population count'),
    flagPng: Joi.string()
      .uri()
      .allow('', null)
      .optional()
      .description('URL to PNG flag'),
    flagSvg: Joi.string()
      .uri()
      .allow('', null)
      .optional()
      .description('URL to SVG flag'),
    data: Joi.object().optional().description('Additional country data'),
  }),

  // Payload validation for updating a country
  updateCountry: Joi.object({
    name: Joi.string().optional().description('Country name'),
    capital: Joi.array()
      .items(Joi.string())
      .optional()
      .description('Capital cities'),
    region: Joi.string()
      .allow('', null)
      .optional()
      .description('Geographic region'),
    subregion: Joi.string()
      .allow('', null)
      .optional()
      .description('Geographic subregion'),
    population: Joi.number()
      .integer()
      .min(0)
      .optional()
      .description('Population count'),
    flagPng: Joi.string()
      .uri()
      .allow('', null)
      .optional()
      .description('URL to PNG flag'),
    flagSvg: Joi.string()
      .uri()
      .allow('', null)
      .optional()
      .description('URL to SVG flag'),
    data: Joi.object().optional().description('Additional country data'),
  }),
};
