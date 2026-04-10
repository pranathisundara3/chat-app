import React, { useEffect, useRef, useState, useContext } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from '../library/utils';
import { AuthContext } from '../../context/AuthContext.jsx';
import { ChatContext } from '../../context/ChatContext.jsx';
import toast from 'react-hot-toast';

const Chatcontainer = () => {
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } = useContext(ChatContext);
  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollEnd = useRef();
  const [input, setInput] = useState('');

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '' || !selectedUser) return null;
    const sent = await sendMessage(selectedUser._id, { text: input.trim() });
    if (sent) {
      setInput('');
    }
  };

  // Handle sending an image
  const handleSendImage = async (e) => {
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
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser, getMessages]);


  useEffect(() => {
    if(scrollEnd.current && messages){
      scrollEnd.current.scrollIntoView({behavior:"smooth" })
    }
  },[messages])
  return selectedUser ? (
    <div className='h-full overflow-scroll relative backdrop-blur-lg'>
      {/* Chat header */}
      <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
        <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className="w-8 rounded-full" />
        <p className='flex-1 text-lg text-white flex items-center gap-2'>
          {selectedUser.fullName}
          {onlineUsers.includes(selectedUser._id) && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
        </p>
        <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className="md:hidden max-w-7" />
        <img src={assets.help_icon} alt="" className="max-md:hidden max-w-5" />
      </div>
      {/* Chat messages will go here */}
      <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6 '>
        {messages.map((message, index) => (
          <div key={index} className={`flex items-end gap-2 justify-end ${message.senderId !== authUser._id ? 'flex-row-reverse' : ''}`}>
            {message.image ? (
              <img src={message.image} alt="" className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8' />
            ) : (
              <p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all ${message.senderId === authUser._id ? 'bg-violet-500/30 text-white rounded-br-none' : 'bg-white/30 text-black rounded-bl-none'}`}>
                {message.text}
              </p>
            )}
              <div className="text-center text-xs">
                <img src={message.senderId === authUser._id ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon} alt="" className='w-7 rounded-full' />
                <p className='text-gray-500'>{formatMessageTime(message.createdAt)}</p>
            </div>

          </div>
        ))}
        <div ref={scrollEnd}></div>
      </div>
      {/*-----bottom area-----------*/}
      <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
        <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-lg'>
          <input onChange={(e)=>setInput(e.target.value)} value={input} onKeyDown={(e)=>e.key === 'Enter' ? handleSendMessage(e) : null} type="text"
            placeholder="send a message"
            className='flex-1 text-sm px-3 py-2 rounded-lg outline-none text-white placeholder-gray-400 resize-none'
          />

          <input onChange={handleSendImage} type="file" id='image' accept='image/png, image/jpeg' hidden />
          <label htmlFor="image">
            <img src={assets.gallery_icon} alt="upload" className="w-5 mr-2 cursor-pointer" />
          </label>
        </div>
        <img onClick={handleSendMessage} src={assets.send_button} alt="" className="w-7 cursor-pointer" />
      </div>
    </div>
  ) : null;
};

export default Chatcontainer;