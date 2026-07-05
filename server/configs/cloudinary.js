import { v2 as cloudinary } from 'cloudinary';
import { logger } from "../utils/logger.js";

const connectCloudinary = async () => {
    const { CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

    if (!CLOUDINARY_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        throw new Error("Cloudinary environment variables are not configured");
    }

    cloudinary.config({
        cloud_name: CLOUDINARY_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
    });

    logger.info("cloudinary.configured");
}

export default connectCloudinary;
