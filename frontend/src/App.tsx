
import { useState } from 'react';

import Landing from './pages/Landing';
import Login from './pages/Login';
import ParticipantLogin from './components/ParticipantLogin.tsx';
import AcceptInvitation from './pages/AcceptInvitation.tsx';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import AdminLayout from './components/AdminLayout.tsx';
import AdminDashboard from './pages/admin/Dashboard.tsx';
import Participants from './pages/admin/Participants.tsx';
import ParticipantProfile from './pages/admin/ParticipantProfile.tsx';
import Invitations from './pages/admin/Invitiations.tsx';
import Announcements from './pages/admin/Announcements';
import Documents from './pages/admin/Documents';
import Chat from './pages/admin/Chat';
import EventBuilder from './pages/admin/EventBuilder';

import ParticipantDashboard from './pages/participant/Dashboard';

type View =
  | 'landing'
  | 'login'
  | 'participant-login'
  | 'forgot-password'
  | 'reset-password'
  | 'admin-dashboard'
  | 'participants'
  | 'participant-profile'
  | 'invitations'
  | 'announcements'
  | 'documents'
  | 'chat'
  | 'event-builder'
  | 'participant-dashboard';

export default function App() {
  const [view, setView] = useState<View>('landing');

  const [
    selectedParticipantId,
    setSelectedParticipantId,
  ] = useState<string | null>(null);

  // ---------------------------------------------------------
  // READ URL PARAMETERS
  // ---------------------------------------------------------

  const searchParams = new URLSearchParams(
    window.location.search
  );

  const invitationToken = searchParams.get('token');

  const resetToken = searchParams.get('resetToken');

  // ---------------------------------------------------------
  // CHECK FOR INVITATION TOKEN
  // ---------------------------------------------------------

  if (invitationToken) {
    return (
      <AcceptInvitation
        token={invitationToken}
        onAccepted={() => {
          window.history.replaceState({}, '', '/');
          setView('participant-dashboard');
        }}
      />
    );
  }

  // ---------------------------------------------------------
  // CHECK FOR PASSWORD RESET TOKEN
  // ---------------------------------------------------------

  if (resetToken) {
    return (
      <ResetPassword
        token={resetToken}
        onSuccess={() => {
          window.history.replaceState({}, '', '/');
          setView('login');
        }}
      />
    );
  }

  // ---------------------------------------------------------
  // GO TO LOGIN
  // ---------------------------------------------------------

  const goToLogin = (
    role: 'admin' | 'participant'
  ) => {
    if (role === 'admin') {
      setView('login');
    } else {
      setView('participant-login');
    }
  };

  // ---------------------------------------------------------
  // HANDLE SUCCESSFUL LOGIN
  // ---------------------------------------------------------

  const handleLogin = (
    role: 'admin' | 'participant'
  ) => {
    if (role === 'admin') {
      setView('admin-dashboard');
    } else {
      setView('participant-dashboard');
    }
  };

  // ---------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------

  const handleLogout = () => {
    setSelectedParticipantId(null);

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setView('landing');
  };

  // ---------------------------------------------------------
  // ADMIN NAVIGATION
  // ---------------------------------------------------------

  const adminNavigate = (
    page: string,
    id?: string
  ) => {

    // Dashboard
    if (page === 'dashboard') {
      setView('admin-dashboard');
      return;
    }

    // Participant profile
    if (
      page === 'participant-profile' &&
      id
    ) {
      setSelectedParticipantId(id);
      setView('participant-profile');
      return;
    }

    // Other admin pages
    if (
      page === 'participants' ||
      page === 'invitations' ||
      page === 'announcements' ||
      page === 'documents' ||
      page === 'chat' ||
      page === 'event-builder'
    ) {
      setView(page);
      return;
    }
  };

  // ---------------------------------------------------------
  // LANDING PAGE
  // ---------------------------------------------------------

  if (view === 'landing') {
    return (
      <Landing
        onLogin={goToLogin}
      />
    );
  }

  // ---------------------------------------------------------
  // ADMIN LOGIN PAGE
  // ---------------------------------------------------------

  if (view === 'login') {
    return (
      <Login
        onLogin={handleLogin}
        onBack={() => setView('landing')}
        onForgotPassword={() =>
          setView('forgot-password')
        }
      />
    );
  }

  // ---------------------------------------------------------
  // PARTICIPANT LOGIN PAGE
  // ---------------------------------------------------------

  if (view === 'participant-login') {
    return (
      <ParticipantLogin
        onLogin={handleLogin}
        onBack={() => setView('landing')}
      />
    );
  }

  // ---------------------------------------------------------
  // FORGOT PASSWORD PAGE
  // ---------------------------------------------------------

  if (view === 'forgot-password') {
    return (
      <ForgotPassword
        onBack={() => setView('login')}
        onResetLink={(link) => {
          window.location.href = link;
        }}
      />
    );
  }

  // ---------------------------------------------------------
  // PARTICIPANT DASHBOARD
  // ---------------------------------------------------------

  if (view === 'participant-dashboard') {
    return (
      <ParticipantDashboard
        onLogout={handleLogout}
      />
    );
  }

  // ---------------------------------------------------------
  // ADMIN PAGE ID
  // ---------------------------------------------------------

  const adminPageId =
    view === 'admin-dashboard'
      ? 'dashboard'
      : view;

  // ---------------------------------------------------------
  // ADMIN PORTAL
  // ---------------------------------------------------------

  return (
    <AdminLayout
      currentPage={adminPageId}
      onNavigate={adminNavigate}
      onLogout={handleLogout}
      eventName="Tech Summit 2026"
    >

      {/* ------------------------------------------------- */}
      {/* DASHBOARD */}
      {/* ------------------------------------------------- */}

      {view === 'admin-dashboard' && (
        <AdminDashboard
          onNavigate={adminNavigate}
        />
      )}

      {/* ------------------------------------------------- */}
      {/* PARTICIPANTS */}
      {/* ------------------------------------------------- */}

      {view === 'participants' && (
        <Participants />
      )}

      {/* ------------------------------------------------- */}
      {/* PARTICIPANT PROFILE */}
      {/* ------------------------------------------------- */}

      {view === 'participant-profile' &&
        selectedParticipantId && (
          <ParticipantProfile
            participantId={selectedParticipantId}
            onBack={() =>
              setView('participants')
            }
          />
        )}

      {/* ------------------------------------------------- */}
      {/* INVITATIONS */}
      {/* ------------------------------------------------- */}

      {view === 'invitations' && (
        <Invitations />
      )}

      {/* ------------------------------------------------- */}
      {/* ANNOUNCEMENTS */}
      {/* ------------------------------------------------- */}

      {view === 'announcements' && (
        <Announcements />
      )}

      {/* ------------------------------------------------- */}
      {/* DOCUMENTS */}
      {/* ------------------------------------------------- */}

      {view === 'documents' && (
        <Documents />
      )}

      {/* ------------------------------------------------- */}
      {/* CHAT */}
      {/* ------------------------------------------------- */}

      {view === 'chat' && (
        <Chat />
      )}

      {/* ------------------------------------------------- */}
      {/* EVENT BUILDER */}
      {/* ------------------------------------------------- */}

      {view === 'event-builder' && (
        <EventBuilder />
      )}

    </AdminLayout>
  );
}
