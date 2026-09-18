import { useEffect, useState } from "react";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ParticipantLogin from "./components/ParticipantLogin";
import AcceptInvitation from "./pages/AcceptInvitation";

import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import Participants from "./pages/admin/Participants";
import ParticipantProfile from "./pages/admin/ParticipantProfile";
import Invitations from "./pages/admin/Invitiations";
import Announcements from "./pages/admin/Announcements";
import Documents from "./pages/admin/Documents";
import Chat from "./pages/admin/Chat";

import ParticipantDashboard from "./pages/participant/Dashboard";

type View =
  | "landing"
  | "login"
  | "participant-login"
  | "admin-dashboard"
  | "participants"
  | "participant-profile"
  | "invitations"
  | "announcements"
  | "documents"
  | "chat"
  | "participant-dashboard";

const VIEW_STORAGE_KEY = "eventflow_current_view";

const PARTICIPANT_ID_STORAGE_KEY =
  "eventflow_selected_participant_id";

const validViews: View[] = [
  "landing",
  "login",
  "participant-login",
  "admin-dashboard",
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

  const savedView = sessionStorage.getItem(
    VIEW_STORAGE_KEY
  ) as View | null;

  if (!token || !userString) {
    return "landing";
  }

  try {
    const user = JSON.parse(userString);

    if (
      savedView &&
      validViews.includes(savedView)
    ) {
      if (
        user.role === "admin" &&
        savedView === "participant-dashboard"
      ) {
        return "admin-dashboard";
      }

      if (
        user.role === "participant" &&
        adminViews.includes(savedView)
      ) {
        return "participant-dashboard";
      }

      return savedView;
    }

    return "landing";
  } catch (error) {
    console.error(
      "Unable to restore EventFlow session:",
      error
    );

    return "landing";
  }
};

export default function App() {
  const [view, setView] =
    useState<View>(getInitialView);

  const [
    selectedParticipantId,
    setSelectedParticipantId,
  ] = useState<string | null>(() => {
    return (
      sessionStorage.getItem(
        PARTICIPANT_ID_STORAGE_KEY
      ) || null
    );
  });

  const searchParams =
    new URLSearchParams(
      window.location.search
    );

  const invitationToken =
    searchParams.get("token") || "";

  useEffect(() => {
    if (view === "landing") {
      sessionStorage.removeItem(
        VIEW_STORAGE_KEY
      );
      return;
    }

    sessionStorage.setItem(
      VIEW_STORAGE_KEY,
      view
    );
  }, [view]);

  useEffect(() => {
    if (selectedParticipantId) {
      sessionStorage.setItem(
        PARTICIPANT_ID_STORAGE_KEY,
        selectedParticipantId
      );
    } else {
      sessionStorage.removeItem(
        PARTICIPANT_ID_STORAGE_KEY
      );
    }
  }, [selectedParticipantId]);

  if (invitationToken) {
    sessionStorage.setItem(
      "eventflow_invitation_token",
      invitationToken
    );

    return (
      <AcceptInvitation
        token={invitationToken}
        onAccepted={() => {
          sessionStorage.setItem(
            "eventflow_invitation_token",
            invitationToken
          );

          window.history.replaceState(
            {},
            "",
            "/"
          );

          setView("participant-login");
        }}
      />
    );
  }

  const goToLogin = (
    role: "admin" | "participant"
  ) => {
    if (role === "admin") {
      setView("login");
      return;
    }

    setView("participant-login");
  };

  const handleLogin = (
    role: "admin" | "participant"
  ) => {
    if (role === "admin") {
      setView("admin-dashboard");
      return;
    }

    setView("participant-dashboard");
  };

  const handleLogout = () => {
    setSelectedParticipantId(null);

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    localStorage.removeItem(
      "eventflow_selected_event"
    );

    localStorage.removeItem(
      "eventflow_participant_event"
    );

    sessionStorage.removeItem(
      VIEW_STORAGE_KEY
    );

    sessionStorage.removeItem(
      PARTICIPANT_ID_STORAGE_KEY
    );

    sessionStorage.removeItem(
      "eventflow_invitation_token"
    );

    setView("landing");
  };

  const adminNavigate = (
    page: string,
    id?: string
  ) => {
    if (page === "dashboard") {
      setSelectedParticipantId(null);
      setView("admin-dashboard");
      return;
    }

    if (
      page === "participant-profile" &&
      id
    ) {
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

      return;
    }
  };

  if (view === "landing") {
    return (
      <Landing
        onLogin={goToLogin}
      />
    );
  }

  if (view === "login") {
    return (
      <Login
        onLogin={handleLogin}
        onBack={() =>
          setView("landing")
        }
      />
    );
  }

  if (view === "participant-login") {
    const storedInvitationToken =
      sessionStorage.getItem(
        "eventflow_invitation_token"
      ) || "";

    return (
      <ParticipantLogin
        onLogin={handleLogin}
        onBack={() =>
          setView("landing")
        }
        invitationToken={
          invitationToken ||
          storedInvitationToken ||
          undefined
        }
      />
    );
  }

  if (
    view === "participant-dashboard"
  ) {
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
      eventName="Tech Summit 2026"
    >
      {view === "admin-dashboard" && (
        <AdminDashboard
          onNavigate={adminNavigate}
        />
      )}

      {view === "participants" && (
        <Participants />
      )}

      {view === "participant-profile" &&
        selectedParticipantId && (
          <ParticipantProfile
            participantId={
              selectedParticipantId
            }
            onBack={() =>
              setView("participants")
            }
          />
        )}

      {view === "invitations" && (
        <Invitations />
      )}

      {view === "announcements" && (
        <Announcements />
      )}

      {view === "documents" && (
        <Documents />
      )}

      {view === "chat" && (
        <Chat />
      )}
    </AdminLayout>
  );
}