import dns from "node:dns";
import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

// Force Google DNS
dns.setServers(["8.8.8.8", "8.8.4.4"]);

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
      throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    logger.info("mongodb.connection_established");
  } catch (error) {
    logger.error("mongodb.connection_failed", {
      message: error.message,
    });
    throw error;
  }
};

export default connectDB;