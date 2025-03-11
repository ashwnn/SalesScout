import express from 'express';
import { connectDB } from '@/config/db';
import dealRoutes from '@/routes/dealRoutes';
import userRoutes from '@/routes/userRoutes';
import queryRoutes from '@/routes/queryRoutes';
import { initializeScheduler } from '@/services/schedulerService';
import { scrapeRedFlagDeals } from '@/controllers/dealController';
import dotenv from 'dotenv';

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

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3005');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use('/api/deals', dealRoutes);
app.use('/api/users', userRoutes);
app.use('/api/queries', queryRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});