import { useState } from 'react';

interface LoginProps {
  onLogin: (role: 'admin' | 'participant') => void;
  onBack: () => void;
}

export default function Login({
  onLogin,
  onBack,
}: LoginProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ============================================================
  // SEND OTP
  // ============================================================

  const handleSendOTP = async () => {
    setError('');
    setSuccess('');

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(
        'Please enter your email address.'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/admin/send-otp',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            email: normalizedEmail,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Unable to send OTP.'
        );
      }

      setOtpSent(true);

      setSuccess(
        'A verification OTP has been sent to your email address.'
      );

    } catch (error) {

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          'Unable to send OTP. Please try again.'
        );
      }

    } finally {
      setLoading(false);
    }
  };


  // ============================================================
  // VERIFY OTP
  // ============================================================

  const handleVerifyOTP = async () => {
    setError('');
    setSuccess('');

    const normalizedEmail =
      email.trim().toLowerCase();

    const cleanOTP =
      otp.trim();

    if (!normalizedEmail) {
      setError(
        'Please enter your email address.'
      );
      return;
    }

    if (!/^\d{6}$/.test(cleanOTP)) {
      setError(
        'Please enter the 6-digit OTP.'
      );
      return;
    }

    setLoading(true);

    try {

      const response = await fetch(
        'http://localhost:5000/api/auth/admin/verify-otp',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            email: normalizedEmail,
            otp: cleanOTP,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'OTP verification failed.'
        );
      }

      // --------------------------------------------------------
      // Store authentication information
      // --------------------------------------------------------

      localStorage.setItem(
        'token',
        data.token
      );

      localStorage.setItem(
        'user',
        JSON.stringify(data.user)
      );

      // --------------------------------------------------------
      // Login as admin
      // --------------------------------------------------------

      onLogin('admin');

    } catch (error) {

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          'Unable to verify OTP. Please try again.'
        );
      }

    } finally {
      setLoading(false);
    }
  };


  // ============================================================
  // RESEND OTP
  // ============================================================

  const handleResendOTP = async () => {
    setOtp('');
    setError('');
    setSuccess('');

    await handleSendOTP();
  };


  // ============================================================
  // CHANGE EMAIL
  // ============================================================

  const handleChangeEmail = () => {
    setOtpSent(false);
    setOtp('');
    setError('');
    setSuccess('');
  };


  // ============================================================
  // FORM SUBMIT
  // ============================================================

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {

    e.preventDefault();

    if (!otpSent) {
      await handleSendOTP();
    } else {
      await handleVerifyOTP();
    }
  };


  return (
    <div className="min-h-full gradient-hero flex items-center justify-center p-6">

      <div className="w-full max-w-md">

        {/* ================================================== */}
        {/* LOGO */}
        {/* ================================================== */}

        <div className="text-center mb-8">

          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-3 group"
          >

            <div
              className="
                w-10
                h-10
                rounded-xl
                gradient-primary
                flex
                items-center
                justify-center
                shadow-card
              "
            >
              <span className="text-white font-bold">
                E
              </span>
            </div>

            <span
              className="
                font-display
                text-2xl
                text-[#1A1A2E]
              "
            >
              EventFlow
            </span>

          </button>

        </div>


        {/* ================================================== */}
        {/* LOGIN CARD */}
        {/* ================================================== */}

        <div
          className="
            bg-white
            rounded-3xl
            shadow-elevated
            p-8
            border
            border-[#E8E8F0]
          "
        >

          {/* ================================================= */}
          {/* HEADING */}
          {/* ================================================= */}

          <h1
            className="
              font-display
              text-3xl
              text-[#1A1A2E]
              text-center
              mb-2
            "
          >
            Welcome back
          </h1>


          <p
            className="
              text-sm
              text-[#9090A8]
              text-center
              mb-6
            "
          >
            Sign in securely using your email address
          </p>


          {/* ================================================= */}
          {/* ADMIN BADGE */}
          {/* ================================================= */}

          <div className="flex items-center justify-center mb-6">

            <div
              className="
                inline-flex
                items-center
                gap-2
                bg-[#EEF2FF]
                text-[#5B6FD4]
                px-4
                py-2
                rounded-xl
                text-sm
                font-medium
              "
            >

              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="
                    M5.121 17.804
                    A13.937 13.937 0 0112 16
                    c2.5 0 4.847.655 6.879 1.804
                    M15 10
                    a3 3 0 11-6 0
                    3 3 0 016 0z
                  "
                />
              </svg>

              Admin Login

            </div>

          </div>


          {/* ================================================= */}
          {/* OTP FORM */}
          {/* ================================================= */}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* ================================================= */}
            {/* EMAIL */}
            {/* ================================================= */}

            <div>

              <label
                className="
                  block
                  text-sm
                  font-medium
                  text-[#1A1A2E]
                  mb-1.5
                "
              >
                Email address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="admin@eventflow.com"
                autoComplete="email"
                disabled={otpSent}
                className="
                  w-full
                  px-4
                  py-3
                  rounded-xl
                  border
                  border-[#E8E8F0]
                  bg-[#FAFAF7]
                  text-sm
                  text-[#1A1A2E]
                  placeholder:text-[#C0C0D0]
                  focus:outline-none
                  focus:border-[#5B6FD4]
                  focus:ring-2
                  focus:ring-[#5B6FD4]/10
                  transition-all
                  disabled:opacity-70
                  disabled:cursor-not-allowed
                "
              />

            </div>


            {/* ================================================= */}
            {/* OTP */}
            {/* ================================================= */}

            {otpSent && (

              <div>

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    mb-1.5
                  "
                >

                  <label
                    className="
                      block
                      text-sm
                      font-medium
                      text-[#1A1A2E]
                    "
                  >
                    Verification OTP
                  </label>

                  <button
                    type="button"
                    onClick={handleChangeEmail}
                    className="
                      text-xs
                      text-[#5B6FD4]
                      hover:underline
                    "
                  >
                    Change email
                  </button>

                </div>


                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 6)
                    )
                  }
                  placeholder="Enter 6-digit OTP"
                  autoComplete="one-time-code"
                  autoFocus
                  className="
                    w-full
                    px-4
                    py-3
                    rounded-xl
                    border
                    border-[#E8E8F0]
                    bg-[#FAFAF7]
                    text-sm
                    text-[#1A1A2E]
                    tracking-[0.35em]
                    text-center
                    placeholder:tracking-normal
                    placeholder:text-[#C0C0D0]
                    focus:outline-none
                    focus:border-[#5B6FD4]
                    focus:ring-2
                    focus:ring-[#5B6FD4]/10
                    transition-all
                  "
                />

                <p
                  className="
                    text-xs
                    text-[#9090A8]
                    mt-2
                  "
                >
                  Enter the 6-digit verification code
                  sent to your email.
                </p>

              </div>

            )}


            {/* ================================================= */}
            {/* SUCCESS */}
            {/* ================================================= */}

            {success && (

              <div
                className="
                  px-4
                  py-3
                  bg-green-50
                  border
                  border-green-100
                  rounded-xl
                  text-sm
                  text-green-700
                "
              >
                {success}
              </div>

            )}


            {/* ================================================= */}
            {/* ERROR */}
            {/* ================================================= */}

            {error && (

              <div
                className="
                  px-4
                  py-3
                  bg-red-50
                  border
                  border-red-100
                  rounded-xl
                  text-sm
                  text-[#D95B5B]
                "
              >
                {error}
              </div>

            )}


            {/* ================================================= */}
            {/* MAIN BUTTON */}
            {/* ================================================= */}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                gradient-primary
                text-white
                font-semibold
                py-3.5
                rounded-xl
                shadow-soft
                hover:opacity-90
                transition-all
                disabled:opacity-70
                disabled:cursor-not-allowed
                mt-2
              "
            >

              {loading ? (

                <span
                  className="
                    flex
                    items-center
                    justify-center
                    gap-2
                  "
                >

                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >

                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="
                        M4 12
                        a8 8 0 018-8
                        V0
                        C5.373 0 0 5.373 0 12
                        h4z
                      "
                    />

                  </svg>

                  {otpSent
                    ? 'Verifying...'
                    : 'Sending OTP...'}

                </span>

              ) : (

                otpSent
                  ? 'Verify & Sign In'
                  : 'Send Verification OTP'

              )}

            </button>


            {/* ================================================= */}
            {/* RESEND */}
            {/* ================================================= */}

            {otpSent && (

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="
                  w-full
                  text-sm
                  font-medium
                  text-[#5B6FD4]
                  hover:text-[#4558BD]
                  transition-colors
                  disabled:opacity-50
                "
              >
                Resend OTP
              </button>

            )}

          </form>


          {/* ================================================= */}
          {/* PARTICIPANT INFORMATION */}
          {/* ================================================= */}

          <div
            className="
              mt-6
              pt-5
              border-t
              border-[#E8E8F0]
            "
          >

            <p
              className="
                text-center
                text-xs
                text-[#9090A8]
                leading-relaxed
              "
            >
              Are you a participant? Use the invitation
              link sent to your email. Your email address
              will be verified using a one-time password
              (OTP).
            </p>

          </div>

        </div>


        {/* ================================================== */}
        {/* BACK BUTTON */}
        {/* ================================================== */}

        <button
          type="button"
          onClick={onBack}
          className="
            mt-6
            text-sm
            text-[#9090A8]
            hover:text-[#5B6FD4]
            transition-colors
            mx-auto
            block
          "
        >
          ← Back to Home
        </button>

      </div>

    </div>
  );
}