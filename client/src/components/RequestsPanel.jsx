import { useContext, useEffect } from 'react';
import assets from '../assets/assets';
import { ChatContext } from '../../context/ChatContext.jsx';

const RequestsPanel = () => {
  const {
    incomingRequests,
    getRequests,
    acceptRequest,
    rejectRequest,
    requestActionLoading,
  } = useContext(ChatContext);

  useEffect(() => {
    getRequests();
  }, [getRequests]);

  const handleAccept = async (requestId) => {
    const accepted = await acceptRequest(requestId);
    if (accepted) {
      await getRequests();
    }
  };

  const handleReject = async (requestId) => {
    const rejected = await rejectRequest(requestId);
    if (rejected) {
      await getRequests();
    }
  };

  return (
    <div className='w-full max-w-3xl rounded-2xl border border-violet-400/30 bg-[#0f0b1f]/90 p-6 text-violet-50 shadow-[0_24px_60px_rgba(0,0,0,0.45)]'>
      <div className='mb-5 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Pending Invitations</h1>
          <p className='mt-1 text-sm text-violet-200/80'>
            Accept or reject new chat requests.
          </p>
        </div>
        <span className='rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white'>
          {incomingRequests.length}
        </span>
      </div>

      <div className='space-y-3'>
        {incomingRequests.length ? (
          incomingRequests.map((requestItem) => {
            const requestUser = requestItem.senderId || {};

            return (
              <div
                key={requestItem._id}
                className='rounded-xl border border-violet-400/20 bg-[#1a1333]/80 p-4 transition-all duration-200 hover:border-violet-300/60 hover:bg-[#211944]'
              >
                <div className='flex items-center gap-3'>
                  <img
                    src={requestUser.profilePic || assets.avatar_icon}
                    alt={requestUser.fullName || 'Request user avatar'}
                    className='h-12 w-12 rounded-full object-cover ring-2 ring-violet-300/30'
                  />

                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-base font-medium text-violet-50'>
                      {requestUser.fullName || 'Unknown user'}
                    </p>
                    <p className='truncate text-sm text-violet-200/75'>
                      @{requestUser.username || 'user'}
                    </p>
                  </div>

                  <div className='flex items-center gap-2'>
                    <button
                      type='button'
                      onClick={() => handleAccept(requestItem._id)}
                      disabled={requestActionLoading}
                      className='rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60'
                    >
                      Accept
                    </button>
                    <button
                      type='button'
                      onClick={() => handleReject(requestItem._id)}
                      disabled={requestActionLoading}
                      className='rounded-md border border-rose-300/40 bg-rose-500/15 px-3 py-1.5 text-sm font-medium text-rose-100 transition-all duration-200 hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-60'
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className='rounded-xl border border-violet-400/20 bg-[#1a1333]/70 p-6 text-center text-sm text-violet-200/80'>
            No incoming requests right now.
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestsPanel;
