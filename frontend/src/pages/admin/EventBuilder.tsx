import { useState, type FormEvent } from "react";

type EventType =
  | "conference"
  | "wedding"
  | "workshop"
  | "seminar"
  | "corporate"
  | "custom";

const API_URL = "http://localhost:5000/api";

const eventTypeConfig: Record<
  EventType,
  {
    label: string;
    emoji: string;
    color: string;
    bg: string;
    defaultModules: string[];
  }
> = {
  conference: {
    label: "Conference",
    emoji: "◎",
    color: "#5B6FD4",
    bg: "#EEF2FF",
    defaultModules: [
      "participants",
      "rsvp",
      "schedule",
      "documents",
      "chat",
      "announcements",
    ],
  },

  wedding: {
    label: "Wedding",
    emoji: "◈",
    color: "#9B7ECB",
    bg: "#F0EBFB",
    defaultModules: [
      "participants",
      "rsvp",
      "documents",
      "accommodation",
      "travel",
    ],
  },

  workshop: {
    label: "Workshop",
    emoji: "◉",
    color: "#E8824A",
    bg: "#FEF3ED",
    defaultModules: [
      "participants",
      "documents",
      "chat",
      "announcements",
    ],
  },

  seminar: {
    label: "Seminar",
    emoji: "◧",
    color: "#3D9E8C",
    bg: "#E6F4F1",
    defaultModules: [
      "participants",
      "rsvp",
      "schedule",
      "announcements",
    ],
  },

  corporate: {
    label: "Corporate Event",
    emoji: "◫",
    color: "#5B6FD4",
    bg: "#EEF2FF",
    defaultModules: [
      "participants",
      "rsvp",
      "schedule",
      "documents",
      "chat",
      "accommodation",
      "travel",
      "announcements",
    ],
  },

  custom: {
    label: "Custom Event",
    emoji: "+",
    color: "#9090A8",
    bg: "#F0F0F8",
    defaultModules: [],
  },
};

const allModules = [
  {
    id: "participants",
    label: "Participants",
    desc: "Manage attendee profiles and registration",
  },
  {
    id: "rsvp",
    label: "RSVP",
    desc: "Track attendance confirmations",
  },
  {
    id: "schedule",
    label: "Schedule",
    desc: "Create agenda and timetable",
  },
  {
    id: "documents",
    label: "Documents",
    desc: "Collect and manage file submissions",
  },
  {
    id: "chat",
    label: "Chat",
    desc: "Private messaging with participants",
  },
  {
    id: "announcements",
    label: "Announcements",
    desc: "Broadcast updates to all participants",
  },
  {
    id: "accommodation",
    label: "Accommodation",
    desc: "Manage hotel bookings and room assignments",
  },
  {
    id: "travel",
    label: "Travel",
    desc: "Coordinate travel logistics and arrivals",
  },
];

