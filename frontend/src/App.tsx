import { useEffect, useState } from "react";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ParticipantLogin from "./components/ParticipantLogin";
import AcceptInvitation from "./pages/AcceptInvitation";

import AdminLayout from "./components/AdminLayout";
import AdminDashboard, {
  type Event,
} from "./pages/admin/Dashboard";

import Participants from "./pages/admin/Participants";
import Invitations from "./pages/admin/Invitiations";
import Announcements from "./pages/admin/Announcements";
import Documents from "./pages/admin/Documents";
import Chat from "./pages/admin/Chat";
import EventBuilder from "./pages/admin/EventBuilder";

import ParticipantDashboard from "./pages/participant/Dashboard";

type View =
  | "landing"
  | "login"
  | "participant-login"
  | "admin-dashboard"
  | "event-builder"
  | "participants"
  | "participant-profile"
  | "invitations"
  | "announcements"
  | "documents"
  | "chat"
  | "participant-dashboard";

const VIEW_STORAGE_KEY = "eventflow_current_view";
const PARTICIPANT_ID_STORAGE_KEY = "eventflow_selected_participant_id";
const SELECTED_EVENT_KEY = "eventflow_selected_event";
const INVITATION_TOKEN_KEY = "eventflow_invitation_token";

const validViews: View[] = [
  "landing",
  "login",
  "participant-login",
  "admin-dashboard",
  "event-builder",
  "participants",
  "participant-profile",
  "invitations",
  "announcements",
  "documents",
  "chat",
  "participant-dashboard",
];

const adminViews: View[] = [
  "admin-dashboard",
  "event-builder",
  "participants",
  "participant-profile",
  "invitations",
  "announcements",
  "documents",
  "chat",
];

const getInitialView = (): View => {
  const token = localStorage.getItem("token");
  const userString = localStorage.getItem("user");
  const savedView = sessionStorage.getItem(VIEW_STORAGE_KEY) as View | null;

  if (!token || !userString) {
    return "landing";
  }

  if (!savedView || !validViews.includes(savedView)) {
    return "landing";
  }

  try {
    const user = JSON.parse(userString);

    if (user.role === "admin" && savedView === "participant-dashboard") {
      return "admin-dashboard";
    }

    if (user.role === "participant" && adminViews.includes(savedView)) {
      return "participant-dashboard";
    }

    return savedView;
  } catch {
    return "landing";
  }
};

const getInitialSelectedEvent = (): Event | null => {
  const storedEvent = sessionStorage.getItem(SELECTED_EVENT_KEY);

  if (!storedEvent) {
    return null;
  }

  try {
    return JSON.parse(storedEvent) as Event;
  } catch {
    sessionStorage.removeItem(SELECTED_EVENT_KEY);
    return null;
  }
};

export default function App() {
  const [view, setView] = useState<View>(getInitialView);

  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(() => {
    return sessionStorage.getItem(PARTICIPANT_ID_STORAGE_KEY) || null;
  });

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(
    getInitialSelectedEvent
  );

  const searchParams = new URLSearchParams(window.location.search);
  const invitationToken = searchParams.get("token") || "";

  useEffect(() => {
    if (view === "landing") {
      sessionStorage.removeItem(VIEW_STORAGE_KEY);
      return;
    }

    sessionStorage.setItem(VIEW_STORAGE_KEY, view);
  }, [view]);

  useEffect(() => {
    if (selectedParticipantId) {
      sessionStorage.setItem(
        PARTICIPANT_ID_STORAGE_KEY,
        selectedParticipantId
      );
    } else {
      sessionStorage.removeItem(PARTICIPANT_ID_STORAGE_KEY);
    }
  }, [selectedParticipantId]);

  useEffect(() => {
    if (selectedEvent) {
      sessionStorage.setItem(
        SELECTED_EVENT_KEY,
        JSON.stringify(selectedEvent)
      );
    } else {
      sessionStorage.removeItem(SELECTED_EVENT_KEY);
    }
  }, [selectedEvent]);

  if (invitationToken) {
    sessionStorage.setItem(
      INVITATION_TOKEN_KEY,
      invitationToken
    );

    return (
      <AcceptInvitation
        token={invitationToken}
        onAccepted={() => {
          window.history.replaceState({}, "", "/");

          setView("participant-dashboard");
        }}
      />
    );
  }

  const goToLogin = (role: "admin" | "participant") => {
    if (role === "admin") {
      setView("login");
      return;
    }

    setView("participant-login");
  };

  const handleLogin = (role: "admin" | "participant") => {
    if (role === "admin") {
      setView("admin-dashboard");
      return;
    }

    setView("participant-dashboard");
  };

  const handleLogout = () => {
    setSelectedParticipantId(null);
    setSelectedEvent(null);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("eventflow_selected_event");
    localStorage.removeItem("eventflow_participant_event");

    sessionStorage.removeItem(VIEW_STORAGE_KEY);
    sessionStorage.removeItem(PARTICIPANT_ID_STORAGE_KEY);
    sessionStorage.removeItem(SELECTED_EVENT_KEY);
    sessionStorage.removeItem(INVITATION_TOKEN_KEY);

    setView("landing");
  };

  const adminNavigate = (page: string, id?: string) => {
    if (page === "dashboard") {
      setSelectedParticipantId(null);
      setView("admin-dashboard");
      return;
    }

    if (page === "event-builder") {
      setView("event-builder");
      return;
    }

    if (page === "participant-profile" && id) {
      setSelectedParticipantId(id);
      setView("participant-profile");
      return;
    }

    if (
      page === "participants" ||
      page === "invitations" ||
      page === "announcements" ||
      page === "documents" ||
      page === "chat"
    ) {
      setView(
        page as
          | "participants"
          | "invitations"
          | "announcements"
          | "documents"
          | "chat"
      );
    }
  };

  if (view === "landing") {
    return <Landing onLogin={goToLogin} />;
  }

  if (view === "login") {
    return (
      <Login
        onLogin={handleLogin}
        onBack={() => setView("landing")}
      />
    );
  }

  if (view === "participant-login") {
    const storedInvitationToken =
      sessionStorage.getItem(INVITATION_TOKEN_KEY) || "";

    return (
      <ParticipantLogin
        onLogin={handleLogin}
        onBack={() => setView("landing")}
        invitationToken={
          invitationToken ||
          storedInvitationToken ||
          undefined
        }
      />
    );
  }

  if (view === "participant-dashboard") {
    return (
      <ParticipantDashboard
        onLogout={handleLogout}
      />
    );
  }

  const adminPageId =
    view === "admin-dashboard"
      ? "dashboard"
      : view;

  return (
    <AdminLayout
      currentPage={adminPageId}
      onNavigate={adminNavigate}
      onLogout={handleLogout}
      eventName={
        selectedEvent?.name ||
        "No event selected"
      }
    >
      {view === "admin-dashboard" && (
        <AdminDashboard
          onNavigate={adminNavigate}
          selectedEvent={selectedEvent}
          onEventChange={setSelectedEvent}
        />
      )}

      {view === "event-builder" && (
        <EventBuilder
          onNavigate={adminNavigate}
        />
      )}

      {view === "participants" && (
        <Participants />
      )}

      {/* {view === "participant-profile" &&
        selectedParticipantId && (
          <ParticipantProfile
            participantId={selectedParticipantId}
            onBack={() =>
              setView("participants")
            }
          />
        )} */}

      {view === "invitations" && (
        <Invitations />
      )}

      {view === "announcements" && (
        <Announcements />
      )}

      {view === "documents" && (
        <Documents />
      )}

      {view === "chat" && <Chat />}
    </AdminLayout>
  );
}