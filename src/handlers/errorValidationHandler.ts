import Boom from '@hapi/boom';

export const errorValidationHandler = {
  options: {
    stripUnknown: true,
    abortEarly: false,
  },
  failAction: (request: any, h: any, err: any) => {
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
