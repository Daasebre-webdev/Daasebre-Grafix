// app/login/page.tsx
'use client';
import { useEffect } from 'react';

export default function Login() {
  useEffect(() => {
    // Redirect to PHP login page
    window.location.href = 'https://pulse.great-site.net/Google_signup/index.php';
  }, []);

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
