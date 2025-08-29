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
  const [timeLeft, setTimeLeft] = useState<number>(600) // 10 minutes
  const [canResend, setCanResend] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // 🔹 Fetch verification session from backend
  useEffect(() => {
    const urlEmail = searchParams.get('email') || localStorage.getItem('email_to_verify')

    if (!urlEmail) {
      setError('No email found for verification.')
      return
    }

    setEmail(urlEmail)
    localStorage.setItem('email_to_verify', urlEmail)

    // Check if we have a stored expiration time
    const storedExpiry = localStorage.getItem('verification_expiry')
    if (storedExpiry) {
      const remaining = Math.max(0, Math.floor((parseInt(storedExpiry) - Date.now()) / 1000))
      setTimeLeft(remaining)
      setCanResend(remaining <= 0)
    }

    const fetchVerification = async () => {
      try {
        setIsLoading(true)
        const res = await fetch(
          `https://pulse.great-site.net/Google_signup/verify_email.php?email=${encodeURIComponent(urlEmail)}`,
          { 
            method: 'GET',
            credentials: 'include'
          }
        )
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.message || `HTTP error! Status: ${res.status}`)
        }

        const data = await res.json()
        if (data.success) {
          if (data.expires_at) {
            const remaining = Math.max(0, Math.floor(data.expires_at - Date.now() / 1000))
            setTimeLeft(remaining)
            localStorage.setItem('verification_expiry', data.expires_at.toString())
          }
        } else {
          setError(data.message || 'Verification session expired. Please sign up again.')
          if (data.redirect) {
            router.push(data.redirect)
          }
        }
      } catch (err) {
        console.error('Error fetching verification session:', err)
        setError('Could not load verification data. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVerification()
  }, [router, searchParams])

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000)
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
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Submit verification code (manual + google)
  const handleVerify = async () => {
    const enteredCode = code.join('')
    if (enteredCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        'https://pulse.great-site.net/Google_signup/verify_email.php',
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: new URLSearchParams({
            email,
            code: enteredCode,
          }),
        }
      )

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! Status: ${response.status}`)
      }

      if (data.success) {
        // Store session token if provided
        if (data.session_token) {
          localStorage.setItem('session_token', data.session_token)
        }
        if (data.token) {
          localStorage.setItem('session_token', data.token)
        }
        
        // Clear verification data
        localStorage.removeItem('email_to_verify')
        localStorage.removeItem('verification_expiry')
        
        await fetchUser()
        
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
      setError(
        err instanceof Error
          ? `Verification failed: ${err.message}`
          : 'Verification failed. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

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
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: new URLSearchParams({ 
            email, 
            resend: 'true' 
          }),
        }
      )

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! Status: ${response.status}`)
      }

      if (data.success) {
        setTimeLeft(600) // Reset to 10 minutes
        setCanResend(false)
        setCode(Array(6).fill(''))
        
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
      setError(
        err instanceof Error
          ? `Failed to resend code: ${err.message}`
          : 'Failed to resend verification code.'
      )
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
        
        {isLoading && (
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
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
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isLoading}
              className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
              Resend Code
            </button>
          )}
        </div>
        
        <button
          onClick={handleVerify}
          disabled={code.join('').length !== 6 || isLoading}
          className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Verifying...' : 'Verify Email'}
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
      </div>
    </div>
  )
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}