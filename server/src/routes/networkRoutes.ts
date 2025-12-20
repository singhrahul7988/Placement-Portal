import express from 'express';
import { 
    sendConnectionRequest, 
    getMyNetwork, 
    respondToRequest,
    getAllColleges 
} from '../controllers/networkController';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

router.post('/connect', authMiddleware, sendConnectionRequest);
router.get('/requests/:userId', authMiddleware, getMyNetwork);
router.put('/respond', authMiddleware, respondToRequest);
router.get('/search-colleges', authMiddleware, getAllColleges);

export default router;
