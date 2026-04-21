'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../utils/supabase'

export default function LoginPage() {
  const [role, setRole] = useState<'student' | 'tutor' | 'admin'>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleForgotPassword = async () => {
    if (!forgotEmail) { setForgotError('Please enter your email address.'); return }
    setForgotLoading(true)
    setForgotError('')
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: window.location.origin + '/reset-password',
    })
    setForgotLoading(false)
    if (error) { setForgotError(error.message); return }
    setForgotSent(true)
  }

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    if (profile?.role === 'tutor') router.push('/tutor')
    else if (profile?.role === 'admin') router.push('/admin')
    else router.push('/dashboard')
  }

  return (
    <main style={{minHeight: '100vh', display: 'flex', fontFamily: 'Sora, sans-serif', background: '#f7f4ee'}}>

      {/* LEFT PANEL */}
      <div style={{width: '52%', background: '#0d2340', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 56px'}}>

        <div>
          {/* Logo */}
          <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48, paddingBottom: 24, borderBottom: '0.5px solid rgba(201,168,76,0.2)'}}>
            <div style={{width: 42, height: 42, background: '#c9a84c', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <div style={{width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '12px solid #0d2340'}}/>
            </div>
            <div>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 24, color: 'white', fontWeight: 600}}>StepUp</div>
              <div style={{fontSize: 11, color: '#c9a84c', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2}}>P2P Mentoring Program</div>
            </div>
          </div>

          {/* Hero */}
          <div style={{fontFamily: 'Georgia, serif', fontSize: 42, color: 'white', lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 18}}>
            Your Step 1 command <span style={{color: '#c9a84c'}}>center.</span>
          </div>
          <div style={{fontSize: 16, lineHeight: 1.7, maxWidth: 400, marginBottom: 48, color: 'rgba(255,255,255,0.6)'}}>
            Everything you need for 8 weeks of focused, structured, high-yield preparation — in one place.
          </div>

          {/* Pills */}
          <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
            {[
              {color: '#c9a84c', text: 'Daily personalized schedule & task list'},
              {color: '#4a8c84', text: 'Live weakness tracking from Qbank + NBME'},
              {color: '#6b7c3a', text: 'Session recordings, slides & HY notes'},
              {color: '#c07040', text: 'Mentor meeting calendar & reminders'},
              {color: '#c0574a', text: 'Timed exams with instant assessment reports'},
            ].map((pill, i) => (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px'}}>
                <div style={{width: 9, height: 9, borderRadius: '50%', background: pill.color, flexShrink: 0}}/>
                <span style={{fontSize: 15, color: 'rgba(255,255,255,0.8)'}}>{pill.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quote */}
        <div style={{borderTop: '0.5px solid rgba(201,168,76,0.15)', paddingTop: 24}}>
          <div style={{fontFamily: 'Georgia, serif', fontSize: 15, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', lineHeight: 1.6}}>
            "Every question you do today is a point on your score tomorrow."
          </div>
          <div style={{fontSize: 13, color: '#c9a84c', marginTop: 8}}>— P2P Mentoring Program</div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 64px'}}>
        <div style={{maxWidth: 440, width: '100%', margin: '0 auto'}}>

          <div style={{marginBottom: 36}}>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 32, color: '#162032', letterSpacing: -0.3, marginBottom: 8}}>Welcome back</div>
            <div style={{fontSize: 16, color: '#8a7d6a'}}>Sign in to your StepUp account</div>
          </div>

          {/* Role toggle */}
          <div style={{display: 'flex', gap: 6, background: '#f0ece0', borderRadius: 10, padding: 4, marginBottom: 28}}>
            {(['student', 'tutor', 'admin'] as const).map(r => (
              <button key={r} onClick={() => setRole(r)}
                style={{flex: 1, padding: '10px 0', borderRadius: 7, border: role === r ? '0.5px solid rgba(201,168,76,0.3)' : 'none',
                  background: role === r ? 'white' : 'transparent', color: role === r ? '#162032' : '#8a7d6a',
                  fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: role === r ? 600 : 400, cursor: 'pointer', textTransform: 'capitalize'
                }}>{r}</button>
            ))}
          </div>

          {/* Email */}
          <div style={{marginBottom: 18}}>
            <label style={{fontSize: 14, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 7}}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@university.edu"
              style={{width: '100%', height: 48, borderRadius: 9, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 15, padding: '0 16px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}
            />
          </div>

          {/* Password */}
          <div style={{marginBottom: 12}}>
            <label style={{fontSize: 14, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 7}}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{width: '100%', height: 48, borderRadius: 9, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 15, padding: '0 16px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}
            />
          </div>

          <div style={{textAlign: 'right', marginBottom: 24}}>
            <span onClick={() => { setForgotMode(true); setForgotSent(false); setForgotError(''); setForgotEmail(email) }} style={{fontSize: 14, color: '#c9a84c', cursor: 'pointer'}}>Forgot password?</span>
          </div>

          {forgotMode && (
            <div style={{background: '#f7f4ee', border: '0.5px solid #e0d8c4', borderRadius: 10, padding: '18px 20px', marginBottom: 18}}>
              <div style={{fontSize: 14, fontWeight: 600, color: '#0d2340', marginBottom: 10}}>Reset your password</div>
              {forgotSent ? (
                <div>
                  <div style={{fontSize: 14, color: '#3a6b3a', marginBottom: 10}}>Reset link sent! Check your inbox.</div>
                  <span onClick={() => setForgotMode(false)} style={{fontSize: 13, color: '#c9a84c', cursor: 'pointer'}}>Back to sign in</span>
                </div>
              ) : (
                <div>
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                    placeholder="your@email.com"
                    style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 14px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', marginBottom: 10}}/>
                  {forgotError && <div style={{fontSize: 13, color: '#c0574a', marginBottom: 8}}>{forgotError}</div>}
                  <div style={{display: 'flex', gap: 10}}>
                    <button onClick={handleForgotPassword} disabled={forgotLoading}
                      style={{flex: 1, height: 38, background: '#0d2340', border: 'none', borderRadius: 8, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer'}}>
                      {forgotLoading ? 'Sending...' : 'Send reset link'}
                    </button>
                    <button onClick={() => setForgotMode(false)}
                      style={{height: 38, padding: '0 14px', background: 'white', border: '0.5px solid #e0d8c4', borderRadius: 8, fontFamily: 'Sora, sans-serif', fontSize: 13, color: '#8a7d6a', cursor: 'pointer'}}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{background: '#fdf2ed', border: '0.5px solid #e8c4a8', borderRadius: 8, padding: '12px 16px', marginBottom: 18, fontSize: 14, color: '#6b3010'}}>
              {error}
            </div>
          )}

          <button onClick={handleLogin} disabled={loading}
            style={{width: '100%', height: 50, background: loading ? '#4a5568' : '#0d2340', border: 'none', borderRadius: 10, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 22}}
          >
            {loading ? 'Signing in...' : 'Sign in to StepUp'}
          </button>

          <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22}}>
            <div style={{flex: 1, height: 0.5, background: '#e8dfc8'}}/>
            <span style={{fontSize: 13, color: '#a89870'}}>or continue with</span>
            <div style={{flex: 1, height: 0.5, background: '#e8dfc8'}}/>
          </div>

          <button style={{width: '100%', height: 48, border: '0.5px solid #e8dfc8', borderRadius: 10, background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#3d3020', marginBottom: 28}}>
            <div style={{width: 20, height: 20, borderRadius: '50%', background: '#EA4335', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700}}>G</div>
            Sign in with Google
          </button>

          <div style={{background: '#0d2340', borderRadius: 10, padding: '14px 18px', borderLeft: '3px solid #c9a84c'}}>
            <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c9a84c', marginBottom: 4}}>Next session</div>
            <div style={{fontSize: 15, color: 'white', fontWeight: 500}}>Cardiovascular HY Review</div>
            <div style={{fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 3}}>Tuesday Apr 22 · 7:00 PM CST · Zoom</div>
          </div>

        </div>
      </div>
    </main>
  )
}