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

  const themeVars = {
    '--login-bg': '#07050f',
    '--login-bg-soft': '#1a1234',
    '--login-bg-soft-2': '#2b1164',
    '--login-card': 'rgba(15, 12, 26, 0.92)',
    '--login-border': 'rgba(139, 92, 246, 0.34)',
    '--login-text': '#f4efff',
    '--login-muted': '#b9abd9',
    '--login-input': 'rgba(24, 18, 44, 0.85)',
    '--login-input-border': 'rgba(139, 92, 246, 0.45)',
    '--login-focus': 'rgba(168, 85, 247, 0.35)',
  };

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
    <div
      style={themeVars}
      className='relative min-h-screen overflow-hidden bg-[var(--login-bg)] px-4 py-10 flex items-center justify-center'
    >
      <div className='pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[var(--login-bg-soft)] blur-3xl' />
      <div className='pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[var(--login-bg-soft-2)] blur-3xl' />

      <form
        onSubmit={onSubmitHandler}
        className='relative z-10 w-full max-w-md rounded-3xl border border-[color:var(--login-border)] bg-[var(--login-card)] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl'
      >
        <div className='mb-6 text-center'>
          <img
            src={assets.logo_icon}
            alt='QuickChat logo'
            className='mx-auto mb-3 h-12 w-12 rounded-xl ring-2 ring-violet-500/40 shadow-[0_0_28px_rgba(139,92,246,0.4)]'
          />
          <h1 className='text-3xl font-semibold text-[var(--login-text)]'>Login</h1>
          <p className='mt-1 text-sm text-[var(--login-muted)]'>Welcome back. Sign in to continue.</p>
        </div>

        <div className='space-y-4'>
          <div>
            <label htmlFor='email' className='mb-1 block text-sm font-medium text-[var(--login-muted)]'>
              Email
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder='you@example.com'
              className='w-full rounded-xl border border-[color:var(--login-input-border)] bg-[var(--login-input)] px-4 py-3 text-[var(--login-text)] placeholder:text-violet-200/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-[color:var(--login-focus)]'
            />
            {errors.email && <p className='mt-1 text-xs text-red-500'>{errors.email}</p>}
          </div>

          <div>
            <label htmlFor='password' className='mb-1 block text-sm font-medium text-[var(--login-muted)]'>
              Password
            </label>
            <input
              id='password'
              type='password'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder='Enter your password'
              className='w-full rounded-xl border border-[color:var(--login-input-border)] bg-[var(--login-input)] px-4 py-3 text-[var(--login-text)] placeholder:text-violet-200/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-[color:var(--login-focus)]'
            />
            {errors.password && <p className='mt-1 text-xs text-red-500'>{errors.password}</p>}
          </div>

          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full rounded-xl bg-gradient-to-r from-violet-700 to-purple-500 py-3 font-medium text-white shadow-[0_12px_30px_rgba(109,40,217,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70'
          >
            {isSubmitting ? 'Please wait...' : 'Login'}
          </button>
        </div>

        <div className='my-6 flex items-center gap-3'>
          <span className='h-px flex-1 bg-violet-400/25' />
          <span className='text-xs font-medium tracking-[0.2em] text-violet-200/70'>OR</span>
          <span className='h-px flex-1 bg-violet-400/25' />
        </div>

        {isGoogleConfigured ? (
          <div className='flex justify-center'>
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} theme='filled_black' />
          </div>
        ) : (
          <p className='rounded-xl border border-violet-400/30 bg-violet-950/40 px-3 py-2 text-center text-xs text-violet-200'>
            Set VITE_GOOGLE_CLIENT_ID in your client .env file to enable Google login.
          </p>
        )}

        {errors.google && <p className='mt-3 text-center text-xs text-red-500'>{errors.google}</p>}

        {googleProfile?.email && (
          <p className='mt-4 text-center text-xs text-violet-200/80'>
            Google account detected: {googleProfile.fullName || googleProfile.email} ({googleProfile.email})
          </p>
        )}
      </form>
    </div>
  );
};

export default Loginpage;