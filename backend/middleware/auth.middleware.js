import { clerkClient } from "@clerk/express";
export const protectRoute = async (req, res, next) => {

    const userId = req.auth.userId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized - No user ID found" });
    }
    next();
};

export const requireAdmin = async (req, res, next) => {
    try {
        const currentUser = await clerkClient.users.getUser(req.auth.userId);
        const isAdmin = process.env.ADMIN_EMAIL === currentUser.primaryEmailAddress?.emailAddress;
        if (!isAdmin) {
            return res.status(403).json({ message: "Forbidden - Admin access required" });
        }
        next();
    } catch (error) {
        next(error)
        
    }

    
    };
 
