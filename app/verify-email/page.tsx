'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useUser } from '@/app/context/UserContext'
import { useRouter, useSearchParams } from 'next/navigation'
import Swal from 'sweetalert2'

// Force dynamic rendering to avoid suspense error
export const dynamic = 'force-dynamic'

function VerifyEmailContent() {
  const { login } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const [timeLeft, setTimeLeft] = useState<number>(120)
  const [canResend, setCanResend] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isVerifying, setIsVerifying] = useState<boolean>(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null))

  // JWT from localStorage
  const jwtToken = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null

  // Initialize - just get the email
  useEffect(() => {
    const urlEmail = searchParams.get('email') || localStorage.getItem('email_to_verify')

    if (!urlEmail) {
      setError('No email found for verification. Please sign up again.')
      return
    }

    setEmail(urlEmail)
    localStorage.setItem('email_to_verify', urlEmail)
    
    // Set initial timer
    const savedExpiry = localStorage.getItem('verification_expiry')
    if (savedExpiry) {
      const remaining = Math.max(0, parseInt(savedExpiry) - Math.floor(Date.now() / 1000))
      setTimeLeft(remaining)
      setCanResend(remaining <= 0)
    } else {
      setTimeLeft(120) // Default 2 minutes
    }
  }, [searchParams])

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

  // Verify code - FIXED to send JSON
 // --- VERIFY CODE ---
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

    const payload = {
      email: email,
      code: enteredCode, // Make sure backend expects 'code'
      action: 'verify'
    }

    console.log('Sending verification payload:', payload)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
      },
      body: JSON.stringify(payload),
      credentials: 'include',
    })

    console.log('Verification HTTP status:', response.status)

    // Always read response as text first for debugging
    const text = await response.text()
    console.log('Raw verification response:', text)

    // Attempt to parse JSON
    let data: any
    try {
      data = JSON.parse(text)
    } catch (err) {
      console.error('JSON parse error:', err)
      setError('Invalid response from server.')
      return
    }

    if (response.ok && data.success) {
      console.log('Verification succeeded:', data)

      if (data.jwt) localStorage.setItem('jwt_token', data.jwt)
      if (data.session_token) localStorage.setItem('session_token', data.session_token)
      if (data.user) {
        login(data.user)
        localStorage.setItem('user_data', JSON.stringify(data.user))
      }

      localStorage.removeItem('email_to_verify')
      localStorage.removeItem('verification_expiry')

      Swal.fire({
        icon: 'success',
        title: 'Verification Successful!',
        text: 'Your email has been verified.',
        timer: 2000,
        showConfirmButton: false,
      }).then(() => router.push(data.redirect || '/dashboard'))
    } else {
      console.warn('Verification failed:', data)
      setError(data.message || 'Verification failed. Please try again.')
    }
  } catch (err) {
    console.error('Network error during verification:', err)
    setError('Network error. Please check your connection and try again.')
  } finally {
    setIsVerifying(false)
  }
}

// --- RESEND CODE ---
const handleResend = async () => {
  if (!canResend) return

  setIsLoading(true)
  setError(null)

  try {
    const apiUrl = 'https://pulse.great-site.net/Google_signup/verify_email.php'

    const payload = {
      email: email,
      resend: true
    }

    console.log('Sending resend payload:', payload)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
      },
      body: JSON.stringify(payload),
      credentials: 'include',
    })

    console.log('Resend HTTP status:', response.status)
    const text = await response.text()
    console.log('Raw resend response:', text)

    let data: any
    try {
      data = JSON.parse(text)
    } catch (err) {
      console.error('JSON parse error:', err)
      setError('Invalid response from server.')
      return
    }

    if (response.ok && data.success) {
      console.log('Resend succeeded:', data)
      setTimeLeft(120)
      setCanResend(false)
      setCode(Array(6).fill(''))
      inputRefs.current[0]?.focus()

      if (data.expires_at) {
        const expiresAt = typeof data.expires_at === 'number'
          ? data.expires_at
          : Math.floor(new Date(data.expires_at).getTime() / 1000)
        localStorage.setItem('verification_expiry', expiresAt.toString())
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
    setError('Network error. Please check your connection and try again.')
  } finally {
    setIsLoading(false)
  }
}

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-100 to-blue-200">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={() => router.push('/signup')}
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
              >
                Go Back to Signup
              </button>
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
              className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={!canResend || isLoading}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Resend Code'}
            </button>
          )}
        </div>

        <button
          onClick={handleVerify}
          disabled={code.join('').length !== 6 || isVerifying}
          className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isVerifying ? 'Verifying...' : 'Verify Email'}
        </button>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-700 text-sm text-center">
            <strong>Note:</strong> Check your email inbox (and spam folder) for the verification code.
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