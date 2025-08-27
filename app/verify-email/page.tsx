'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyEmail() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleFetchUser = () => {
      router.push('/dashboard'); // Redirect to dashboard on successful verification
    };

    window.addEventListener('fetchUser', handleFetchUser);

    return () => window.removeEventListener('fetchUser', handleFetchUser);
  }, [router]);

  const handleInputChange = (index: number, value: string) => {
    if (/^\d$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (index < 5 && value) {
        document.querySelectorAll<HTMLInputElement>('.digit')[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.querySelectorAll<HTMLInputElement>('.digit')[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData.length === 6) {
      const newOtp = pasteData.split('');
      setOtp(newOtp);
      document.querySelector<HTMLInputElement>('.digit:last-child')?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the full 6-digit code');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include',
        body: new URLSearchParams({ code }),
      });

      const data = await response.json();

      if (data.success) {
        // Rely on fetchUser event from verify_email.php's Swal.fire
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-2 sm:py-6 sm:px-4">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-7 sm:w-8 h-7 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Email Verification</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Verify your account</p>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-8">
          {error && (
            <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-md sm:rounded-lg p-3 sm:p-4">
              <div className="flex items-center">
                <svg className="w-4 sm:w-5 h-4 sm:h-5 text-red-500 mr-1 sm:mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-xs sm:text-sm text-red-800">{error}</span>
              </div>
            </div>
          )}

          <p className="text-center mb-4 sm:mb-6 text-sm sm:text-base text-gray-600">
            Enter the 6-digit code sent to<br />
            <strong>{/* Email would be fetched from session or API */}example@domain.com</strong>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="code-input flex justify-between mb-4 sm:mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="digit w-10 sm:w-12 h-12 sm:h-14 text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  disabled={loading}
                />
              ))}
            </div>

            <div className="terms mb-4 sm:mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  disabled={loading}
                />
                <span className="ml-2 text-sm sm:text-base text-gray-700">
                  I agree to the{' '}
                  <span className="text-indigo-600 hover:text-indigo-500 cursor-pointer">Terms and Conditions</span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 sm:py-3 px-4 rounded-md sm:rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors text-sm sm:text-base disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}