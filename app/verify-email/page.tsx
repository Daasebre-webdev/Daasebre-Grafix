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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Helper function to safely get error message
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  // Clear error when code changes
  useEffect(() => {
    const enteredCode = code.join('')
    if (enteredCode.length === 6 && error === 'Please enter all 6 digits of the verification code.') {
      setError(null)
    }
  }, [code, error])

  // 🔹 Fetch verification session from backend
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

        // Check if we have a stored expiration time
        const storedExpiry = localStorage.getItem('verification_expiry')
        if (storedExpiry) {
          const expiryTime = parseInt(storedExpiry)
          const remaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000))
          setTimeLeft(remaining)
          setCanResend(remaining <= 0)
        }

        // Try to fetch verification data from backend
        try {
          const apiUrl = `https://pulse.great-site.net/Google_signup/verify_email.php?email=${encodeURIComponent(urlEmail)}`
          console.log('Fetching verification data from:', apiUrl)
          
          const response = await fetch(apiUrl, { 
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
            }
          })
          
          console.log('Response status:', response.status, response.statusText)
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const contentType = response.headers.get('content-type')
          console.log('Response content-type:', contentType)
          
          if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text()
            console.log('Non-JSON response received:', textResponse.substring(0, 200))
            throw new Error('Server returned invalid response format')
          }
          
          const data = await response.json()
          console.log('Response data:', data)
          
          if (data.success) {
            if (data.expires_at) {
              const expiresAt = typeof data.expires_at === 'number' 
                ? data.expires_at 
                : Math.floor(new Date(data.expires_at).getTime() / 1000);
              
              const remaining = Math.max(0, expiresAt - Math.floor(Date.now() / 1000))
              setTimeLeft(remaining)
              localStorage.setItem('verification_expiry', (Math.floor(Date.now() / 1000) + remaining).toString())
            }
            
            // Check if already verified
            if (data.redirect && data.message?.includes('verified')) {
              // User is already verified, redirect to dashboard
              router.push(data.redirect)
              return
            }
          } else {
            setError(data.message || 'Verification session expired. Please sign up again.')
            if (data.redirect) {
              setTimeout(() => router.push(data.redirect), 3000)
            }
          }
        } catch (fetchError) {
          console.error('API fetch error:', fetchError)
          setError('Connection issue. Please check your internet connection and try again.')
        }
      } catch (err) {
        console.error('Error initializing verification:', err)
        setError('Could not load verification data. Please try again later.')
      } finally {
        setIsInitializing(false)
      }
    }

    initializeVerification()
  }, [router, searchParams])

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

  // Handle OTP input
  const handleChange = (index: number, value: string) => {
    if (/^[0-9]?$/.test(value)) {
      const newCode = [...code]
      newCode[index] = value
      setCode(newCode)
      
      // Clear error when user starts typing
      if (error && error.includes('Please enter all 6 digits')) {
        setError(null)
      }
      
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
      
      // Auto-submit when all digits are entered
      if (value && index === 5 && newCode.every(digit => digit !== '')) {
        handleVerify()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Submit verification code
  const handleVerify = async () => {
    const enteredCode = code.join('')
    if (enteredCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code.')
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      // Use URLSearchParams instead of FormData for better compatibility
      const formData = new URLSearchParams()
      formData.append('email', email)
      formData.append('code', enteredCode)
      formData.append('agreed_to_terms', 'true')

      const apiUrl = 'https://pulse.great-site.net/Google_signup/verify_email.php'
      console.log('Verifying code at:', apiUrl)
      console.log('Request data:', { email, code: enteredCode })

      const response = await fetch(apiUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      })

      console.log('Verification response status:', response.status, response.statusText)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      console.log('Response content-type:', contentType)
      
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text()
        console.error('Non-JSON response:', textResponse)
        throw new Error('Server returned invalid response format')
      }

      const data = await response.json()
      console.log('Verification response data:', data)
      
      if (data.success) {
        // Store tokens if provided
        if (data.user?.token) {
          localStorage.setItem('session_token', data.user.token)
        }
        if (data.jwt) {
          localStorage.setItem('jwt_token', data.jwt)
        }
        
        // Store user data for dashboard
        if (data.user) {
          login(data.user) // Use the login function from UserContext
          localStorage.setItem('user_data', JSON.stringify(data.user))
        }
        
        // Clear verification data
        localStorage.removeItem('email_to_verify')
        localStorage.removeItem('verification_expiry')
        
        Swal.fire({
          icon: 'success',
          title: 'Verification Successful!',
          text: 'Your email has been verified successfully.',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          router.push(data.redirect || '/dashboard')
        })
      } else {
        setError(data.message || 'Invalid or expired verification code.')
      }
    } catch (err) {
      console.error('Verification error:', err)
      const errorMessage = getErrorMessage(err)
      setError(`Verification failed. Please check your connection and try again. Error: ${errorMessage}`)
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
      // Use URLSearchParams instead of FormData
      const formData = new URLSearchParams()
      formData.append('email', email)
      formData.append('resend', 'true')

      const apiUrl = 'https://pulse.great-site.net/Google_signup/verify_email.php'
      console.log('Resending code to:', apiUrl)

      const response = await fetch(apiUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      })

      console.log('Resend response status:', response.status, response.statusText)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      console.log('Response content-type:', contentType)
      
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text()
        console.error('Non-JSON response:', textResponse)
        throw new Error('Server returned invalid response format')
      }

      const data = await response.json()
      console.log('Resend response data:', data)
      
      if (data.success) {
        setTimeLeft(120)
        setCanResend(false)
        setCode(Array(6).fill(''))
        
        // Focus on first input field
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
    } catch (err) {
      console.error('Resend error:', err)
      const errorMessage = getErrorMessage(err)
      setError(`Failed to resend code: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Test connection to backend
  const testConnection = async () => {
    try {
      const response = await fetch('https://pulse.great-site.net/Google_signup/verify_email.php', {
        method: 'HEAD',
        credentials: 'include',
      })
      console.log('Connection test result:', response.status, response.statusText)
      return response.ok
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
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
            <button
              onClick={() => testConnection().then(success => {
                if (success) {
                  setError('Connection test successful. Please try again.')
                } else {
                  setError('Connection test failed. Please check your internet connection.')
                }
              })}
              className="text-blue-600 text-xs mt-2 underline"
            >
              Test Connection
            </button>
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
                inputRefs.current[index] = el
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

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              console.log('Current state:', {
                email,
                code: code.join(''),
                timeLeft,
                canResend,
                isLoading,
                isVerifying
              })
              testConnection()
            }}
            className="text-xs text-gray-500 underline"
          >
            Debug Info
          </button>
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