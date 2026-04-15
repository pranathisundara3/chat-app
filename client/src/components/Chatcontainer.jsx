import React, { useEffect, useRef, useState, useContext } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from '../library/utils';
import { AuthContext } from '../../context/AuthContext.jsx';
import { ChatContext } from '../../context/ChatContext.jsx';
import toast from 'react-hot-toast';

const toIdString = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
};

const Chatcontainer = () => {
  const {
    messages,
    setMessages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages,
    sendChatRequest,
    acceptRequest,
    rejectRequest,
    requestActionLoading,
    messagesLoading,
    getUsers,
  } = useContext(ChatContext);
  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollEnd = useRef();
  const [input, setInput] = useState('');
  const canChat = selectedUser?.chatStatus === 'accepted';
  const authUserId = toIdString(authUser?._id);
  const selectedUserId = selectedUser?._id;
  const selectedUserStatus = selectedUser?.chatStatus;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!canChat || input.trim() === '' || !selectedUser) return null;
    const sent = await sendMessage(selectedUser._id, { text: input.trim() });
    if (sent) {
      setInput('');
    }
  };

  // Handle sending an image
  const handleSendImage = async (e) => {
    if (!canChat) return;

    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      if (!selectedUser) return;
      const sent = await sendMessage(selectedUser._id, { image: reader.result });
      if (sent) {
        e.target.value = "";
      }
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!selectedUserId || selectedUserStatus !== 'accepted') {
      return;
    }

    const loadMessages = async () => {
      await getMessages(selectedUserId);
    };

    loadMessages();
  }, [selectedUserId, selectedUserStatus, getMessages]);


  useEffect(() => {
    if(scrollEnd.current && messages){
      scrollEnd.current.scrollIntoView({behavior:"smooth" })
    }
  },[messages])

  const renderChatStatusBanner = () => {
    if (!selectedUser || canChat) return null;

    if (selectedUser.chatStatus === 'pending-sent') {
      return (
        <div className='m-4 rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200'>
          Chat request sent. You can message after it is accepted.
        </div>
      );
    }

    if (selectedUser.chatStatus === 'pending-received') {
      return (
        <div className='m-4 rounded-lg border border-violet-400/40 bg-violet-500/10 px-4 py-3 text-sm text-violet-100'>
          <p className='mb-2'>This user sent you a chat request.</p>
          <div className='flex gap-2'>
            <button
              onClick={async () => {
                if (!selectedUser.requestId) return;
                const accepted = await acceptRequest(selectedUser.requestId);
                if (accepted) {
                  setSelectedUser((prev) => prev ? { ...prev, chatStatus: 'accepted' } : prev);
                  await getUsers();
                }
              }}
              disabled={requestActionLoading}
              className='rounded-md bg-emerald-500 px-3 py-1 text-xs text-white disabled:opacity-60'
            >
              Accept
            </button>
            <button
              onClick={async () => {
                if (!selectedUser.requestId) return;
                const rejected = await rejectRequest(selectedUser.requestId);
                if (rejected) {
                  setSelectedUser((prev) => prev ? { ...prev, chatStatus: 'none' } : prev);
                  await getUsers();
                }
              }}
              disabled={requestActionLoading}
              className='rounded-md bg-rose-500 px-3 py-1 text-xs text-white disabled:opacity-60'
            >
              Reject
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className='m-4 rounded-lg border border-indigo-400/40 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100'>
        Search and send a request first. Chat becomes available once accepted.
        <button
          onClick={async () => {
            const sent = await sendChatRequest(selectedUser._id);
            if (sent) {
              setSelectedUser((prev) => prev ? { ...prev, chatStatus: 'pending-sent' } : prev);
              await getUsers();
            }
          }}
          disabled={requestActionLoading}
          className='ml-3 rounded-md bg-violet-500 px-3 py-1 text-xs text-white disabled:opacity-60'
        >
          Send Request
        </button>
      </div>
    );
  };

  return selectedUser ? (
    <div className='h-full flex flex-col backdrop-blur-lg'>
      {/* Chat header */}
      <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
        <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className="w-8 rounded-full" />
        <p className='flex-1 text-lg text-white flex items-center gap-2'>
          {selectedUser.fullName}
          {onlineUsers.includes(selectedUser._id) && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
        </p>
        <img
          onClick={() => {
            setSelectedUser(null);
            setMessages([]);
          }}
          src={assets.arrow_icon}
          alt=""
          className="md:hidden max-w-7"
        />
        <img src={assets.help_icon} alt="" className="max-md:hidden max-w-5" />
      </div>
      {messagesLoading && messages.length === 0 && <p className='px-4 py-3 text-xs text-violet-200'>Loading conversation...</p>}
      {renderChatStatusBanner()}
      {/* Chat messages will go here */}
      <div className='flex-1 overflow-y-auto p-3 pb-6'>
        {messages.map((message, index) => {
          const senderId = toIdString(message.senderId);
          const isMyMessage = senderId === authUserId;
          const messageKey = message._id || `${message.createdAt || 'msg'}-${index}`;

          return (
            <div key={messageKey} className={`mb-4 flex items-end gap-2 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
              {!isMyMessage && (
                <div className="text-center text-xs text-gray-400">
                  <img src={selectedUser?.profilePic || assets.avatar_icon} alt="" className='w-7 rounded-full' />
                  <p>{formatMessageTime(message.createdAt)}</p>
                </div>
              )}

              {message.image ? (
                <img src={message.image} alt="" className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden' />
              ) : (
                <p className={`p-2 max-w-[240px] md:text-sm font-light rounded-lg break-words ${isMyMessage ? 'bg-violet-500/30 text-white rounded-br-none' : 'bg-white/20 text-white rounded-bl-none'}`}>
                  {message.text}
                </p>
              )}

              {isMyMessage && (
                <div className="text-center text-xs text-gray-400">
                  <img src={authUser?.profilePic || assets.avatar_icon} alt="" className='w-7 rounded-full' />
                  <p>{formatMessageTime(message.createdAt)}</p>
                </div>
              )}
            </div>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>
      {/*-----bottom area-----------*/}
      <div className='flex items-center gap-3 border-t border-stone-600/60 p-3'>
        <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-lg'>
          <input onChange={(e)=>setInput(e.target.value)} value={input} onKeyDown={(e)=>e.key === 'Enter' ? handleSendMessage(e) : null} type="text"
            placeholder="send a message"
            disabled={!canChat}
            className='flex-1 text-sm px-3 py-2 rounded-lg outline-none text-white placeholder-gray-400 resize-none disabled:opacity-60'
          />

          <input onChange={handleSendImage} type="file" id='image' accept='image/png, image/jpeg' hidden disabled={!canChat} />
          <label htmlFor="image">
            <img src={assets.gallery_icon} alt="upload" className={`w-5 mr-2 ${canChat ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`} />
          </label>
        </div>
        <img onClick={canChat ? handleSendMessage : undefined} src={assets.send_button} alt="" className={`w-7 ${canChat ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`} />
      </div>
    </div>
  ) : null;
};

export default Chatcontainer;