'use client';
import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import UserContext from '../context/UserContext';

export default function VerifyEmail() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const userContext = useContext(UserContext);
  const [code, setCode] = useState('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  useEffect(() => {
    fetch('https://pulse.great-site.net/Google_signup/verify_email.php', {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log('Initial response:', data); // Debug log
        if (data.success && data.redirect) {
          router.push(data.redirect);
        } else if (data.expires_at) {
          setExpiresAt(data.expires_at);
        } else if (data.message) {
          setError(data.message);
        }
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setError('Failed to initialize verification: ' + (err instanceof Error ? err.message : String(err)));
      });
  }, [router]);

  const handleVerification = async () => {
    try {
      const response = await fetch('https://pulse.great-site.net/Google_signup/verify_email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code }),
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        if (data.redirect) {
          router.push(data.redirect);
        } else {
          const userResponse = await fetch('/api/get-user', {
            method: 'GET',
            credentials: 'include',
          });
          const userData = await userResponse.json();
          if (userData.user) {
            await userContext?.fetchUser();
            router.push('/dashboard');
          } else {
            setError('Failed to load user details.');
          }
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('An error occurred during verification: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleResend = async () => {
    try {
      const response = await fetch('https://pulse.great-site.net/Google_signup/verify_email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ resend: 'true' }),
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setExpiresAt(data.expires_at);
        setError('New code sent to your email.');
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('Failed to resend code: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-4 bg-red-100 border border-red-400 rounded">
          <p className="text-red-700">{error}</p>
          <form onSubmit={(e) => { e.preventDefault(); handleVerification(); }} className="mt-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="p-2 border rounded"
              maxLength={6}
              pattern="\d{6}"
            />
            <button type="submit" className="ml-2 p-2 bg-blue-500 text-white rounded">
              Verify
            </button>
          </form>
          <button onClick={handleResend} className="mt-2 text-indigo-600 hover:underline">
            Resend Code {expiresAt ? `(${Math.floor((expiresAt - Date.now() / 1000) / 60)}m ${Math.floor((expiresAt - Date.now() / 1000) % 60)}s)` : ''}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-700">Verifying your email...</p>
      </div>
    </div>
  );
}