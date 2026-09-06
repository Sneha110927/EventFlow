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

interface AcceptResponse {
  message?: string;
  user?: {
    id: string;
    name: string;
    email: string;
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
  const [creating, setCreating] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

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
  // ACCEPT INVITATION
  // ---------------------------------------------------------

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!password || !confirmPassword) {
      setError(
        "Please enter and confirm your password."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setCreating(true);

      const response = await fetch(
        `http://localhost:5000/api/invitations/accept/${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password,
          }),
        }
      );

      const data: AcceptResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create participant account"
        );
      }

      setMessage(
        "Account created successfully! Redirecting to login..."
      );

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        onAccepted();
      }, 1500);
    } catch (err: unknown) {
      console.error(
        "Accept invitation error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create account"
      );
    } finally {
      setCreating(false);
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
              Participant
            </p>

            <p className="font-semibold text-[#1A1A2E] mt-1">
              {invitation.name}
            </p>

            <p className="text-sm text-gray-500">
              {invitation.email}
            </p>

          </div>

          {/* Password Form */}

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4"
          >

            <div>

              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                Create Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Minimum 6 characters"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#6276E8]"
              />

            </div>

            <div>

              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                Confirm Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                placeholder="Enter password again"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#6276E8]"
              />

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

            {/* Button */}

            <button
              type="submit"
              disabled={creating}
              className="w-full gradient-primary text-white font-semibold py-3 rounded-xl disabled:opacity-50"
            >
              {creating
                ? "Creating Account..."
                : "Accept Invitation"}
            </button>

          </form>

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