import {
  useState,
  type FormEvent,
} from "react";

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
};

export default function EventBuilder({
  onNavigate,
}: EventBuilderProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] =
    useState("");
  const [startDate, setStartDate] =
    useState("");
  const [endDate, setEndDate] =
    useState("");
  const [location, setLocation] =
    useState("");

  const [modules, setModules] =
    useState<Modules>(defaultModules);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError(
        "Please enter an event name."
      );
      return;
    }

    if (!type.trim()) {
      setError(
        "Please enter an event type."
      );
      return;
    }

    if (
      startDate &&
      endDate &&
      new Date(endDate) <
        new Date(startDate)
    ) {
      setError(
        "End date cannot be before the start date."
      );
      return;
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
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: name.trim(),

            type: type.trim(),

            description:
              description.trim(),

            startDate:
              startDate || undefined,

            endDate:
              endDate || undefined,

            location:
              location.trim(),

            modules,
          }),
        }
      );

      const data =
        await response.json();

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
        <div />
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