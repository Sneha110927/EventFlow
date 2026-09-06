import { useEffect, useState } from "react";

interface EventItem {
  _id: string;
  name: string;
  type: string;
}

interface ParticipantUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Participant {
  _id: string;
  user: ParticipantUser;
  event?: EventItem;
  status: "pending" | "accepted" | "registered";
  registrationCompleted: boolean;
  joinedAt: string;
  createdAt: string;
}

interface ParticipantsResponse {
  participants?: Participant[];
  message?: string;
}

interface EventsResponse {
  events?: EventItem[];
  message?: string;
}

interface InvitationResponse {
  message?: string;
}

export default function Participants() {
  // =========================================================
  // STATE
  // =========================================================

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showInviteForm, setShowInviteForm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [eventId, setEventId] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // GET ACTUAL PARTICIPANTS
  // =========================================================

  const fetchParticipants = async (): Promise<Participant[]> => {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("You are not logged in.");
    }

    const response = await fetch(
      "http://localhost:5000/api/event-participants",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data: ParticipantsResponse = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to load participants"
      );
    }

    return data.participants || [];
  };

  // =========================================================
  // GET EVENTS
  // =========================================================

  const fetchEvents = async (): Promise<EventItem[]> => {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("You are not logged in.");
    }

    const response = await fetch(
      "http://localhost:5000/api/events",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data: EventsResponse = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to load events"
      );
    }

    return data.events || [];
  };

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [participantData, eventData] =
          await Promise.all([
            fetchParticipants(),
            fetchEvents(),
          ]);

        setParticipants(participantData);
        setEvents(eventData);
      } catch (err: unknown) {
        console.error(
          "Load participants error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load participants"
        );
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  // =========================================================
  // CREATE INVITATION
  // =========================================================

  const handleInvite = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      !name.trim() ||
      !email.trim() ||
      !eventId
    ) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setSending(true);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
      }

      const response = await fetch(
        "http://localhost:5000/api/invitations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            eventId,
          }),
        }
      );

      const data: InvitationResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create invitation"
        );
      }

      setMessage(
        "Invitation created successfully!"
      );

      setName("");
      setEmail("");
      setEventId("");

      setShowInviteForm(false);

      /*
       * IMPORTANT:
       *
       * We DO NOT add the invited person
       * to the participant list here.
       *
       * They will appear in Participants only
       * after they accept the invitation and
       * EventParticipant is created.
       */
    } catch (err: unknown) {
      console.error(
        "Invitation error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create invitation"
      );
    } finally {
      setSending(false);
    }
  };

  // =========================================================
  // FILTER PARTICIPANTS
  // =========================================================

  const filtered = participants.filter(
    (participant) => {
      const query = search.toLowerCase();

      const participantName =
        participant.user?.name?.toLowerCase() ||
        "";

      const participantEmail =
        participant.user?.email?.toLowerCase() ||
        "";

      const matchesSearch =
        !query ||
        participantName.includes(query) ||
        participantEmail.includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        participant.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    }
  );

  // =========================================================
  // STATUS BADGE
  // =========================================================

  const getStatusBadge = (
    status: Participant["status"]
  ) => {
    if (status === "accepted") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          Accepted
        </span>
      );
    }

    if (status === "registered") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          Registered
        </span>
      );
    }

    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">
        Pending
      </span>
    );
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-[#1A1A2E]">
            Participants
          </h2>

          <p className="text-sm text-[#9090A8] mt-0.5">
            {participants.length} participant
            {participants.length !== 1
              ? "s"
              : ""}
          </p>
        </div>

        <button
          onClick={() => {
            setShowInviteForm(
              !showInviteForm
            );
            setMessage("");
            setError("");
          }}
          className="gradient-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-soft hover:opacity-90 transition-opacity"
        >
          + Invite Participant
        </button>
      </div>

      {/* SUCCESS MESSAGE */}

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm">
          {message}
        </div>
      )}

      {/* INVITE FORM */}

      {showInviteForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          <h3 className="font-semibold text-lg text-[#1A1A2E] mb-5">
            Invite a Participant
          </h3>

          <form
            onSubmit={handleInvite}
            className="space-y-4"
          >

            {/* NAME */}

            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                Participant Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Enter participant name"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#6276E8]"
              />
            </div>

            {/* EMAIL */}

            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="participant@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#6276E8]"
              />
            </div>

            {/* EVENT */}

            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-1.5">
                Event
              </label>

              <select
                value={eventId}
                onChange={(e) =>
                  setEventId(e.target.value)
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#6276E8]"
              >
                <option value="">
                  Select an event
                </option>

                {events.map((event) => (
                  <option
                    key={event._id}
                    value={event._id}
                  >
                    {event.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ERROR */}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={sending}
              className="gradient-primary text-white font-semibold px-5 py-3 rounded-xl disabled:opacity-50"
            >
              {sending
                ? "Sending..."
                : "Send Invitation"}
            </button>

          </form>
        </div>
      )}

      {/* SEARCH + FILTER */}

      <div className="flex flex-col sm:flex-row gap-3">

        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#6276E8]"
        />

        <div className="flex gap-2 flex-wrap">

          <button
            onClick={() =>
              setStatusFilter("all")
            }
            className={`px-4 py-2 rounded-xl border ${
              statusFilter === "all"
                ? "bg-[#6276E8] text-white"
                : "bg-white text-gray-700"
            }`}
          >
            All
          </button>

          <button
            onClick={() =>
              setStatusFilter("accepted")
            }
            className={`px-4 py-2 rounded-xl border ${
              statusFilter === "accepted"
                ? "bg-[#6276E8] text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Accepted
          </button>

          <button
            onClick={() =>
              setStatusFilter("registered")
            }
            className={`px-4 py-2 rounded-xl border ${
              statusFilter === "registered"
                ? "bg-[#6276E8] text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Registered
          </button>

          <button
            onClick={() =>
              setStatusFilter("pending")
            }
            className={`px-4 py-2 rounded-xl border ${
              statusFilter === "pending"
                ? "bg-[#6276E8] text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Pending
          </button>

        </div>
      </div>

      {/* ERROR */}

      {error && !showInviteForm && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* LOADING */}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-500">
            Loading participants...
          </p>
        </div>
      ) : (

        /* TABLE */

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>
                <tr className="border-b border-gray-100">

                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500">
                    PARTICIPANT
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500">
                    EVENT
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500">
                    REGISTRATION
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500">
                    INVITATION
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500">
                    DOCUMENTS
                  </th>

                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500">
                    JOINED
                  </th>

                </tr>
              </thead>

              <tbody>

                {filtered.length === 0 ? (

                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-gray-400"
                    >
                      No participants found.
                    </td>
                  </tr>

                ) : (

                  filtered.map(
                    (participant) => (

                      <tr
                        key={participant._id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >

                        {/* PARTICIPANT */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="w-10 h-10 rounded-full bg-[#6276E8] text-white flex items-center justify-center font-semibold">
                              {participant.user?.name
                                ?.charAt(0)
                                .toUpperCase() ||
                                "?"}
                            </div>

                            <div>

                              <p className="font-semibold text-[#1A1A2E]">
                                {participant.user
                                  ?.name ||
                                  "Unknown user"}
                              </p>

                              <p className="text-sm text-gray-400">
                                {participant.user
                                  ?.email ||
                                  ""}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* EVENT */}

                        <td className="px-6 py-5">

                          <p className="font-medium text-[#1A1A2E]">
                            {participant.event
                              ?.name ||
                              "Unknown event"}
                          </p>

                          <p className="text-sm text-gray-400">
                            {participant.event
                              ?.type ||
                              ""}
                          </p>

                        </td>

                        {/* REGISTRATION */}

                        <td className="px-6 py-5">

                          {participant.registrationCompleted ? (

                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              Completed
                            </span>

                          ) : (

                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">
                              Pending
                            </span>

                          )}

                        </td>

                        {/* INVITATION */}

                        <td className="px-6 py-5">

                          {getStatusBadge(
                            participant.status
                          )}

                        </td>

                        {/* DOCUMENTS */}

                        <td className="px-6 py-5">

                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                            Missing
                          </span>

                        </td>

                        {/* JOINED */}

                        <td className="px-6 py-5 text-sm text-gray-500">

                          {participant.joinedAt
                            ? new Date(
                                participant.joinedAt
                              ).toLocaleDateString()
                            : new Date(
                                participant.createdAt
                              ).toLocaleDateString()}

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

      )}

    </div>
  );
}