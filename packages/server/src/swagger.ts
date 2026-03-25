import swaggerJsdoc from 'swagger-jsdoc';
import * as path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mnemo API',
      version: '3.1.0',
      description: 'API for Mnemo - a personal knowledge base with wiki-style linking, graph visualization, and markdown editing.',
    },
    servers: [
      { url: '/api', description: 'API server' },
    ],
  },
  apis: [
    path.join(import.meta.dirname, 'routes', '*.ts'),
    path.join(import.meta.dirname, 'routes', '*.js'),
    path.join(import.meta.dirname, 'index.ts'),
    path.join(import.meta.dirname, 'index.js'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
