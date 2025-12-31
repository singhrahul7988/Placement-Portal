import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Job from '../models/Job';
import Partnership from '../models/Partnership';
import User from '../models/User';

type AuthRequest = Request & { userId?: string };

// @desc    Create a new Job Drive
// @route   POST /api/jobs/create
export const createJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const {
      companyId: bodyCompanyId,
      collegeId,
      title,
      ctc,
      deadline,
      minCgpa,
      branches,
      rounds,
      description,
      location
    } = req.body;

    if (!title || !ctc || !deadline || !collegeId) {
      res.status(400).json({ message: "Missing required fields." });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(collegeId)) {
      res.status(400).json({ message: "Invalid college ID." });
      return;
    }

    if (bodyCompanyId && String(bodyCompanyId) !== String(req.userId)) {
      res.status(403).json({ message: "Requester mismatch." });
      return;
    }

    const requester = await User.findById(req.userId).select('role');
    if (!requester || requester.role !== 'company') {
      res.status(403).json({ message: "Only companies can create drives." });
      return;
    }

    const targetCollege = await User.findById(collegeId).select('role');
    if (!targetCollege || targetCollege.role !== 'college') {
      res.status(400).json({ message: "Target college not found." });
      return;
    }

    const parsedMinCgpa = Number(minCgpa ?? 0);
    if (Number.isNaN(parsedMinCgpa) || parsedMinCgpa < 0 || parsedMinCgpa > 10) {
      res.status(400).json({ message: "Invalid minimum CGPA." });
      return;
    }

    const parsedDeadline = new Date(deadline);
    if (Number.isNaN(parsedDeadline.getTime())) {
      res.status(400).json({ message: "Invalid deadline." });
      return;
    }

    const parsedRounds = Array.isArray(rounds)
      ? rounds.filter((round: any) => String(round).trim().length > 0)
      : typeof rounds === "string"
      ? rounds.split(",").map((round) => round.trim()).filter(Boolean)
      : [];

    if (parsedRounds.length === 0) {
      res.status(400).json({ message: "Rounds are required." });
      return;
    }

    const parsedBranches = Array.isArray(branches)
      ? branches.map((branch: any) => String(branch).trim()).filter(Boolean)
      : [];

    console.log(`[Job] Creating job for College ID: ${collegeId}`);

    // 1. Convert to ObjectId to ensure database matching
    const companyObjectId = new mongoose.Types.ObjectId(req.userId);
    const collegeObjectId = new mongoose.Types.ObjectId(collegeId);

    // 2. Security Check: Are they connected?
    const isPartner = await Partnership.findOne({
      requesterId: { $in: [companyObjectId, collegeObjectId] },
      recipientId: { $in: [companyObjectId, collegeObjectId] },
      status: 'Active'
    });

    if (!isPartner) {
      const companyIdLog = String(req.userId);
      console.log(`[Job] Failed: No active partnership between ${companyIdLog} and ${collegeId}`);
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
      deadline: parsedDeadline,
      criteria: {
        minCgpa: parsedMinCgpa,
        branches: parsedBranches
      },
      rounds: parsedRounds
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
    const authReq = req as AuthRequest;
    if (!authReq.userId) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }
    if (String(authReq.userId) !== String(req.params.companyId)) {
      res.status(403).json({ message: "Not authorized to view this company's jobs." });
      return;
    }

    const requester = await User.findById(authReq.userId).select('role');
    if (!requester || requester.role !== 'company') {
      res.status(403).json({ message: "Only companies can view this job list." });
      return;
    }

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
    const authReq = req as AuthRequest;
    if (!authReq.userId) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

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

    const requester = await User.findById(authReq.userId).select('role collegeId');
    if (!requester) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const jobCompanyId = String((job.companyId as any)?._id ?? job.companyId);
    const jobCollegeId = String((job.collegeId as any)?._id ?? job.collegeId);
    const requesterCollegeId = requester.collegeId ? String(requester.collegeId) : "";

    const isCompanyOwner = requester.role === "company" && String(requester._id) === jobCompanyId;
    const isCollegeOwner = requester.role === "college" && String(requester._id) === jobCollegeId;
    const isCollegeMember = requester.role === "college_member" && requesterCollegeId === jobCollegeId;
    const isStudent = requester.role === "student" && requesterCollegeId === jobCollegeId;

    if (!isCompanyOwner && !isCollegeOwner && !isCollegeMember && !isStudent) {
      res.status(403).json({ message: "Not authorized to view this job." });
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
    const authReq = req as AuthRequest;
    if (!authReq.userId) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const { collegeId } = req.params;
    
    // 1. Validate ID Format
    if (!mongoose.Types.ObjectId.isValid(collegeId)) {
        console.log(`[Job Feed] Invalid College ID format: ${collegeId}`);
        res.status(400).json({ message: "Invalid College ID format" });
        return;
    }

    const requester = await User.findById(authReq.userId).select('role collegeId');
    if (!requester) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const isCollegeOwner = requester.role === "college" && String(requester._id) === String(collegeId);
    const isCollegeMember = requester.role === "college_member" && String(requester.collegeId || "") === String(collegeId);
    const isStudent = requester.role === "student" && String(requester.collegeId || "") === String(collegeId);

    if (!isCollegeOwner && !isCollegeMember && !isStudent) {
      res.status(403).json({ message: "Not authorized to view this job feed." });
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
