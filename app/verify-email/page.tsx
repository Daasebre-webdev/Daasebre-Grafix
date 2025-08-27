"use client";
import { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";

export default function VerifyEmail() {
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState<number>(180);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("your email");
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch email to verify
  useEffect(() => {
    const initializeVerification = async () => {
      try {
        const res = await fetch("http://localhost/Project_pulse/verify_email.php", {
          method: "POST",
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          if (data.email) {
            setEmail(data.email);
          }
        } else {
          setError("Failed to fetch verification email. Please try again.");
        }
      } catch {
        setError("Failed to connect to the server. Please check your network.");
      }
    };

    initializeVerification();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Handle OTP input
  const handleChange = (index: number, value: string) => {
    if (/^[0-9]?$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Submit verification code
  const handleVerify = async () => {
    const enteredCode = code.join("");
    if (enteredCode.length !== 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    try {
      const res = await fetch("http://localhost/Project_pulse/verify_email.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `code=${enteredCode}`,
        credentials: "include",
      });

      const data = await res.json();
      if (data.success) {
        window.location.href = "/dashboard";
      } else {
        setError(data.message || "Invalid or expired code.");
      }
    } catch {
      setError("An error occurred during verification.");
    }
  };

  // Resend code
  const handleResend = async () => {
    try {
      const res = await fetch("http://localhost/Project_pulse/resend_code.php", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();
      if (data.success) {
        setTimeLeft(180);
        setCanResend(false);
        setError(null);
      } else {
        setError(data.message || "Failed to resend code.");
      }
    } catch {
      setError("Network error while resending code.");
    }
  };

  // Show Terms with SweetAlert2
  const handleShowTerms = () => {
    Swal.fire({
      title:
        '<div style="font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 20px;">Terms of Service</div>',
      html: `
        <div style="text-align: left; max-height: 60vh; overflow-y: auto; font-size: 14px; line-height: 1.6; color: #374151;">
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <i class="fas fa-history" style="margin-right: 8px;"></i>
            <strong>Last Updated:</strong> ${new Date().toLocaleDateString()}
          </div>
          <p>Welcome to Project Pulse! By using our services, you agree to the following terms and conditions:</p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>✅ Respect intellectual property rights.</li>
            <li>✅ Do not share your verification codes with anyone.</li>
            <li>✅ Accounts must only be used for academic purposes.</li>
            <li>✅ Violation of terms may lead to account suspension.</li>
          </ul>
          <p>For more details, visit our <a href="/privacy-policy" style="color: #2563eb;">Privacy Policy</a>.</p>
        </div>
      `,
      width: "800px",
      padding: "20px",
      background: "#ffffff",
      customClass: {
        popup: "rounded-lg shadow-xl",
        confirmButton:
          "px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
        closeButton: "text-gray-400 hover:text-gray-600",
      },
      showCloseButton: true,
      showConfirmButton: true,
      confirmButtonText: "I Accept",
      showCancelButton: true,
      cancelButtonText: "Close",
      buttonsStyling: false,
      scrollbarPadding: false,
    });
  };

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

        {/* Error Message */}
        {error && (
          <p className="text-red-500 text-center mb-4">{error}</p>
        )}

        {/* Code Inputs */}
        <div className="flex justify-between mb-6">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                if (el) inputRefs.current[index] = el;
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

        {/* Timer + Resend */}
        <div className="text-center mb-6">
          {timeLeft > 0 ? (
            <p className="text-sm text-gray-500">
              Resend code in{" "}
              <span className="font-semibold text-indigo-600">
                {Math.floor(timeLeft / 60)}:
                {String(timeLeft % 60).padStart(2, "0")}
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

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none"
        >
          Verify Email
        </button>

        {/* Terms */}
        <p className="mt-6 text-xs sm:text-sm text-gray-500 text-center">
          By verifying, you agree to our{" "}
          <span
            onClick={handleShowTerms}
            className="text-indigo-600 hover:text-indigo-500 cursor-pointer"
          >
            Terms and Conditions
          </span>
        </p>
      </div>
    </div>
  );
}
