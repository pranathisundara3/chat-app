import React, { useMemo, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { useContext } from "react";
import { ChatContext } from "../../context/ChatContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";

const RightSidebar = () => {
  const { selectedUser, messages, removeConnection, requestActionLoading } = useContext(ChatContext);
  const { logout, onlineUsers } = useContext(AuthContext);
  const msgImages = useMemo(() => messages.filter(msg => msg.image).map(msg => msg.image), [messages]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleRemoveConnection = async () => {
    setIsUserMenuOpen(false);

    if (!selectedUser) return;

    const shouldRemove = window.confirm('Are you sure you want to remove this user?');
    if (!shouldRemove) return;

    await removeConnection(selectedUser._id);
  };

  return selectedUser && (
    <div className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll ${selectedUser ? "max-md:hidden" : ""}`}>
      <div className="pt-16 flex-col items-center gap-2 text-xs font-light mx-auto relative">
        <div className="absolute right-5 top-2" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="rounded-md p-1 transition hover:bg-violet-500/20"
          >
            <img src={assets.menu_icon} alt="User menu" className="h-4 w-4" />
          </button>

          <div className={`absolute right-0 z-20 mt-2 w-44 rounded-xl border border-violet-400/25 bg-[#1c1431] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.45)] transition-all duration-200 ${isUserMenuOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'}`}>
            <button
              type="button"
              onClick={handleRemoveConnection}
              disabled={requestActionLoading}
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-rose-200 transition-colors duration-200 hover:bg-rose-500/20 disabled:opacity-60"
            >
              🗑 Remove Connection
            </button>
          </div>
        </div>

        <img src={selectedUser?.profilePic || assets.avatar_icon} alt="" className="w-20 rounded-full" />
        <h1 className='px-10 text-xl font-medium mx-auto flex items-center gap-2'>
          {onlineUsers.includes(selectedUser._id) ? <p className='w-2 h-2 rounded-full bg-green-500 '> </p> : <p className='w-2 h-2 rounded-full bg-gray-500 '> </p>}
          {selectedUser.fullName}
        </h1>
        <p className='px-10 mx-auto'>{selectedUser.bio}</p>
      </div>
      <hr className="border-[#ffffff50] my-4" />
      <div className="px-5 text-xs">
        <p>Media</p>
        <div className='mt-2 max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-4 opacity-80'>
          {msgImages.map((url, index) => (
            <div key={index} onClick={() => window.open(url)} className="cursor-pointer rounded">
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => logout()} className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-violet-600 text-white border-none text-sm font-light px-4 py-2 rounded-full cursor-pointer">
        Logout
      </button>
    </div>
  );
};

export default RightSidebar;