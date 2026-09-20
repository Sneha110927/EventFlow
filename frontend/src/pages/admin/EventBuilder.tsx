import { useState, type FormEvent } from "react";
import API_BASE_URL from "../../config/api";

interface EventBuilderProps {
  onNavigate: (page: string) => void;
}

interface Modules {
  participants: boolean;
  registration: boolean;
  schedule: boolean;
  documents: boolean;
  announcements: boolean;
  chat: boolean;
  accommodation: boolean;
  travel: boolean;
  virtualMeeting: boolean;
}

const defaultModules: Modules = {
  participants: true,
  registration: true,
  schedule: true,
  documents: true,
  announcements: true,
  chat: true,
  accommodation: false,
  travel: false,
  virtualMeeting: false,
};

export default function EventBuilder({
  onNavigate,
}: EventBuilderProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [modules, setModules] =
    useState<Modules>(defaultModules);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter an event name.");
      return;
    }

    if (!type.trim()) {
      setError("Please enter an event type.");
      return;
    }

    if (
      startDate &&
      endDate &&
      new Date(endDate) < new Date(startDate)
    ) {
      setError(
        "End date cannot be before the start date."
      );
      return;
    }

    if (
      modules.virtualMeeting &&
      !meetingLink.trim()
    ) {
      setError(
        "Please enter the Google Meet link for this event."
      );
      return;
    }

    if (modules.virtualMeeting) {
      try {
        const url = new URL(meetingLink.trim());

        if (
          url.protocol !== "https:" ||
          !url.hostname.includes("meet.google.com")
        ) {
          setError(
            "Please enter a valid Google Meet link."
          );
          return;
        }
      } catch {
        setError(
          "Please enter a valid Google Meet link."
        );
        return;
      }
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      setError(
        "Your session has expired. Please log in again."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE_URL}/events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            type: type.trim(),
            description: description.trim(),
            startDate:
              startDate || undefined,
            endDate:
              endDate || undefined,
            location: location.trim(),
            modules,
            meetingLink:
              modules.virtualMeeting
                ? meetingLink.trim()
                : "",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create event."
        );
      }

      setSuccess(
        "Event created successfully."
      );

      setName("");
      setType("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setLocation("");
      setMeetingLink("");
      setModules(defaultModules);

      setTimeout(() => {
        onNavigate("dashboard");
      }, 800);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create event."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          {/* <h1 className="font-display text-2xl text-[#1A1A2E]">
            Create New Event
          </h1>

          <p className="text-sm text-[#9090A8] mt-1">
            Set up your event and choose the features you need.
          </p> */}
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-600">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-6">
          <h2 className="font-semibold text-[#1A1A2E] mb-5">
            Event Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                Event Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Tech Summit 2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                Event Type
              </label>

              <input
                type="text"
                value={type}
                onChange={(e) =>
                  setType(e.target.value)
                }
                placeholder="Conference"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                placeholder="Describe your event..."
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm outline-none resize-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  setStartDate(
                    e.target.value
                  )
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                min={
                  startDate || undefined
                }
                onChange={(e) =>
                  setEndDate(
                    e.target.value
                  )
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                Location
              </label>

              <input
                type="text"
                value={location}
                onChange={(e) =>
                  setLocation(
                    e.target.value
                  )
                }
                placeholder="New Delhi, India"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10"
              />
            </div>
          </div>
        </div>

        {/* <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-6">
          <h2 className="font-semibold text-[#1A1A2E]">
            Event Modules
          </h2>

          <p className="text-sm text-[#9090A8] mt-1 mb-5">
            Select the features that should be available for this event.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              Object.keys(
                modules
              ) as Array<keyof Modules>
            ).map((module) => (
              <button
                key={module}
                type="button"
                onClick={() =>
                  updateModule(module)
                }
                className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                  modules[module]
                    ? "border-[#5B6FD4]/30 bg-[#EEF2FF]"
                    : "border-[#E8E8F0] bg-[#FAFAF7]"
                }`}
              >
                <span className="text-sm font-medium text-[#1A1A2E]">
                  {moduleLabels[module]}
                </span>

                <span
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                    modules[module]
                      ? "bg-[#5B6FD4]"
                      : "bg-[#D8D8E2]"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      modules[module]
                        ? "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </span>
              </button>
            ))}
          </div>

          {modules.virtualMeeting && (
            <div className="mt-5 rounded-xl border border-[#D9DEFA] bg-[#F8F9FF] p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-[#EEF2FF] flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-[#5B6FD4]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#1A1A2E]">
                    Virtual Event
                  </h3>

                  <p className="text-xs text-[#9090A8] mt-1">
                    Add a Google Meet link for participants who cannot attend the event physically.
                  </p>
                </div>
              </div>

              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                Google Meet Link
              </label>

              <input
                type="url"
                value={meetingLink}
                onChange={(e) =>
                  setMeetingLink(
                    e.target.value
                  )
                }
                placeholder="https://meet.google.com/abc-defg-hij"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E8F0] bg-white text-sm outline-none focus:border-[#5B6FD4] focus:ring-2 focus:ring-[#5B6FD4]/10"
              />

              <p className="text-xs text-[#9090A8] mt-2">
                Only participants of this event will receive access to this virtual meeting.
              </p>
            </div>
          )}
        </div> */}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() =>
              onNavigate("dashboard")
            }
            className="px-5 py-2.5 rounded-xl border border-[#E8E8F0] bg-white text-sm font-medium text-[#5A5A72] hover:bg-[#F7F7F3]"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="gradient-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? "Creating..."
              : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}