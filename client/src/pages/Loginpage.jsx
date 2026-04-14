import { useContext, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import assets from '../assets/assets';
import { AuthContext } from '../../context/AuthContext.jsx';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseGoogleCredential = (credential) => {
  try {
    const payload = credential.split('.')[1];
    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
    const parsedPayload = JSON.parse(atob(paddedPayload));

    return {
      email: parsedPayload.email || '',
      fullName: parsedPayload.name || '',
      profilePic: parsedPayload.picture || '',
    };
  } catch {
    return null;
  }
};

const Loginpage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleProfile, setGoogleProfile] = useState(null);

  const { login, loginWithGoogle } = useContext(AuthContext);
  const isGoogleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const validateForm = () => {
    const nextErrors = {};

    if (!emailPattern.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!password.trim()) {
      nextErrors.password = 'Password is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    await login({
      email: email.trim().toLowerCase(),
      password,
    });
    setIsSubmitting(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setErrors((prev) => ({ ...prev, google: 'Google login failed. Please try again.' }));
      return;
    }

    const profileData = parseGoogleCredential(credentialResponse.credential);
    setGoogleProfile(profileData);
    setErrors((prev) => ({ ...prev, google: '' }));

    setIsSubmitting(true);
    await loginWithGoogle(credentialResponse.credential, profileData || {});
    setIsSubmitting(false);
  };

  const handleGoogleError = () => {
    setErrors((prev) => ({ ...prev, google: 'Google login failed. Please try again.' }));
  };

  return (
    <div className='min-h-screen px-4 py-10 flex items-center justify-center'>
      <form
        onSubmit={onSubmitHandler}
        className='w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-sm'
      >
        <div className='mb-6 text-center'>
          <img src={assets.logo_icon} alt='QuickChat logo' className='mx-auto mb-3 h-12 w-12 rounded-xl' />
          <h1 className='text-2xl font-semibold text-slate-800'>Login</h1>
          <p className='mt-1 text-sm text-slate-500'>Welcome back. Sign in to continue.</p>
        </div>

        <div className='space-y-4'>
          <div>
            <label htmlFor='email' className='mb-1 block text-sm font-medium text-slate-700'>
              Email
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder='you@example.com'
              className='w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200'
            />
            {errors.email && <p className='mt-1 text-xs text-red-500'>{errors.email}</p>}
          </div>

          <div>
            <label htmlFor='password' className='mb-1 block text-sm font-medium text-slate-700'>
              Password
            </label>
            <input
              id='password'
              type='password'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder='Enter your password'
              className='w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200'
            />
            {errors.password && <p className='mt-1 text-xs text-red-500'>{errors.password}</p>}
          </div>

          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full rounded-xl bg-slate-800 py-3 font-medium text-white shadow-md transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70'
          >
            {isSubmitting ? 'Please wait...' : 'Login'}
          </button>
        </div>

        <div className='my-6 flex items-center gap-3'>
          <span className='h-px flex-1 bg-slate-200' />
          <span className='text-xs font-medium tracking-[0.2em] text-slate-400'>OR</span>
          <span className='h-px flex-1 bg-slate-200' />
        </div>

        {isGoogleConfigured ? (
          <div className='flex justify-center'>
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
          </div>
        ) : (
          <p className='rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-700'>
            Set VITE_GOOGLE_CLIENT_ID in your client .env file to enable Google login.
          </p>
        )}

        {errors.google && <p className='mt-3 text-center text-xs text-red-500'>{errors.google}</p>}

        {googleProfile?.email && (
          <p className='mt-4 text-center text-xs text-slate-500'>
            Google account detected: {googleProfile.fullName || googleProfile.email} ({googleProfile.email})
          </p>
        )}
      </form>
    </div>
  );
};

export default Loginpage;