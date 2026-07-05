import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      logger.info("mongodb.connected");
    });

    mongoose.connection.on("error", (err) => {
      logger.error("mongodb.connection_error", { message: err.message });
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("mongodb.disconnected");
    });

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in .env file");
    }

    if (mongoose.connection.readyState === 1) {
      logger.info("mongodb.already_connected");
      return mongoose.connection;
    }

    await mongoose.connect(process.env.MONGODB_URI);

    logger.info("mongodb.connection_established");
    return mongoose.connection;
  } catch (error) {
    logger.error("mongodb.connection_failed", { message: error.message });
    throw error;
  }
};

export default connectDB;
