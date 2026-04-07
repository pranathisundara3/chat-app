import mongoose from "mongoose";

// function to connect to MongoDB
export const connectDb = async () => {
  try {
    mongoose.connection.on('connected', () => console.log('MongoDB connected successfully'));
    mongoose.connection.on('error', err => console.error('MongoDB connection error:', err));

    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not defined in environment');

    await mongoose.connect(uri);
    console.log('Mongoose connect() resolved');
  } catch (error) {
    console.error('connectDb failed:', error);
    throw error; // allow caller to decide after logging
  }
};