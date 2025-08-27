'use client';
import { useEffect, useContext } from 'react';
import UserContext from '../context/UserContext';
import { useRouter } from 'next/navigation';

export default function Login() {
  const userContext = useContext(UserContext);
  const router = useRouter();

  useEffect(() => {
    const handleAuthFlow = async () => {
      if (!userContext || !userContext.fetchUser) {
        console.error('User context is not available');
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
        }
      } else if (!sessionToken) {
        console.log('Login: No session token, redirecting to index.php');
        window.location.href = 'https://pulse.great-site.net/Google_signup/index.php';
      }
    };

    handleAuthFlow().catch((err) => console.error('Auth flow error:', err));
  }, [userContext, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Redirecting to Login...</h1>
        <p className="mt-2 text-gray-600">Please wait while we redirect you to the login page.</p>
        <div className="mt-8 flex justify-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
}