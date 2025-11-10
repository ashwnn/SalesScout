import express, { Request, Response, NextFunction } from 'express';
import { connectDB } from '@/config/db';
import dealRoutes from '@/routes/dealRoutes';
import userRoutes from '@/routes/userRoutes';
import queryRoutes from '@/routes/queryRoutes';
import { initializeScheduler } from '@/services/schedulerService';
import { scrapeRedFlagDeals } from '@/controllers/dealController';
import { createDemoUser } from '@/scripts/createDemoUser';
import logger from '@/utils/logger';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import Deal from './models/Deal';
import helmet from 'helmet';

dotenv.config();

const app = express();
const PORT: number | string = process.env.BACKEND_PORT || process.env.PORT || 3311;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: [
        "'self'", 
        // Allow Umami analytics script
        "https://umami.bepo.ca"
      ],
      connectSrc: [
        "'self'",
        // Allow Umami analytics data collection
        "https://umami.bepo.ca"
      ],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Request Size Limits - Prevent DoS via large payloads
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// CORS Configuration
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS 
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(url => url.trim())
  : ['http://localhost:3005', 'http://localhost:3000', 'http://localhost:1533'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Health check endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SalesScout API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  };
  
  const statusCode = mongoose.connection.readyState === 1 ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SalesScout API v1.0',
    endpoints: {
      users: '/api/users',
      deals: '/api/deals',
      queries: '/api/queries'
    }
  });
});

// API Routes
app.use('/api/deals', dealRoutes);
app.use('/api/users', userRoutes);
app.use('/api/queries', queryRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err.message, err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Never expose stack traces - security risk
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal Server Error' : message
  });
});

const setupAutomaticScraping = () => {
  logger.info('Performing initial deals scrape on startup...');
  scrapeRedFlagDeals()
    .then(deals => logger.info(`Successfully scraped ${deals.length} new deals`))
    .catch(err => logger.error('Error in initial scrape:', err.message));

  const THIRTY_MINUTES = 30 * 60 * 1000;
  setInterval(async () => {
    logger.info('Running scheduled deals scrape...');
    try {
      const deals = await scrapeRedFlagDeals();
      logger.info(`Successfully scraped ${deals.length} new deals at ${new Date().toLocaleString()}`);
    } catch (err: any) {
      logger.error('Error in scheduled scrape:', err.message);
    }
  }, THIRTY_MINUTES);

  logger.info('Automatic deal scraping scheduled every 30 minutes');
};

// Start server only after DB connection
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    logger.info('Database connected successfully');

    // Create demo user if demo mode is enabled
    await createDemoUser();

    // Initialize scheduler
    await initializeScheduler();
    logger.info('Scheduler initialized');

    // Setup automatic scraping
    setupAutomaticScraping();

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}`);
      logger.info(`API endpoint: http://localhost:${PORT}/api`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Log level: ${process.env.LOG_LEVEL || 'INFO'}`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.warn(`${signal} received. Starting graceful shutdown...`);

      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error: any) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the application
startServer();