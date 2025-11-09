import express, { Request, Response, NextFunction } from 'express';
import { connectDB } from '@/config/db';
import dealRoutes from '@/routes/dealRoutes';
import userRoutes from '@/routes/userRoutes';
import queryRoutes from '@/routes/queryRoutes';
import { initializeScheduler } from '@/services/schedulerService';
import { scrapeRedFlagDeals } from '@/controllers/dealController';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT: number | string = process.env.PORT || 3311;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: ['http://localhost:3005', 'http://localhost:3000'],
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
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const setupAutomaticScraping = () => {
  console.log('Performing initial deals scrape on startup...');
  scrapeRedFlagDeals()
    .then(deals => console.log(`Successfully scraped ${deals.length} new deals`))
    .catch(err => console.error('Error in initial scrape:', err.message));
  
  const THIRTY_MINUTES = 30 * 60 * 1000;
  setInterval(async () => {
    console.log('⏰ Running scheduled deals scrape...');
    try {
      const deals = await scrapeRedFlagDeals();
      console.log(`Successfully scraped ${deals.length} new deals at ${new Date().toLocaleString()}`);
    } catch (err: any) {
      console.error('Error in scheduled scrape:', err.message);
    }
  }, THIRTY_MINUTES);
  
  console.log('📅 Automatic deal scraping scheduled every 30 minutes');
};

// Start server only after DB connection
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Database connected successfully');
    
    // Initialize scheduler
    await initializeScheduler();
    console.log('Scheduler initialized');
    
    // Setup automatic scraping
    setupAutomaticScraping();
    
    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}`);
      console.log(`API endpoint: http://localhost:${PORT}/api`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error: any) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the application
startServer();