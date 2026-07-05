const toNormalizedList = (value) => {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

export const resolveUserRole = ({ clerkUserId, email, existingRole }) => {
  const adminEmails = toNormalizedList(process.env.ADMIN_EMAILS);
  const adminClerkIds = toNormalizedList(process.env.ADMIN_CLERK_IDS);

  const isAllowedAdmin =
    adminEmails.includes((email || "").trim().toLowerCase()) ||
    adminClerkIds.includes((clerkUserId || "").trim().toLowerCase());

  if (existingRole === "admin" || isAllowedAdmin) {
    return "admin";
  }

  if (existingRole === "educator") {
    return "educator";
  }

  return "student";
};