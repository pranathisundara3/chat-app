import ChatRequest from "../models/chatRequest.js";
import Message from "../models/message.js";

const pairFilter = (userA, userB) => ({
    $or: [
        { senderId: userA, receiverId: userB },
        { senderId: userB, receiverId: userA },
    ],
});

export const hasPreviousMessages = async (userA, userB) => {
    const existingMessage = await Message.findOne(pairFilter(userA, userB)).select("_id").lean();
    return Boolean(existingMessage);
};

export const hasAcceptedRequest = async (userA, userB) => {
    const acceptedRequest = await ChatRequest.findOne({
        ...pairFilter(userA, userB),
        status: "accepted",
    })
        .select("_id")
        .lean();

    return Boolean(acceptedRequest);
};

export const canUsersChat = async (userA, userB) => {
    const [chatHistoryExists, acceptedRequestExists] = await Promise.all([
        hasPreviousMessages(userA, userB),
        hasAcceptedRequest(userA, userB),
    ]);

    return chatHistoryExists || acceptedRequestExists;
};
