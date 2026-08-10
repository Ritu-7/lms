import crypto from "crypto";

// Fallback for development if not provided in .env (DO NOT USE FALLBACK IN PRODUCTION)
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || "fallback_secret_must_be_32_bytes_";
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

const getSecretKey = () => {
  // Ensure the key is exactly 32 bytes long
  if (Buffer.byteLength(ENCRYPTION_SECRET) === 32) {
    return Buffer.from(ENCRYPTION_SECRET);
  }
  return crypto.scryptSync(ENCRYPTION_SECRET, "salt", 32);
};

export const encryptKey = (text) => {
  if (!text) return null;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt API key");
  }
};

export const decryptKey = (encryptedText) => {
  if (!encryptedText) return null;
  try {
    const [ivHex, encryptedHex] = encryptedText.split(":");
    if (!ivHex || !encryptedHex) return null;
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    // Return null instead of throwing to avoid crashing if secret changes
    return null;
  }
};
