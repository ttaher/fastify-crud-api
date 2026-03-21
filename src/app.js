const Fastify = require('fastify');
const swagger = require('@fastify/swagger');
const swaggerUi = require('@fastify/swagger-ui');

function buildApp({logger = false }) {
  const app = Fastify({ logger });

  app.register(swagger, {
    openapi: {
      info: {
        title: 'Product Catalog API',
        description: 'CRUD API for product catalog',
        version: '1.0.0'
      }
    }
  });

  app.register(swaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list'
    }
  });

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      message: `Route ${request.method} ${request.url} not found`
    });
  });

  app.setErrorHandler((error, _, reply) => {
    if (error.validation) {
      const [firstValidationError] = error.validation;
      const isInvalidProductId =
        error.validationContext === 'params' &&
        Array.isArray(error.validation) &&
        error.validation.some((item) => item.instancePath === '/productId');

      if (
        firstValidationError &&
        firstValidationError.keyword === 'required' &&
        firstValidationError.params &&
        typeof firstValidationError.params.missingProperty === 'string'
      ) {
        return reply
          .code(400)
          .send({ message: `Field "${firstValidationError.params.missingProperty}" is required` });
      }

      if (
        firstValidationError &&
        firstValidationError.instancePath === '/price' &&
        (firstValidationError.keyword === 'exclusiveMinimum' || firstValidationError.keyword === 'minimum')
      ) {
        return reply.code(400).send({ message: 'Field "price" must be a positive number' });
      }

      const message = isInvalidProductId
        ? 'Invalid productId: expected UUID v4'
        : 'Validation error: request payload is invalid';

      return reply.code(400).send({ message });
    }

    reply.log.error(error);
    reply.code(500).send({ message: 'Internal server error' });
  });

  return app;
}

module.exports = {
  buildApp
};
