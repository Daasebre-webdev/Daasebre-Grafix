"use client";
import { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";

export default function VerifyEmail() {
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState<number>(120); // Adjusted to 2 minutes
  const [canResend, setCanResend] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("your email");
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch email to verify
  useEffect(() => {
    const initializeVerification = async () => {
      try {
        const res = await fetch("https://pulse.great-site.net/Google_signup/verify_email.php", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const data = await res.json();
        if (data.email) {
          setEmail(data.email);
          setTimeLeft(data.expires_at ? data.expires_at - Math.floor(Date.now() / 1000) : 120);
        } else {
          setError("No email found for verification.");
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setError(
          err instanceof Error
            ? `Failed to connect to the server. Please check your network. Details: ${err.message}`
            : "Failed to connect to the server. Please check your network."
        );
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
      const res = await fetch("https://pulse.great-site.net/Google_signup/verify_email.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `code=${enteredCode}&agreed_to_terms=true`, // Added terms agreement
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        // Store JWT in local storage
        if (data.jwt) {
          localStorage.setItem("jwt_token", data.jwt);
          // Optional: Decode JWT client-side for immediate use (demo purposes)
          const userData = decodeJWT(data.jwt);
          if (userData) {
            console.log("Decoded user data:", userData); // Log or use in context
          }
        }
        Swal.fire({
          icon: "success",
          title: "Verification Successful",
          text: "Redirecting to dashboard...",
          confirmButtonColor: "#28a745",
          timer: 2000,
          willClose: () => {
            window.location.href = data.redirect || "/dashboard";
          },
        });
      } else {
        setError(data.message || "Invalid or expired code.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError(
        err instanceof Error
          ? `An error occurred during verification. Details: ${err.message}`
          : "An error occurred during verification."
      );
    }
  };

  // Resend code
  const handleResend = async () => {
    if (!canResend) return;

    try {
      const res = await fetch("https://pulse.great-site.net/Google_signup/verify_email.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        credentials: "include",
        body: new URLSearchParams({ resend: "true" }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setTimeLeft(120);
        setCanResend(false);
        setError(null);
        Swal.fire({
          icon: "success",
          title: "Code Resent",
          text: "Check your email inbox for the new code.",
          confirmButtonColor: "#28a745",
          customClass: { popup: "text-sm" },
        });
      } else {
        setError(data.message || "Failed to resend code.");
      }
    } catch (err) {
      console.error("Resend error:", err);
      setError(
        err instanceof Error
          ? `Network error while resending code. Details: ${err.message}`
          : "Network error while resending code."
      );
    }
  };

  // Show Terms with SweetAlert2
  const handleShowTerms = () => {
    Swal.fire({
      title: "Terms and Conditions",
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

  // Helper function to decode JWT (client-side, for demo; use server-side in production)
  const decodeJWT = (token: string) => {
    try {
      const [, payloadBase64] = token.split(".");
      const payload = JSON.parse(atob(payloadBase64));
      return {
        id: payload.sub,
        email: payload.email,
        isVerified: payload.is_verified,
      };
    } catch (err) {
      console.error("JWT decode error:", err);
      return null;
    }
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

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

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

        <button
          onClick={handleVerify}
          className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none"
          disabled={timeLeft === 0}
        >
          Verify Email
        </button>

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