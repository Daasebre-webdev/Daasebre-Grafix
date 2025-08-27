'use client';
import { useEffect, useState, useContext, FormEvent } from 'react';
import UserContext from '../context/UserContext';
import { useRouter } from 'next/navigation';

export default function Login() {
  const userContext = useContext(UserContext);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const handleAuthFlow = async () => {
      if (!userContext || !userContext.fetchUser) {
        console.error('User context is not available');
        setError('User context error. Please try again.');
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const complete = urlParams.get('complete');

      const sessionToken = document.cookie.split('; ').find(row => row.startsWith('__test='))?.split('=')[1];
      console.log('Login: Session token', sessionToken || 'none');

      if (sessionToken) {
        const success = await userContext.fetchUser();
        if (success && userContext.user?.is_verified) {
          router.push('/dashboard');
        } else if (success && userContext.user) {
          router.push('/api/verify-email');
        } else {
          setError('Session invalid or user not verified.');
        }
      }

      if (code) {
        const res = await fetch('/api/get-user', { method: 'GET', credentials: 'include' });
        const data = await res.json();
        console.log('Login: /api/get-user response', data);
        if (data.error) {
          window.location.href = `https://pulse.great-site.net/Google_signup/google_callback.php?${urlParams.toString()}`;
        } else if (data.success && data.user?.is_verified) {
          await userContext.fetchUser();
          router.push('/dashboard');
        } else if (data.success && data.user) {
          router.push('/api/google-complete-signup');
        } else {
          setError('Google authentication failed.');
        }
      } else if (complete) {
        const res = await fetch('/api/get-user', { method: 'GET', credentials: 'include' });
        const data = await res.json();
        console.log('Login: /api/get-user response', data);
        if (data.error) {
          router.push('/api/google-complete-signup');
        } else if (data.success && data.user?.is_verified) {
          await userContext.fetchUser();
          router.push('/dashboard');
        } else if (data.success && data.user) {
          router.push('/api/verify-email');
        } else {
          setError('Signup completion failed.');
        }
      }
    };

    handleAuthFlow().catch((err) => {
      console.error('Auth flow error:', err);
      setError('Network error. Please try again.');
    });
  }, [userContext, router]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!userContext || !userContext.fetchUser) {
      console.error('User context is not available during login');
      setError('User context error. Please try again.');
      return;
    }

    const response = await fetch('https://pulse.great-site.net/Google_signup/index.php', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, 'remember-me': rememberMe }),
    });

    const data = await response.json();
    console.log('Login: POST response', data);

    if (data.success) {
      await userContext.fetchUser(); // Safe to call since userContext is checked
      router.push('/dashboard');
    } else if (data.errors) {
      setError(data.errors[0] || 'Login failed. Please try again.');
    } else {
      setError(data.message || 'Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center w-full max-w-md p-4 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900">Login</h1>
        {error && <p className="mt-2 text-red-600">{error}</p>}
        <form onSubmit={handleLogin} className="mt-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2 mb-2 border rounded"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 mb-2 border rounded"
            required
          />
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mr-2"
            />
            Remember Me
          </label>
          <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Login
          </button>
        </form>
        <a href={userContext?.user ? '/dashboard' : 'https://pulse.great-site.net/Google_signup/index.php?login=google'} className="mt-4 inline-block text-blue-600 hover:underline">
          {userContext?.user ? 'Go to Dashboard' : 'Login with Google'}
        </a>
        <p className="mt-2 text-gray-600">Please wait if redirecting...</p>
        <div className="mt-4 flex justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
}