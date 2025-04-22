import { Request, ResponseToolkit } from '@hapi/hapi';
import {
  createCountry,
  deleteCountry,
  getCountries,
  getCountryBy,
  getCountryById,
} from '../services/CountriesService.js';

import { CountryInput } from '../types/countryModel';
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
  const countryData = request.payload as CountryInput;
  try {
    const result = await createCountry(countryData);
    return h.response(result).code(201);
  } catch (error) {
    // Create a request ID for tracking this error
    const errorId = 23423423525; //uuidv4();

    // Log the full error with context for debugging
    console.error(`[Error ${errorId}] Creating country failed:`, {
      error,
      countryData: request.payload,
      timestamp: new Date().toISOString(),
    });

    // Handle specific expected errors
    if (error instanceof Error) {
      // Case 1: Country already exists
      if (
        error.message.includes('Country with code') &&
        error.message.includes('already exists')
      ) {
        return Boom.conflict(error.message);
      }

      // Case 2: Database unique constraint violations
      if (
        error.message.includes('unique constraint') ||
        error.message.includes('duplicate key')
      ) {
        if (error.message.includes('cca3')) {
          return Boom.conflict('A country with this code already exists');
        }
        return Boom.conflict('A duplicate value was found');
      }

      // Case 3: Foreign key constraint violations
      if (
        error.message.includes('foreign key constraint') ||
        error.message.includes('violates foreign key')
      ) {
        return Boom.badRequest('One or more referenced entities do not exist');
      }

      // Case 4: Other database constraint violations
      if (
        error.message.includes('check constraint') ||
        error.message.includes('not-null constraint')
      ) {
        return Boom.badRequest(
          'The provided data violates database constraints',
        );
      }

      // Case 5: Transaction errors
      if (error.message.includes('transaction')) {
        return Boom.serverUnavailable(
          'Database transaction failed, please try again',
        );
      }
    }

    // Generic error response for unexpected errors
    // Note: We don't expose the actual error message to clients for security reasons
    return Boom.badImplementation('An unexpected error occurred', {
      errorId, // Include the error ID so users can reference it when reporting issues
      timestamp: new Date().toISOString(),
    });
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

export async function getCountryHandler(request: Request, h: ResponseToolkit) {
  const { id } = request.params;
  try {
    const result = await getCountryById(Number(id));
    if (!result) {
      return Boom.notFound('Failed to delete country', error);
    }
    return h
      .response({ message: 'Country deleted successfully', data: result })
      .code(200);
  } catch (error) {
    return Boom.internal('Failed to delete country', error);
  }
}
