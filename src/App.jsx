import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import HabitPage from './pages/HabitPage';
import ProfilePage from './pages/ProfilePage';
import CalculatorPage from './pages/CalculatorPage';

import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';

export default function App() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(() => {
    // Only show if not shown before in this session
    const shown = sessionStorage.getItem('splash_shown')
    return !shown
  })

  useEffect(() => {
    if(showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false)
        sessionStorage.setItem('splash_shown', 'true')
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [])

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

  if(showSplash) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F4FB 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Nunito', sans-serif",
        position: 'relative',
        overflow: 'hidden'
      }}>
        <style>{`
          @keyframes splashPop {
            0% { opacity:0; transform:scale(0.5) }
            70% { transform:scale(1.1) }
            100% { opacity:1; transform:scale(1) }
          }
          @keyframes splashFadeUp {
            from { opacity:0; transform:translateY(20px) }
            to { opacity:1; transform:translateY(0) }
          }
          @keyframes splashFloat {
            0%,100% { transform:translateY(0px) }
            50% { transform:translateY(-12px) }
          }
          @keyframes splashDots {
            0%,80%,100% { transform:scale(0.6); opacity:0.4 }
            40% { transform:scale(1); opacity:1 }
          }
          @keyframes fadeOut {
            from { opacity:1 }
            to { opacity:0 }
          }
        `}</style>

        {/* Background blobs */}
        <div style={{
          position:'absolute', top:'-80px',
          right:'-80px', width:'250px',
          height:'250px', borderRadius:'50%',
          background:'#00A8D6', opacity:0.12
        }}/>
        <div style={{
          position:'absolute', bottom:'80px',
          left:'-100px', width:'280px',
          height:'280px', borderRadius:'50%',
          background:'#00A8D6', opacity:0.08
        }}/>
        <div style={{
          position:'absolute', top:'30%',
          right:'-40px', width:'120px',
          height:'120px', borderRadius:'50%',
          background:'#00A8D6', opacity:0.06
        }}/>

        {/* Small dots */}
        {[
          {top:'15%', left:'10%', size:'12px'},
          {top:'25%', right:'15%', size:'8px'},
          {top:'60%', left:'8%', size:'10px'},
          {bottom:'25%', right:'10%', size:'14px'},
        ].map((dot, i) => (
          <div key={i} style={{
            position:'absolute',
            ...dot,
            width: dot.size,
            height: dot.size,
            borderRadius:'50%',
            background:'#00A8D6',
            opacity: 0.25
          }}/>
        ))}

        {/* Doraemon Avatar */}
        <div style={{
          animation: 'splashPop 0.6s ease forwards, splashFloat 3s ease-in-out 0.6s infinite',
          marginBottom: '24px',
          willChange: 'transform'
        }}>
          <img
            src="/dora-avatar.png"
            alt="DoraLink"
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              objectFit: 'cover',
              boxShadow: '0 12px 40px rgba(0,168,214,0.3)',
              border: '4px solid white'
            }}
          />
        </div>

        {/* App Name */}
        <div style={{
          animation: 'splashFadeUp 0.5s ease 0.4s both'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '900',
            color: '#00A8D6',
            letterSpacing: '4px',
            marginBottom: '6px',
            textAlign: 'center'
          }}>DORALINK</h1>
        </div>

        {/* Tagline */}
        <div style={{
          animation: 'splashFadeUp 0.5s ease 0.6s both'
        }}>
          <p style={{
            fontSize: '15px',
            color: '#9ca3af',
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: '48px'
          }}>Your Pocket AI Buddy 🤖</p>
        </div>

        {/* Loading dots */}
        <div style={{
          display: 'flex',
          gap: '8px',
          animation: 'splashFadeUp 0.5s ease 0.8s both'
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#00A8D6',
              animation: 'splashDots 1.4s ease infinite',
              animationDelay: `${i * 0.16}s`
            }}/>
          ))}
        </div>

        {/* Bottom credit */}
        <div style={{
          position: 'absolute',
          bottom: '32px',
          animation: 'splashFadeUp 0.5s ease 1s both'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#b8d4e0',
            fontWeight: '600',
            textAlign: 'center'
          }}>By Khushal Prajapat ✨</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white relative">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/habits" element={<HabitPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
