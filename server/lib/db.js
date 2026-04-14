import mongoose from "mongoose";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// function to connect to MongoDB
export const connectDb = async () => {
  mongoose.connection.on('connected', () => console.log('MongoDB connected successfully'));
  mongoose.connection.on('error', err => console.error('MongoDB connection error:', err));

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined in environment');

  const maxRetries = Number(process.env.MONGODB_CONNECT_RETRIES || 5);
  const retryDelayMs = Number(process.env.MONGODB_CONNECT_RETRY_DELAY_MS || 2000);
  const forceIpv4 = process.env.MONGODB_FORCE_IPV4 === 'true';

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      const connectOptions = {
        serverSelectionTimeoutMS: 15000,
      };

      if (forceIpv4) {
        connectOptions.family = 4;
      }

      await mongoose.connect(uri, connectOptions);
      console.log(`Mongoose connect() resolved on attempt ${attempt}`);
      return;
    } catch (error) {
      lastError = error;
      console.error(`Mongo connection attempt ${attempt}/${maxRetries} failed:`, error.message);

      if (attempt < maxRetries) {
        await wait(retryDelayMs);
      }
    }
  }

  console.error('connectDb failed:', lastError);
  throw lastError;
};