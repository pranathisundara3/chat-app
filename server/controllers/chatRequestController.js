import ChatRequest from "../models/chatRequest.js";
import User from "../models/user.js";
import { canUsersChat } from "../lib/chatAccess.js";

const requestUserFields = "fullName username profilePic bio";

const pairFilter = (userA, userB) => ({
    $or: [
        { senderId: userA, receiverId: userB },
        { senderId: userB, receiverId: userA },
    ],
});

// send chat request from current user to target user
export const sendRequest = async (req, res) => {
    try {
        const senderId = req.user._id;
        const receiverId = req.params.id;

        if (!receiverId) {
            return res.json({ success: false, message: "Receiver id is required" });
        }

        if (senderId.toString() === receiverId.toString()) {
            return res.json({ success: false, message: "You cannot send request to yourself" });
        }

        const receiverExists = await User.findById(receiverId).select("_id");
        if (!receiverExists) {
            return res.json({ success: false, message: "User not found" });
        }

        const alreadyConnected = await canUsersChat(senderId, receiverId);
        if (alreadyConnected) {
            return res.json({
                success: true,
                status: "accepted",
                message: "Chat is already enabled for this user",
            });
        }

        const directRequest = await ChatRequest.findOne({ senderId, receiverId });
        if (directRequest) {
            if (directRequest.status === "pending") {
                return res.json({ success: true, status: "pending", message: "Request already pending" });
            }

            if (directRequest.status === "accepted") {
                return res.json({ success: true, status: "accepted", message: "Request already accepted" });
            }

            directRequest.status = "pending";
            await directRequest.save();
            return res.json({ success: true, status: "pending", message: "Request sent successfully" });
        }

        const reverseRequest = await ChatRequest.findOne({ senderId: receiverId, receiverId: senderId });
        if (reverseRequest) {
            if (reverseRequest.status === "accepted") {
                return res.json({ success: true, status: "accepted", message: "Request already accepted" });
            }

            if (reverseRequest.status === "pending") {
                reverseRequest.status = "accepted";
                await reverseRequest.save();
                return res.json({ success: true, status: "accepted", message: "Request auto accepted" });
            }
        }

        await ChatRequest.create({ senderId, receiverId, status: "pending" });
        return res.json({ success: true, status: "pending", message: "Request sent successfully" });
    } catch (error) {
        console.log(error.message);
        return res.json({ success: false, message: error.message });
    }
};

// get incoming/outgoing pending requests and accepted users
export const getRequests = async (req, res) => {
    try {
        const userId = req.user._id;

        const [incomingRequests, outgoingRequests, acceptedRequests] = await Promise.all([
            ChatRequest.find({ receiverId: userId, status: "pending" })
                .populate("senderId", requestUserFields)
                .sort({ createdAt: -1 }),
            ChatRequest.find({ senderId: userId, status: "pending" })
                .populate("receiverId", requestUserFields)
                .sort({ createdAt: -1 }),
            ChatRequest.find({
                status: "accepted",
                $or: [{ senderId: userId }, { receiverId: userId }],
            })
                .populate("senderId", requestUserFields)
                .populate("receiverId", requestUserFields)
                .sort({ updatedAt: -1 }),
        ]);

        const acceptedUsersMap = new Map();
        acceptedRequests.forEach((requestDoc) => {
            const sender = requestDoc.senderId;
            const receiver = requestDoc.receiverId;
            const otherUser = sender._id.toString() === userId.toString() ? receiver : sender;

            if (otherUser) {
                acceptedUsersMap.set(otherUser._id.toString(), otherUser);
            }
        });

        return res.json({
            success: true,
            incomingRequests,
            outgoingRequests,
            acceptedUsers: Array.from(acceptedUsersMap.values()),
        });
    } catch (error) {
        console.log(error.message);
        return res.json({ success: false, message: error.message });
    }
};

// accept a pending request (receiver only)
export const acceptRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const userId = req.user._id;

        const requestDoc = await ChatRequest.findById(requestId);
        if (!requestDoc) {
            return res.json({ success: false, message: "Request not found" });
        }

        if (requestDoc.receiverId.toString() !== userId.toString()) {
            return res.json({ success: false, message: "You are not allowed to accept this request" });
        }

        if (requestDoc.status !== "pending") {
            return res.json({ success: false, message: `Request is already ${requestDoc.status}` });
        }

        requestDoc.status = "accepted";
        await requestDoc.save();

        return res.json({ success: true, message: "Request accepted" });
    } catch (error) {
        console.log(error.message);
        return res.json({ success: false, message: error.message });
    }
};

// reject a pending request (receiver only)
export const rejectRequest = async (req, res) => {
    try {
        const requestId = req.params.id;
        const userId = req.user._id;

        const requestDoc = await ChatRequest.findById(requestId);
        if (!requestDoc) {
            return res.json({ success: false, message: "Request not found" });
        }

        if (requestDoc.receiverId.toString() !== userId.toString()) {
            return res.json({ success: false, message: "You are not allowed to reject this request" });
        }

        if (requestDoc.status !== "pending") {
            return res.json({ success: false, message: `Request is already ${requestDoc.status}` });
        }

        requestDoc.status = "rejected";
        await requestDoc.save();

        return res.json({ success: true, message: "Request rejected" });
    } catch (error) {
        console.log(error.message);
        return res.json({ success: false, message: error.message });
    }
};

// remove an accepted connection without deleting user accounts
export const removeConnection = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const targetUserId = req.params.id;

        if (!targetUserId) {
            return res.json({ success: false, message: "Target user id is required" });
        }

        if (currentUserId.toString() === targetUserId.toString()) {
            return res.json({ success: false, message: "You cannot remove yourself" });
        }

        const targetUser = await User.findById(targetUserId).select("_id");
        if (!targetUser) {
            return res.json({ success: false, message: "User not found" });
        }

        const existingRequest = await ChatRequest.findOne(pairFilter(currentUserId, targetUserId)).sort({ updatedAt: -1 });

        if (existingRequest) {
            existingRequest.status = "removed";
            await existingRequest.save();
        } else {
            await ChatRequest.create({
                senderId: currentUserId,
                receiverId: targetUserId,
                status: "removed",
            });
        }

        return res.json({ success: true, message: "Connection removed successfully" });
    } catch (error) {
        console.log(error.message);
        return res.json({ success: false, message: error.message });
    }
};