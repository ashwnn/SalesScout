import express from 'express';
import { 
  createQuery, 
  getUserQueries, 
  getQuery, 
  updateQuery, 
  deleteQuery,
  createQueryValidation
} from '../controllers/queryController';
import { protect } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// All query routes are protected and rate limited
router.use(protect);
router.use(apiRateLimiter);

router.route('/')
  .post(createQueryValidation, createQuery)
  .get(getUserQueries);

router.route('/:id')
  .get(getQuery)
  .put(updateQuery)
  .delete(deleteQuery);

export default router;