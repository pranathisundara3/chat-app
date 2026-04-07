import { useContext, useState, useEffect, useCallback } from "react";
import toast from 'react-hot-toast';
import { AuthContext } from "./AuthContext.jsx";
import { ChatContext } from "./ChatContext.jsx";

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});
    const { socket, axios } = useContext(AuthContext);

    //function  to get all users for sidebar
    const getUsers = async () => {
        try {
            const { data } = await axios.get('/api/message/users');
            if (data.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };
// function to get messages for selected user
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/message/${userId}`);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };
    // function to send messages to selected user

    const sendMessage = async (userId, message) => {
        try {
            const { data } = await axios.post(`/api/message/send/${userId}`, message);
            if (data.success) {
                setMessages((prevMessages) => [...prevMessages, data.message]);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const subscribeToMessages = useCallback(() => {
        if (!socket) return;
        socket.on("newMessage", (message) => {
            if (selectedUser && message.senderId === selectedUser._id) {
                message.seen = true;
                setMessages((prevMessages) => [...prevMessages, message]);
                axios.put(`/api/message/mark/${message._id}`);
            } else {
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages,
                    [message.senderId]: prevUnseenMessages[message.senderId] ? prevUnseenMessages[message.senderId] + 1 : 1,
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
        selectedUser,
        setSelectedUser,
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
