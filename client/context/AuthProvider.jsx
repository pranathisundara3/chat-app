import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext.jsx';

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);

    const connectSocket = useCallback((userData) => {
        if (!userData || socket?.connected) return;
        const newSocket = io(backendUrl, {
            query: {
                userId: userData._id,
            },
        });
        newSocket.connect();
        setSocket(newSocket);
        newSocket.on('getOnlineUsers', (userIds) => {
            setOnlineUsers(userIds);
        });
    }, [socket]);

    const applyAuthSession = (data) => {
        setAuthUser(data.userData);
        connectSocket(data.userData);
        setToken(data.token);
        localStorage.setItem('token', data.token);
    };

    const login = async (credentials) => {
        try {
            const { data } = await axios.post('/api/auth/login', credentials);
            if (data.success) {
                applyAuthSession(data);
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    const loginWithGoogle = async (credential, profile = {}) => {
        try {
            const { data } = await axios.post('/api/auth/google', { credential, profile });
            if (data.success) {
                applyAuthSession(data);
                toast.success(data.message);
                return true;
            }

            toast.error(data.message);
            return false;
        } catch (error) {
            toast.error(error.message);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setAuthUser(null);
        setToken(null);
        setOnlineUsers([]);
        delete axios.defaults.headers.common['token'];
        toast.success('Logged out successfully');
        socket?.disconnect();
    };

    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put('/api/auth/update-profile', body);
            if (data.success) {
                setAuthUser(data.userData);
                toast.success('profile updated successfully');
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            if (token) {
                axios.defaults.headers.common['token'] = token;
            } else {
                delete axios.defaults.headers.common['token'];
            }
            try {
                const { data } = await axios.get('/api/auth/check');
                if (data.success) {
                    setAuthUser(data.user);
                    connectSocket(data.user);
                }
            } catch (error) {
                toast.error(error.message);
            }
        };
        initializeAuth();
    }, [token, connectSocket]);

    const value = {
        axios,
        token,
        setToken,
        authUser,
        setAuthUser,
        onlineUsers,
        setOnlineUsers,
        socket,
        setSocket,
        login,
        loginWithGoogle,
        logout,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
