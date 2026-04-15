import Message from "../models/message.js";
import User from "../models/user.js";
import ChatRequest from "../models/chatRequest.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";
import { canUsersChat } from "../lib/chatAccess.js";

// get sidebar users only from existing chat history
export const getChatUsers = async (req, res) => {
    try {
        const userId = req.user._id;

        const relatedMessages = await Message.find({
            $or: [{ senderId: userId }, { receiverId: userId }],
        })
            .sort({ createdAt: -1 })
            .select("senderId receiverId")
            .lean();

        const uniqueUserIds = [];
        const seenUserIds = new Set();
        const userIdString = userId.toString();

        relatedMessages.forEach((messageDoc) => {
            const senderId = messageDoc.senderId.toString();
            const receiverId = messageDoc.receiverId.toString();
            const otherUserId = senderId === userIdString ? receiverId : senderId;

            if (!seenUserIds.has(otherUserId)) {
                seenUserIds.add(otherUserId);
                uniqueUserIds.push(otherUserId);
            }
        });

        if (!uniqueUserIds.length) {
            return res.json({ success: true, users: [], unseenMessages: {} });
        }

        const removedRows = await ChatRequest.find({
            status: "removed",
            $or: [
                { senderId: userId, receiverId: { $in: uniqueUserIds } },
                { receiverId: userId, senderId: { $in: uniqueUserIds } },
            ],
        })
            .select("senderId receiverId")
            .lean();

        const removedUserIds = new Set();
        removedRows.forEach((requestDoc) => {
            const senderId = requestDoc.senderId.toString();
            const receiverId = requestDoc.receiverId.toString();
            const otherUserId = senderId === userIdString ? receiverId : senderId;
            removedUserIds.add(otherUserId);
        });

        const visibleUserIds = uniqueUserIds.filter((id) => !removedUserIds.has(id));

        if (!visibleUserIds.length) {
            return res.json({ success: true, users: [], unseenMessages: {} });
        }

        const users = await User.find({ _id: { $in: visibleUserIds } })
            .select("-password")
            .lean();

        const usersMap = new Map(users.map((user) => [user._id.toString(), user]));
        const orderedUsers = visibleUserIds
            .map((id) => usersMap.get(id))
            .filter(Boolean);

        const unseenMessages = {};
        const unseenMessageRows = await Message.find({
            senderId: { $in: visibleUserIds },
            receiverId: userId,
            seen: false,
        })
            .select("senderId")
            .lean();

        unseenMessageRows.forEach((messageDoc) => {
            const senderId = messageDoc.senderId.toString();
            unseenMessages[senderId] = (unseenMessages[senderId] || 0) + 1;
        });

        res.json({ success: true, users: orderedUsers, unseenMessages });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// alias to keep compatibility with existing route import
export const getUsersForSidebar = getChatUsers;

// get all messages for selected user
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const isAllowed = await canUsersChat(myId, selectedUserId);
        if (!isAllowed) {
            return res.json({
                success: false,
                canChat: false,
                messages: [],
                message: "Chat request is not accepted yet",
            });
        }

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ],
        });

        await Message.updateMany(
            { senderId: selectedUserId, receiverId: myId },
            { seen: true }
        );

        res.json({ success: true, canChat: true, messages });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// api to mark message as seen using message id
export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { seen: true });
        res.json({ success: true });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        if (!text && !image) {
            return res.json({ success: false, message: "Message text or image is required" });
        }

        const isAllowed = await canUsersChat(senderId, receiverId);
        if (!isAllowed) {
            return res.json({ success: false, message: "Chat request is not accepted yet" });
        }

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.json({ success: true, message: newMessage });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};