import express from 'express';
import { getDeals } from '../controllers/dealController';

const router = express.Router();

router.get('/scrape', getDeals);

export default router;