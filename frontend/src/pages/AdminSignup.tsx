import { type FormEvent, useState } from "react";
import API_BASE_URL from "../config/api";

interface AdminSignupProps {
  onBack: () => void;
  onRegistered: () => void;
}

export default function AdminSignup({
  onBack,
  onRegistered,
}: AdminSignupProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  setError("");
  setSuccess("");

  if (!name.trim()) {
    setError("Please enter your name.");
    return;
  }

  if (!email.trim()) {
    setError("Please enter your email.");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(
      `${API_BASE_URL}/auth/admin/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          mobile: mobile.trim(),
        }),
      }
    );

    const contentType =
      response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const text = await response.text();

      console.error(
        "Non-JSON response from server:",
        text
      );

      throw new Error(
        `Server returned a non-JSON response (${response.status}). Please check the backend route.`
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to create admin account."
      );
    }

    setSuccess(
      "Admin account created successfully. You can now login."
    );
  } catch (err) {
    console.error(
      "ADMIN SIGNUP ERROR:",
      err
    );

    setError(
      err instanceof Error
        ? err.message
        : "Something went wrong."
    );
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

          <button
            type="button"
            onClick={onBack}
            className="text-sm text-slate-500 hover:text-slate-800 mb-6"
          >
            ← Back
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900">
              Create Admin Account
            </h1>

            <p className="mt-2 text-slate-500">
              Register the administrator account for EventFlow.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter admin name"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mobile Number
                </label>

                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-slate-900 text-white py-3 font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "Creating Account..." : "Create Admin Account"}
              </button>

            </form>
          ) : (
            <button
              type="button"
              onClick={onRegistered}
              className="w-full rounded-lg bg-slate-900 text-white py-3 font-medium hover:bg-slate-800"
            >
              Continue to Admin Login
            </button>
          )}

        </div>
      </div>
    </div>
  );
}