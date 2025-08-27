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
  const [email, setEmail] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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
        console.log('Initial response:', data);
        if (data.success && data.redirect) {
          router.push(data.redirect);
        } else if (data.expires_at) {
          setExpiresAt(data.expires_at);
          setEmail(data.email || null);
        } else if (data.message) {
          setError(data.message);
        }
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setError('Failed to initialize verification: ' + (err instanceof Error ? err.message : String(err)));
        setEmail(''); // Allow manual entry as fallback
      });
  }, [router]);

  const handleVerification = async () => {
    if (!agreedToTerms) {
      setError('You must agree to the terms and conditions.');
      return;
    }

    try {
      const response = await fetch('https://pulse.great-site.net/Google_signup/verify_email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code, agreed_to_terms: 'true' }),
        credentials: 'include',
      });

      const data = await response.json();
      console.log('Verification response:', data);
      if (data.success) {
        const userResponse = await fetch('/api/get-user', {
          method: 'GET',
          credentials: 'include',
        });
        const userData = await userResponse.json();
        if (userData.user) {
          await userContext?.fetchUser();
          router.push(data.redirect || '/dashboard');
        } else {
          setError('Failed to load user details.');
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

  if (error || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-4 bg-red-100 border border-red-400 rounded max-w-md">
          <p className="text-red-700">{error || 'Please enter your email to proceed.'}</p>
          <form onSubmit={(e) => { e.preventDefault(); handleVerification(); }} className="mt-4 space-y-4">
            <input
              type="text"
              value={email || ''}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full p-2 border rounded"
              disabled={!!email} // Disable if fetched
            />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full p-2 border rounded"
              maxLength={6}
              pattern="\d{6}"
              required
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mr-2"
              />
              <label className="text-sm text-gray-700">
                I agree to the <a href="/terms" className="text-blue-600 underline">Terms and Conditions</a>
              </label>
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded" disabled={!agreedToTerms}>
              Verify
            </button>
          </form>
          <button onClick={handleResend} className="mt-2 text-blue-600 hover:underline">
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