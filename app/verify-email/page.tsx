'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useUser } from '@/app/context/UserContext'
import { useRouter, useSearchParams } from 'next/navigation'
import Swal from 'sweetalert2'

// Force dynamic rendering to avoid suspense error
export const dynamic = 'force-dynamic'

function VerifyEmailContent() {
  const { fetchUser } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const [timeLeft, setTimeLeft] = useState<number>(120) // 2 minutes
  const [canResend, setCanResend] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isVerifying, setIsVerifying] = useState<boolean>(false)
  const [isInitializing, setIsInitializing] = useState<boolean>(true)
  const [usingFallback, setUsingFallback] = useState<boolean>(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Helper function to safely get error message
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

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
          const res = await fetch(
            `https://pulse.great-site.net/Google_signup/verify_email.php?email=${encodeURIComponent(urlEmail)}`,
            { 
              method: 'GET',
              credentials: 'include',
              headers: {
                'Accept': 'application/json',
              }
            }
          )
          
          // Check if response is JSON
          const contentType = res.headers.get('content-type')
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned invalid response format')
          }
          
          const data = await res.json()
          
          if (data.success) {
            if (data.expires_at) {
              // Convert to seconds if it's a timestamp
              const expiresAt = typeof data.expires_at === 'number' 
                ? data.expires_at 
                : Math.floor(new Date(data.expires_at).getTime() / 1000);
              
              const remaining = Math.max(0, expiresAt - Math.floor(Date.now() / 1000))
              setTimeLeft(remaining)
              localStorage.setItem('verification_expiry', (Math.floor(Date.now() / 1000) + remaining).toString())
            }
            
            // Check if already verified
            if (data.redirect && (data.message === 'Already verified' || data.message === 'Email already verified')) {
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
          // If API call fails, we'll use fallback mode
          setUsingFallback(true)
          setError('Connection issue. Using cached data. You can still enter your verification code.')
        }
      } catch (err) {
        console.error('Error initializing verification:', err)
        setError('Could not load verification data. Please try again later.')
        
        // Try to get email from session storage as fallback
        const fallbackEmail = localStorage.getItem('email_to_verify')
        if (fallbackEmail) {
          setEmail(fallbackEmail)
          setUsingFallback(true)
          setError('Verification data loaded from cache. You can still enter your code.')
        }
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
      
      // Auto-submit when all digits are entered
      if (value && index === 5 && newCode.every(digit => digit !== '')) {
        handleVerify()
      } else if (value && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Paste OTP code
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '')
    if (pastedData.length === 6) {
      const newCode = pastedData.split('').slice(0, 6)
      setCode(newCode)
      
      // Auto-focus the last input and submit
      inputRefs.current[5]?.focus()
      setTimeout(() => handleVerify(), 100)
    }
  }

  // Submit verification code (manual + google)
  const handleVerify = async () => {
    const enteredCode = code.join('')
    if (enteredCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code.')
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const response = await fetch(
        'https://pulse.great-site.net/Google_signup/verify_email.php',
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email,
            code: enteredCode,
            agreed_to_terms: true
          }),
        }
      )

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        // Try to parse as text to get more details about the error
        const textResponse = await response.text()
        console.error('Non-JSON response:', textResponse)
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Store session token if provided
        if (data.user?.token) {
          localStorage.setItem('session_token', data.user.token)
        }
        if (data.jwt) {
          localStorage.setItem('jwt_token', data.jwt)
        }
        
        // Store user data for dashboard
        if (data.user) {
          localStorage.setItem('user_data', JSON.stringify(data.user))
        }
        
        // Clear verification data
        localStorage.removeItem('email_to_verify')
        localStorage.removeItem('verification_expiry')
        
        // Try to fetch user data, but if it fails, use the data from response
        try {
          await fetchUser()
        } catch (fetchError) {
          console.warn('Could not fetch user data, using response data:', fetchError)
          // We can still proceed with the data we have from the verification response
        }
        
        Swal.fire({
          icon: 'success',
          title: 'Verification Successful!',
          text: 'Your email has been verified successfully.',
          confirmButtonColor: '#28a745',
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
      const errorMessage = getErrorMessage(err);
      setError(`Verification failed: ${errorMessage}`)
      
      // If we're in fallback mode, suggest alternative actions
      if (usingFallback) {
        setError(`${errorMessage}. Please check your connection and try again, or contact support.`)
      }
    } finally {
      setIsVerifying(false)
    }
  } // <-- This closing brace was missing

  // Resend code
  const handleResend = async () => {
    if (!canResend) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        'https://pulse.great-site.net/Google_signup/verify_email.php',
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ 
            email, 
            resend: true 
          }),
        }
      )

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        // Try to parse as text to get more details about the error
        const textResponse = await response.text()
        console.error('Non-JSON response:', textResponse)
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setTimeLeft(120) // Reset to 2 minutes
        setCanResend(false)
        setCode(Array(6).fill(''))
        
        // Focus on first input field
        inputRefs.current[0]?.focus()
        
        Swal.fire({
          icon: 'success',
          title: 'Code Resent!',
          text: 'A new verification code has been sent to your email.',
          confirmButtonColor: '#28a745',
          timer: 3000,
          showConfirmButton: false,
        })
      } else {
        setError(data.message || 'Failed to resend verification code.')
      }
    } catch (err) {
      console.error('Resend error:', err)
      const errorMessage = getErrorMessage(err);
      setError(`Failed to resend code: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Show Terms with SweetAlert2
  const handleShowTerms = () => {
    Swal.fire({
      title: 'Terms and Conditions',
      html: `
        <div style="text-align: left; max-height: 60vh; overflow-y: auto; font-size: 14px;">
          <h3 style="font-size: 1.1em; margin-bottom: 0.5rem;">Project Pulse Terms of Service</h3>
          <p style="margin-bottom: 1rem;">Last Updated: ${new Date().toLocaleDateString()}</p>
          <h4 style="font-size: 1em; margin-bottom: 0.5rem;">1. Acceptance of Terms</h4>
          <p style="margin-bottom: 1rem;">By using Project Pulse, you agree to these terms and our Privacy Policy.</p>
          <h4 style="font-size: 1em; margin-bottom: 0.5rem;">2. User Responsibilities</h4>
          <ul style="padding-left: 1.5rem; margin-bottom: 1rem;">
            <li style="margin-bottom: 0.5rem;">You must provide accurate registration information</li>
            <li style="margin-bottom: 0.5rem;">You are responsible for maintaining the confidentiality of your account</li>
            <li>You agree to use the service for lawful purposes only</li>
          </ul>
          <h4 style="font-size: 1em; margin-bottom: 0.5rem;">3. Intellectual Property</h4>
          <p style="margin-bottom: 1rem;">All content and trademarks are property of Project Pulse.</p>
          <h4 style="font-size: 1em; margin-bottom: 0.5rem;">4. Limitation of Liability</h4>
          <p>Project Pulse is not liable for any indirect, incidental, or consequential damages.</p>
        </div>
      `,
      width: '800px',
      padding: '20px',
      background: '#ffffff',
      customClass: {
        popup: 'rounded-lg shadow-xl',
        confirmButton: 'px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
        closeButton: 'text-gray-400 hover:text-gray-600',
      },
      showCloseButton: true,
      showConfirmButton: true,
      confirmButtonText: 'I Accept',
      showCancelButton: true,
      cancelButtonText: 'Close',
      buttonsStyling: false,
      scrollbarPadding: false,
    })
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
          <div className={`${usingFallback ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'} border rounded-md p-3 mb-4`}>
            <p className={`${usingFallback ? 'text-yellow-700' : 'text-red-700'} text-sm text-center`}>{error}</p>
            {usingFallback && (
              <p className="text-yellow-600 text-xs text-center mt-1">
                You can still try to verify your code, but some features may not work properly.
              </p>
            )}
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

        <div 
          className="flex justify-between mb-6"
          onPaste={handlePaste}
        >
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
        
        <p className="mt-6 text-xs sm:text-sm text-gray-500 text-center">
          By verifying, you agree to our{' '}
          <span
            onClick={handleShowTerms}
            className="text-indigo-600 hover:text-indigo-500 cursor-pointer"
          >
            Terms and Conditions
          </span>
        </p>
        
        {usingFallback && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-700 text-sm text-center">
              <strong>Connection Issue:</strong> We&apos;re having trouble connecting to the server. 
              You can still try to verify your code, but if it doesn&apos;t work, please check your 
              internet connection and try again later.
            </p>
          </div>
        )}
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