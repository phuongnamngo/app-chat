import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI: string =
      process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp';

    const conn = await mongoose.connect(mongoURI);

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ MongoDB error: ${error.message}`);
    }
    process.exit(1);
  }
};

export default connectDB;