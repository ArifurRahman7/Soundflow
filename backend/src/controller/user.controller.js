import {User} from '../models/user.model.js'; // Adjust the path as needed
import { Message } from "../models/message.model.js";

export const getAllUsers = async (req, res, next) => {
    try {
        const currentUser = req.auth.userId
        const users = await User.find({clerkId: { $ne: currentUser}}); // Fetch all users from the database
        res.status(200).json(users); // Send the users as a JSON response
    } catch (error) {
        next(error); // Pass any errors to the error-handling middleware
    }
};


export const getMessages = async (req, res, next) => {
	try {
		const myId = req.auth.userId;
		const { userId } = req.params;

		const messages = await Message.find({
			$or: [
				{ senderId: userId, receiverId: myId },
				{ senderId: myId, receiverId: userId },
			],
		}).sort({ createdAt: 1 });

		res.status(200).json(messages);
	} catch (error) {
		next(error);
	}
};