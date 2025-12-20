import { Request, Response } from 'express';
import Partnership from '../models/Partnership';
import User from '../models/User';

// @desc    Send a Connection Request
// @route   POST /api/network/connect
export const sendConnectionRequest = async (req: Request, res: Response): Promise<void> => {
  const { requesterId, recipientId } = req.body;

  try {
    const existing = await Partnership.findOne({ requesterId, recipientId });
    if (existing) {
      res.status(400).json({ message: "Request already sent or active." });
      return;
    }

    const partnership = await Partnership.create({
      requesterId,
      recipientId,
      status: 'Pending'
    });

    res.status(201).json(partnership);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Requests for a User
// @route   GET /api/network/requests/:userId
export const getMyNetwork = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
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
export const respondToRequest = async (req: Request, res: Response): Promise<void> => {
  const { partnershipId, status } = req.body; 

  try {
    const partnership = await Partnership.findByIdAndUpdate(
      partnershipId,
      { status },
      { new: true }
    );
    res.json(partnership);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get All Colleges (For Search)
// @route   GET /api/network/search-colleges
export const getAllColleges = async (req: Request, res: Response): Promise<void> => {
    try {
        const colleges = await User.find({ role: 'college' }).select('name email branch');
        res.json(colleges);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}