// config/database.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDatabase = async () => {
  try {
    const uri = process.env.DB_URI;
    if (!uri) throw new Error("Database URI is not defined");

    // Remove previous connections if any
    if (mongoose.connections.length > 0) {
      const promises = mongoose.connections.map(connection => connection.close());
      await Promise.all(promises);
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 50,
      connectTimeoutMS: 10000,
      retryWrites: true,
    });

    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    return mongoose.connection;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

export const checkDatabaseConnection = () => {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
};

export default connectDatabase;