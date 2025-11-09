import express from 'express';
import { getDeals, triggerScrape } from '../controllers/dealController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public route to get all deals
router.get('/', getDeals);

// Protected route to manually trigger scraping
router.get('/scrape', protect, triggerScrape);

export default router;