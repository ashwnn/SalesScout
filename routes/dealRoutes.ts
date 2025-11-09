import express from 'express';
import { getDeals, triggerScrape } from '../controllers/dealController';
import { protect } from '../middleware/auth';
import { apiRateLimiter, strictRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Public route to get all deals with rate limiting
router.get('/', apiRateLimiter, getDeals);

// Protected route to manually trigger scraping with strict rate limiting
router.get('/scrape', protect, strictRateLimiter, triggerScrape);

export default router;