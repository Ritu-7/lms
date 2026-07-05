const REDACTED_KEYS = /authorization|cookie|password|secret|signature|token|key/i;

const sanitize = (value) => {
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, REDACTED_KEYS.test(key) ? "[REDACTED]" : item])
  );
};

const write = (level, message, metadata = {}) => {
  const payload = JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...sanitize(metadata) });
  (level === "error" ? console.error : console.log)(payload);
};

export const logger = {
  info: (message, metadata) => write("info", message, metadata),
  warn: (message, metadata) => write("warn", message, metadata),
  error: (message, metadata) => write("error", message, metadata),
};
