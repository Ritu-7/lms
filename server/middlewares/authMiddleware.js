import { clerkClient } from "@clerk/express";


export const protectEducatorRoutes = async (req, res, next) => {
    try {
        const userId = req.auth?.userId;

      
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized. Please login again." });
        }

      
        const response = await clerkClient.users.getUser(userId);
        const role = response.publicMetadata?.role;

        if (role !== "educator") {
            return res.status(403).json({ 
                success: false, 
                message: "Access denied. Educator role required." 
            });
        }

    
        next();
        
    } catch (error) {
        console.error("Error in educator auth middleware:", error.message);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};