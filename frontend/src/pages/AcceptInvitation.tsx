import { useEffect, useState } from "react";

interface EventInfo {
  name: string;
  type: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
}

interface Invitation {
  id: string;
  name: string;
  email: string;
  status: "pending" | "accepted" | "expired";
  expiresAt: string;
  event?: EventInfo;
}

interface InvitationResponse {
  invitation?: Invitation;
  message?: string;
}

interface OTPResponse {
  message?: string;
  expiresIn?: number;
}

interface VerifyOTPResponse {
  message?: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    mobile?: string;
    role: string;
  };
}

interface AcceptInvitationProps {
  token: string;
  onAccepted: () => void;
}

export default function AcceptInvitation({
  token,
  onAccepted,
}: AcceptInvitationProps) {
  const [invitation, setInvitation] =
    useState<Invitation | null>(null);

  const [loading, setLoading] = useState(true);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ---------------------------------------------------------
  // LOAD INVITATION
  // ---------------------------------------------------------

  useEffect(() => {
    const loadInvitation = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://localhost:5000/api/invitations/accept/${token}`
        );

        const data: InvitationResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load invitation"
          );
        }

        if (!data.invitation) {
          throw new Error(
            "Invitation information not found"
          );
        }

        setInvitation(data.invitation);

        // Pre-fill the invited name
        setName(data.invitation.name);
      } catch (err: unknown) {
        console.error(
          "Invitation loading error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load invitation"
        );
      } finally {
        setLoading(false);
      }
    };

    void loadInvitation();
  }, [token]);

  // ---------------------------------------------------------
  // SEND OTP
  // ---------------------------------------------------------

  const handleSendOTP = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setMessage("");

    // if (!name.trim()) {
    //   setError("Please enter your name.");
    //   return;
    // }

    if (!mobile.trim()) {
      setError(
        "Please enter your mobile number."
      );
      return;
    }

    const cleanMobile = mobile
      .replace(/\D/g, "");

    if (cleanMobile.length !== 10) {
      setError(
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    try {
      setSendingOTP(true);

      const response = await fetch(
        `http://localhost:5000/api/invitations/${token}/send-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            mobile: cleanMobile,
          }),
        }
      );

      const data: OTPResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to send OTP"
        );
      }

      setOtpSent(true);

      setMessage(
        "OTP has been sent to your mobile number."
      );
    } catch (err: unknown) {
      console.error(
        "Send OTP error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to send OTP"
      );
    } finally {
      setSendingOTP(false);
    }
  };

  // ---------------------------------------------------------
  // VERIFY OTP
  // ---------------------------------------------------------

  const handleVerifyOTP = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      setError(
        "OTP must be a 6-digit number."
      );
      return;
    }

    try {
      setVerifyingOTP(true);

      const response = await fetch(
        `http://localhost:5000/api/invitations/${token}/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            otp: otp.trim(),
          }),
        }
      );

      const data: VerifyOTPResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Invalid OTP"
        );
      }

      // -----------------------------------------------------
      // SAVE LOGIN INFORMATION
      // -----------------------------------------------------

      if (data.token && data.user) {
        localStorage.setItem(
          "token",
          data.token
        );

        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      setMessage(
        "OTP verified successfully! Redirecting..."
      );

      // -----------------------------------------------------
      // REDIRECT TO PARTICIPANT DASHBOARD
      // -----------------------------------------------------

      setTimeout(() => {
        onAccepted();
      }, 1000);

    } catch (err: unknown) {
      console.error(
        "Verify OTP error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to verify OTP"
      );
    } finally {
      setVerifyingOTP(false);
    }
  };

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
          <p className="text-gray-500">
            Loading invitation...
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // ERROR
  // ---------------------------------------------------------

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-xl">
              !
            </span>
          </div>

          <h1 className="text-xl font-semibold text-[#1A1A2E] mb-2">
            Invitation unavailable
          </h1>

          <p className="text-gray-500 text-sm">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  // ---------------------------------------------------------
  // INVITATION PAGE
  // ---------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Header */}

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1A1A2E]">
            EventFlow
          </h1>

          <p className="text-gray-500 mt-2">
            Complete your event registration
          </p>
        </div>

        {/* Card */}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">

          {/* Title */}

          <h2 className="text-xl font-semibold text-[#1A1A2E]">
            You're Invited!
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            You have been invited to participate
            in the following event.
          </p>

          {/* Event */}

          <div className="mt-6 bg-[#F7F8FC] rounded-xl p-4">

            <p className="text-xs text-gray-400 uppercase font-semibold">
              Event
            </p>

            <p className="text-lg font-semibold text-[#1A1A2E] mt-1">
              {invitation.event?.name ||
                "Event"}
            </p>

            {invitation.event?.type && (
              <p className="text-sm text-gray-500 mt-1">
                {invitation.event.type}
              </p>
            )}

            {invitation.event?.location && (
              <p className="text-sm text-gray-500 mt-2">
                📍 {invitation.event.location}
              </p>
            )}

          </div>

          {/* Participant */}

          <div className="mt-5">

            <p className="text-xs text-gray-400 uppercase font-semibold">
              Invited Participant
            </p>

            <p className="font-semibold text-[#1A1A2E] mt-1">
              {invitation.name}
            </p>

            <p className="text-sm text-gray-500">
              {invitation.email}
            </p>

          </div>

          {/* ================================================= */}
          {/* STEP 1 - NAME + MOBILE */}
          {/* ================================================= */}

          {!otpSent && (
            <form
              onSubmit={handleSendOTP}
              className="mt-6 space-y-4"
            >

              {/* Name */}

              <div>

                {/* <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                  Your Name
                </label> */}

                {/* <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Enter your name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#6276E8]"
                /> */}

              </div>

              {/* Mobile */}

              <div>

                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                  Mobile Number
                </label>

                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) =>
                    setMobile(e.target.value)
                  }
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#6276E8]"
                />

                <p className="text-xs text-gray-400 mt-1.5">
                  We'll send a 6-digit OTP to this
                  number.
                </p>

              </div>

              {/* Error */}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
                  {error}
                </div>
              )}

              {/* Success */}

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">
                  {message}
                </div>
              )}

              {/* Send OTP */}

              <button
                type="submit"
                disabled={sendingOTP}
                className="w-full gradient-primary text-white font-semibold py-3 rounded-xl disabled:opacity-50"
              >
                {sendingOTP
                  ? "Sending OTP..."
                  : "Send OTP"}
              </button>

            </form>
          )}

          {/* ================================================= */}
          {/* STEP 2 - OTP */}
          {/* ================================================= */}

          {otpSent && (
            <form
              onSubmit={handleVerifyOTP}
              className="mt-6 space-y-4"
            >

              <div>

                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                  Enter OTP
                </label>

                <input
                  type="text"
                  inputMode="numeric"
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
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-xl tracking-[0.4em] outline-none focus:border-[#6276E8]"
                />

                <p className="text-xs text-gray-400 mt-2 text-center">
                  Enter the 6-digit OTP sent to{" "}
                  <span className="font-medium">
                    {mobile}
                  </span>
                </p>

              </div>

              {/* Error */}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
                  {error}
                </div>
              )}

              {/* Success */}

              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">
                  {message}
                </div>
              )}

              {/* Verify */}

              <button
                type="submit"
                disabled={
                  verifyingOTP ||
                  otp.length !== 6
                }
                className="w-full gradient-primary text-white font-semibold py-3 rounded-xl disabled:opacity-50"
              >
                {verifyingOTP
                  ? "Verifying..."
                  : "Verify OTP & Continue"}
              </button>

              {/* Back */}

              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setError("");
                  setMessage("");
                }}
                className="w-full text-sm text-gray-500 hover:text-[#6276E8]"
              >
                ← Change mobile number
              </button>

            </form>
          )}

          {/* Expiry */}

          <p className="text-xs text-gray-400 text-center mt-5">
            Your invitation is valid until{" "}
            {new Date(
              invitation.expiresAt
            ).toLocaleDateString()}
          </p>

        </div>
      </div>
    </div>
  );
}