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
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <main className="min-h-screen flex" style={{fontFamily: 'Sora, sans-serif', background: '#f7f4ee', fontSize: '1rem'}}>

      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] p-10" style={{background: '#0d2340'}}>

        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 mb-12 pb-6" style={{borderBottom: '0.5px solid rgba(201,168,76,0.2)'}}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background: '#c9a84c'}}>
              <div style={{width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '11px solid #0d2340'}}/>
            </div>
            <div>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 22, color: 'white', fontWeight: 600, letterSpacing: -0.3}}>StepUp</div>
              <div style={{fontSize: 9, color: '#c9a84c', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2}}>P2P Mentoring Program</div>
            </div>
          </div>

          <div style={{fontFamily: 'Georgia, serif', fontSize: 38, color: 'white', lineHeight: 1.2, letterSpacing: -0.5, marginBottom: 16}}>
            Your Step 1 command <span style={{color: '#c9a84c'}}>center.</span>
          </div>
          <div style={{fontSize: 14, lineHeight: 1.7, maxWidth: 380, marginBottom: 48, color: 'rgba(255,255,255,0.6)'}}>
            Everything you need for 8 weeks of focused, structured, high-yield preparation — in one place.
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            {[
              {color: '#c9a84c', text: 'Daily personalized schedule & task list'},
              {color: '#4a8c84', text: 'Live weakness tracking from Qbank + NBME'},
              {color: '#6b7c3a', text: 'Session recordings, slides & HY notes'},
              {color: '#c07040', text: 'Mentor meeting calendar & reminders'},
              {color: '#c0574a', text: 'Timed exams with instant assessment reports'},
            ].map((pill, i) => (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px'}}>
                <div style={{width: 8, height: 8, borderRadius: '50%', background: pill.color, flexShrink: 0}}/>
                <span style={{fontSize: 13, color: 'rgba(255,255,255,0.8)'}}>{pill.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{borderTop: '0.5px solid rgba(201,168,76,0.15)', paddingTop: 20}}>
          <div style={{fontFamily: 'Georgia, serif', fontSize: 13, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', lineHeight: 1.6}}>
            "Every question you do today is a point on your score tomorrow."
          </div>
          <div style={{fontSize: 11, color: '#c9a84c', marginTop: 6}}>— P2P Mentoring Program</div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-14">
        <div style={{maxWidth: 420, width: '100%', margin: '0 auto'}}>

          <div style={{marginBottom: 32}}>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 26, color: '#162032', letterSpacing: -0.3, marginBottom: 6}}>Welcome back</div>
            <div style={{fontSize: 13.5, color: '#8a7d6a'}}>Sign in to your StepUp account</div>
          </div>

          <div style={{display: 'flex', gap: 6, background: '#f0ece0', borderRadius: 10, padding: 4, marginBottom: 28}}>
            {(['student', 'tutor', 'admin'] as const).map(r => (
              <button key={r} onClick={() => setRole(r)}
                style={{flex: 1, padding: '8px 0', borderRadius: 7, border: role === r ? '0.5px solid rgba(201,168,76,0.3)' : 'none',
                  background: role === r ? 'white' : 'transparent', color: role === r ? '#162032' : '#8a7d6a',
                  fontFamily: 'Sora, sans-serif', fontSize: 12.5, fontWeight: role === r ? 600 : 400, cursor: 'pointer', textTransform: 'capitalize'
                }}>{r}</button>
            ))}
          </div>

          <div style={{marginBottom: 16}}>
            <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, letterSpacing: '0.03em'}}>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@university.edu"
              style={{width: '100%', height: 44, borderRadius: 9, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 13.5, padding: '0 14px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}
            />
          </div>

          <div style={{marginBottom: 10}}>
            <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, letterSpacing: '0.03em'}}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{width: '100%', height: 44, borderRadius: 9, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 13.5, padding: '0 14px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}
            />
          </div>

          <div style={{textAlign: 'right', marginBottom: 22}}>
            <span style={{fontSize: 12, color: '#c9a84c', cursor: 'pointer'}}>Forgot password?</span>
          </div>

          {error && (
            <div style={{background: '#fdf2ed', border: '0.5px solid #e8c4a8', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: '#6b3010'}}>
              {error}
            </div>
          )}

          <button onClick={handleLogin} disabled={loading}
            style={{width: '100%', height: 46, background: loading ? '#4a5568' : '#0d2340', border: 'none', borderRadius: 10, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.02em', marginBottom: 20}}
          >
            {loading ? 'Signing in...' : 'Sign in to StepUp'}
          </button>

          <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20}}>
            <div style={{flex: 1, height: 0.5, background: '#e8dfc8'}}/>
            <span style={{fontSize: 12, color: '#a89870'}}>or continue with</span>
            <div style={{flex: 1, height: 0.5, background: '#e8dfc8'}}/>
          </div>

          <button style={{width: '100%', height: 44, border: '0.5px solid #e8dfc8', borderRadius: 10, background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#3d3020', marginBottom: 24}}>
            <div style={{width: 18, height: 18, borderRadius: '50%', background: '#EA4335', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700}}>G</div>
            Sign in with Google
          </button>

          <div style={{background: '#0d2340', borderRadius: 10, padding: '12px 16px', borderLeft: '3px solid #c9a84c'}}>
            <div style={{fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c9a84c', marginBottom: 3}}>Next session</div>
            <div style={{fontSize: 12.5, color: 'white', fontWeight: 500}}>Cardiovascular HY Review</div>
            <div style={{fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2}}>Tuesday Apr 22 · 7:00 PM CST · Zoom</div>
          </div>

        </div>
      </div>
    </main>
  )
}