import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

export const app = express();

app.use(cors({ origin: env.frontendUrl }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', apiRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route non trouvée' } });
});

app.use(errorHandler);