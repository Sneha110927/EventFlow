import { useEffect, useState, type FormEvent } from "react";

interface ParticipantLoginProps {
  onLogin: (role: "participant") => void;
  onBack: () => void;
  invitationToken?: string;
}

export default function ParticipantLogin({
  onLogin,
  onBack,
  invitationToken,
}: ParticipantLoginProps) {
  const [email, setEmail] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [eventName, setEventName] = useState("");

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingInvitation, setLoadingInvitation] =
    useState(!!invitationToken);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isInvitationLogin = Boolean(invitationToken);

  // ==========================================================
  // LOAD INVITATION DETAILS
  // ==========================================================

  useEffect(() => {
    const loadInvitation = async () => {
      // ------------------------------------------------------
      // Normal participant login
      // ------------------------------------------------------

      if (!invitationToken) {
        setLoadingInvitation(false);
        return;
      }

      // ------------------------------------------------------
      // Invitation login
      // ------------------------------------------------------

      setLoadingInvitation(true);
      setError("");

      try {
        console.log("📨 Loading invitation...");
        console.log(
          "Invitation token:",
          invitationToken
        );

        const response = await fetch(
          `http://localhost:5000/api/invitations/accept/${invitationToken}`
        );

        const data = await response.json();

        console.log(
          "Invitation response:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load invitation."
          );
        }

        if (!data.email) {
          throw new Error(
            "This invitation does not contain a valid email address."
          );
        }

        // ----------------------------------------------------
        // Do NOT automatically fill the email.
        // Participant must type it manually.
        // Backend validates that it matches invitation.email.
        // ----------------------------------------------------

        setEmail("");

        if (data.name) {
          setParticipantName(data.name);
        }

        if (data.event?.name) {
          setEventName(data.event.name);
        }

        console.log(
          "✅ Invitation loaded successfully."
        );

      } catch (error) {
        console.error(
          "Load invitation error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load invitation."
        );

      } finally {
        setLoadingInvitation(false);
      }
    };

    loadInvitation();
  }, [invitationToken]);

  // ==========================================================
  // SEND OTP
  // ==========================================================

  const handleSendOtp = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setMessage("");

    const normalizedEmail =
      email.trim().toLowerCase();

    // --------------------------------------------------------
    // Validate email
    // --------------------------------------------------------

    if (!normalizedEmail) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    setLoading(true);

    try {
      // ======================================================
      // INVITATION LOGIN
      // ======================================================

      if (isInvitationLogin) {
        console.log(
          "📧 Sending invitation participant OTP..."
        );

        const response = await fetch(
          `http://localhost:5000/api/invitations/${invitationToken}/send-otp`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email: normalizedEmail,
            }),
          }
        );

        const data =
          await response.json();

        console.log(
          "Invitation OTP response:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to send OTP."
          );
        }

        setEmail(normalizedEmail);
        setOtpSent(true);

        setMessage(
          "A verification OTP has been sent to your invitation email."
        );

      }

      // ======================================================
      // NORMAL PARTICIPANT LOGIN
      // ======================================================

      else {
        console.log(
          "📧 Sending normal participant login OTP..."
        );

        const response = await fetch(
          "http://localhost:5000/api/auth/participant/send-otp",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email: normalizedEmail,
            }),
          }
        );

        const data =
          await response.json();

        console.log(
          "Participant login OTP response:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to send OTP."
          );
        }

        setEmail(normalizedEmail);
        setOtpSent(true);

        setMessage(
          "A verification OTP has been sent to your email address."
        );
      }

    } catch (error) {
      console.error(
        "Send participant OTP error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to send OTP. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // VERIFY OTP
  // ==========================================================

  const handleVerifyOtp = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setMessage("");

    const cleanOTP =
      otp.replace(/\D/g, "");

    const normalizedEmail =
      email.trim().toLowerCase();

    // --------------------------------------------------------
    // Validate
    // --------------------------------------------------------

    if (!normalizedEmail) {
      setError(
        "Email address is required."
      );
      return;
    }

    if (cleanOTP.length !== 6) {
      setError(
        "OTP must be 6 digits."
      );
      return;
    }

    setLoading(true);

    try {
      let response: Response;

      // ======================================================
      // INVITATION LOGIN
      // ======================================================

      if (isInvitationLogin) {
        console.log(
          "🔐 Verifying invitation participant OTP..."
        );

        response = await fetch(
          `http://localhost:5000/api/invitations/${invitationToken}/verify-otp`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email: normalizedEmail,
              otp: cleanOTP,
            }),
          }
        );

      }

      // ======================================================
      // NORMAL PARTICIPANT LOGIN
      // ======================================================

      else {
        console.log(
          "🔐 Verifying normal participant OTP..."
        );

        response = await fetch(
          "http://localhost:5000/api/auth/participant/verify-otp",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email: normalizedEmail,
              otp: cleanOTP,
            }),
          }
        );
      }

      const data =
        await response.json();

      console.log(
        "Participant OTP verification response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Invalid or expired OTP."
        );
      }

      // ======================================================
      // STORE JWT
      // ======================================================

      localStorage.setItem(
        "token",
        data.token
      );

      // ======================================================
      // STORE USER
      // ======================================================

      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      // ======================================================
      // STORE EVENT
      // ======================================================

      if (data.event) {
        localStorage.setItem(
          "eventflow_participant_event",
          JSON.stringify(data.event)
        );
      }

      // ======================================================
      // REMOVE INVITATION TOKEN
      // ======================================================

      if (isInvitationLogin) {
        sessionStorage.removeItem(
          "eventflow_invitation_token"
        );
      }

      setMessage(
        "Login successful! Opening your dashboard..."
      );

      // ======================================================
      // OPEN PARTICIPANT DASHBOARD
      // ======================================================

      setTimeout(() => {
        onLogin("participant");
      }, 500);

    } catch (error) {
      console.error(
        "Verify participant OTP error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Invalid or expired OTP."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // RESEND OTP
  // ==========================================================

  const handleResendOtp = async () => {
    setOtp("");
    setError("");
    setMessage("");

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    setLoading(true);

    try {
      let response: Response;

      // ------------------------------------------------------
      // Invitation resend
      // ------------------------------------------------------

      if (isInvitationLogin) {
        response = await fetch(
          `http://localhost:5000/api/invitations/${invitationToken}/send-otp`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email: normalizedEmail,
            }),
          }
        );
      }

      // ------------------------------------------------------
      // Normal participant resend
      // ------------------------------------------------------

      else {
        response = await fetch(
          "http://localhost:5000/api/auth/participant/send-otp",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email: normalizedEmail,
            }),
          }
        );
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to resend OTP."
        );
      }

      setMessage(
        "A new OTP has been sent to your email address."
      );

    } catch (error) {
      console.error(
        "Resend OTP error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to resend OTP."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // BACK TO EMAIL
  // ==========================================================

  const handleBackToEmailStep = () => {
    setOtpSent(false);
    setOtp("");
    setMessage("");
    setError("");
  };

  // ==========================================================
  // LOADING INVITATION
  // ==========================================================

  if (loadingInvitation) {
    return (
      <div
        className="
          min-h-full
          gradient-hero
          flex
          items-center
          justify-center
          p-6
        "
      >
        <div
          className="
            w-full
            max-w-md
            bg-white
            rounded-3xl
            shadow-elevated
            p-8
            border
            border-[#E8E8F0]
            text-center
          "
        >
          <div
            className="
              w-10
              h-10
              border-4
              border-[#E8E8F0]
              border-t-[#5B6FD4]
              rounded-full
              animate-spin
              mx-auto
              mb-4
            "
          />

          <h2
            className="
              font-display
              text-xl
              text-[#1A1A2E]
              mb-2
            "
          >
            Loading Invitation
          </h2>

          <p
            className="
              text-sm
              text-[#9090A8]
            "
          >
            Please wait while we verify your invitation.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div
      className="
        min-h-full
        gradient-hero
        flex
        items-center
        justify-center
        p-6
      "
    >
      <div className="w-full max-w-md">

        {/* ====================================================
            LOGO
        ==================================================== */}

        <div className="text-center mb-8">
          <button
            type="button"
            onClick={onBack}
            className="
              inline-flex
              items-center
              gap-3
              group
            "
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

        {/* ====================================================
            CARD
        ==================================================== */}

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

          {/* ==================================================
              HEADING
          ================================================== */}

          <h1
            className="
              font-display
              text-3xl
              text-[#1A1A2E]
              text-center
              mb-2
            "
          >
            Participant Portal
          </h1>

          <p
            className="
              text-sm
              text-[#9090A8]
              text-center
              mb-6
            "
          >
            {isInvitationLogin
              ? "Access your event using your invitation email."
              : "Sign in securely using your email and OTP."
            }
          </p>

          {/* ==================================================
              PARTICIPANT BADGE
          ================================================== */}

          <div
            className="
              flex
              items-center
              justify-center
              mb-6
            "
          >
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

              Participant Login
            </div>
          </div>

          {/* ==================================================
              INVITATION INFORMATION
          ================================================== */}

          {isInvitationLogin &&
            (participantName || eventName) && (
              <div
                className="
                  bg-[#F7F8FF]
                  rounded-xl
                  p-4
                  mb-6
                  border
                  border-[#E8E8F0]
                "
              >
                {participantName && (
                  <p
                    className="
                      text-sm
                      font-medium
                      text-[#1A1A2E]
                    "
                  >
                    Welcome, {participantName}
                  </p>
                )}

                {eventName && (
                  <p
                    className="
                      text-xs
                      text-[#9090A8]
                      mt-1
                    "
                  >
                    Event: {eventName}
                  </p>
                )}
              </div>
            )}

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div
              className="
                mb-5
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

          {/* ==================================================
              EMAIL STEP
          ================================================== */}

          {!otpSent ? (
            <form
              onSubmit={handleSendOtp}
              className="space-y-5"
            >

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
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your email address"
                  autoComplete="email"
                  disabled={loading}
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
                  "
                />

                <p
                  className="
                    text-xs
                    text-[#9090A8]
                    mt-2
                  "
                >
                  {isInvitationLogin
                    ? "Enter the email address that received your EventFlow invitation."
                    : "Enter the email address associated with your EventFlow participant account."
                  }
                </p>
              </div>

              {/* SEND OTP */}

              <button
                type="submit"
                disabled={
                  loading ||
                  !email.trim()
                }
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
                      className="
                        w-4
                        h-4
                        animate-spin
                      "
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

                    Sending OTP...
                  </span>
                ) : (
                  "Send Verification OTP"
                )}
              </button>
            </form>
          ) : (

            /* =================================================
               OTP STEP
            ================================================= */

            <form
              onSubmit={handleVerifyOtp}
              className="space-y-5"
            >

              {/* EMAIL */}

              <div
                className="
                  bg-[#FAFAF7]
                  rounded-xl
                  p-4
                  border
                  border-[#E8E8F0]
                "
              >
                <p
                  className="
                    text-xs
                    text-[#9090A8]
                  "
                >
                  OTP sent to
                </p>

                <p
                  className="
                    font-semibold
                    text-[#1A1A2E]
                    mt-1
                    break-all
                  "
                >
                  {email}
                </p>
              </div>

              {/* SUCCESS MESSAGE */}

              {message && (
                <div
                  className="
                    px-4
                    py-3
                    bg-green-50
                    border
                    border-green-100
                    rounded-xl
                    text-sm
                    text-[#3D9E8C]
                  "
                >
                  {message}
                </div>
              )}

              {/* OTP */}

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
                  Verification OTP
                </label>

                <input
                  type="text"
                  value={otp}
                  onChange={(e) =>
                    setOtp(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  disabled={loading}
                  className="
                    w-full
                    px-4
                    py-3
                    rounded-xl
                    border
                    border-[#E8E8F0]
                    bg-[#FAFAF7]
                    text-center
                    tracking-[0.5em]
                    text-lg
                    font-semibold
                    text-[#1A1A2E]
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
                  Enter the 6-digit code sent to your email.
                </p>
              </div>

              {/* VERIFY */}

              <button
                type="submit"
                disabled={
                  loading ||
                  otp.length !== 6
                }
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
                      className="
                        w-4
                        h-4
                        animate-spin
                      "
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

                    Verifying...
                  </span>
                ) : (
                  "Verify & Sign In"
                )}
              </button>

              {/* RESEND */}

              <button
                type="button"
                onClick={handleResendOtp}
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

              {/* BACK */}

              <button
                type="button"
                onClick={handleBackToEmailStep}
                disabled={loading}
                className="
                  w-full
                  text-sm
                  text-[#9090A8]
                  hover:text-[#5B6FD4]
                  transition-colors
                  disabled:opacity-50
                "
              >
                ← Change Email
              </button>

            </form>
          )}

          {/* ==================================================
              SECURITY
          ================================================== */}

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
              Your email is verified securely using a
              one-time password. The OTP is valid for
              5 minutes and should not be shared with
              anyone.
            </p>
          </div>
        </div>

        {/* ====================================================
            BACK
        ==================================================== */}

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
          ← Back
        </button>
      </div>
    </div>
  );
}