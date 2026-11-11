import React, { useState, useEffect } from 'react';

interface GatekeeperModalProps {
  onAuthenticated?: () => void;
}

export function GatekeeperModal({ onAuthenticated }: GatekeeperModalProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem('worldpilot_auth') === 'granted';
  });

  useEffect(() => {
    if (isUnlocked && onAuthenticated) {
      onAuthenticated();
    }
  }, [isUnlocked, onAuthenticated]);

  // Magic Link auto-unlock via URL query parameter (?code=... or ?passcode=...)
  useEffect(() => {
    if (typeof window === 'undefined' || isUnlocked) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('code') || params.get('passcode') || params.get('key');
      if (urlCode && urlCode.trim()) {
        const clean = urlCode.trim();
        setIsLoading(true);
        fetch('/api/llm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-worldpilot-passcode': clean
          },
          body: JSON.stringify({ action: 'verify_passcode', passcode: clean })
        }).then(res => {
          if (res.ok) {
            sessionStorage.setItem('worldpilot_auth', 'granted');
            sessionStorage.setItem('worldpilot_passcode', clean);
            setIsUnlocked(true);
            if (onAuthenticated) onAuthenticated();
          } else {
            setPasscode(clean);
            setError(true);
          }
        }).catch(() => {
          setPasscode(clean);
        }).finally(() => {
          setIsLoading(false);
        });
      }
    } catch (_) {}
  }, [isUnlocked, onAuthenticated]);

  if (isUnlocked) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = passcode.trim();
    if (!clean) return;

    setIsLoading(true);
    setError(false);

    try {
      // Check with edge server proxy
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-worldpilot-passcode': clean
        },
        body: JSON.stringify({ action: 'verify_passcode', passcode: clean })
      });

      if (res.ok) {
        sessionStorage.setItem('worldpilot_auth', 'granted');
        sessionStorage.setItem('worldpilot_passcode', clean);
        setIsUnlocked(true);
        if (onAuthenticated) onAuthenticated();
      } else {
        setError(true);
      }
    } catch (_) {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'radial-gradient(ellipse at center, #0f172a 0%, #030712 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'rgba(15, 23, 42, 0.94)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(59, 130, 246, 0.15)',
          borderRadius: '16px',
          padding: '32px',
          color: '#f8fafc',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '9999px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', marginBottom: '18px' }}>
          <span style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 600, letterSpacing: '0.04em' }}>
            🔒 VICTORIA VR HACKATHON · DEMO PREVIEW
          </span>
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 10px 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
          WorldPilot Access Gatekeeper
        </h1>

        <p style={{ fontSize: '13.5px', lineHeight: 1.5, color: '#94a3b8', margin: '0 0 24px 0' }}>
          This preview environment is protected to safeguard serverless LLM resources. Evaluators and judges, please enter the access passcode provided in your hackathon submission instructions.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              autoFocus
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                if (error) setError(false);
              }}
              placeholder="Enter access passcode..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '13px 44px 13px 16px',
                borderRadius: '10px',
                border: error ? '1px solid #ef4444' : '1px solid rgba(148, 163, 184, 0.25)',
                background: 'rgba(2, 6, 23, 0.8)',
                color: '#f8fafc',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px',
              }}
            >
              {showPassword ? '👁️' : '🔒'}
            </button>
          </div>

          {error && (
            <div style={{ color: '#f87171', fontSize: '12.5px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '8px 12px' }}>
              Invalid passcode. Please check field 9 ("Demo access instructions") in your submission form.
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !passcode.trim()}
            style={{
              padding: '13px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '14px',
              cursor: isLoading || !passcode.trim() ? 'not-allowed' : 'pointer',
              opacity: isLoading || !passcode.trim() ? 0.6 : 1,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading ? 'Verifying...' : 'Unlock WorldPilot Studio →'}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(148, 163, 184, 0.15)', fontSize: '11.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
          <span>Session-bound (sessionStorage)</span>
          <span>Zero-trust serverless edge proxy</span>
        </div>
      </div>
    </div>
  );
}
