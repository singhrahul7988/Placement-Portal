import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Job from '../models/Job';
import Partnership from '../models/Partnership';

// @desc    Create a new Job Drive
// @route   POST /api/jobs/create
export const createJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId, collegeId, title, ctc, deadline, minCgpa, branches, rounds, description, location } = req.body;

    console.log(`[Job] Creating job for College ID: ${collegeId}`);

    // 1. Convert to ObjectId to ensure database matching
    const companyObjectId = new mongoose.Types.ObjectId(companyId);
    const collegeObjectId = new mongoose.Types.ObjectId(collegeId);

    // 2. Security Check: Are they connected?
    const isPartner = await Partnership.findOne({
      requesterId: { $in: [companyObjectId, collegeObjectId] },
      recipientId: { $in: [companyObjectId, collegeObjectId] },
      status: 'Active'
    });

    if (!isPartner) {
      console.log(`[Job] Failed: No active partnership between ${companyId} and ${collegeId}`);
      res.status(403).json({ message: "You must be connected with this college to post jobs." });
      return;
    }

    // 3. Create Job
    const job = new Job({
      companyId: companyObjectId,
      collegeId: collegeObjectId,
      title,
      description,
      location,
      ctc,
      deadline,
      criteria: {
        minCgpa: Number(minCgpa),
        branches: branches 
      },
      rounds
    });

    await job.save();
    console.log(`[Job] Job created successfully: ${job._id}`);

    res.status(201).json(job);
  } catch (error: any) {
    console.error("[Job] Creation Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Jobs posted by a specific Company
// @route   GET /api/jobs/company/:companyId
export const getJobsByCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    // Convert to ObjectId
    const companyObjectId = new mongoose.Types.ObjectId(req.params.companyId);
    
    const jobs = await Job.find({ companyId: companyObjectId })
      .populate('collegeId', 'name') 
      .sort({ createdAt: -1 });
    
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a Job by ID
// @route   GET /api/jobs/:id
export const getJobById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid job ID format' });
      return;
    }

    const job = await Job.findById(id)
      .populate('companyId', 'name email')
      .populate('collegeId', 'name email');

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    res.json(job);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Jobs for a Student/College
// @route   GET /api/jobs/feed/:collegeId
export const getJobsForCollege = async (req: Request, res: Response): Promise<void> => {
  try {
    const { collegeId } = req.params;
    
    // 1. Validate ID Format
    if (!mongoose.Types.ObjectId.isValid(collegeId)) {
        console.log(`[Job Feed] Invalid College ID format: ${collegeId}`);
        res.status(400).json({ message: "Invalid College ID format" });
        return;
    }

    // 2. Convert to ObjectId
    const collegeObjectId = new mongoose.Types.ObjectId(collegeId);
    
    console.log(`[Job Feed] Searching for jobs with College ID: ${collegeObjectId}`);

    // 3. Find Open jobs
    const jobs = await Job.find({ 
        collegeId: collegeObjectId, 
        status: 'Open' 
    })
    .populate('companyId', 'name email')
    .sort({ createdAt: -1 });
    
    console.log(`[Job Feed] Found ${jobs.length} jobs.`);

    res.json(jobs);
  } catch (error: any) {
    console.error("[Job Feed] Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
