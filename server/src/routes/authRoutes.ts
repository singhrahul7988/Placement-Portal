import express from 'express';
import { 
    registerUser, 
    loginUser, 
    addStudentByCollege, 
    changePassword, 
    addStudentsBulk ,
    getStudentsByCollege,
    deleteStudent
} from '../controllers/authController';
import User from '../models/User';
import { updateUserProfile } from '../controllers/authController'; // <--- Import this
import { addCollegeStaff, getTeamMembers } from '../controllers/authController';
import authMiddleware from '../middleware/authMiddleware';
// ... existing routes ...
// <--- Add this line
const router = express.Router();
router.get('/students/:collegeId', authMiddleware, getStudentsByCollege);
router.delete('/student/:id', authMiddleware, deleteStudent);
router.put('/update-profile', authMiddleware, updateUserProfile); 
// --- PUBLIC AUTH ROUTES ---
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/add-staff', authMiddleware, addCollegeStaff);
router.get('/team/:collegeId', authMiddleware, getTeamMembers);
// --- UTILITY ROUTES ---
// Get list of colleges for the dropdown
router.get('/colleges', async (req, res) => {
  try {
    const colleges = await User.find({ role: 'college' }).select('name _id');
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching colleges' });
  }
});

// --- ONBOARDING ROUTES ---
router.post('/add-student', authMiddleware, addStudentByCollege);       // Manual Add
router.post('/add-students-bulk', authMiddleware, addStudentsBulk);     // Bulk Excel Add
router.put('/change-password', authMiddleware, changePassword);         // Force Password Change

export default router;
