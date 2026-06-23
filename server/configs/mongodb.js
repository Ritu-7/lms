import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Connection Events
    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected.");
    });

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env file");
    }

    // Already connected
    if (mongoose.connection.readyState === 1) {
      console.log("ℹ️ MongoDB already connected");
      return mongoose.connection;
    }

    console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);
    console.log("RAW URI:", JSON.stringify(process.env.MONGODB_URI));
    console.log(
      "Starts with mongodb+srv:// ?",
      process.env.MONGODB_URI.startsWith("mongodb+srv://")
    );

    // Debug host only
    try {
      const host = process.env.MONGODB_URI.split("@")[1];
      console.log("Mongo Host:", host);
    } catch (err) {
      console.log("Could not parse Mongo host");
    }

    // Connect
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("✅ Database connection established");
    return mongoose.connection;

  } catch (error) {
    console.error(
      "❌ Database connection failed during mongoose.connect:",
      error.message
    );
    throw error;
  }
};

export default connectDB;