import { useNavigate } from 'react-router-dom';
import RequestsPanel from '../components/RequestsPanel';

const Requestspage = () => {
  const navigate = useNavigate();

  return (
    <div className='h-screen w-full px-4 py-6 sm:px-[10%] sm:py-[5%]'>
      <div className='mx-auto mb-4 flex w-full max-w-3xl items-center justify-between'>
        <button
          type='button'
          onClick={() => navigate('/')}
          className='rounded-lg border border-violet-400/30 bg-violet-500/15 px-3 py-2 text-sm text-violet-100 transition-all duration-200 hover:bg-violet-500/30'
        >
          Back to Chats
        </button>
      </div>

      <div className='mx-auto flex w-full max-w-3xl justify-center'>
        <RequestsPanel />
      </div>
    </div>
  );
};

export default Requestspage;
