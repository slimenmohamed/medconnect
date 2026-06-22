const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi    = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'MedConnect - Medical Records Service API',
      version: '1.0.0',
      description: 'Service Node.js de dossiers médicaux et prescriptions (JWT Keycloak).'
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    },
    security: [{ bearerAuth: [] }],
    servers: [{ url: '/' }]
  },
  apis: ['./src/routes/*.js']
};

const spec = swaggerJsdoc(options);

function mountSwagger(app) {
  app.get('/v3/api-docs', (req, res) => res.json(spec));
  app.use('/swagger-ui.html', swaggerUi.serve, swaggerUi.setup(spec));
  app.use('/api-docs',       swaggerUi.serve, swaggerUi.setup(spec));
}

module.exports = { mountSwagger };
