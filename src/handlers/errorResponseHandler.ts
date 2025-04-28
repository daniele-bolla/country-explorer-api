import Boom from '@hapi/boom';
import { Request } from '@hapi/hapi';

export function errorResponseHandler(error: Error, request: Request) {
  if (error instanceof Error) {
    if (error.message.includes('not found')) {
      return Boom.notFound(error.message);
    }
    if (error.message.includes('already exists')) {
      // request.logger.error('An unexpected error occurred', error);

      return Boom.conflict(error.message);
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
  // request.logger.error('An unexpected error occurred', error);

  return Boom.badImplementation('An unexpected error occurred', error);
}
