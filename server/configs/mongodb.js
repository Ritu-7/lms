import mongoose from "mongoose";

const connectDB = async () => {
    try {
        // Listeners should be established before the connection attempt
        mongoose.connection.on("connected", () => {
            console.log("MongoDB connected successfully");
        });

        mongoose.connection.on("error", (err) => {
            console.error(" MongoDB connection error:", err);
        });

        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in .env file");
        }

        // Connecting to the URI. 
        // Note: It is often better to include the DB name in the URI string itself, 
        // but this manual append works if your URI doesn't end in a slash.
        await mongoose.connect(`${process.env.MONGODB_URI}/lms`);
        
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
};

export default connectDB;