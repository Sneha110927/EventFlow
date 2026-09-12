import {
  useEffect,
  useState,
} from 'react';

interface InvitationData {
  _id: string;
  name: string;
  email: string;
  event?: {
    _id: string;
    name: string;
    venue?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
  };
}

interface AcceptInvitationProps {
  token: string;
  onAccepted: () => void;
}

const API_BASE_URL = 'http://localhost:5000/api';

export default function AcceptInvitation({
  token,
  onAccepted,
}: AcceptInvitationProps) {
  /* ================================================================
     STATE
  ================================================================= */

  const [invitation, setInvitation] =
    useState<InvitationData | null>(null);

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');

  const [step, setStep] =
    useState<
      | 'loading'
      | 'celebration'
      | 'invitation'
      | 'otp'
      | 'success'
      | 'error'
    >('loading');

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [resendCooldown, setResendCooldown] =
    useState(0);

  /* ================================================================
     LOAD INVITATION
  ================================================================= */

  useEffect(() => {
    const loadInvitation = async () => {
      try {
        setStep('loading');
        setError('');

        const response = await fetch(
          `${API_BASE_URL}/invitations/accept/${encodeURIComponent(
            token
          )}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              'This invitation is invalid or has expired.'
          );
        }

        const invitationData =
          data.invitation || data;

        setInvitation(invitationData);

        /*
         * Invitation loaded successfully.
         *
         * Show the celebration animation first.
         */
        setStep('celebration');

        /*
         * After the celebration, show the mobile
         * verification screen.
         */
        window.setTimeout(() => {
          setStep('invitation');
        }, 2200);
      } catch (err) {
        console.error(
          'Load invitation error:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load invitation.'
        );

        setStep('error');
      }
    };

    void loadInvitation();
  }, [token]);

  /* ================================================================
     RESEND COOLDOWN
  ================================================================= */

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendCooldown((previous) =>
        previous > 0 ? previous - 1 : 0
      );
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [resendCooldown]);

  /* ================================================================
     FORMAT DATE
  ================================================================= */

  const formatDate = (
    date?: string
  ) => {
    if (!date) {
      return '';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    return parsedDate.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  };

  /* ================================================================
     SEND OTP
  ================================================================= */

  const handleSendOTP = async () => {
    setError('');
    setMessage('');

    const cleanMobile =
      mobile.replace(/\D/g, '');

    if (cleanMobile.length !== 10) {
      setError(
        'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/invitations/${encodeURIComponent(
          token
        )}/send-otp`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            mobile: cleanMobile,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to send OTP.'
        );
      }

      setMobile(cleanMobile);
      setOtp('');

      setMessage(
        'OTP has been sent successfully.'
      );

      setStep('otp');

      setResendCooldown(30);
    } catch (err) {
      console.error(
        'Send invitation OTP error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send OTP.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================================================================
     VERIFY OTP
  ================================================================= */

  const handleVerifyOTP = async () => {
    setError('');
    setMessage('');

    const cleanOTP =
      otp.replace(/\D/g, '');

    if (cleanOTP.length !== 6) {
      setError(
        'Please enter the 6-digit OTP.'
      );
      return;
    }

    try {
      setVerifying(true);

      const response = await fetch(
        `${API_BASE_URL}/invitations/${encodeURIComponent(
          token
        )}/verify-otp`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            otp: cleanOTP,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Invalid OTP. Please try again.'
        );
      }

      /* ============================================================
         STORE AUTHENTICATION
      ============================================================= */

      if (data.token) {
        localStorage.setItem(
          'token',
          data.token
        );
      }

      if (data.user) {
        localStorage.setItem(
          'user',
          JSON.stringify(data.user)
        );
      }

      setStep('success');

      setMessage(
        'Invitation accepted successfully!'
      );

      /*
       * Give the success screen a moment to be visible,
       * then move to participant dashboard.
       */

      window.setTimeout(() => {
        onAccepted();
      }, 1000);
    } catch (err) {
      console.error(
        'Verify invitation OTP error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to verify OTP.'
      );
    } finally {
      setVerifying(false);
    }
  };

  /* ================================================================
     BACK TO MOBILE
  ================================================================= */

  const handleBackToMobile = () => {
    setOtp('');
    setError('');
    setMessage('');
    setStep('invitation');
  };

  /* ================================================================
     LOADING SCREEN
  ================================================================= */

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-[#F8F8FC] flex items-center justify-center px-5">

        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8E8F0] shadow-xl p-8 text-center">

          <div className="w-12 h-12 border-4 border-[#EEF2FF] border-t-[#7182DF] rounded-full animate-spin mx-auto mb-4" />

          <h2 className="text-xl font-semibold text-[#1A1A2E]">
            Loading your invitation
          </h2>

          <p className="text-sm text-[#9090A8] mt-2">
            Please wait while we prepare your invitation.
          </p>

        </div>

      </div>
    );
  }

  /* ================================================================
     CELEBRATION ANIMATION
  ================================================================= */

  if (step === 'celebration') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#F8F8FC] flex items-center justify-center px-5">

        {/* ============================================================
            ANIMATED BACKGROUND GLOW
        ============================================================= */}

        <div className="absolute inset-0 pointer-events-none">

          <div className="absolute top-[15%] left-[15%] w-40 h-40 bg-[#7182DF]/15 rounded-full blur-3xl animate-pulse" />

          <div
            className="absolute bottom-[15%] right-[15%] w-48 h-48 bg-[#9B8AFB]/15 rounded-full blur-3xl animate-pulse"
            style={{
              animationDelay: '500ms',
            }}
          />

          <div
            className="absolute top-[35%] right-[25%] w-32 h-32 bg-[#7CCFC1]/15 rounded-full blur-3xl animate-pulse"
            style={{
              animationDelay: '900ms',
            }}
          />

        </div>

        {/* ============================================================
            MAIN CELEBRATION CARD
        ============================================================= */}

        <div className="relative z-10 w-full max-w-lg">

          <div className="bg-white rounded-[32px] border border-[#E8E8F0] shadow-2xl p-8 text-center animate-[celebrateCard_700ms_ease-out]">

            {/* CELEBRATION ICON */}

            <div className="relative mx-auto mb-6 w-20 h-20">

              <div className="absolute inset-0 rounded-full bg-[#7182DF]/10 animate-ping" />

              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#7182DF] to-[#8B7FE8] flex items-center justify-center shadow-xl">

                <span className="text-4xl animate-[celebrateIcon_700ms_ease-out]">
                  🎉
                </span>

              </div>

            </div>

            {/* EVENTFLOW */}

            <p className="text-xs font-bold tracking-[0.25em] text-[#7182DF] mb-3">
              EVENTFLOW
            </p>

            {/* TITLE */}

            <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A1A2E]">
              You're Invited!
            </h1>

            {/* MESSAGE */}

            <p className="text-[#77778D] mt-3 leading-relaxed">
              Hello{' '}
              <span className="font-semibold text-[#1A1A2E]">
                {invitation?.name}
              </span>
              !
            </p>

            {/* EVENT */}

            <div className="mt-5 px-5 py-3 rounded-2xl bg-[#F7F8FF] border border-[#E3E7FF]">

              <p className="text-xs uppercase tracking-wide font-semibold text-[#7182DF]">
                You've been invited to
              </p>

              <p className="text-lg font-semibold text-[#1A1A2E] mt-1">
                {invitation?.event?.name ||
                  'the event'}
              </p>

            </div>

            {/* BOTTOM MESSAGE */}

            <p className="text-sm text-[#9090A8] mt-5">
              We're excited to have you join us.
            </p>
          </div>

        </div>

        {/* ============================================================
            ANIMATION KEYFRAMES
        ============================================================= */}

        <style>
          {`
            @keyframes sparkle {
              0%, 100% {
                opacity: 0.25;
                transform: scale(0.7) rotate(0deg);
              }

              50% {
                opacity: 1;
                transform: scale(1.3) rotate(15deg);
              }
            }

            @keyframes celebrateCard {
              0% {
                opacity: 0;
                transform: translateY(25px) scale(0.92);
              }

              60% {
                opacity: 1;
                transform: translateY(-4px) scale(1.02);
              }

              100% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }

            @keyframes celebrateIcon {
              0% {
                transform: scale(0) rotate(-25deg);
              }

              60% {
                transform: scale(1.2) rotate(8deg);
              }

              100% {
                transform: scale(1) rotate(0deg);
              }
            }
          `}
        </style>

      </div>
    );
  }

  /* ================================================================
     ERROR SCREEN
  ================================================================= */

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-[#F8F8FC] flex items-center justify-center px-5">

        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8E8F0] shadow-xl p-8 text-center">

          <div className="w-16 h-16 rounded-2xl bg-[#FFF0F0] flex items-center justify-center mx-auto mb-5">

            <svg
              className="w-8 h-8 text-[#C65B5B]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v4m0 4h.01M10.29 3.86l-7.82 13a2 2 0 001.71 3h15.64a2 2 0 001.71-3l-7.82-13a2 2 0 00-3.42 0z"
              />
            </svg>

          </div>

          <h1 className="text-2xl font-semibold text-[#1A1A2E]">
            Invitation unavailable
          </h1>

          <p className="text-sm text-[#77778D] mt-3 leading-relaxed">
            {error}
          </p>

          <p className="text-xs text-[#A0A0B0] mt-5">
            Please contact the event administrator if
            you believe this is a mistake.
          </p>

        </div>

      </div>
    );
  }

  /* ================================================================
     SUCCESS SCREEN
  ================================================================= */

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#F8F8FC] flex items-center justify-center px-5">

        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E8E8F0] shadow-xl p-8 text-center">

          <div className="w-20 h-20 rounded-full bg-[#E8F7F2] flex items-center justify-center mx-auto mb-6">

            <svg
              className="w-10 h-10 text-[#3CA18F]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>

          </div>

          <h1 className="text-2xl font-semibold text-[#1A1A2E]">
            Invitation Accepted
          </h1>

          <p className="text-sm text-[#77778D] mt-3">
            Welcome to{' '}
            <strong>
              {invitation?.event?.name ||
                'the event'}
            </strong>
            .
          </p>

          <p className="text-xs text-[#A0A0B0] mt-5">
            Taking you to your participant dashboard...
          </p>

          <div className="w-6 h-6 border-2 border-[#EEF2FF] border-t-[#7182DF] rounded-full animate-spin mx-auto mt-5" />

        </div>

      </div>
    );
  }

  /* ================================================================
     MAIN INVITATION / MOBILE + OTP
  ================================================================= */

  return (
    <div className="min-h-screen max-h-screen overflow-hidden bg-[#F8F8FC] flex items-center justify-center px-5 py-4">

      <div className="w-full max-w-xl">

        {/* ============================================================
            BRAND
        ============================================================= */}

        {/* <div className="text-center mb-7">

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#7182DF] text-white shadow-lg mb-3">

            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>

          </div>

          <p className="text-sm font-semibold tracking-wide text-[#7182DF]">
            EVENTFLOW
          </p>

        </div> */}

        {/* ============================================================
            INVITATION CARD
        ============================================================= */}

        <div className="bg-white rounded-[24px] border border-[#E8E8F0] shadow-xl overflow-hidden">

          {/* TOP BANNER */}

          <div className="bg-[#7182DF] px-6 py-5 text-center text-white">

            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/15 mb-2">

              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>

            </div>

            {/* <p className="text-xs font-medium text-white/80 mb-1">
              You have been invited to
            </p> */}

            <h1 className="text-2xl font-serif font-semibold">
              {invitation?.event?.name ||
                'An Event'}
            </h1>

          </div>

          {/* CONTENT */}

          <div className="p-6">

            {/* GREETING */}

            <div className="mb-4">

              <p className="text-[#77778D] text-xs">
                Hello,
              </p>

              <h2 className="text-xl font-semibold text-[#1A1A2E] mt-0.5">
                {invitation?.name}
              </h2>

              <p className="text-xs text-[#9090A8] mt-1">
                {invitation?.email}
              </p>

            </div>

            {/* EVENT DETAILS */}

            {invitation?.event && (
              <div className="bg-[#F7F8FF] rounded-xl border border-[#E3E7FF] p-4 mb-4">

                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7182DF] mb-3">
                  Event Details
                </p>

                <div className="space-y-2.5">

                  {/* VENUE */}

                  {(invitation.event.venue ||
                    invitation.event.location) && (
                    <div className="flex items-center gap-3">

                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">

                        <svg
                          className="w-4 h-4 text-[#7182DF]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 21.9a2 2 0 01-2.828 0l-4.243-5.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>

                      </div>

                      <div>

                        <p className="text-[11px] text-[#9090A8]">
                          Venue
                        </p>

                        <p className="text-xs font-semibold text-[#1A1A2E] mt-0.5">
                          {invitation.event.venue ||
                            invitation.event.location}
                        </p>

                      </div>

                    </div>
                  )}

                  {/* DATE */}

                  {(invitation.event.startDate ||
                    invitation.event.endDate) && (
                    <div className="flex items-center gap-3">

                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">

                        <svg
                          className="w-4 h-4 text-[#7182DF]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 4h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z"
                          />
                        </svg>

                      </div>

                      <div>

                        <p className="text-[11px] text-[#9090A8]">
                          Date
                        </p>

                        <p className="text-xs font-semibold text-[#1A1A2E] mt-0.5">
                          {formatDate(
                            invitation.event.startDate
                          )}

                          {invitation.event.endDate &&
                            invitation.event.endDate !==
                              invitation.event.startDate && (
                              <>
                                {' '}
                                –{' '}
                                {formatDate(
                                  invitation.event.endDate
                                )}
                              </>
                            )}
                        </p>

                      </div>

                    </div>
                  )}

                </div>

              </div>
            )}

            {/* ========================================================
                STEP 1 — MOBILE NUMBER
            ========================================================= */}

            {step === 'invitation' && (
              <div>

                <div className="mb-3">
{/* 
                  <h3 className="text-lg font-semibold text-[#1A1A2E]">
                    Accept your invitation
                  </h3>

                  <p className="text-sm text-[#77778D] mt-1.5 leading-relaxed">
                    Enter your mobile number to verify your
                    identity and continue to your participant
                    dashboard.
                  </p> */}

                </div>

                {/* MOBILE INPUT */}

                <label className="block text-xs font-semibold text-[#1A1A2E] mb-2">
                  Mobile Number
                </label>

                <div className="flex">

                  <div className="flex items-center px-3 rounded-l-xl border border-r-0 border-[#E3E3ED] bg-[#F7F7FA] text-xs font-medium text-[#5A5A72]">
                    +91
                  </div>

                  <input
                    type="tel"
                    value={mobile}
                    onChange={(event) => {
                      const value =
                        event.target.value
                          .replace(/\D/g, '')
                          .slice(0, 10);

                      setMobile(value);
                      setError('');
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.key === 'Enter'
                      ) {
                        event.preventDefault();
                        void handleSendOTP();
                      }
                    }}
                    placeholder="Enter 10-digit mobile number"
                    inputMode="numeric"
                    autoComplete="tel"
                    className="flex-1 min-w-0 px-4 py-3 rounded-r-xl border border-[#E3E3ED] bg-white text-sm text-[#1A1A2E] outline-none focus:border-[#7182DF] focus:ring-2 focus:ring-[#7182DF]/10"
                  />

                </div>

                <p className="text-[11px] text-[#9090A8] mt-1.5">
                  We'll use this number for OTP verification.
                </p>

                {/* ERROR */}

                {error && (
                  <div className="mt-3 px-3 py-2.5 rounded-lg bg-[#FFF5F5] border border-[#F2D4D4] text-xs text-[#C65B5B]">
                    {error}
                  </div>
                )}

                {/* SEND BUTTON */}

                <button
                  type="button"
                  onClick={() =>
                    void handleSendOTP()
                  }
                  disabled={
                    loading ||
                    mobile.length !== 10
                  }
                  className="w-full mt-4 px-5 py-3 rounded-xl bg-[#7182DF] text-white text-sm font-semibold hover:bg-[#6072D5] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? 'Sending OTP...'
                    : 'Continue with Mobile Number'}
                </button>

              </div>
            )}

            {/* ========================================================
                STEP 2 — OTP
            ========================================================= */}

            {step === 'otp' && (
              <div>

                <div className="text-center mb-4">

                  <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center mx-auto mb-3">

                    <svg
                      className="w-5 h-5 text-[#7182DF]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>

                  </div>

                  <h3 className="text-base font-semibold text-[#1A1A2E]">
                    Verify your mobile number
                  </h3>

                  <p className="text-xs text-[#77778D] mt-1.5">
                    Enter the 6-digit OTP sent to
                  </p>

                  <p className="text-sm font-semibold text-[#1A1A2E] mt-1">
                    +91 {mobile}
                  </p>

                </div>

                {/* OTP INPUT */}

                <input
                  type="text"
                  value={otp}
                  onChange={(event) => {
                    const value =
                      event.target.value
                        .replace(/\D/g, '')
                        .slice(0, 6);

                    setOtp(value);
                    setError('');
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter'
                    ) {
                      event.preventDefault();
                      void handleVerifyOTP();
                    }
                  }}
                  placeholder="000000"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  className="w-full px-5 py-3.5 rounded-xl border border-[#E3E3ED] text-center text-xl tracking-[0.5em] font-semibold text-[#1A1A2E] outline-none focus:border-[#7182DF] focus:ring-2 focus:ring-[#7182DF]/10"
                />

                {/* ERROR */}

                {error && (
                  <div className="mt-3 px-3 py-2.5 rounded-lg bg-[#FFF5F5] border border-[#F2D4D4] text-xs text-[#C65B5B]">
                    {error}
                  </div>
                )}

                {/* SUCCESS MESSAGE */}

                {message && !error && (
                  <div className="mt-3 px-3 py-2.5 rounded-lg bg-[#F0FAF7] border border-[#D2EEE6] text-xs text-[#3A8E7D]">
                    {message}
                  </div>
                )}

                {/* VERIFY */}

                <button
                  type="button"
                  onClick={() =>
                    void handleVerifyOTP()
                  }
                  disabled={
                    verifying ||
                    otp.length !== 6
                  }
                  className="w-full mt-4 px-5 py-3 rounded-xl bg-[#7182DF] text-white text-sm font-semibold hover:bg-[#6072D5] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying
                    ? 'Verifying...'
                    : 'Verify & Accept Invitation'}
                </button>

                {/* ACTIONS */}

                <div className="flex items-center justify-between mt-4">

                  <button
                    type="button"
                    onClick={handleBackToMobile}
                    disabled={verifying}
                    className="text-xs font-medium text-[#5A5A72] hover:text-[#7182DF] transition disabled:opacity-50"
                  >
                    ← Change mobile number
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void handleSendOTP()
                    }
                    disabled={
                      loading ||
                      resendCooldown > 0
                    }
                    className="text-xs font-semibold text-[#7182DF] hover:text-[#6072D5] transition disabled:text-[#A5A5B5] disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : 'Resend OTP'}
                  </button>

                </div>

              </div>
            )}

          </div>

          {/* FOOTER */}

          <div className="px-6 py-3 border-t border-[#EEEEF3] bg-[#FCFCFE]">

            <p className="text-center text-[10px] leading-relaxed text-[#A0A0B0]">
              This invitation was sent through EventFlow.
              If you were not expecting this invitation,
              please contact the event administrator.
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}
