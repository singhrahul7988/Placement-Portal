import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Attempt to connect to the database
    const conn = await mongoose.connect(process.env.MONGO_URI || '');
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    // Stop the server if database connection fails
    process.exit(1);
  }
};

export default connectDB;