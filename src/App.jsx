import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import ChatPage from './pages/ChatPage';

import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#F0F9FF',
        fontFamily: "'Nunito', sans-serif"
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <img src="/dora-avatar.png"
            style={{
              width: '80px',
              animation: 'pulse 1.5s infinite ease-in-out'
            }} />
          <p style={{
            color: '#00A8D6',
            fontWeight: '700'
          }}>Loading...</p>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white relative">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
