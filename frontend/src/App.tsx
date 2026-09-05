import { useState } from 'react';

import Landing from './pages/Landing';
import Login from './pages/Login';

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

  const [selectedParticipantId, setSelectedParticipantId] =
    useState<string | null>(null);

  // Go to login page
  const goToLogin = () => {
    setView('login');
  };

  // Handle successful login
  const handleLogin = (r: 'admin' | 'participant') => {
    if (r === 'admin') {
      setView('admin-dashboard');
    } else {
      setView('participant-dashboard');
    }
  };

  // Logout
  const handleLogout = () => {
    setSelectedParticipantId(null);
    setView('landing');
  };

  // Admin navigation
  const adminNavigate = (page: string, id?: string) => {
    if (page === 'participant-profile' && id) {
      setSelectedParticipantId(id);
      setView('participant-profile');
    } else {
      setView(page as View);
    }
  };

  // Landing page
  if (view === 'landing') {
    return <Landing onLogin={goToLogin} />;
  }

  // Login page
  if (view === 'login') {
    return (
      <Login
        onLogin={handleLogin}
        onBack={() => setView('landing')}
      />
    );
  }

  // Participant dashboard
  if (view === 'participant-dashboard') {
    return <ParticipantDashboard onLogout={handleLogout} />;
  }

  // Admin page ID
  const adminPageId =
    view === 'admin-dashboard' ? 'dashboard' : view;

  // Admin portal
  return (
    <AdminLayout
      currentPage={adminPageId}
      onNavigate={adminNavigate}
      onLogout={handleLogout}
      eventName="Tech Summit 2026"
    >
      {view === 'admin-dashboard' && (
        <AdminDashboard onNavigate={adminNavigate} />
      )}

      {view === 'participants' && (
        <Participants onNavigate={adminNavigate} />
      )}

      {view === 'participant-profile' && selectedParticipantId && (
        <ParticipantProfile
          participantId={selectedParticipantId}
          onBack={() => setView('participants')}
        />
      )}

      {view === 'invitations' && <Invitations />}

      {view === 'announcements' && <Announcements />}

      {view === 'documents' && <Documents />}

      {view === 'chat' && <Chat />}

      {view === 'event-builder' && <EventBuilder />}
    </AdminLayout>
  );
} 