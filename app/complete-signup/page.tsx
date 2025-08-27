'use client';
import { useState, useEffect, useContext, useRef, Suspense } from 'react';
import UserContext from '../context/UserContext';
import { useRouter, useSearchParams } from 'next/navigation'; // Updated import

// Augment the Window interface to include grecaptcha
declare global {
  interface Window {
    grecaptcha: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
        }
      ) => void;
    };
  }
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading signup form...</p>
      </div>
    </div>
  );
}

function CompleteSignupContent() {
  const userContext = useContext(UserContext);
  const router = useRouter();
  const searchParams = useSearchParams(); // Now recognized
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    password: '',
    confirm: '',
    user_id: searchParams.get('user_id') || '',
    'g-recaptcha-response': '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const recaptchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkSignupStatus = async () => {
      try {
        const res = await fetch('/api/get-user', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await res.json();
        
        if (data.user && !data.user.is_verified) {
          setUserEmail(data.user.email);
          setFormData(prev => ({ ...prev, user_id: data.user.id || '' }));
          setLoading(false);
        } else if (data.user?.is_verified) {
          await userContext?.fetchUser();
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking signup status:', error);
        setErrors(['Unable to load signup form. Please try again.']);
        setLoading(false);
      }
    };

    checkSignupStatus();

    // Dynamically load reCAPTCHA script
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=6LdecGYrAAAAAKnkc61iivG44inWC0hjqkVXMubj';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (recaptchaRef.current) {
        window.grecaptcha.render(recaptchaRef.current, {
          sitekey: '6LdecGYrAAAAAKnkc61iivG44inWC0hjqkVXMubj',
          callback: (token: string) => handleRecaptcha(token),
        });
      }
    };
    document.body.appendChild(script);

    // Cleanup
    return () => {
      document.body.removeChild(script);
    };
  }, [router, userContext]);

  const updatePasswordStrength = (password: string) => {
    let strength = 0;
    let message = '';

    // Reset animation
    const strengthBar = document.getElementById('strength-bar') as HTMLDivElement;
    const strengthText = document.getElementById('strength-text') as HTMLParagraphElement;
    strengthBar.style.width = '0%';
    strengthBar.style.backgroundColor = 'red';

    const animateStep = (targetStrength: number, targetMessage: string, delay: number) =>
      new Promise<void>(resolve => {
        setTimeout(() => {
          strength = targetStrength;
          message = targetMessage;
          strengthBar.style.width = `${strength * 20}%`;
          strengthBar.style.backgroundColor = strength <= 2 ? 'red' : strength < 5 ? 'orange' : 'green';
          strengthText.textContent = message;
          resolve();
        }, delay);
      });

    (async () => {
      if (password.length >= 6) {
        await animateStep(1, 'Meets minimum length (6 characters)', 200);
        if (/[a-z]/.test(password)) {
          await animateStep(2, 'Includes lowercase letter', 200);
          if (/[A-Z]/.test(password)) {
            await animateStep(3, 'Includes uppercase letter', 200);
            if (/\d/.test(password)) {
              await animateStep(4, 'Includes number', 200);
              if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
                await animateStep(5, 'Meets all criteria', 200);
              } else {
                strengthText.textContent = 'Missing special character';
              }
            } else {
              strengthText.textContent = 'Missing number';
            }
          } else {
            strengthText.textContent = 'Missing uppercase letter';
          }
        } else {
          strengthText.textContent = 'Missing lowercase letter';
        }
      } else {
        strengthText.textContent = 'Too short (less than 6 characters)';
      }
      setPasswordStrength(strength);
    })();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'password') updatePasswordStrength(value);
  };

  const handleRecaptcha = (token: string) => {
    setFormData(prev => ({ ...prev, 'g-recaptcha-response': token }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors([]);

    const newErrors: string[] = [];
    if (!formData['g-recaptcha-response']) newErrors.push('Please complete the reCAPTCHA verification.');
    if (!formData.password || !formData.confirm) newErrors.push('Both password and confirmation are required.');
    if (formData.password !== formData.confirm) newErrors.push('Passwords do not match.');
    if (passwordStrength < 5) newErrors.push('Password must meet all strength criteria.');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setProcessing(false);
      return;
    }

    try {
      const response = await fetch('/api/google-complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          password: formData.password,
          confirm: formData.confirm,
          user_id: formData.user_id,
          'g-recaptcha-response': formData['g-recaptcha-response'],
        }),
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        router.push('/verify-email');
      } else if (data.errors) {
        setErrors(data.errors);
      } else {
        setErrors(['An unexpected error occurred. Please try again.']);
      }
    } catch (error) {
      console.error('Error completing signup:', error);
      setErrors(['Network error. Please check your connection and try again.']);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading signup form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shadow-md mr-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <span className="text-xl font-semibold text-blue-600">Project Pulse</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Complete Signup</h1>
          <p className="mt-2 text-gray-600">Finish setting up your account</p>
          <p className="mt-1 text-sm text-gray-600">
            Email: <strong>{userEmail}</strong>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {errors.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-800">
                  {errors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Set Password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                />
              </div>
              <div id="strength">
                <div id="strength-bar" className="h-2 rounded-lg bg-red-500"></div>
                <p id="strength-text" className="text-xs text-gray-600 mt-1"></p>
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  id="confirm"
                  name="confirm"
                  value={formData.confirm}
                  onChange={handleInputChange}
                  placeholder="Confirm Password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div ref={recaptchaRef} className="g-recaptcha" data-sitekey="6LdecGYrAAAAAKnkc61iivG44inWC0hjqkVXMubj"></div>

            <button
              type="submit"
              disabled={processing}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Verify and Send OTP'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CompleteSignup() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CompleteSignupContent />
    </Suspense>
  );
}