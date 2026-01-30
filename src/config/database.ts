import mongoose from "mongoose";

export const connectDatabase = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/health-ai";
        await mongoose.connect(mongoUri);
        console.log("✅ MongoDB connected successfully");
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error);
        process.exit(1);
    }
};
