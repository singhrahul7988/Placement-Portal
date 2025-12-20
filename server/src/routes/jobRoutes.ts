import express from 'express';
import { createJob, getJobById, getJobsByCompany, getJobsForCollege } from '../controllers/jobController';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

router.post('/create', authMiddleware, createJob);
router.get('/company/:companyId', authMiddleware, getJobsByCompany);
router.get('/feed/:collegeId', authMiddleware, getJobsForCollege);
router.get('/:id', authMiddleware, getJobById);

export default router;
