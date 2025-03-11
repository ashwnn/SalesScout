import express from 'express';
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
const PORT: number | string = process.env.PORT || 3000;

const setupAutomaticScraping = () => {
  console.log('Performing initial deals scrape on startup...');
  scrapeRedFlagDeals()
    .then(deals => console.log(`Successfully scraped ${deals.length} deals`))
    .catch(err => console.error('Error in initial scrape:', err));
  
  const THIRTY_MINUTES = 30 * 60 * 1000;
  setInterval(async () => {
    console.log('Running scheduled deals scrape...');
    try {
      const deals = await scrapeRedFlagDeals();
      console.log(`Successfully scraped ${deals.length} deals at ${new Date().toLocaleString()}`);
    } catch (err) {
      console.error('Error in scheduled scrape:', err);
    }
  }, THIRTY_MINUTES);
  
  console.log('Automatic deal scraping scheduled every 30 minutes');
};

connectDB().then(() => {
  initializeScheduler();
  setupAutomaticScraping();
});
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3005',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

app.use('/api/deals', dealRoutes);
app.use('/api/users', userRoutes);
app.use('/api/queries', queryRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});