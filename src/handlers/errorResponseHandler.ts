import Boom from '@hapi/boom';

export function errorResponseHandler(error: Error) {
  if (error instanceof Error) {
    if (error.message.includes('not found')) {
      return Boom.notFound(error.message);
    }
    if (error.message.includes('already exists')) {
      return Boom.conflict(error.message);
    }

    if (
      error.message.includes('unique constraint') ||
      error.message.includes('duplicate key')
    ) {
      if (error.message.includes('cca3')) {
        return Boom.conflict('A country with this code already exists');
      }
      return Boom.conflict('A duplicate value was found');
    }

    if (
      error.message.includes('foreign key constraint') ||
      error.message.includes('violates foreign key')
    ) {
      return Boom.badRequest('One or more referenced entities do not exist');
    }

    if (
      error.message.includes('check constraint') ||
      error.message.includes('not-null constraint')
    ) {
      return Boom.badRequest('The provided data violates database constraints');
    }

    if (error.message.includes('transaction')) {
      return Boom.serverUnavailable(
        'Database transaction failed, please try again',
      );
    }
  }

  return Boom.badImplementation('An unexpected error occurred', error);
}
