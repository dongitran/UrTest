import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from './config/index.js';
import { databaseManager } from './config/database.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import curlRoutes from './routes/curl.js';

const app = express();
const PORT = config.get('port');

app.use(helmet(config.get('security.helmet')));
app.use(cors(config.get('security.cors')));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(authMiddleware);

app.use('/api/curl', curlRoutes);

app.get('/health', async (req, res) => {
  const dbHealth = await databaseManager.healthCheck();
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: config.get('nodeEnv'),
    version: '2.0.0',
    database: dbHealth,
    config: {
      maxRetries: config.get('ai.maxRetries'),
      maxFieldLength: config.get('processing.maxFieldLength'),
      requestTimeout: config.get('processing.requestTimeout')
    }
  });
});

app.use(errorHandler);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

async function startServer() {
  try {
    await databaseManager.connect();
    
    app.listen(PORT, () => {
      logger.success(`Server running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Environment: ${config.get('nodeEnv')}`);
      logger.info(`Retry mechanism: Enabled (max ${config.get('ai.maxRetries')} retries)`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await databaseManager.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await databaseManager.close();
  process.exit(0);
});

startServer();
