// config/database.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDatabase = async () => {
  try {
    const uri = process.env.DB_URI;

    if (!uri) {
      throw new Error("Database URI is not defined in environment variables");
    }

    // Disconnect from any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("Disconnected from previous connection");
    }

    console.log("Attempting to connect to MongoDB...");

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,    
      socketTimeoutMS: 45000,
      maxPoolSize: 50,
      connectTimeoutMS: 10000,
      retryWrites: true
      // Removed deprecated options:
      // useNewUrlParser and useUnifiedTopology
    });

    // Success handlers
    mongoose.connection.on('connected', () => {
      console.log(`✅ MongoDB connected successfully to ${conn.connection.host}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    // Error handlers
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', {
        name: err.name,
        message: err.message,
        code: err.code
      });
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error during database disconnection:', err);
        process.exit(1);
      }
    });

    return conn;

  } catch (error) {
    console.error("Database connection error:", {
      name: error.name,
      message: error.message,
      code: error.code || 'NO_CODE'
    });

    throw error;
  }
};

export const checkDatabaseConnection = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: '❌ disconnected',
    1: '✅ connected',
    2: '⏳ connecting',
    3: '⚠️ disconnecting',
  };
  
  return states[state] || '❓ unknown';
};

export default connectDatabase;