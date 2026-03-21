const Fastify = require('fastify');
const swagger = require('@fastify/swagger');
const swaggerUi = require('@fastify/swagger-ui');
const os = require('node:os');
const { isValidUuid, validateProductPayload, toProductData } = require('./validation');

function buildApp({ db, logger = false }) {
  const app = Fastify({ logger, trustProxy: true });

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
      createdAt: { type: 'string', format: 'date-time', default: new Date().toISOString() },
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

  app.get('/health', async (_, reply) => {
    return reply.code(200).send({
      status: 'ok',
      instanceId: process.env.INSTANCE_ID || os.hostname(),
      pid: process.pid
    });
  });

  app.after(() => {
    app.get('/api/products', {
      schema: {
        tags: ['Products'],
        summary: 'Get all products',
        response: {
          200: {
            type: 'array',
            items: productSchema
          }
        }
      }
    }, async (_, reply) => {
      const products = await db.getAll();
      return reply.code(200).send(products);
    });

    app.get('/api/products/:productId', {
      schema: {
        tags: ['Products'],
        summary: 'Get product by id',
        params: productIdParamsSchema,
        response: {
          200: productSchema,
          400: errorSchema,
          404: errorSchema
        }
      }
    }, async (request, reply) => {
      const { productId } = request.params;

      if (!isValidUuid(productId)) {
        return reply.code(400).send({ message: 'Invalid productId: expected UUID v4' });
      }

      const product = await db.getById(productId);
      if (!product) {
        return reply.code(404).send({ message: `Product with id ${productId} not found` });
      }

      return reply.code(200).send(product);
    });

    app.post('/api/products', {
      schema: {
        tags: ['Products'],
        summary: 'Create a product',
        body: productPayloadSchema,
        response: {
          201: productSchema,
          400: errorSchema
        }
      }
    }, async (request, reply) => {
      const validationError = validateProductPayload(request.body);
      if (validationError) {
        return reply.code(400).send({ message: validationError });
      }

      const created = await db.create(toProductData(request.body));
      return reply.code(201).send(created);
    });

    app.put('/api/products/:productId', {
      schema: {
        tags: ['Products'],
        summary: 'Update a product',
        params: productIdParamsSchema,
        body: productPayloadSchema,
        response: {
          200: productSchema,
          400: errorSchema,
          404: errorSchema
        }
      }
    }, async (request, reply) => {
      const { productId } = request.params;

      if (!isValidUuid(productId)) {
        return reply.code(400).send({ message: 'Invalid productId: expected UUID v4' });
      }

      const validationError = validateProductPayload(request.body);
      if (validationError) {
        return reply.code(400).send({ message: validationError });
      }

      const updated = await db.update(productId, toProductData(request.body));
      if (!updated) {
        return reply.code(404).send({ message: `Product with id ${productId} not found` });
      }

      return reply.code(200).send(updated);
    });

    app.delete('/api/products/:productId', {
      schema: {
        tags: ['Products'],
        summary: 'Delete a product',
        params: productIdParamsSchema,
        response: {
          204: { type: 'null' },
          400: errorSchema,
          404: errorSchema
        }
      }
    }, async (request, reply) => {
      const { productId } = request.params;

      if (!isValidUuid(productId)) {
        return reply.code(400).send({ message: 'Invalid productId: expected UUID v4' });
      }

      const deleted = await db.delete(productId);
      if (!deleted) {
        return reply.code(404).send({ message: `Product with id ${productId} not found` });
      }

      return reply.code(204).send();
    });
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
