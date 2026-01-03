import { User } from "../models/user.model.js";

export const authCallback = async (req,res,next) => {
    try{
        const {id,firstName,lastName} = req.body;

        //check if user already exists
        const user = await User.findOne({clerkId:id});
        if(!user){
            //create new user
            await User.create({
                clerkId:id,
                fullName: `${firstName || ""} ${lastName || ""}`.trim(),
                imageUrl: req.body.imageUrl
            });
        }
        res.status(200).json({
            success:true,
            // message:"user created successfully",
        })
    }catch(err){
        console.log("error in auth route",err);
        // res.status(500).json({
        //     success:false,
        //     message:"internal server error",err
        //})
        next(err);
    }
}