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
import { definedPropertiesOnly } from '../utils/definedPropertiesOnly';

/**
 * Handler for getting countries with filtering, sorting and pagination
 */
export async function getAllCountriesHandler(
  request: Request,
  h: ResponseToolkit,
) {
  try {
    const {
      page,
      pageSize,
      includeRelations,
      sortField,
      sortDirection,
      populationMin,
      populationMax,
      ...filterParams
    } = request.query;

    const filter = definedPropertiesOnly({
      ...definedPropertiesOnly(filterParams),

      ...((populationMin || populationMax) && {
        population: definedPropertiesOnly({
          min: populationMin,
          max: populationMax,
        }),
      }),
    });

    const sort =
      sortField && sortDirection
        ? { field: sortField, direction: sortDirection }
        : undefined;

    const countries = await getCountries(
      definedPropertiesOnly({
        page,
        pageSize,
        includeRelations,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        sort,
      }),
    );

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
  const countryData = definedPropertiesOnly(
    request.payload,
  ) as UpdateCountryInput;
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
