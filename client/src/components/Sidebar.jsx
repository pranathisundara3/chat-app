import { useEffect, useMemo, useState, useContext, useRef } from "react";
import assets from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "../../context/AuthContext.jsx";
import { ChatContext } from "../../context/ChatContext.jsx";

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    selectChatUser,
    unseenMessages,
    searchUsers,
    clearSearchResults,
    searchResults,
    incomingRequests,
    sendChatRequest,
    acceptRequest,
    rejectRequest,
    requestActionLoading,
  } = useContext(ChatContext);

  const { logout, onlineUsers } = useContext(AuthContext);

  const [input, setInput] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dismissedRequestCount, setDismissedRequestCount] = useState(0);
  const menuRef = useRef(null);

  const navigate = useNavigate();
  const pendingRequestCount = incomingRequests.length;
  const showRequestsDialog = pendingRequestCount > 0 && pendingRequestCount !== dismissedRequestCount;

  const filteredHistoryUsers = useMemo(() => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return users;

    return users.filter((user) => {
      const fullName = user.fullName?.toLowerCase() || '';
      const username = user.username?.toLowerCase() || '';
      return fullName.includes(trimmed) || username.includes(trimmed);
    });
  }, [users, input]);

  const isSearching = input.trim().length > 0;

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!input.trim()) {
      clearSearchResults();
      return;
    }

    const timer = setTimeout(() => {
      searchUsers(input.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [input, searchUsers, clearSearchResults]);

  const handleSelectHistoryUser = (user) => {
    selectChatUser({ ...user, chatStatus: 'accepted' });
  };

  const renderSearchAction = (user) => {
    if (user.chatStatus === 'accepted') {
      return (
        <button
          onClick={(event) => {
            event.stopPropagation();
            selectChatUser({ ...user, chatStatus: 'accepted' });
          }}
          className='text-xs px-3 py-1 rounded-full bg-violet-500 text-white'
        >
          Open
        </button>
      );
    }

    if (user.chatStatus === 'pending-sent') {
      return <span className='text-xs px-3 py-1 rounded-full bg-amber-500/30 text-amber-300'>Pending</span>;
    }

    if (user.chatStatus === 'pending-received') {
      return (
        <div className='flex gap-2'>
          <button
            onClick={async (event) => {
              event.stopPropagation();
              await acceptRequest(user.requestId);
              await getUsers();
            }}
            disabled={requestActionLoading}
            className='text-xs px-2 py-1 rounded bg-emerald-500/80 text-white disabled:opacity-60'
          >
            Accept
          </button>
          <button
            onClick={async (event) => {
              event.stopPropagation();
              await rejectRequest(user.requestId);
              await searchUsers(input.trim());
            }}
            disabled={requestActionLoading}
            className='text-xs px-2 py-1 rounded bg-rose-500/80 text-white disabled:opacity-60'
          >
            Reject
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={async (event) => {
          event.stopPropagation();
          await sendChatRequest(user._id);
          await searchUsers(input.trim());
        }}
        disabled={requestActionLoading}
        className='text-xs px-3 py-1 rounded-full bg-indigo-500 text-white disabled:opacity-60'
      >
        Send Request
      </button>
    );
  };

  return (
    <>
      {showRequestsDialog && pendingRequestCount > 0 && (
        <div className='fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm'>
          <div className='w-full max-w-sm rounded-2xl border border-violet-400/35 bg-[#140f29] p-5 text-white shadow-[0_22px_60px_rgba(0,0,0,0.55)]'>
            <h3 className='text-lg font-semibold text-violet-100'>You have pending requests</h3>
            <p className='mt-2 text-sm text-violet-200/80'>
              You received {pendingRequestCount} request{pendingRequestCount > 1 ? 's' : ''}. Open Requests to accept or reject.
            </p>
            <div className='mt-5 flex items-center justify-end gap-2'>
              <button
                type='button'
                onClick={() => setDismissedRequestCount(pendingRequestCount)}
                className='rounded-md border border-violet-300/35 px-3 py-1.5 text-sm text-violet-100 transition-colors duration-200 hover:bg-violet-500/20'
              >
                Not now
              </button>
              <button
                type='button'
                onClick={() => {
                  setDismissedRequestCount(pendingRequestCount);
                  navigate('/requests');
                }}
                className='rounded-md bg-violet-500 px-3 py-1.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-violet-400'
              >
                Open Requests
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll text-white ${selectedUser ? 'max-md:hidden' : ''}`}>
      <div className='pb-5'>
        <div className='flex justify-between items-center'>
          <img src={assets.logo} alt="logo" className='max-w-40' />

          <div className="relative py-2" ref={menuRef}>
            <button
              type='button'
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className='relative rounded-md p-1 transition hover:bg-white/10'
            >
              <img src={assets.menu_icon} alt="Menu" className='max-h-5 cursor-pointer' />
              {pendingRequestCount > 0 && (
                <span className='absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white'>
                  {pendingRequestCount > 99 ? '99+' : pendingRequestCount}
                </span>
              )}
            </button>

            <div
              className={`absolute top-full right-0 z-20 mt-2 w-44 rounded-xl border border-violet-400/25 bg-[#1c1431] p-2 text-gray-100 shadow-[0_18px_40px_rgba(0,0,0,0.45)] transition-all duration-200 ${isMenuOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'}`}
            >
              <button
                type='button'
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/profile');
                }}
                className='flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors duration-200 hover:bg-violet-500/20'
              >
                Profile
              </button>

              <button
                type='button'
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/requests');
                }}
                className='mt-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors duration-200 hover:bg-violet-500/20'
              >
                <span>📩 Requests</span>
                {pendingRequestCount > 0 && (
                  <span className='ml-2 min-w-5 rounded-full bg-rose-500 px-1 text-center text-[10px] font-semibold text-white'>
                    {pendingRequestCount > 99 ? '99+' : pendingRequestCount}
                  </span>
                )}
              </button>

              <div className='my-2 border-t border-violet-400/20' />

              <button
                type='button'
                onClick={() => {
                  setIsMenuOpen(false);
                  logout();
                }}
                className='flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-rose-200 transition-colors duration-200 hover:bg-rose-500/20'
              >
                Logout
              </button>
            </div>
          </div>
        </div>
        <div className='bg-[#282142] rounded-full flex items-center gap-2 mt-5 px-4 py-3'>
          <img src={assets.search_icon} alt="Search" className='w-3' />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            type="text"
            className='bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1'
            placeholder='Search by username...'
          />
        </div>
      </div>

      {isSearching ? (
        <div className='flex flex-col gap-2'>
          <p className='text-xs text-violet-200 uppercase tracking-wider mb-1'>Search Results</p>
          {searchResults.length ? searchResults.map((user) => (
            <div
              key={user._id}
              onClick={() => {
                if (user.chatStatus === 'accepted') {
                  selectChatUser({ ...user, chatStatus: 'accepted' });
                }
              }}
              className='flex items-center justify-between gap-2 p-2 pl-3 rounded bg-[#221a3a]'
            >
              <div className='flex items-center gap-2'>
                <img src={user?.profilePic || assets.avatar_icon} alt='' className='w-9 h-9 rounded-full' />
                <div className='leading-4'>
                  <p className='text-sm'>{user.fullName}</p>
                  <p className='text-[11px] text-violet-200/70'>@{user.username || 'user'}</p>
                </div>
              </div>
              {renderSearchAction(user)}
            </div>
          )) : (
            <p className='text-xs text-gray-300'>No users found.</p>
          )}
        </div>
      ) : (
        <>
          <div className='flex flex-col mb-4'>
            <p className='text-xs text-violet-200 uppercase tracking-wider mb-2'>Chats</p>
            {filteredHistoryUsers.map((user) => (
              <div
                onClick={() => handleSelectHistoryUser(user)}
                key={user._id}
                className={'relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm ' + (selectedUser?._id === user._id ? 'bg-[#282142]/50' : '')}
              >
                <img src={user?.profilePic || assets.avatar_icon} alt="" className='w-[35px] aspect-[1/1] rounded-full' />
                <div className='flex flex-col leading-5'>
                  <p>{user.fullName}</p>
                  {onlineUsers.includes(user._id)
                    ? <span className='text-green-400 text-xs'>Online</span>
                    : <span className='text-neutral-400 text-xs'>Offline</span>}
                </div>
                {unseenMessages[user._id] > 0 && (
                  <p className='absolute top-4 right-4 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/50'>
                    {unseenMessages[user._id]}
                  </p>
                )}
              </div>
            ))}

            {!filteredHistoryUsers.length && (
              <p className='text-xs text-gray-300 mt-1'>No chat history yet. Search users to start.</p>
            )}
          </div>

        </>
      )}
      </div>
    </>
  );
};

export default Sidebar;