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
  const [isInitializing, setIsInitializing] = useState<boolean>(true)
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null))

  // JWT from localStorage
  const jwtToken = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null

  // Clear error when code changes
  useEffect(() => {
    const enteredCode = code.join('')
    if (enteredCode.length === 6 && error === 'Please enter all 6 digits of the verification code.') {
      setError(null)
    }
  }, [code, error])

  // Initialize verification session
  useEffect(() => {
    const initializeVerification = async () => {
      try {
        setIsInitializing(true)
        const urlEmail = searchParams.get('email') || localStorage.getItem('email_to_verify')

        if (!urlEmail) {
          setError('No email found for verification. Please sign up again.')
          setIsInitializing(false)
          return
        }

        setEmail(urlEmail)
        localStorage.setItem('email_to_verify', urlEmail)

        // Fetch verification info from backend
        const apiUrl = `https://pulse.great-site.net/Google_signup/verify_email.php?email=${encodeURIComponent(urlEmail)}&action=check_status`

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {})
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            if (data.expires_at) {
              const expiresAt = typeof data.expires_at === 'number'
                ? data.expires_at
                : Math.floor(new Date(data.expires_at).getTime() / 1000)

              const remaining = Math.max(0, expiresAt - Math.floor(Date.now() / 1000))
              setTimeLeft(remaining)
              localStorage.setItem('verification_expiry', (Math.floor(Date.now() / 1000) + remaining).toString())
            }

            // Already verified
            if (data.redirect && data.message?.includes('verified')) {
              router.push(data.redirect)
              return
            }
          } else {
            setError(data.message || 'Verification session expired. Please sign up again.')
          }
        } else {
          console.warn('Status check failed, but allowing manual verification')
          setError('Connection issue. You can still enter your verification code manually.')
        }
      } catch (err) {
        console.error('Error initializing verification:', err)
        setError('Could not load verification data. Please try again later.')
      } finally {
        setIsInitializing(false)
      }
    }

    initializeVerification()
  }, [router, searchParams, jwtToken])

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
      if (error && error.includes('Please enter all 6 digits')) setError(null)
      if (value && index < 5) inputRefs.current[index + 1]?.focus()
      if (value && index === 5 && newCode.every(digit => digit !== '')) handleVerify()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) inputRefs.current[index - 1]?.focus()
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
      const apiUrl = `https://pulse.great-site.net/Google_signup/verify_email.php`

      const formData = new FormData()
      formData.append('email', email)
      formData.append('code', enteredCode)
      formData.append('agreed_to_terms', 'true')
      formData.append('action', 'verify')

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {})
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Store both JWT and session token
          if (data.jwt) {
            localStorage.setItem('jwt_token', data.jwt)
          }
          if (data.session_token) {
            localStorage.setItem('session_token', data.session_token)
          }
          
          // Fetch complete user data using the new JWT token
          if (data.jwt && data.user) {
            try {
              const userResponse = await fetch(`https://pulse.great-site.net/Google_signup/get_user.php`, {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${data.jwt}`
                }
              })

              if (userResponse.ok) {
                const userData = await userResponse.json()
                if (userData.success && userData.user) {
                  login(userData.user)
                  localStorage.setItem('user_data', JSON.stringify(userData.user))
                }
              }
            } catch (err) {
              console.warn('Failed to fetch user data, using verification response data:', err)
              // Fallback to verification response data
              if (data.user) {
                login(data.user)
                localStorage.setItem('user_data', JSON.stringify(data.user))
              }
            }
          }

          localStorage.removeItem('email_to_verify')
          localStorage.removeItem('verification_expiry')

          Swal.fire({
            icon: 'success',
            title: 'Verification Successful!',
            text: 'Your email has been verified successfully.',
            timer: 2000,
            showConfirmButton: false,
          }).then(() => router.push(data.redirect || '/dashboard'))
        } else {
          setError(data.message || 'Invalid or expired verification code.')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Server returned status: ${response.status}`)
      }
    } catch (err) {
      console.error('Verification error:', err)
      setError(err instanceof Error ? err.message : 'Verification failed. Please check your code and try again.')
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
      const apiUrl = `https://pulse.great-site.net/Google_signup/verify_email.php`

      const formData = new FormData()
      formData.append('email', email)
      formData.append('resend', 'true')

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {})
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTimeLeft(120)
          setCanResend(false)
          setCode(Array(6).fill(''))
          inputRefs.current[0]?.focus()
          Swal.fire({
            icon: 'success',
            title: 'Code Resent!',
            text: 'A new verification code has been sent to your email.',
            timer: 3000,
            showConfirmButton: false,
          })
        } else {
          setError(data.message || 'Failed to resend verification code.')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Server returned status: ${response.status}`)
      }
    } catch (err) {
      console.error('Resend error:', err)
      setError(err instanceof Error ? err.message : 'Failed to resend code. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-100 to-blue-200">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification data...</p>
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
          <strong>{email || 'your email'}</strong>
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
              {isVerifying ? 'Verifying...' : 'Loading...'}
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
              onChange={(e) => handleChange(index, e.target.value)}
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
            <strong>Note:</strong> If verification fails, please check your email for the code and try again.
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