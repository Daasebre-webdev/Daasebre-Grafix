// app/login/page.tsx
'use client';
import { useEffect, useContext } from 'react';
import UserContext from '../context/UserContext';
import { useRouter } from 'next/navigation';

export default function Login() {
  const userContext = useContext(UserContext);
  const router = useRouter();

  useEffect(() => {
    const handleAuthFlow = async () => {
      // Check if context is available
      if (!userContext || !userContext.fetchUser) {
        console.error('User context is not available');
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const complete = urlParams.get('complete');

      if (code) {
        // Handle Google callback
        const res = await fetch('/api/get-user', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await res.json();
        if (data.error) {
          // Fallback to google_callback.php if get-user fails
          window.location.href = `https://pulse.great-site.net/Google_signup/google_callback.php?${urlParams.toString()}`;
        } else if (data.user?.is_verified) {
          await userContext.fetchUser();
          router.push('/dashboard');
        } else if (data.user) {
          // Redirect to complete signup
          window.location.href = '/api/google-complete-signup';
        }
      } else if (complete) {
        // Handle return from google_complete_signup.php
        const res = await fetch('/api/get-user', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await res.json();
        if (data.error) {
          window.location.href = '/api/google-complete-signup'; // Retry if needed
        } else if (data.user?.is_verified) {
          await userContext.fetchUser();
          router.push('/dashboard');
        } else if (data.user) {
          window.location.href = '/api/verify-email';
        }
      } else {
        // Initial login, redirect to PHP login page
        window.location.href = 'https://pulse.great-site.net/Google_signup/index.php';
      }
    };

    handleAuthFlow().catch((err) => console.error('Auth flow error:', err));
  }, [userContext, router]); // Changed dependency to userContext

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Redirecting to Login...</h1>
        <p className="mt-2 text-gray-600">Please wait while we redirect you to the login page.</p>

        {/* Branded spinner */}
        <div className="mt-8 flex justify-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
}