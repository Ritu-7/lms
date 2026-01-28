import mongoose from "mongoose";

const connectDB = async () => {
    try {
        // Event Listeners
        mongoose.connection.on("connected", () => {
            console.log("✅ MongoDB connected successfully");
        });

        mongoose.connection.on("error", (err) => {
            console.error("❌ MongoDB connection error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
        });

        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in .env file");
        }

        // Check if already connected (useful for serverless environments like Vercel/Next.js)
        if (mongoose.connection.readyState === 1) {
            return mongoose.connection;
        }

        // Connection with options
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: 'lms', // Cleaner than string concatenation
        });
        
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
        // Consider if you want to crash the app or retry
        process.exit(1);
    }
};

export default connectDB;