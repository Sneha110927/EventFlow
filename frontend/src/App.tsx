import { useState } from "react";

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

// ============================================================
// VIEW TYPES
// ============================================================

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

export default function App() {
  const [view, setView] =
    useState<View>("landing");

  const [
    selectedParticipantId,
    setSelectedParticipantId,
  ] = useState<string | null>(null);

  // ==========================================================
  // URL PARAMETERS
  // ==========================================================

  const searchParams =
    new URLSearchParams(
      window.location.search
    );

  const invitationToken =
    searchParams.get("token") || "";

  // ==========================================================
  // INVITATION LINK
  // ==========================================================
  //
  // Example:
  //
  // http://localhost:5173/accept-invitation?token=ABC123
  //
  // If an invitation token exists, show the invitation page.
  //
  // ==========================================================

  if (invitationToken) {
    // Store invitation token temporarily
    sessionStorage.setItem(
      "eventflow_invitation_token",
      invitationToken
    );

    return (
      <AcceptInvitation
        token={invitationToken}
        onAccepted={() => {
          // Keep token available for ParticipantLogin
          sessionStorage.setItem(
            "eventflow_invitation_token",
            invitationToken
          );

          // Remove token from browser URL
          window.history.replaceState(
            {},
            "",
            "/"
          );

          // Open participant login
          setView("participant-login");
        }}
      />
    );
  }

  // ==========================================================
  // LOGIN NAVIGATION
  // ==========================================================

  const goToLogin = (
    role: "admin" | "participant"
  ) => {
    if (role === "admin") {
      setView("login");
      return;
    }

    // ========================================================
    // NORMAL PARTICIPANT LOGIN
    // ========================================================
    //
    // IMPORTANT:
    //
    // A participant does NOT need an invitation token
    // to log in normally.
    //
    // They simply enter their registered email and
    // receive an OTP.
    //
    // ========================================================

    setView("participant-login");
  };

  // ==========================================================
  // SUCCESSFUL LOGIN
  // ==========================================================

  const handleLogin = (
    role: "admin" | "participant"
  ) => {
    if (role === "admin") {
      setView("admin-dashboard");
      return;
    }

    setView("participant-dashboard");
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {
    setSelectedParticipantId(null);

    // Remove authentication
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Remove selected event
    localStorage.removeItem(
      "eventflow_selected_event"
    );

    // Remove participant event
    localStorage.removeItem(
      "eventflow_participant_event"
    );

    // Remove invitation token
    sessionStorage.removeItem(
      "eventflow_invitation_token"
    );

    // Return to landing page
    setView("landing");
  };

  // ==========================================================
  // ADMIN NAVIGATION
  // ==========================================================

  const adminNavigate = (
    page: string,
    id?: string
  ) => {
    // --------------------------------------------------------
    // Dashboard
    // --------------------------------------------------------

    if (page === "dashboard") {
      setView("admin-dashboard");
      return;
    }

    // --------------------------------------------------------
    // Participant Profile
    // --------------------------------------------------------

    if (
      page === "participant-profile" &&
      id
    ) {
      setSelectedParticipantId(id);
      setView("participant-profile");
      return;
    }

    // --------------------------------------------------------
    // Other Admin Pages
    // --------------------------------------------------------

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

  // ==========================================================
  // LANDING PAGE
  // ==========================================================

  if (view === "landing") {
    return (
      <Landing
        onLogin={goToLogin}
      />
    );
  }

  // ==========================================================
  // ADMIN LOGIN
  // ==========================================================

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

  // ==========================================================
  // PARTICIPANT LOGIN
  // ==========================================================
  //
  // There are TWO possible ways to reach this page:
  //
  // 1. Normal login:
  //
  //    Landing
  //       ↓
  //    Login
  //       ↓
  //    Participant
  //       ↓
  //    ParticipantLogin
  //
  //    No invitation token.
  //
  //
  // 2. Invitation login:
  //
  //    Invitation Email
  //       ↓
  //    Invitation Link
  //       ↓
  //    AcceptInvitation
  //       ↓
  //    ParticipantLogin
  //
  //    Invitation token is available.
  //
  // ==========================================================

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

  // ==========================================================
  // PARTICIPANT DASHBOARD
  // ==========================================================

  if (
    view === "participant-dashboard"
  ) {
    return (
      <ParticipantDashboard
        onLogout={handleLogout}
      />
    );
  }

  // ==========================================================
  // ADMIN PAGE ID
  // ==========================================================

  const adminPageId =
    view === "admin-dashboard"
      ? "dashboard"
      : view;

  // ==========================================================
  // ADMIN LAYOUT
  // ==========================================================

  return (
    <AdminLayout
      currentPage={adminPageId}
      onNavigate={adminNavigate}
      onLogout={handleLogout}
      eventName="Tech Summit 2026"
    >
      {/* ====================================================
          ADMIN DASHBOARD
          ==================================================== */}

      {view === "admin-dashboard" && (
        <AdminDashboard
          onNavigate={adminNavigate}
        />
      )}

      {/* ====================================================
          PARTICIPANTS
          ==================================================== */}

      {view === "participants" && (
        <Participants />
      )}

      {/* ====================================================
          PARTICIPANT PROFILE
          ==================================================== */}

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

      {/* ====================================================
          INVITATIONS
          ==================================================== */}

      {view === "invitations" && (
        <Invitations />
      )}

      {/* ====================================================
          ANNOUNCEMENTS
          ==================================================== */}

      {view === "announcements" && (
        <Announcements />
      )}

      {/* ====================================================
          DOCUMENTS
          ==================================================== */}

      {view === "documents" && (
        <Documents />
      )}

      {/* ====================================================
          CHAT
          ==================================================== */}

      {view === "chat" && (
        <Chat />
      )}
    </AdminLayout>
  );
}