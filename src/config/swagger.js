// config/swagger.js
const swagger = require('@fastify/swagger');
const swaggerUI = require('@fastify/swagger-ui');

async function registerSwagger(fastify) {
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Zomato API',
        description: 'API for paginating Zomato restaurant data',
        version: '1.0.0',
      },
    },
  });

  await fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
    },
    staticCSP: true,
    transformSpecification: (swaggerObject) => swaggerObject,
    transformSpecificationClone: true,
  });
}

module.exports = registerSwagger;
