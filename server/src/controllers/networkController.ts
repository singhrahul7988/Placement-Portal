import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Partnership from '../models/Partnership';
import User from '../models/User';

type AuthRequest = Request & { userId?: string };

// @desc    Send a Connection Request
// @route   POST /api/network/connect
export const sendConnectionRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const { recipientId, requesterId: bodyRequesterId } = req.body;
  if (!req.userId) {
    res.status(401).json({ message: "Not authorized" });
    return;
  }

  const requesterId = req.userId;

  try {
    if (bodyRequesterId && String(bodyRequesterId) !== String(requesterId)) {
      res.status(403).json({ message: "Requester mismatch." });
      return;
    }
    if (!recipientId) {
      res.status(400).json({ message: "Recipient is required." });
      return;
    }
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      res.status(400).json({ message: "Invalid recipient ID." });
      return;
    }
    if (String(requesterId) === String(recipientId)) {
      res.status(400).json({ message: "Cannot request partnership with yourself." });
      return;
    }

    const requester = await User.findById(requesterId).select('role');
    const recipient = await User.findById(recipientId).select('role');

    if (!requester || !recipient) {
      res.status(404).json({ message: "Requester or recipient not found." });
      return;
    }

    const validRoles = ['company', 'college'];
    if (!validRoles.includes(requester.role) || !validRoles.includes(recipient.role)) {
      res.status(400).json({ message: "Only companies and colleges can partner." });
      return;
    }

    const isCrossRole = requester.role !== recipient.role;
    if (!isCrossRole) {
      res.status(400).json({ message: "Partnerships require a company and a college." });
      return;
    }

    const pairKey = [String(requesterId), String(recipientId)].sort().join(':');
    const existing = await Partnership.findOne({
      $or: [
        { pairKey },
        { requesterId, recipientId },
        { requesterId: recipientId, recipientId: requesterId }
      ]
    });
    if (existing) {
      if (existing.status === 'Rejected') {
        existing.status = 'Pending';
        existing.requesterId = new mongoose.Types.ObjectId(requesterId);
        existing.recipientId = new mongoose.Types.ObjectId(recipientId);
        await existing.save();
        res.status(200).json(existing);
        return;
      }
      res.status(400).json({ message: "Request already sent or active." });
      return;
    }

    const partnership = await Partnership.create({
      requesterId,
      recipientId,
      status: 'Pending',
      pairKey
    });

    res.status(201).json(partnership);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Requests for a User
// @route   GET /api/network/requests/:userId
export const getMyNetwork = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  if (!req.userId) {
    res.status(401).json({ message: "Not authorized" });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: "Invalid user ID." });
    return;
  }

  try {
    const requestingUser = await User.findById(req.userId).select('role collegeId');
    if (!requestingUser) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const isSelf = String(req.userId) === String(userId);
    const isCollegeMember =
      requestingUser.role === 'college_member' &&
      String(requestingUser.collegeId || '') === String(userId);
    if (!isSelf && !isCollegeMember) {
      res.status(403).json({ message: "Not authorized to view this network." });
      return;
    }

    const partnerships = await Partnership.find({
      $or: [{ requesterId: userId }, { recipientId: userId }]
    })
    .populate('requesterId', 'name email role')
    .populate('recipientId', 'name email role');

    res.json(partnerships);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Respond to Request (Accept/Reject)
// @route   PUT /api/network/respond
export const respondToRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const { partnershipId, status } = req.body; 
  if (!req.userId) {
    res.status(401).json({ message: "Not authorized" });
    return;
  }
  if (!partnershipId || !mongoose.Types.ObjectId.isValid(partnershipId)) {
    res.status(400).json({ message: "Invalid partnership ID." });
    return;
  }
  if (!['Active', 'Rejected'].includes(status)) {
    res.status(400).json({ message: "Invalid status update." });
    return;
  }

  try {
    const partnership = await Partnership.findById(partnershipId);
    if (!partnership) {
      res.status(404).json({ message: "Partnership not found." });
      return;
    }
    if (String(partnership.recipientId) !== String(req.userId)) {
      res.status(403).json({ message: "Only the recipient can respond to this request." });
      return;
    }

    partnership.status = status;
    await partnership.save();
    res.json(partnership);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get All Colleges (For Search)
// @route   GET /api/network/search-colleges
export const getAllColleges = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }
        const requester = await User.findById(req.userId).select('role');
        if (!requester || !['company', 'college', 'college_member'].includes(requester.role)) {
            res.status(403).json({ message: "Not authorized to view colleges." });
            return;
        }

        const colleges = await User.find({ role: 'college' }).select('name email branch state');
        res.json(colleges);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Get All Companies (For Search)
// @route   GET /api/network/search-companies
export const getAllCompanies = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.userId) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }
        const requester = await User.findById(req.userId).select('role');
        if (!requester || !['company', 'college', 'college_member'].includes(requester.role)) {
            res.status(403).json({ message: "Not authorized to view companies." });
            return;
        }

        const companies = await User.find({ role: 'company' }).select('name email');
        res.json(companies);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
