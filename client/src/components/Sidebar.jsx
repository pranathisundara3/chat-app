import { useEffect, useMemo, useState, useContext } from "react";
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
    outgoingRequests,
    sendChatRequest,
    acceptRequest,
    rejectRequest,
    requestActionLoading,
  } = useContext(ChatContext);

  const { logout, onlineUsers } = useContext(AuthContext);

  const [input, setInput] = useState("");

  const navigate = useNavigate();

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
    <div className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll text-white ${selectedUser ? 'max-md:hidden' : ''}`}>
      <div className='pb-5'>
        <div className='flex justify-between items-center'>
          <img src={assets.logo} alt="logo" className='max-w-40' />
        
        <div className="relative py-2 group">
          <img src={assets.menu_icon} alt="Menu" className='max-h-5 cursor-pointer' />
<div className='absolute top-full right-0 z-20 w-32 p-5 rounded-md bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block'>
 

  <p  onClick={() => navigate('/profile')} className='cursor-pointer text-sm'>Edit Profile</p>
  <hr className="my-2 border-t border-gray-500" />
  <p onClick={() => logout()} className='cursor-pointer text-sm'>Logout</p>

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

          <div className='space-y-3'>
            <div>
              <p className='text-xs text-violet-200 uppercase tracking-wider mb-2'>Incoming Requests</p>
              {incomingRequests.length ? incomingRequests.map((requestItem) => (
                <div key={requestItem._id} className='flex items-center justify-between gap-2 p-2 rounded bg-[#221a3a] mb-2'>
                  <div className='flex items-center gap-2'>
                    <img
                      src={requestItem.senderId?.profilePic || assets.avatar_icon}
                      alt=''
                      className='w-8 h-8 rounded-full'
                    />
                    <div>
                      <p className='text-sm'>{requestItem.senderId?.fullName || 'Unknown'}</p>
                      <p className='text-[11px] text-violet-200/70'>@{requestItem.senderId?.username || 'user'}</p>
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <button
                      onClick={async () => {
                        await acceptRequest(requestItem._id);
                        await getUsers();
                      }}
                      disabled={requestActionLoading}
                      className='text-xs px-2 py-1 rounded bg-emerald-500/80 text-white disabled:opacity-60'
                    >
                      Accept
                    </button>
                    <button
                      onClick={async () => {
                        await rejectRequest(requestItem._id);
                        await getUsers();
                      }}
                      disabled={requestActionLoading}
                      className='text-xs px-2 py-1 rounded bg-rose-500/80 text-white disabled:opacity-60'
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )) : <p className='text-xs text-gray-300'>No incoming requests.</p>}
            </div>

            <div>
              <p className='text-xs text-violet-200 uppercase tracking-wider mb-2'>Outgoing Requests</p>
              {outgoingRequests.length ? outgoingRequests.map((requestItem) => (
                <div key={requestItem._id} className='flex items-center justify-between gap-2 p-2 rounded bg-[#221a3a] mb-2'>
                  <div className='flex items-center gap-2'>
                    <img
                      src={requestItem.receiverId?.profilePic || assets.avatar_icon}
                      alt=''
                      className='w-8 h-8 rounded-full'
                    />
                    <div>
                      <p className='text-sm'>{requestItem.receiverId?.fullName || 'Unknown'}</p>
                      <p className='text-[11px] text-violet-200/70'>@{requestItem.receiverId?.username || 'user'}</p>
                    </div>
                  </div>
                  <span className='text-xs px-2 py-1 rounded bg-amber-500/30 text-amber-300'>Pending</span>
                </div>
              )) : <p className='text-xs text-gray-300'>No outgoing requests.</p>}
            </div>
          </div>
        </>
      )}

      <div className='h-2' />
      {onlineUsers.length > 0 && (
        <p className='text-[11px] text-violet-200/70'>Online users: {onlineUsers.length}</p>
      )}
    </div>
  );
};

export default Sidebar;