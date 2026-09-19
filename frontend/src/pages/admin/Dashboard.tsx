import { useEffect, useState } from "react";

import API_BASE_URL from "../../config/api";

export interface Event {
  _id: string;
  name: string;
  type: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;

  modules?: {
    participants: boolean;
    registration: boolean;
    schedule: boolean;
    documents: boolean;
    announcements: boolean;
    chat: boolean;
    accommodation: boolean;
    travel: boolean;
  };

  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };

  createdAt: string;
  updatedAt: string;
}

interface DashboardProps {
  onNavigate: (
    page: string,
    id?: string
  ) => void;

  selectedEvent: Event | null;

  onEventChange: (
    event: Event | null
  ) => void;
}

interface ParticipantUser {
  _id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
}

interface EventParticipant {
  _id: string;

  event:
    | string
    | {
        _id: string;
        name: string;
      };

  user:
    | string
    | ParticipantUser;

  status:
    | "registered"
    | "accepted"
    | "pending"
    | "cancelled"
    | string;

  registrationCompleted?: boolean;

  joinedAt?: string;

  createdAt: string;

  updatedAt?: string;
}

export default function AdminDashboard({
  onNavigate,
  selectedEvent,
  onEventChange,
}: DashboardProps) {
  const [events, setEvents] =
    useState<Event[]>([]);

  const [participants, setParticipants] =
    useState<EventParticipant[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    participantsLoading,
    setParticipantsLoading,
  ] = useState(false);

  const [deletingEventId, setDeletingEventId] =
    useState<string | null>(null);

  const [eventToDelete, setEventToDelete] =
    useState<Event | null>(null);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const fetchEvents =
      async () => {
        try {
          setLoading(true);
          setError("");

          const token =
            localStorage.getItem(
              "token"
            );

          if (!token) {
            throw new Error(
              "You are not logged in."
            );
          }

          const response =
            await fetch(
              `${API_BASE_URL}/events`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Failed to load events."
            );
          }

          const loadedEvents: Event[] =
            data.events || [];

          setEvents(
            loadedEvents
          );

          if (
            loadedEvents.length ===
            0
          ) {
            onEventChange(null);
            return;
          }

          if (selectedEvent) {
            const existingEvent =
              loadedEvents.find(
                (event) =>
                  event._id ===
                  selectedEvent._id
              );

            if (existingEvent) {
              onEventChange(
                existingEvent
              );
            } else {
              onEventChange(
                loadedEvents[0]
              );
            }
          } else {
            onEventChange(
              loadedEvents[0]
            );
          }
        } catch (err) {
          if (
            err instanceof Error
          ) {
            setError(
              err.message
            );
          } else {
            setError(
              "Failed to load events."
            );
          }
        } finally {
          setLoading(false);
        }
      };

    void fetchEvents();
  }, []);

  useEffect(() => {
    const fetchParticipants =
      async () => {
        if (!selectedEvent) {
          setParticipants([]);
          return;
        }

        try {
          setParticipantsLoading(
            true
          );

          const token =
            localStorage.getItem(
              "token"
            );

          if (!token) {
            return;
          }

          const response =
            await fetch(
              `${API_BASE_URL}/event-participants/event/${selectedEvent._id}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.message ||
                "Failed to load participants."
            );
          }

          setParticipants(
            data.participants ||
              []
          );
        } catch (err) {
          console.error(
            "Failed to load participants:",
            err
          );

          setParticipants([]);
        } finally {
          setParticipantsLoading(
            false
          );
        }
      };

    void fetchParticipants();
  }, [selectedEvent]);

  const handleDeleteEvent = async (
    event: Event
  ) => {
    try {
      setDeletingEventId(
        event._id
      );

      setError("");

      const token =
        localStorage.getItem(
          "token"
        );

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
      }

      const response =
        await fetch(
          `${API_BASE_URL}/events/${event._id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete event."
        );
      }

      const remainingEvents =
        events.filter(
          (item) =>
            item._id !==
            event._id
        );

      setEvents(
        remainingEvents
      );

      if (
        selectedEvent?._id ===
        event._id
      ) {
        if (
          remainingEvents.length >
          0
        ) {
          onEventChange(
            remainingEvents[0]
          );
        } else {
          onEventChange(null);
        }
      }

      setEventToDelete(null);
    } catch (err) {
      console.error(
        "Failed to delete event:",
        err
      );

      if (
        err instanceof Error
      ) {
        setError(
          err.message
        );
      } else {
        setError(
          "Failed to delete event."
        );
      }
    } finally {
      setDeletingEventId(
        null
      );
    }
  };

  const registered =
    participants.length;

  const confirmed =
    participants.filter(
      (participant) =>
        participant.status ===
          "registered" ||
        participant.status ===
          "accepted"
    ).length;

  const pending =
    participants.filter(
      (participant) =>
        participant.status ===
        "pending"
    ).length;

  const pendingDocs = 0;

  const stats = [
    {
      label: "Registered",
      value: registered,
      total: null as number | null,
      color: "#5B6FD4",
      bg: "gradient-card-blue",
    },
    {
      label: "Confirmed",
      value: confirmed,
      total: registered,
      color: "#3D9E8C",
      bg: "gradient-card-teal",
    },
    {
      label: "Pending",
      value: pending,
      total: registered,
      color: "#E8A438",
      bg: "gradient-card-peach",
    },
    {
      label: "Docs Pending",
      value: pendingDocs,
      total: registered,
      color: "#9B7ECB",
      bg: "gradient-card-lavender",
    },
  ];

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft p-10 text-center">
          <div className="flex justify-center mb-4">
            <svg
              className="w-8 h-8 animate-spin text-[#5B6FD4]"
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>

          <p className="text-sm text-[#9090A8]">
            Loading your events...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-red-100 shadow-soft p-8 text-center">
          <div className="text-red-500 text-3xl mb-3">
            !
          </div>

          <h2 className="font-semibold text-[#1A1A2E] mb-2">
            Unable to load events
          </h2>

          <p className="text-sm text-[#9090A8] mb-5">
            {error}
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
            className="gradient-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 gradient-primary rounded-2xl p-6 text-white shadow-card">
          <p className="text-white/70 text-sm mb-1">
            Welcome back,
          </p>

          <h2 className="font-display text-2xl mb-4">
            Event Admin
          </h2>

          {selectedEvent ? (
            <>
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wider">
                    Event
                  </p>

                  <p className="font-semibold">
                    {selectedEvent.name}
                  </p>
                </div>

                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wider">
                    Date
                  </p>

                  <p className="font-semibold">
                    {selectedEvent.startDate
                      ? new Date(
                          selectedEvent.startDate
                        ).toLocaleDateString(
                          "en-US",
                          {
                            month:
                              "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )
                      : "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wider">
                    Venue
                  </p>

                  <p className="font-semibold">
                    {selectedEvent.location ||
                      "Not set"}
                  </p>
                </div>
              </div>

              {events.length > 1 && (
                <div className="mt-5">
                  <label className="text-xs text-white/60 uppercase tracking-wider">
                    Dashboard Event
                  </label>

                  <select
                    value={
                      selectedEvent._id
                    }
                    onChange={(e) => {
                      const event =
                        events.find(
                          (item) =>
                            item._id ===
                            e.target.value
                        );

                      if (event) {
                        onEventChange(
                          event
                        );
                      }
                    }}
                    className="mt-1 w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none"
                  >
                    {events.map(
                      (event) => (
                        <option
                          key={
                            event._id
                          }
                          value={
                            event._id
                          }
                          className="text-[#1A1A2E]"
                        >
                          {event.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}

              <div className="mt-4">
                <div className="flex justify-between text-xs text-white/70 mb-1">
                  <span>
                    Registered
                    participants
                  </span>

                  <span>
                    {participantsLoading
                      ? "..."
                      : registered}
                  </span>
                </div>

                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{
                      width:
                        registered >
                        0
                          ? "100%"
                          : "0%",
                    }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <p className="text-white/70 text-sm">
                You haven't created an event yet.
              </p>

              <button
                onClick={() =>
                  onNavigate(
                    "event-builder"
                  )
                }
                className="mt-4 bg-white text-[#5B6FD4] px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
              >
                Create Your First Event
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E8E8F0] shadow-soft lg:w-72">
          <h3 className="font-semibold text-[#1A1A2E] mb-4">
            Quick Actions
          </h3>

          <div className="space-y-2">
            <button
              onClick={() =>
                onNavigate(
                  "invitations"
                )
              }
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#EEF2FF] text-[#5B6FD4] hover:opacity-80 transition-opacity text-sm font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-[#5B6FD4]" />
              Invite Participants
            </button>

            <button
              onClick={() =>
                onNavigate(
                  "announcements"
                )
              }
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#E6F4F1] text-[#3D9E8C] hover:opacity-80 transition-opacity text-sm font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-[#3D9E8C]" />
              Broadcast Announcement
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const total =
            stat.total || 0;

          const percentage =
            total > 0
              ? Math.min(
                  (stat.value /
                    total) *
                    100,
                  100
                )
              : stat.value > 0
              ? 100
              : 0;

          return (
            <div
              key={stat.label}
              className={`${stat.bg} rounded-2xl p-5 border border-white/60 shadow-soft`}
            >
              <p className="text-xs font-medium text-[#9090A8] uppercase tracking-wider mb-2">
                {stat.label}
              </p>

              <p
                className="font-display text-3xl"
                style={{
                  color:
                    stat.color,
                }}
              >
                {stat.value}
              </p>

              <p className="text-xs text-[#9090A8] mt-1">
                {stat.total !==
                null
                  ? `of ${stat.total} total`
                  : "Current total"}
              </p>

              <div className="mt-3 h-1 bg-white/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${percentage}%`,
                    background:
                      stat.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E8F0] shadow-soft overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8F0]">
          <h3 className="font-semibold text-[#1A1A2E]">
            All Events
          </h3>

          <button
            onClick={() =>
              onNavigate(
                "event-builder"
              )
            }
            className="text-xs font-semibold text-white gradient-primary px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            + New Event
          </button>
        </div>

        {events.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-[#9090A8] mb-4">
              No events have been created yet.
            </p>

            <button
              onClick={() =>
                onNavigate(
                  "event-builder"
                )
              }
              className="gradient-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
            >
              Create Event
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-medium text-[#9090A8] uppercase tracking-wider border-b border-[#F0F0F8]">
                  <th className="text-left px-6 py-3">
                    Event
                  </th>

                  <th className="text-left px-6 py-3">
                    Type
                  </th>

                  <th className="text-left px-6 py-3">
                    Start Date
                  </th>

                  <th className="text-left px-6 py-3">
                    Venue
                  </th>

                  <th className="text-right px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F0F0F8]">
                {events.map(
                  (event) => (
                    <tr
                      key={
                        event._id
                      }
                      onClick={() =>
                        onEventChange(
                          event
                        )
                      }
                      className={`hover:bg-[#FAFAF7] transition-colors ${
                        selectedEvent?._id ===
                        event._id
                          ? "bg-[#FAFAF7]"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-3.5 font-medium text-[#1A1A2E]">
                        {
                          event.name
                        }
                      </td>

                      <td className="px-6 py-3.5">
                        <span className="capitalize text-xs bg-[#EEF2FF] text-[#5B6FD4] px-2.5 py-1 rounded-full font-medium">
                          {
                            event.type
                          }
                        </span>
                      </td>

                      <td className="px-6 py-3.5 text-[#5A5A72]">
                        {event.startDate
                          ? new Date(
                              event.startDate
                            ).toLocaleDateString(
                              "en-US",
                              {
                                month:
                                  "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "Not set"}
                      </td>

                      <td className="px-6 py-3.5 text-[#5A5A72]">
                        {event.location ||
                          "Not set"}
                      </td>

                      <td
                        className="px-6 py-3.5 text-right"
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                      >
                        <button
                          onClick={() =>
                            setEventToDelete(
                              event
                            )
                          }
                          disabled={
                            deletingEventId ===
                            event._id
                          }
                          title="Delete event"
                          aria-label={`Delete ${event.name}`}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v5" />
                            <path d="M14 11v5" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => {
              if (!deletingEventId) {
                setEventToDelete(null);
              }
            }}
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E8E8F0] p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-11 h-11 rounded-full bg-red-50 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-red-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v5" />
                  <path d="M14 11v5" />
                </svg>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#1A1A2E]">
                  Delete Event?
                </h3>

                <p className="text-sm text-[#5A5A72] mt-2 leading-6">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-[#1A1A2E]">
                    "{eventToDelete.name}"
                  </span>
                  ?
                </p>

                <p className="text-xs text-[#9090A8] mt-2">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-7">
              <button
                onClick={() =>
                  setEventToDelete(null)
                }
                disabled={
                  !!deletingEventId
                }
                className="px-4 py-2.5 rounded-xl border border-[#E8E8F0] text-sm font-medium text-[#5A5A72] hover:bg-[#FAFAF7] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={() =>
                  void handleDeleteEvent(
                    eventToDelete
                  )
                }
                disabled={
                  !!deletingEventId
                }
                className="px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingEventId
                  ? "Deleting..."
                  : "Delete Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}