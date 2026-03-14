import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Chrome, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login, signup, loginWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        await signup(email, password);
        alert('Check your email for confirmation!');
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0F9FF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Nunito', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      padding: '20px'
    }}>
      {/* Decorative Blobs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '300px', height: '300px', background: 'rgba(0, 168, 214, 0.08)', borderRadius: '50%', filter: 'blur(40px)' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '400px', height: '400px', background: 'rgba(255, 215, 0, 0.08)', borderRadius: '50%', filter: 'blur(40px)' }} />

      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: '30px',
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0, 168, 214, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        zIndex: 1,
        textAlign: 'center'
      }}>
        {/* Avatar */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
          <img
            src="/dora-avatar.png"
            alt="DoraLink"
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              border: '4px solid white',
              boxShadow: '0 4px 20px rgba(0, 168, 214, 0.2)',
              animation: 'float 4s ease-in-out infinite'
            }}
          />
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#00A8D6', marginBottom: '8px' }}>DoraLink</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>Khushal ka personal AI buddy</p>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 14px 14px 48px',
                borderRadius: '16px',
                border: '1.5px solid rgba(0, 168, 214, 0.1)',
                outline: 'none',
                background: 'white',
                fontSize: '15px',
                transition: 'border-color 0.2s',
                BoxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#00A8D6'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(0, 168, 214, 0.1)'}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 14px 14px 48px',
                borderRadius: '16px',
                border: '1.5px solid rgba(0, 168, 214, 0.1)',
                outline: 'none',
                background: 'white',
                fontSize: '15px',
                transition: 'border-color 0.2s',
                BoxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#00A8D6'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(0, 168, 214, 0.1)'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '50px',
              background: '#00A8D6',
              color: 'white',
              border: 'none',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'transform 0.2s, background 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '10px'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? 'Create Account' : 'Login')}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <span
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ color: '#00A8D6', fontWeight: '700', cursor: 'pointer' }}
          >
            {isSignUp ? 'Login' : 'Sign Up'}
          </span>
        </p>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.1)' }} />
          <span style={{ fontSize: '12px', color: '#999', fontWeight: '700' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(0,0,0,0.1)' }} />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '50px',
            background: 'white',
            color: '#1a1a1a',
            border: '1.5px solid #eee',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
          onMouseLeave={(e) => e.target.style.background = 'white'}
        >
          <Chrome size={20} color="#4285F4" />
          Continue with Google
        </button>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
