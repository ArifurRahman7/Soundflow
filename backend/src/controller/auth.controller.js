import { User } from "../models/user.model.js"
export const authCallback = async (req, res,next) => {
    try {
        const { id, firstName, lastName, imageUrl } = req.body;
          //check if user already exists
        const user = await User.findOne({ clerkId: id });
        if (!user) {
            //signup
            await User.create({
                clerkId: id,
                firstName,
                lastName,
                imageUrl,
            });
        }
    } catch (error) {
        console.log("Error in auth callback:", error);
        next(error);
    }
};