import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';

// --- 1. IMPORT ROUTES ---
import authRoutes from './routes/authRoutes';
import jobRoutes from './routes/jobRoutes';         // <--- WAS MISSING
import networkRoutes from './routes/networkRoutes'; // <--- WAS MISSING

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors());

// --- 2. USE ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);        // <--- WAS MISSING (Fixes Job Feed 404)
app.use('/api/network', networkRoutes); // <--- WAS MISSING (Fixes Partnership 404)

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
