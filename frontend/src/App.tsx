
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
  | 'participant-dashboard';

export default function App() {
  const [view, setView] = useState<View>('landing');

  const [
    selectedParticipantId,
    setSelectedParticipantId,
  ] = useState<string | null>(null);

 

  const searchParams = new URLSearchParams(
    window.location.search
  );

  const invitationToken = searchParams.get('token');

  const resetToken = searchParams.get('resetToken');


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



  const goToLogin = (
    role: 'admin' | 'participant'
  ) => {
    if (role === 'admin') {
      setView('login');
    } else {
      setView('participant-login');
    }
  };

 

  const handleLogin = (
    role: 'admin' | 'participant'
  ) => {
    if (role === 'admin') {
      setView('admin-dashboard');
    } else {
      setView('participant-dashboard');
    }
  };



  const handleLogout = () => {
    setSelectedParticipantId(null);

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setView('landing');
  };


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

   if (
  page === 'participants' ||
  page === 'invitations' ||
  page === 'announcements' ||
  page === 'documents' ||
  page === 'chat'
) {
  setView(page);
  return;
}
  };
  
  if (view === 'landing') {
    return (
      <Landing
        onLogin={goToLogin}
      />
    );
  }

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


  if (view === 'participant-login') {
    return (
      <ParticipantLogin
        onLogin={handleLogin}
        onBack={() => setView('landing')}
      />
    );
  }



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



  if (view === 'participant-dashboard') {
    return (
      <ParticipantDashboard
        onLogout={handleLogout}
      />
    );
  }


  const adminPageId =
    view === 'admin-dashboard'
      ? 'dashboard'
      : view;


  return (
    <AdminLayout
      currentPage={adminPageId}
      onNavigate={adminNavigate}
      onLogout={handleLogout}
      eventName="Tech Summit 2026"
    >

      {view === 'admin-dashboard' && (
        <AdminDashboard
          onNavigate={adminNavigate}
        />
      )}

    
      {view === 'participants' && (
        <Participants />
      )}

    

      {view === 'participant-profile' &&
        selectedParticipantId && (
          <ParticipantProfile
            participantId={selectedParticipantId}
            onBack={() =>
              setView('participants')
            }
          />
        )}

      
      {view === 'invitations' && (
        <Invitations />
      )}


      {view === 'announcements' && (
        <Announcements />
      )}

      {view === 'documents' && (
        <Documents />
      )}
      
      {view === 'chat' && (
        <Chat />
      )}

    </AdminLayout>
  );
}
