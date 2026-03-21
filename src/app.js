const Fastify = require('fastify');
const swagger = require('@fastify/swagger');
const swaggerUi = require('@fastify/swagger-ui');

function buildApp({db, logger = false }) {
  const app = Fastify({ logger });

    const productSchema = {
    type: 'object',
    required: ['id', 'name', 'description', 'price', 'category', 'inStock'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      description: { type: 'string' },
      price: { type: 'number', exclusiveMinimum: 0 },
      category: { type: 'string' },
      inStock: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' ,default: new Date().toISOString() },
      updatedAt: { type: 'string', format: 'date-time' },
      imgUrl: { type: 'string', format: 'uri' }

    }
  };

  const productPayloadSchema = {
    type: 'object',
    required: ['name', 'description', 'price', 'category', 'inStock'],
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      price: { type: 'number', exclusiveMinimum: 0 },
      category: { type: 'string' },
      inStock: { type: 'boolean' }
    }
  };

  const productIdParamsSchema = {
    type: 'object',
    required: ['productId'],
    properties: {
      productId: { type: 'string', format: 'uuid' }
    }
  };

  const errorSchema = {
    type: 'object',
    required: ['message'],
    properties: {
      message: { type: 'string' }
    }
  };

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

  app.after(() => {});


  return app;
}

module.exports = {
  buildApp
};
