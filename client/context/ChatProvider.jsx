import { useContext, useState, useEffect, useCallback } from "react";
import toast from 'react-hot-toast';
import { AuthContext } from "./AuthContext.jsx";
import { ChatContext } from "./ChatContext.jsx";

const toIdString = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object" && value._id) return String(value._id);
    return String(value);
};

const normalizeMessage = (messageDoc) => ({
    ...messageDoc,
    _id: toIdString(messageDoc._id),
    senderId: toIdString(messageDoc.senderId),
    receiverId: toIdString(messageDoc.receiverId),
});

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});
    const [searchResults, setSearchResults] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [outgoingRequests, setOutgoingRequests] = useState([]);
    const [requestActionLoading, setRequestActionLoading] = useState(false);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const { socket, axios } = useContext(AuthContext);

    const mergeUsersWithAcceptedStatus = useCallback((chatUsers) => {
        return chatUsers.map((user) => ({ ...user, chatStatus: 'accepted' }));
    }, []);

    const applySelectedUserStatus = useCallback((nextStatus) => {
        setSelectedUser((prev) => {
            if (!prev) return prev;
            if (prev.chatStatus === nextStatus) return prev;
            return { ...prev, chatStatus: nextStatus };
        });
    }, []);

    const updateSearchUserStatus = useCallback((userId, updater) => {
        setSearchResults((prevResults) => prevResults.map((user) => {
            if (user._id !== userId) return user;
            return typeof updater === 'function' ? updater(user) : { ...user, ...updater };
        }));
    }, []);

    const getRequests = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/chat-request');
            if (data.success) {
                setIncomingRequests(data.incomingRequests || []);
                setOutgoingRequests(data.outgoingRequests || []);
                return data;
            }
            toast.error(data.message);
            return null;
        } catch (error) {
            toast.error(error.message);
            return null;
        }
    }, [axios]);

    // function to get chat history users for sidebar
    const getUsers = useCallback(async () => {
        try {
            const [usersResponse, requestsResponse] = await Promise.all([
                axios.get('/api/message/users'),
                axios.get('/api/chat-request'),
            ]);

            if (usersResponse.data.success) {
                setUsers(mergeUsersWithAcceptedStatus(usersResponse.data.users || []));
                setUnseenMessages(usersResponse.data.unseenMessages || {});
            }

            if (requestsResponse.data.success) {
                setIncomingRequests(requestsResponse.data.incomingRequests || []);
                setOutgoingRequests(requestsResponse.data.outgoingRequests || []);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }, [axios, mergeUsersWithAcceptedStatus]);

    const searchUsers = useCallback(async (queryText) => {
        const trimmedQuery = queryText.trim();
        if (!trimmedQuery) {
            setSearchResults([]);
            return;
        }

        try {
            const { data } = await axios.get('/api/auth/search', {
                params: { query: trimmedQuery },
            });

            if (data.success) {
                setSearchResults(data.users || []);
                return;
            }

            toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        }
    }, [axios]);

    const clearSearchResults = useCallback(() => {
        setSearchResults([]);
    }, []);

    const sendChatRequest = useCallback(async (userId) => {
        setRequestActionLoading(true);
        try {
            const { data } = await axios.post(`/api/chat-request/send/${userId}`);
            if (!data.success) {
                toast.error(data.message);
                return false;
            }

            const nextStatus = data.status === 'accepted' ? 'accepted' : 'pending-sent';

            updateSearchUserStatus(userId, (user) => ({
                ...user,
                chatStatus: nextStatus,
            }));

            if (selectedUser?._id === userId) {
                applySelectedUserStatus(nextStatus);
            }

            await getUsers();
            toast.success(data.message);
            return true;
        } catch (error) {
            toast.error(error.message);
            return false;
        } finally {
            setRequestActionLoading(false);
        }
    }, [axios, updateSearchUserStatus, selectedUser, applySelectedUserStatus, getUsers]);

    const acceptRequest = useCallback(async (requestId) => {
        setRequestActionLoading(true);
        try {
            const { data } = await axios.put(`/api/chat-request/accept/${requestId}`);
            if (!data.success) {
                toast.error(data.message);
                return false;
            }

            await getUsers();
            toast.success(data.message);
            return true;
        } catch (error) {
            toast.error(error.message);
            return false;
        } finally {
            setRequestActionLoading(false);
        }
    }, [axios, getUsers]);

    const rejectRequest = useCallback(async (requestId) => {
        setRequestActionLoading(true);
        try {
            const { data } = await axios.put(`/api/chat-request/reject/${requestId}`);
            if (!data.success) {
                toast.error(data.message);
                return false;
            }

            await getUsers();
            toast.success(data.message);
            return true;
        } catch (error) {
            toast.error(error.message);
            return false;
        } finally {
            setRequestActionLoading(false);
        }
    }, [axios, getUsers]);

    const selectChatUser = useCallback((user) => {
        const chatStatus = user.chatStatus || 'accepted';
        setSelectedUser({ ...user, chatStatus });
        setMessages([]);
        setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
    }, []);

    // function to get messages for selected user
    const getMessages = useCallback(async (userId) => {
        setMessagesLoading(true);
        try {
            const { data } = await axios.get(`/api/message/${userId}`);
            if (data.success) {
                setMessages((data.messages || []).map(normalizeMessage));
                applySelectedUserStatus('accepted');
                return { success: true, canChat: true };
            }

            if (data.canChat === false) {
                setMessages([]);
                return { success: false, canChat: false, message: data.message };
            }

            toast.error(data.message);
            return { success: false, canChat: false, message: data.message };
        } catch (error) {
            toast.error(error.message);
            return { success: false, canChat: false, message: error.message };
        } finally {
            setMessagesLoading(false);
        }
    }, [axios, applySelectedUserStatus]);

    // function to send messages to selected user
    const sendMessage = useCallback(async (userId, message) => {
        try {
            const { data } = await axios.post(`/api/message/send/${userId}`, message);
            if (data.success) {
                setMessages((prevMessages) => [...prevMessages, normalizeMessage(data.message)]);
                return true;
            }
            toast.error(data.message);
            return false;
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    }, [axios]);

    const subscribeToMessages = useCallback(() => {
        if (!socket) return;
        socket.on("newMessage", (message) => {
            const normalizedMessage = normalizeMessage(message);
            const senderId = normalizedMessage.senderId;
            const activeUserId = toIdString(selectedUser?._id);

            if (selectedUser && senderId === activeUserId) {
                normalizedMessage.seen = true;
                setMessages((prevMessages) => [...prevMessages, normalizedMessage]);

                if (normalizedMessage._id) {
                    axios.put(`/api/message/mark/${normalizedMessage._id}`);
                }
            } else {
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages,
                    [senderId]: prevUnseenMessages[senderId] ? prevUnseenMessages[senderId] + 1 : 1,
                }));
            }
        });
    }, [socket, selectedUser, axios]);
    
    // function to unsubscribe from messages 
    const unsubscribeFromMessages = useCallback(() => {
        if (socket) 
            socket.off("newMessage");
    }, [socket]);
    
    useEffect(() => {
        subscribeToMessages();
        return () => unsubscribeFromMessages();
    }, [subscribeToMessages, unsubscribeFromMessages]);
            
    


    const value = {
        messages,
        setMessages,
        users,
        setUsers,
        searchResults,
        clearSearchResults,
        searchUsers,
        incomingRequests,
        outgoingRequests,
        getRequests,
        sendChatRequest,
        acceptRequest,
        rejectRequest,
        requestActionLoading,
        messagesLoading,
        selectedUser,
        setSelectedUser,
        selectChatUser,
        unseenMessages,
        setUnseenMessages,
        getUsers,
        getMessages,
        sendMessage,
        subscribeToMessages,
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};
