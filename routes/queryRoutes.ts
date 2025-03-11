import express from 'express';
import { 
  createQuery, 
  getUserQueries, 
  getQuery, 
  updateQuery, 
  deleteQuery 
} from '../controllers/queryController';
import { protect } from '../middleware/auth';

const router = express.Router();

// All query routes are protected
router.use(protect);

router.route('/')
  .post(createQuery)
  .get(getUserQueries);

router.route('/:id')
  .get(getQuery)
  .put(updateQuery)
  .delete(deleteQuery);

export default router;