export default function EventBuilder() {
  const [step, setStep] = useState(1);

  const [eventType, setEventType] =
    useState<EventType | null>(null);

  const [modules, setModules] =
    useState<string[]>([]);

  const [form, setForm] = useState({
    name: "",
    date: "",
    endDate: "",
    venue: "",
    location: "",
    capacity: "",
    description: "",
  });

  const [notification, setNotification] =
    useState("");

  const [error, setError] =
    useState("");

  const [creating, setCreating] =
    useState(false);

  // =========================================================
  // NOTIFICATION
  // =========================================================

  const show = (message: string) => {
    setNotification(message);

    window.setTimeout(() => {
      setNotification("");
    }, 3000);
  };

  // =========================================================
  // SELECT EVENT TYPE
  // =========================================================

  const selectType = (type: EventType) => {
    setEventType(type);

    setModules(
      eventTypeConfig[type].defaultModules
    );

    setError("");
  };

  // =========================================================
  // TOGGLE MODULE
  // =========================================================

  const toggleModule = (id: string) => {
    setModules((previousModules) =>
      previousModules.includes(id)
        ? previousModules.filter(
            (module) => module !== id
          )
        : [...previousModules, id]
    );
  };

  // =========================================================
  // CREATE EVENT
  // =========================================================

const create = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  setError("");

  if (!form.name.trim()) {
    setError("Please enter an event name.");
    return;
  }

  if (!eventType) {
    setError("Please select an event type.");
    return;
  }

  if (!form.date) {
    setError("Please select a start date.");
    return;
  }

  if (!form.endDate) {
    setError("Please select an end date.");
    return;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    setError("You are not logged in.");
    return;
  }

  setCreating(true);

  try {
    /*
     * Convert the frontend module array:
     *
     * ["participants", "documents", "chat"]
     *
     * into the object expected by MongoDB:
     *
     * {
     *   participants: true,
     *   registration: false,
     *   documents: true,
     *   chat: true,
     *   ...
     * }
     */

    const moduleConfig = {
      participants: modules.includes("participants"),

      registration:
        modules.includes("rsvp"),

      schedule:
        modules.includes("schedule"),

      documents:
        modules.includes("documents"),

      announcements:
        modules.includes("announcements"),

      chat:
        modules.includes("chat"),

      accommodation:
        modules.includes("accommodation"),

      travel:
        modules.includes("travel"),
    };

    const payload = {
      name: form.name.trim(),

      type: eventType,

      description:
        form.description.trim(),

      startDate: form.date,

      endDate: form.endDate,

      location: [
        form.venue.trim(),
        form.location.trim(),
      ]
        .filter(Boolean)
        .join(", "),

      modules: moduleConfig,
    };

    console.log(
      "SENDING EVENT TO BACKEND:",
      payload
    );

    const response = await fetch(
      `${API_URL}/events`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    console.log(
      "CREATE EVENT RESPONSE:",
      data
    );

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to create event"
      );
    }

    show(
      "Event created successfully!"
    );

    console.log(
      "EVENT SAVED:",
      data.event
    );

    /*
     * Reset builder after successful
     * database creation.
     */

    setStep(1);

    setEventType(null);

    setModules([]);

    setForm({
      name: "",
      date: "",
      endDate: "",
      venue: "",
      location: "",
      capacity: "",
      description: "",
    });

  } catch (error) {
    console.error(
      "CREATE EVENT ERROR:",
      error
    );

    setError(
      error instanceof Error
        ? error.message
        : "Failed to create event"
    );
  } finally {
    setCreating(false);
  }
};

  const config =
    eventType
      ? eventTypeConfig[eventType]
      : null;

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* ================================================= */}
      {/* SUCCESS NOTIFICATION */}
      {/* ================================================= */}

      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-[#3D9E8C] text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium">
          ✓ {notification}
        </div>
      )}

      {/* ================================================= */}
      {/* ERROR NOTIFICATION */}
      {/* ================================================= */}

      {error && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 bg-[#E05252] text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium max-w-xl">
          {error}
        </div>
      )}

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div>
        <h2 className="font-display text-2xl text-[#1A1A2E]">
          Event Builder
        </h2>

        <p className="text-sm text-[#9090A8] mt-0.5">
          Create and configure a new
          event in three steps
        </p>
      </div>

      {/* ================================================= */}
      {/* STEPS */}
      {/* ================================================= */}

      <div className="flex items-center gap-2">

        {[
          {
            n: 1,
            label: "Choose Type",
          },
          {
            n: 2,
            label: "Configure Modules",
          },
          {
            n: 3,
            label: "Event Details",
          },
        ].map((s, i) => (
          <div
            key={s.n}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => {
                if (s.n < step) {
                  setStep(s.n);
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                step === s.n
                  ? "bg-[#5B6FD4] text-white shadow-lg"
                  : step > s.n
                  ? "bg-[#E6F4F1] text-[#3D9E8C] cursor-pointer"
                  : "bg-[#F0F0F8] text-[#9090A8]"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > s.n
                    ? "bg-[#3D9E8C] text-white"
                    : step === s.n
                    ? "bg-white/30"
                    : "bg-[#E0E0F0]"
                }`}
              >
                {step > s.n
                  ? "✓"
                  : s.n}
              </span>

              {s.label}
            </button>

            {i < 2 && (
              <div
                className={`w-6 h-0.5 rounded-full ${
                  step > s.n
                    ? "bg-[#3D9E8C]"
                    : "bg-[#E0E0F0]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ================================================= */}
      {/* STEP 1 — EVENT TYPE */}
      {/* ================================================= */}

      {step === 1 && (
        <div>

          <p className="text-sm text-[#5A5A72] mb-4">
            Select the type of event
            you're creating
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

            {(
              Object.entries(
                eventTypeConfig
              ) as [
                EventType,
                typeof eventTypeConfig[EventType]
              ][]
            ).map(
              ([type, cfg]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    selectType(type);
                    setStep(2);
                  }}
                  className={`p-5 rounded-2xl border-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                    eventType === type
                      ? "border-current shadow-lg"
                      : "border-[#E8E8F0] bg-white hover:border-[#C0C0D8]"
                  }`}
                  style={
                    eventType === type
                      ? {
                          background:
                            cfg.bg,
                          borderColor:
                            cfg.color,
                        }
                      : {}
                  }
                >
                  <span className="text-2xl block mb-2">
                    {cfg.emoji}
                  </span>

                  <p className="font-semibold text-sm text-[#1A1A2E]">
                    {cfg.label}
                  </p>

                  <p className="text-xs text-[#9090A8] mt-1">
                    {
                      cfg
                        .defaultModules
                        .length
                    }{" "}
                    default modules
                  </p>
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* STEP 2 — MODULES */}
      {/* ================================================= */}

      {step === 2 &&
        config && (
          <div>

            <div className="flex items-center gap-3 mb-5">

              <div
                className="px-3 py-1.5 rounded-xl text-sm font-medium"
                style={{
                  background:
                    config.bg,
                  color:
                    config.color,
                }}
              >
                {config.emoji}{" "}
                {config.label}
              </div>

              <p className="text-sm text-[#9090A8]">
                Toggle the modules for
                this event
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">

              {allModules.map(
                (module) => {
                  const enabled =
                    modules.includes(
                      module.id
                    );

                  return (
                    <button
                      key={module.id}
                      type="button"
                      onClick={() =>
                        toggleModule(
                          module.id
                        )
                      }
                      className={`flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                        enabled
                          ? "border-[#5B6FD4] bg-[#EEF2FF]"
                          : "border-[#E8E8F0] bg-white hover:border-[#C0C0D8]"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                          enabled
                            ? "bg-[#5B6FD4] border-[#5B6FD4]"
                            : "border-[#C0C0D0]"
                        }`}
                      >
                        {enabled && (
                          <span className="text-white text-xs font-bold">
                            ✓
                          </span>
                        )}
                      </div>

                      <div>
                        <p
                          className={`font-medium text-sm ${
                            enabled
                              ? "text-[#5B6FD4]"
                              : "text-[#1A1A2E]"
                          }`}
                        >
                          {module.label}
                        </p>

                        <p className="text-xs text-[#9090A8] mt-0.5">
                          {module.desc}
                        </p>
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            <div className="flex gap-3 mt-5">

              <button
                type="button"
                onClick={() =>
                  setStep(3)
                }
                className="bg-[#5B6FD4] text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                Continue →
              </button>

              <button
                type="button"
                onClick={() =>
                  setStep(1)
                }
                className="bg-[#F0F0F8] text-[#5A5A72] font-medium px-6 py-3 rounded-xl hover:bg-[#E8E8F0]"
              >
                Back
              </button>
            </div>
          </div>
        )}

      {/* ================================================= */}
      {/* STEP 3 — EVENT DETAILS */}
      {/* ================================================= */}

      {step === 3 &&
        config && (
          <form
            onSubmit={create}
            className="space-y-5"
          >

            {/* EVENT INFORMATION */}

            <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-lg p-6 space-y-4">

              <h3 className="font-semibold text-[#1A1A2E]">
                Event Information
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">

                {/* EVENT NAME */}

                <div className="sm:col-span-2">

                  <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                    Event Name
                  </label>

                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                    placeholder="Tech Summit 2027"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4]"
                    required
                  />
                </div>

                {/* START DATE */}

                <div>

                  <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4]"
                    required
                  />
                </div>

                {/* END DATE */}

                <div>

                  <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={form.endDate}
                    min={form.date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        endDate:
                          e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4]"
                    required
                  />
                </div>

                {/* VENUE */}

                <div>

                  <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                    Venue Name
                  </label>

                  <input
                    value={form.venue}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        venue: e.target.value,
                      })
                    }
                    placeholder="Moscone Center"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4]"
                  />
                </div>

                {/* LOCATION */}

                <div>

                  <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                    Location / City
                  </label>

                  <input
                    value={form.location}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        location:
                          e.target.value,
                      })
                    }
                    placeholder="San Francisco, CA"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4]"
                  />
                </div>

                {/* CAPACITY */}

                <div>

                  <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                    Capacity
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        capacity:
                          e.target.value,
                      })
                    }
                    placeholder="500"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4]"
                  />

                  <p className="text-xs text-[#9090A8] mt-1">
                    Capacity is not
                    currently stored in
                    the Event database.
                  </p>
                </div>

                {/* DESCRIPTION */}

                <div className="sm:col-span-2">

                  <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                    Description
                  </label>

                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description:
                          e.target.value,
                      })
                    }
                    placeholder="A brief description of the event..."
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8F0] bg-[#FAFAF7] text-sm focus:outline-none focus:border-[#5B6FD4] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* ================================================= */}
            {/* SELECTED MODULES */}
            {/* ================================================= */}

            <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-lg p-5">

              <h3 className="font-semibold text-[#1A1A2E] mb-3 text-sm">
                Selected Modules (
                {modules.length})
              </h3>

              <div className="flex flex-wrap gap-2">

                {modules.map(
                  (moduleId) => {
                    const module =
                      allModules.find(
                        (item) =>
                          item.id ===
                          moduleId
                      );

                    return (
                      <span
                        key={moduleId}
                        className="text-xs bg-[#EEF2FF] text-[#5B6FD4] px-3 py-1 rounded-full font-medium"
                      >
                        {module?.label ||
                          moduleId}
                      </span>
                    );
                  }
                )}

                {modules.length ===
                  0 && (
                  <span className="text-xs text-[#9090A8]">
                    No modules selected
                  </span>
                )}
              </div>
            </div>

            {/* ================================================= */}
            {/* BUTTONS */}
            {/* ================================================= */}

            <div className="flex gap-3">

              <button
                type="submit"
                disabled={creating}
                className="bg-[#5B6FD4] text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creating
                  ? "Creating Event..."
                  : "Create Event"}
              </button>

              <button
                type="button"
                disabled={creating}
                onClick={() =>
                  setStep(2)
                }
                className="bg-[#F0F0F8] text-[#5A5A72] font-medium px-6 py-3 rounded-xl hover:bg-[#E8E8F0] transition-colors disabled:opacity-50"
              >
                Back
              </button>
            </div>
          </form>
        )}
    </div>
  );
}