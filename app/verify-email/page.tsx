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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // 🔹 Fetch verification session from backend on mount
  useEffect(() => {
    const fetchVerificationSession = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/verify_email.php`, {
          method: 'GET',
          credentials: 'include',
        })

        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)

        const data = await res.json()
        if (data.success) {
          setEmail(data.email)
          localStorage.setItem('email_to_verify', data.email)

          if (data.expires_at) {
            const remaining = Math.max(0, Math.floor(data.expires_at - Date.now() / 1000))
            setTimeLeft(remaining)
          }
        } else {
          setError(data.message || 'Verification session expired. Please sign up again.')
          if (data.redirect) router.push(data.redirect)
        }
      } catch (err) {
        console.error('Error fetching verification session:', err)
        // fallback to localStorage or URL param if backend fails
        const storedEmail = localStorage.getItem('email_to_verify') || searchParams.get('email') || ''
        if (storedEmail) {
          setEmail(storedEmail)
        } else {
          setError('No email found for verification.')
        }
      }
    }

    fetchVerificationSession()
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

  // Submit verification code
  const handleVerify = async () => {
    const enteredCode = code.join('')
    if (enteredCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code.')
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/verify_email.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include',
        body: new URLSearchParams({ code: enteredCode, agreed_to_terms: 'true' }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        if (data.jwt) {
          localStorage.setItem('jwt_token', data.jwt)
        }
        await fetchUser()
        Swal.fire({
          icon: 'success',
          title: 'Verification Successful',
          text: 'Redirecting to dashboard...',
          confirmButtonColor: '#28a745',
          timer: 2000,
          willClose: () => {
            router.push(data.redirect || '/dashboard')
          },
        })
      } else {
        setError(data.message || 'Invalid or expired code.')
      }
    } catch (err) {
      console.error('Verification error:', err)
      setError(
        err instanceof Error
          ? `Failed to connect to the server. Please check your network. Details: ${err.message}`
          : 'Failed to connect to the server. Please check your network.'
      )
    }
  }

  // Resend code
  const handleResend = async () => {
    if (!canResend) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/verify_email.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include',
        body: new URLSearchParams({ resend: 'true' }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setTimeLeft(120)
        setCanResend(false)
        setError(null)
        setCode(Array(6).fill(''))
        Swal.fire({
          icon: 'success',
          title: 'Code Resent',
          text: 'Check your email inbox for the new code.',
          confirmButtonColor: '#28a745',
          customClass: { popup: 'text-sm' },
        })
      } else {
        setError(data.message || 'Failed to resend code.')
      }
    } catch (err) {
      console.error('Resend error:', err)
      setError(
        err instanceof Error
          ? `Network error while resending code. Details: ${err.message}`
          : 'Network error while resending code.'
      )
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
        confirmButton:
          'px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
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
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
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
              className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              disabled={!canResend}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Resend Code
            </button>
          )}
        </div>
        <button
          onClick={handleVerify}
          className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none"
          disabled={timeLeft === 0 || code.join('').length !== 6}
        >
          Verify Email
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
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
