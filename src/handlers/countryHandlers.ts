import { Request, ResponseToolkit } from '@hapi/hapi';
import {
  createCountry,
  deleteCountry,
  getCountries,
  getCountryById,
  updateCountry,
  UpdateCountryInput,
} from '../services/CountriesService';

import { CountryInput } from '../types/countryModel';
import { errorResponseHandler } from './errorResponseHandler';

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
    return errorResponseHandler(error as Error);
  }
}

export async function createCountryHandler(
  request: Request,
  h: ResponseToolkit,
) {
  const countryData = request.payload as CountryInput;
  try {
    const result = await createCountry(countryData);
    return h.response(result).code(201);
  } catch (error: unknown) {
    return errorResponseHandler(error as Error);
  }
}

export async function updateCountryHandler(
  request: Request,
  h: ResponseToolkit,
) {
  const { id } = request.params;
  const countryData = request.payload as UpdateCountryInput;
  try {
    const updatedCountry = await updateCountry(countryData, Number(id));
    return h
      .response({
        message: 'Country updated successfully',
        data: updatedCountry,
      })
      .code(200);
  } catch (error: unknown) {
    return errorResponseHandler(error as Error);
  }
}

export async function deleteCountryHandler(
  request: Request,
  h: ResponseToolkit,
) {
  const { id } = request.params;
  try {
    const result = await deleteCountry(Number(id));
    return h
      .response({ message: 'Country deleted successfully', data: result })
      .code(200);
  } catch (error: unknown) {
    return errorResponseHandler(error as Error);
  }
}

export async function getCountryHandler(request: Request, h: ResponseToolkit) {
  const { id } = request.params;
  try {
    const result = await getCountryById(Number(id));
    return h
      .response({ message: 'Country retrieved successfully', data: result })
      .code(200);
  } catch (error: unknown) {
    return errorResponseHandler(error as Error);
  }
}
