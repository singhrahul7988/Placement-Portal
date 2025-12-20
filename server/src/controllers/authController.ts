import { Request, Response } from 'express';
import User, { IUser } from '../models/User'; // Import IUser interface
import jwt from 'jsonwebtoken';

type AuthRequest = Request & { userId?: string };

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user (Self Registration)
// @route   POST /api/auth/register
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role, collegeId } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Explicitly define the object structure to help TypeScript
    const userData: Partial<IUser> = {
      name,
      email,
      password,
      role
    };

    // Only add collegeId if it's a valid non-empty string
    if (collegeId && typeof collegeId === 'string' && collegeId.trim() !== "") {
        userData.collegeId = collegeId as any; // Cast as any to bypass strict ObjectId checks if string format is valid
    }

    // Use new User() + save() pattern
    const user = new User(userData);
    await user.save();

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken((user._id as unknown) as string),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error: any) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ... (Rest of the file remains exactly the same as provided before) ...
// (Include loginUser, addStudentByCollege, changePassword, etc. here)

// @desc    Login user
// @route   POST /api/auth/login
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const targetCollegeId = user.role === 'college' ? user._id : user.collegeId;

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        collegeId: targetCollegeId, 
        isFirstLogin: user.isFirstLogin,
        branch: user.branch,
        cgpa: user.cgpa,
        phone: user.phone,
        skills: user.skills,
        token: generateToken((user._id as unknown) as string),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ... (Paste the rest of the functions: addStudentByCollege, changePassword, addStudentsBulk, updateUserProfile, getStudentsByCollege, deleteStudent, addCollegeStaff, getTeamMembers from previous response) ...

export const addStudentByCollege = async (req: Request, res: Response): Promise<void> => {
  const { name, email, branch, cgpa, phone, collegeId } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: 'Student email already exists' });
      return;
    }

    const user = await User.create({
      name,
      email,
      password: 'welcome123',
      role: 'student',
      collegeId,
      isFirstLogin: true,
      branch: branch || "",
      cgpa: cgpa || "",
      phone: phone || ""
    });

    res.status(201).json({ message: "Student added successfully", user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    const { newPassword } = req.body;
    try {
        if (!req.userId) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }

        const user = await User.findById(req.userId);
        if(!user) {
             res.status(404).json({ message: "User not found" });
             return;
        }
        
        user.password = newPassword;
        user.isFirstLogin = false;
        await user.save();
        
        res.json({ message: "Password updated successfully. Please login." });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export const addStudentsBulk = async (req: Request, res: Response): Promise<void> => {
  const { students, collegeId } = req.body;

  try {
    let successCount = 0;
    let failedCount = 0;

    for (const rawStudent of students) {
      const student: any = {};
      Object.keys(rawStudent).forEach((key) => {
        student[key.toLowerCase().trim()] = rawStudent[key];
      });

      const { name, email, branch, cgpa, phone } = student;

      if (!email || !name) {
         failedCount++;
         continue; 
      }

      const userExists = await User.findOne({ email });
      if (!userExists) {
        await User.create({
          name,
          email,
          password: 'welcome123',
          role: 'student',
          collegeId,
          isFirstLogin: true,
          branch: branch || "", 
          cgpa: typeof cgpa === 'number' ? cgpa.toString() : (cgpa || ""),
          phone: phone || ""
        });
        successCount++;
      } else {
        failedCount++;
      }
    }

    res.status(201).json({ 
      message: `Process Complete. Added: ${successCount}, Skipped/Failed: ${failedCount}` 
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, phone, branch, cgpa, skills } = req.body;

  try {
    if (!req.userId) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const user = await User.findById(req.userId);

    if (user) {
      user.name = name || user.name;
      user.phone = phone || user.phone;
      user.branch = branch || user.branch;
      user.cgpa = cgpa || user.cgpa;
      user.skills = skills || user.skills;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        branch: updatedUser.branch,
        cgpa: updatedUser.cgpa,
        phone: updatedUser.phone,
        skills: updatedUser.skills,
        collegeId: updatedUser.role === 'college' ? updatedUser._id : updatedUser.collegeId,
        token: req.headers.authorization?.split(" ")[1] 
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentsByCollege = async (req: Request, res: Response): Promise<void> => {
  const { collegeId } = req.params;
  try {
    const students = await User.find({ collegeId, role: 'student' }).select('-password');
    res.json(students);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "Student removed" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export const addCollegeStaff = async (req: Request, res: Response): Promise<void> => {
  const { name, email, collegeId } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: 'Email already in use' });
      return;
    }

    const user = await User.create({
      name,
      email,
      password: 'staff123',
      role: 'college_member',
      collegeId,
      isFirstLogin: true
    });

    res.status(201).json({ message: "Staff member added", user });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeamMembers = async (req: Request, res: Response): Promise<void> => {
    try {
        const team = await User.find({ 
            collegeId: req.params.collegeId, 
            role: 'college_member' 
        }).select('-password');
        res.json(team);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}
