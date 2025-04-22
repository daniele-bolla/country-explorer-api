import { Request, ResponseToolkit } from '@hapi/hapi';
import {
  addCountry,
  deleteCountry,
  getCountries,
  getCountryBy,
} from '../services/CountriesService.js';

import { CountryApiInput } from '../types/countryModel';
import Boom from '@hapi/boom';

export async function getCountryhandler(request: Request, h: ResponseToolkit) {
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

export async function getAllCountriesHandler(
  request: Request,
  h: ResponseToolkit,
) {
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

export async function createCountryHandler(
  request: Request,
  h: ResponseToolkit,
) {
  const countryData = request.payload as CountryApiInput;
  try {
    const newCountry = await addCountry(countryData);
    return h.response(newCountry).code(201);
  } catch (error) {
    return Boom.internal('Failed to create country', error);
  }
}

export async function updateCountryHandler(
  request: Request,
  h: ResponseToolkit,
) {
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

export async function deleteCountryHandler(
  request: Request,
  h: ResponseToolkit,
) {
  const { id } = request.params;
  console.log(id);
  try {
    const result = await deleteCountry(Number(id));
    console.log(result);
    if (!result) {
      return h.response({ error: 'Country not found' }).code(404);
    }
    return h.response({ message: 'Country deleted successfully' }).code(200);
  } catch (error) {
    return Boom.internal('Failed to delete country', error);
  }
}
