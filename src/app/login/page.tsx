'use client';

import Navbar from '@/components/layout/Navbar';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import './login.css';

export default function Login() {
  const [showPw, setShowPw] = useState(false);
  const [loginState, setLoginState] = useState('➔ Enter CrowdSense');
  const [socialStates, setSocialStates] = useState({ google: false });
  const [errorMessage, setErrorMessage] = useState('');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    const cleanedEmail = email.trim();
    setErrorMessage('');
    
    if (!cleanedEmail || !password) {
      const orig = loginState;
      setLoginState('MISSING CREDENTIALS');
      setErrorMessage('Please enter both email and password.');
      setTimeout(() => setLoginState(orig), 2000);
      return;
    }

    setLoginState('CHECKING...');
    
    let errorResponse;

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email: cleanedEmail, password });
      errorResponse = error;
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: cleanedEmail, password });
      errorResponse = error;
    }

    if (errorResponse) {
      setLoginState('ERROR: INVALID');
      setErrorMessage(errorResponse.message);
      console.error(errorResponse.message);
      setTimeout(() => setLoginState(isSignUp ? '➔ Join CrowdSense' : '➔ Enter CrowdSense'), 3000);
    } else {
      setLoginState('✓ AUTHENTICATED');
      setTimeout(() => {
        window.location.href = '/my-trips';
      }, 1000);
    }
  };

  const handleSocial = async (provider: 'google') => {
    setSocialStates(prev => ({ ...prev, [provider]: true }));
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/my-trips`
      }
    });

    if (error) {
      console.error(`Error with ${provider} sign in:`, error.message);
      setSocialStates(prev => ({ ...prev, [provider]: false }));
    }
  };

  const toggleMode = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSignUp(!isSignUp);
    setErrorMessage('');
    setLoginState(!isSignUp ? '➔ Join CrowdSense' : '➔ Enter CrowdSense');
  };

  const GoogleIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
  );


  const SuccessIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
  );

  return (
    <>
      <Navbar />
      <div className="login-root">
        <div className="grid-bg"></div>
        <div className="stamp">CROWD INTEL v2.1</div>
        <div className="wrapper bg-[#FAFAFA]">
          <div className="left-panel">
            <div>
              <div className="logo-mark">
                <div className="logo-icon">
                  <div className="bar bar1"></div>
                  <div className="bar bar2"></div>
                  <div className="bar bar3"></div>
                  <div className="bar bar4"></div>
                </div>
                <div>
                  <div className="logo-text">CrowdSense</div>
                  <div className="tagline">Trip Intelligence Layer</div>
                </div>
              </div>
              <div className="live-pill"><div className="pulse-dot"></div>LIVE CROWD DATA</div>
            </div>
            
            <div className="hero-headline">
              <span className="big-word">PLAN</span>
              <span className="big-word">SMART.</span>
              <span className="big-word invert">MOVE</span>
              <span className="big-word invert">SMARTER.</span>
              
              <div className="crowd-stat">
                <div className="stat"><div className="stat-num">2.4M</div><div className="stat-label">Places Tracked</div></div>
                <div className="stat"><div className="stat-num">98%</div><div className="stat-label">Accuracy</div></div>
                <div className="stat"><div className="stat-num">140+</div><div className="stat-label">Countries</div></div>
              </div>
            </div>
          </div>
          
          <div className="right-panel">
            <div className="section-label">{isSignUp ? 'Create Account' : 'Access Portal'}</div>
            
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                className="form-input" 
                type="email" 
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="pw-wrap">
                <input 
                  className="form-input" 
                  type={showPw ? 'text' : 'password'} 
                  placeholder="••••••••••••" 
                  style={{ paddingRight: '60px' }}
                  value={password}
                  onChange={e => setPassword(e.target.value)} 
                />
                <button className="pw-toggle" onClick={() => setShowPw(!showPw)}>{showPw ? 'HIDE' : 'SHOW'}</button>
              </div>
            </div>
            
            <div className="form-row">
              <label className="remember">
                <input type="checkbox" className="cb" />
                <span className="remember-text">Keep me in</span>
              </label>
              <a href="#" className="forgot">Forgot?</a>
            </div>
            
            <button className="btn-login" onClick={handleAuth} style={{ opacity: loginState === 'CHECKING...' ? 0.7 : 1 }}>
              {loginState}
            </button>
            
            {errorMessage && (
              <div style={{ color: '#FF3D00', fontSize: '13px', marginTop: '12px', textAlign: 'center', fontWeight: 'bold', fontFamily: "'DM Mono', monospace" }}>
                {errorMessage}
              </div>
            )}
            
            <div className="divider">
              <div className="divider-line"></div>
              <div className="divider-text">OR CONTINUE WITH</div>
              <div className="divider-line"></div>
            </div>
            
            <div className="social-row">
              <div className="social-item">
                <button className="social-btn" onClick={() => handleSocial('google')} title="Google">
                  {socialStates.google ? <SuccessIcon /> : <GoogleIcon />}
                </button>
                <div className="social-name">Google</div>
              </div>
            </div>
            
            <div className="signup-prompt">
              {isSignUp ? 'Already have an account?' : 'No account?'} {' '}
              <a href="#" onClick={toggleMode} className="signup-link">
                {isSignUp ? 'Sign in instead \u2192' : 'Get access \u2192'}
              </a>
            </div>
            <div className="corner-badge">EST. 2025</div>
          </div>
        </div>
      </div>
    </>
  );
}
