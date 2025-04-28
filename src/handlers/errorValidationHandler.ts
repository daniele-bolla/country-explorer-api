import Boom from '@hapi/boom';
import { Request } from '@hapi/hapi';

export const errorValidationHandler = {
  options: {
    stripUnknown: true,
    abortEarly: false,
  },
  failAction: (_request: Request, _h: any, err: any) => {
    const error = Boom.badRequest('Invalid request query parameters');
    error.output.payload.validation = {
      errors: err.details.map((detail: any) => ({
        message: detail.message,
        path: detail.path,
        type: detail.type,
        context: detail.context,
      })),
    };
    throw error;
  },
};
