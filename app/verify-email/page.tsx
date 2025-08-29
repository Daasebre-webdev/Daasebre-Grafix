'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useUser } from '@/app/context/UserContext'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'

// Force dynamic rendering to avoid suspense error
export const dynamic = 'force-dynamic'

// Define a basic User interface
interface User {
  id: string;
  email: string;
  name?: string;
  is_verified?: boolean;
}

// Define interface for API response
interface ApiResponse {
  success: boolean;
  message?: string;
  jwt?: string;
  session_token?: string;
  user?: User;
  redirect?: string;
  expires_at?: number;
  email?: string;
  error_code?: number;
}

// Function to decode JWT token
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

function VerifyEmailContent() {
  const { login } = useUser()
  const router = useRouter()
  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const [timeLeft, setTimeLeft] = useState<number>(120)
  const [canResend, setCanResend] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isVerifying, setIsVerifying] = useState<boolean>(false)
  const [initializationFailed, setInitializationFailed] = useState<boolean>(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null))

  // Get tokens from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const jwt = localStorage.getItem('jwt_token');
      const session = localStorage.getItem('session_token');
      
      if (session) {
        setSessionToken(session);
      }
      
      // Check if we already have email in localStorage
      const savedEmail = localStorage.getItem('email_to_verify');
      if (savedEmail) {
        setEmail(savedEmail);
        console.log('Pre-loaded email from localStorage:', savedEmail);
      } else if (jwt) {
        // Try to extract email from JWT
        const decodedToken = decodeJWT(jwt);
        if (decodedToken && decodedToken.email) {
          setEmail(decodedToken.email);
          localStorage.setItem('email_to_verify', decodedToken.email);
          console.log('Email extracted from JWT:', decodedToken.email);
        }
      }
    }
  }, [])

  // Initialize - get email from session if not already available
  useEffect(() => {
    const initVerify = async () => {
      // If we already have an email, no need to initialize
      if (email) return;
      
      // If we don't have a session token, we can't initialize
      if (!sessionToken) {
        setInitializationFailed(true);
        setError('No active session found. Please sign in again.');
        return;
      }

      try {
        const apiUrl = 'https://pulse.great-site.net/Google_signup/verify_email.php'
        
        console.log('Initializing verification with session token');
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
          },
          credentials: 'include',
        })

        console.log('Initialization response status:', response.status);

        if (response.ok) {
          const data: ApiResponse = await response.json()
          console.log('Initialization response data:', data);
          
          if (data.success) {
            if (data.redirect) {
              // Already verified, redirect to dashboard
              router.push(data.redirect)
              return
            }
            
            if (data.email) {
              setEmail(data.email)
              localStorage.setItem('email_to_verify', data.email)
            }
            
            if (data.expires_at) {
              const remaining = Math.max(0, data.expires_at - Math.floor(Date.now() / 1000))
              setTimeLeft(remaining)
              setCanResend(remaining <= 0)
              localStorage.setItem('verification_expiry', data.expires_at.toString())
            }
          } else {
            setError(data.message || 'Failed to initialize verification')
            setInitializationFailed(true)
          }
        } else {
          console.error('Initialization failed with status:', response.status);
          setInitializationFailed(true)
          setError('Failed to connect to verification service')
        }
      } catch (err) {
        console.error('Initialization error:', err)
        setInitializationFailed(true)
        setError('Network error during initialization')
      }
    }

    if (!email && sessionToken) {
      initVerify()
    }
  }, [sessionToken, email, router])

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setCanResend(true)
            return 0
          }
          return t - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  // OTP input handling
  const handleChange = (index: number, value: string) => {
    if (/^[0-9]?$/.test(value)) {
      const newCode = [...code]
      newCode[index] = value
      setCode(newCode)
      
      // Clear error when typing
      if (error && error.includes('Please enter all 6 digits')) {
        setError(null)
      }
      
      // Move to next input if value is entered
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
      
      // Auto-verify only if ALL digits are filled
      const allDigitsFilled = newCode.every(digit => digit !== '')
      if (allDigitsFilled) {
        handleVerify()
      }
    } else if (value === '') {
      // Allow backspace/delete
      const newCode = [...code]
      newCode[index] = ''
      setCode(newCode)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Verify code
  const handleVerify = async () => {
    const enteredCode = code.join('')
    if (enteredCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code.')
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const apiUrl = 'https://pulse.great-site.net/Google_signup/verify_email.php'

      // Use URLSearchParams instead of FormData for JSON API
      const params = new URLSearchParams()
      params.append('code', enteredCode)

      console.log('Sending verification code:', enteredCode)

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}),
        },
        body: params.toString(),
        credentials: 'include',
      })

      console.log('Verification HTTP status:', response.status)

      // Check if server is responding
      if (response.status >= 500) {
        throw new Error('Server error. Please try again later.')
      }

      const data: ApiResponse = await response.json()
      console.log('Verification response:', data)

      if (response.ok && data.success) {
        console.log('Verification succeeded:', data)

        if (data.jwt) localStorage.setItem('jwt_token', data.jwt)
        if (data.session_token) localStorage.setItem('session_token', data.session_token)
        if (data.user) {
          // Ensure id is always a string and name has a default value
          const userData = {
            ...data.user,
            id: String(data.user.id),
            name: data.user.name || '' // Provide default empty string if name is undefined
          }
          login(userData)
          localStorage.setItem('user_data', JSON.stringify(userData))
        }

        localStorage.removeItem('email_to_verify')
        localStorage.removeItem('verification_expiry')

        Swal.fire({
          icon: 'success',
          title: 'Verification Successful!',
          text: 'Your email has been verified.',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          if (data.redirect) {
            router.push(data.redirect)
          } else {
            router.push('/dashboard')
          }
        })
      } else {
        console.warn('Verification failed:', data)
        
        // Handle specific error codes
        let errorMessage = data.message || 'Verification failed. Please try again.'
        if (data.error_code === 1002) {
          errorMessage = 'Verification code expired. Please request a new one.'
        } else if (data.error_code === 1004) {
          errorMessage = 'Invalid verification code. Please try again.'
        }
        
        setError(errorMessage)
      }
    } catch (err) {
      console.error('Network error during verification:', err)
      setError('Server is currently unavailable. Please try again later.')
    } finally {
      setIsVerifying(false)
    }
  }

  // Resend code
  const handleResend = async () => {
    if (!canResend) return

    setIsLoading(true)
    setError(null)

    try {
      const apiUrl = 'https://pulse.great-site.net/Google_signup/verify_email.php'

      // Use URLSearchParams instead of FormData for JSON API
      const params = new URLSearchParams()
      params.append('resend', 'true')

      console.log('Requesting code resend')

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}),
        },
        body: params.toString(),
        credentials: 'include',
      })

      console.log('Resend HTTP status:', response.status)
      
      // Check if server is responding
      if (response.status >= 500) {
        throw new Error('Server error. Please try again later.')
      }
      
      const data: ApiResponse = await response.json()
      console.log('Resend response:', data)

      if (response.ok && data.success) {
        console.log('Resend succeeded:', data)
        setTimeLeft(120)
        setCanResend(false)
        setCode(Array(6).fill(''))
        inputRefs.current[0]?.focus()

        if (data.expires_at) {
          localStorage.setItem('verification_expiry', data.expires_at.toString())
        }

        Swal.fire({
          icon: 'success',
          title: 'Code Resent!',
          text: 'A new verification code has been sent to your email.',
          timer: 3000,
          showConfirmButton: false,
        })
      } else {
        console.warn('Resend failed:', data)
        setError(data.message || 'Failed to resend verification code.')
      }
    } catch (err) {
      console.error('Network error during resend:', err)
      setError('Server is currently unavailable. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!email && initializationFailed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-100 to-blue-200">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Verification Issue</h2>
          <p className="text-gray-600 mb-6">
            {error || "We're having trouble initializing the verification process."}
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <p className="text-yellow-700 text-sm">
              <strong>Note:</strong> Please check if you&apos;re logged in or try refreshing the page.
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 mr-2"
          >
            Go to Login
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-100 to-blue-200">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification data...</p>
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-100 to-blue-200 p-4 sm:p-6">
      <div className="bg-white p-6 sm:p-10 rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg lg:max-w-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-6 text-gray-800">
          Email Verification
        </h1>
        <p className="text-center mb-4 sm:mb-6 text-sm sm:text-base text-gray-600">
          Enter the 6-digit code sent to<br />
          <strong>{email}</strong>
        </p>

        {initializationFailed && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <p className="text-yellow-700 text-sm text-center">
              <strong>Note:</strong> We&apos;re experiencing server issues. 
              You can still try to verify your code, but resend may not work.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-700 text-sm text-center">{error}</p>
          </div>
        )}

        {(isLoading || isVerifying) && (
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">
              {isVerifying ? 'Verifying...' : 'Sending...'}
            </span>
          </div>
        )}

        <div className="flex justify-between mb-6">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isLoading || isVerifying}
              className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none"
              autoFocus={index === 0}
            />
          ))}
        </div>

        <div className="text-center mb-6">
          {timeLeft > 0 ? (
            <p className="text-sm text-gray-500">
              Resend code in{' '}
              <span className="font-semibold text-indigo-600">
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={!canResend || isLoading || initializationFailed}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? 'Sending...' : 'Resend Code'}
            </button>
          )}
        </div>

        <button
          onClick={handleVerify}
          disabled={code.join('').length !== 6 || isVerifying}
          className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          {isVerifying ? 'Verifying...' : 'Verify Email'}
        </button>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-700 text-sm text-center">
            <strong>Note:</strong> Check your email inbox (and spam folder) for the verification code.
            The code will expire in 2 minutes.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmail() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}