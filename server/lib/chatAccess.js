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

export const hasRemovedConnection = async (userA, userB) => {
    const removedConnection = await ChatRequest.findOne({
        ...pairFilter(userA, userB),
        status: "removed",
    })
        .select("_id")
        .lean();

    return Boolean(removedConnection);
};

export const canUsersChat = async (userA, userB) => {
    const [acceptedRequestExists, removedConnectionExists] = await Promise.all([
        hasAcceptedRequest(userA, userB),
        hasRemovedConnection(userA, userB),
    ]);

    if (removedConnectionExists) {
        return false;
    }

    if (acceptedRequestExists) {
        return true;
    }

    const chatHistoryExists = await hasPreviousMessages(userA, userB);
    return chatHistoryExists;
};
