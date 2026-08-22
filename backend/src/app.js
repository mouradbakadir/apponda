import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { prisma } from './config/prisma.js';
import { redis } from './config/redis.js';

export const app = express();

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin === env.frontendUrl ||
      origin.endsWith('.railway.app') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
// Remplace app.use(morgan('dev')) si tu l'avais par :
app.use(pinoHttp({
  logger,
  autoLogging: false, // On ne loggue pas chaque requête automatiquement pour ne pas polluer, ou mets true si tu veux tout tracer
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) return 'warn'
    if (res.statusCode >= 500 || err) return 'error'
    return 'info'
  }
}));

app.use('/api', apiRoutes);
// La route de documentation Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }', // Rend l'interface plus jolie
  customSiteTitle: "Documentation API ONDA"
}));
app.get('/api/health', async (req, res) => {
  try {
    // Test 1: La base de données répond-elle ?
    await prisma.$queryRaw`SELECT 1`;
    // Test 2: Le cache Redis répond-il ?
    await redis.ping();

    res.json({
      status: 'OK',
      timestamp: new Date(),
      services: {
        database: 'UP',
        redis: 'UP'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: "Un service critique est en panne",
      error: error.message
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route non trouvée' } });
});

app.use(errorHandler);