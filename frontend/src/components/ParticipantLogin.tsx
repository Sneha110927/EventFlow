import { useState } from "react";

interface ParticipantLoginProps {
  onLogin: (role: "participant") => void;
  onBack: () => void;
}

export default function ParticipantLogin({
  onLogin,
  onBack,
}: ParticipantLoginProps) {

  const [mobile, setMobile] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [otpSent, setOtpSent] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");


  // ==========================================================
  // SEND OTP
  // ==========================================================

  const handleSendOtp = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {

    e.preventDefault();

    setError("");
    setMessage("");

    const cleanMobile =
      mobile.replace(/\D/g, "");

    if (!cleanMobile) {
      setError(
        "Please enter your mobile number."
      );
      return;
    }

    if (cleanMobile.length !== 10) {
      setError(
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    setLoading(true);

    try {

      console.log(
        "📱 Sending participant OTP..."
      );

      console.log(
        "Mobile:",
        cleanMobile
      );


      const response =
        await fetch(
          "http://localhost:5000/api/auth/participant/send-otp",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              mobile: cleanMobile,
            }),
          }
        );


      const data =
        await response.json();


      console.log(
        "Send OTP response:",
        data
      );


      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to send OTP."
        );
      }


      setOtpSent(true);

      setMessage(
        "OTP has been generated. Check the backend terminal for the development OTP."
      );

    } catch (error) {

      console.error(
        "Send OTP error:",
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
    e: React.FormEvent<HTMLFormElement>
  ) => {

    e.preventDefault();

    setError("");
    setMessage("");


    const cleanMobile =
      mobile.replace(/\D/g, "");

    const cleanOTP =
      otp.replace(/\D/g, "");


    if (cleanOTP.length !== 6) {
      setError(
        "OTP must be 6 digits."
      );
      return;
    }


    setLoading(true);


    try {

      console.log(
        "🔐 Verifying participant OTP..."
      );


      const response =
        await fetch(
          "http://localhost:5000/api/auth/participant/verify-otp",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              mobile: cleanMobile,
              otp: cleanOTP,
            }),
          }
        );


      const data =
        await response.json();


      console.log(
        "Verify OTP response:",
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


      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );


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
        "Verify OTP error:",
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
  // CHANGE MOBILE
  // ==========================================================

  const handleChangeMobile = () => {

    setOtpSent(false);

    setOtp("");

    setMessage("");

    setError("");

  };


  return (
    <div className="min-h-full gradient-hero flex items-center justify-center p-6">

      <div className="w-full max-w-md">


        {/* ==================================================
            LOGO
        ================================================== */}

        <div className="text-center mb-8">

          <button
            onClick={onBack}
            className="inline-flex items-center gap-3"
          >

            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-card">

              <span className="text-white font-bold">
                E
              </span>

            </div>


            <span className="font-display text-2xl text-[#1A1A2E]">
              Evently
            </span>

          </button>

        </div>


        {/* ==================================================
            CARD
        ================================================== */}

        <div className="bg-white rounded-3xl shadow-elevated p-8 border border-[#E8E8F0]">


          {/* ==================================================
              HEADING
          ================================================== */}

          <h1 className="font-display text-3xl text-[#1A1A2E] text-center mb-2">
            Participant Portal
          </h1>


          <p className="text-sm text-[#9090A8] text-center mb-8">
            Sign in using your mobile number and OTP
          </p>


          {/* ==================================================
              MOBILE FORM
          ================================================== */}

          {!otpSent ? (

            <form
              onSubmit={handleSendOtp}
              className="space-y-5"
            >


              {/* Mobile */}

              <div>

                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                  Mobile Number
                </label>


                <input
                  type="tel"
                  value={mobile}

                  onChange={(e) =>
                    setMobile(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10)
                    )
                  }

                  placeholder="10-digit mobile number"

                  maxLength={10}

                  inputMode="numeric"

                  className="w-full px-4 py-3 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10"
                />


                <p className="text-xs text-[#9090A8] mt-2">
                  Use the mobile number associated with your invitation.
                </p>

              </div>


              {/* Error */}

              {error && (

                <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-[#D95B5B]">

                  {error}

                </div>

              )}


              {/* Button */}

              <button
                type="submit"
                disabled={loading}

                className="w-full gradient-primary text-white font-semibold py-3.5 rounded-xl shadow-soft hover:opacity-90 transition-all disabled:opacity-70"
              >

                {loading
                  ? "Sending OTP..."
                  : "Send OTP"}

              </button>

            </form>

          ) : (

            /* =================================================
               OTP FORM
            ================================================= */

            <form
              onSubmit={handleVerifyOtp}
              className="space-y-5"
            >


              {/* Mobile */}

              <div className="bg-[#FAFAF7] rounded-xl p-4">

                <p className="text-xs text-[#9090A8]">
                  OTP sent to
                </p>


                <p className="font-semibold text-[#1A1A2E] mt-1">
                  +91 {mobile}
                </p>

              </div>


              {/* OTP */}

              <div>

                <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                  Enter OTP
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

                  autoFocus

                  className="w-full px-4 py-3 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-center tracking-[0.5em] text-lg font-semibold focus:outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10"
                />

              </div>


              {/* Success message */}

              {message && (

                <div className="px-4 py-3 bg-green-50 border border-green-100 rounded-xl text-sm text-[#3D9E8C]">

                  {message}

                </div>

              )}


              {/* Error */}

              {error && (

                <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-[#D95B5B]">

                  {error}

                </div>

              )}


              {/* Verify */}

              <button
                type="submit"
                disabled={
                  loading ||
                  otp.length !== 6
                }

                className="w-full gradient-primary text-white font-semibold py-3.5 rounded-xl shadow-soft hover:opacity-90 transition-all disabled:opacity-70"
              >

                {loading
                  ? "Verifying..."
                  : "Verify OTP"}

              </button>


              {/* Change mobile */}

              <button
                type="button"

                onClick={
                  handleChangeMobile
                }

                className="w-full text-sm text-[#5B6FD4] hover:underline"
              >

                Change mobile number

              </button>

            </form>

          )}


          {/* ==================================================
              BACK
          ================================================== */}

          <button
            onClick={onBack}

            className="w-full mt-6 text-sm text-[#9090A8] hover:text-[#5B6FD4]"
          >

            ← Back

          </button>

        </div>

      </div>

    </div>
  );
}