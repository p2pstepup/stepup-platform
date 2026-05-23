'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../utils/supabase'
import { setActiveProgram } from '../utils/program-context'

type Step = 'idle' | 'nbme' | 'login'
type Role = 'student' | 'tutor' | 'admin'

const CARD_ACCENT: Record<string, {bar: string, label: string}> = {
  step1:    { bar: '#c9a84c', label: 'Step 1' },
  step2:    { bar: '#4a9d8f', label: 'Step 2' },
  nbme:     { bar: '#c07856', label: 'NBME' },
  osce:     { bar: '#7b9e4a', label: 'OSCE' },
  research: { bar: '#8b6abf', label: 'Research' },
}

export default function HomePage() {
  const [programs, setPrograms]         = useState<any[]>([])
  const [loadingPrograms, setLoadingPrograms] = useState(true)
  const [step, setStep]                 = useState<Step>('idle')
  const [selectedProgram, setSelectedProgram] = useState<any>(null)
  const [role, setRole]                 = useState<Role>('student')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [signingIn, setSigningIn]       = useState(false)
  const [error, setError]               = useState('')
  const [forgotMode, setForgotMode]     = useState(false)
  const [forgotEmail, setForgotEmail]   = useState('')
  const [forgotSent, setForgotSent]     = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError]   = useState('')
  const router  = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetch('/api/programs').then(r => r.json()).then(data => {
      setPrograms(Array.isArray(data) ? data : [])
      setLoadingPrograms(false)
    })
  }, [])

  const mainPrograms = programs.filter(p => p.type !== 'nbme')
  const nbmePrograms = programs.filter(p => p.type === 'nbme')

  const pick = (p: any) => { setSelectedProgram(p); setStep('login'); setError(''); setForgotMode(false) }

  const handleLogin = async () => {
    if (!selectedProgram) return
    setSigningIn(true); setError('')
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setSigningIn(false); return }

    const userId = data.user.id
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()

    if (profile?.role === 'admin') {
      setActiveProgram({ id: selectedProgram.id, name: selectedProgram.name, slug: selectedProgram.slug, type: selectedProgram.type, role: 'admin' })
      router.push('/admin'); return
    }

    const { data: enrollment } = await supabase
      .from('program_enrollments').select('role')
      .eq('user_id', userId).eq('program_id', selectedProgram.id).single()

    if (!enrollment) {
      setError(`You're not enrolled in ${selectedProgram.name}. Contact your administrator to get access.`)
      await supabase.auth.signOut(); setSigningIn(false); return
    }

    setActiveProgram({ id: selectedProgram.id, name: selectedProgram.name, slug: selectedProgram.slug, type: selectedProgram.type, role: enrollment.role })
    router.push(enrollment.role === 'tutor' ? '/tutor' : '/dashboard')
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail) { setForgotError('Enter your email.'); return }
    setForgotLoading(true); setForgotError('')
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo: window.location.origin + '/reset-password' })
    setForgotLoading(false)
    if (error) { setForgotError(error.message); return }
    setForgotSent(true)
  }

  const isNbmeActive = step === 'nbme' || (step === 'login' && selectedProgram?.type === 'nbme')

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }

        @keyframes goldPulse {
          0%, 100% { opacity: 0.10; transform: scale(1); }
          50%       { opacity: 0.17; transform: scale(1.06); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.3s cubic-bezier(.22,.68,0,1.2) both; }
        .glow-orb { animation: goldPulse 7s ease-in-out infinite; }

        .prog-card {
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
          cursor: pointer;
        }
        .prog-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3) !important;
          border-color: rgba(255,255,255,0.22) !important;
          background: rgba(255,255,255,0.1) !important;
        }
        .prog-card.card-active {
          background: rgba(201,168,76,0.11) !important;
          border-color: rgba(201,168,76,0.55) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(201,168,76,0.15) !important;
        }
        .prog-card.card-active:hover {
          border-color: rgba(201,168,76,0.7) !important;
        }

        .nbme-card {
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
          cursor: pointer;
        }
        .nbme-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 36px rgba(0,0,0,0.28) !important;
          border-color: rgba(255,255,255,0.2) !important;
          background: rgba(255,255,255,0.09) !important;
        }
        .nbme-card.card-active {
          background: rgba(192,120,86,0.12) !important;
          border-color: rgba(192,120,86,0.5) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(192,120,86,0.12) !important;
        }

        .nbme-sub-row {
          transition: background 0.14s ease, box-shadow 0.14s ease, transform 0.14s ease;
          cursor: pointer;
        }
        .nbme-sub-row:hover {
          background: #f0f0f5 !important;
          transform: translateX(3px);
        }

        .role-btn { transition: all 0.15s ease; cursor: pointer; }
        .sign-btn { transition: all 0.18s ease; }
        .sign-btn:not(:disabled):hover {
          background: #1a3457 !important;
          box-shadow: 0 10px 32px rgba(11,30,53,0.4) !important;
        }
        input { outline: none !important; }
        input:focus {
          border-color: #0b1e35 !important;
          box-shadow: 0 0 0 4px rgba(11,30,53,0.09) !important;
        }
      `}</style>

      <main style={{minHeight: '100vh', display: 'flex', fontFamily: '-apple-system, BlinkMacSystemFont, "Sora", sans-serif', background: '#060f1e'}}>

        {/* ══════════════════════════════════
            LEFT  —  Brand + Program Tiles
            ══════════════════════════════════ */}
        <div style={{width: '54%', minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0}}>

          {/* Background layers */}
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(155deg, #0f2244 0%, #080f20 55%, #040a18 100%)'}} />
          <div className="glow-orb" style={{position: 'absolute', top: '-15%', left: '-10%', width: '75%', height: '75%', background: 'radial-gradient(ellipse, rgba(201,168,76,0.22) 0%, transparent 68%)', pointerEvents: 'none'}} />
          <div style={{position: 'absolute', bottom: '-5%', right: '-5%', width: '55%', height: '55%', background: 'radial-gradient(ellipse, rgba(20,80,160,0.12) 0%, transparent 65%)', pointerEvents: 'none'}} />
          <div style={{position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.028) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none'}} />

          {/* Content */}
          <div style={{position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', padding: '44px 50px 40px'}}>

            {/* Logo */}
            <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 52, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.07)'}}>
              <div style={{width: 40, height: 40, background: 'linear-gradient(135deg, #d9b84a 0%, #c9a84c 100%)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 18px rgba(201,168,76,0.38)'}}>
                <div style={{width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '11px solid rgba(6,15,30,0.9)'}} />
              </div>
              <div>
                <div style={{fontSize: 20, color: 'white', fontWeight: 800, letterSpacing: -0.5, lineHeight: 1}}>StepUp</div>
                <div style={{fontSize: 9.5, color: 'rgba(201,168,76,0.5)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 3}}>P2P Mentoring · Windsor SOM</div>
              </div>
            </div>

            {/* Hero */}
            <div style={{marginBottom: 40}}>
              <div style={{fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 44, color: 'white', fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.1, marginBottom: 16}}>
                Your path to<br/><span style={{color: '#c9a84c'}}>passing</span> starts<br/>here.
              </div>
              <div style={{fontSize: 13.5, color: 'rgba(255,255,255,0.36)', lineHeight: 1.75, maxWidth: 340}}>
                Structured mentoring, high-yield content, and real-time tracking — built for Windsor SOM.
              </div>
            </div>

            {/* Divider */}
            <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20}}>
              <div style={{flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)'}} />
              <span style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap'}}>Select your program</span>
              <div style={{flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)'}} />
            </div>

            {/* ── Program Card Grid ── */}
            {loadingPrograms ? (
              <div style={{color: 'rgba(255,255,255,0.2)', fontSize: 13}}>Loading programs…</div>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>

                {/* 2-col grid for non-NBME programs */}
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10}}>
                  {mainPrograms.map((p: any) => {
                    const ac = CARD_ACCENT[p.type] || CARD_ACCENT.step1
                    const isActive = selectedProgram?.id === p.id && step === 'login'
                    return (
                      <div key={p.id}
                        className={`prog-card${isActive ? ' card-active' : ''}`}
                        onClick={() => pick(p)}
                        style={{background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: '20px 18px 18px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.2)'}}>
                        {/* Accent bar */}
                        <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: ac.bar, borderRadius: '16px 16px 0 0'}} />
                        {/* Selected glow behind */}
                        {isActive && <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(ellipse at top left, ${ac.bar}18 0%, transparent 65%)`, pointerEvents: 'none'}} />}

                        <div style={{marginTop: 6, position: 'relative'}}>
                          <div style={{fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: ac.bar, marginBottom: 9}}>{ac.label}</div>
                          <div style={{fontFamily: 'Georgia, serif', fontSize: 16, color: 'white', fontWeight: 700, lineHeight: 1.3, letterSpacing: -0.3}}>{p.name}</div>
                        </div>

                        {isActive && (
                          <div style={{position: 'absolute', top: 12, right: 13, width: 18, height: 18, borderRadius: '50%', background: ac.bar, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${ac.bar}60`}}>
                            <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><polyline points="1.5 6 4.5 9 10.5 3" stroke="#0b1e35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* NBME — full-width special card */}
                {nbmePrograms.length > 0 && (
                  <div
                    className={`nbme-card${isNbmeActive ? ' card-active' : ''}`}
                    onClick={() => { setStep('nbme'); setSelectedProgram(null) }}
                    style={{background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: '20px 22px 18px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.2)'}}>
                    <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #c07856, #d4956a)', borderRadius: '16px 16px 0 0'}} />
                    {isNbmeActive && <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top left, rgba(192,120,86,0.14) 0%, transparent 60%)', pointerEvents: 'none'}} />}

                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', marginTop: 4}}>
                      <div>
                        <div style={{fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c07856', marginBottom: 8}}>NBME Shelf Exams</div>
                        <div style={{fontFamily: 'Georgia, serif', fontSize: 18, color: 'white', fontWeight: 700, letterSpacing: -0.4, marginBottom: 6}}>NBME Courses</div>
                        <div style={{display: 'flex', gap: 6, flexWrap: 'wrap'}}>
                          {nbmePrograms.slice(0, 4).map((p: any) => (
                            <span key={p.id} style={{fontSize: 10.5, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.07)', padding: '3px 9px', borderRadius: 20, border: '0.5px solid rgba(255,255,255,0.1)'}}>
                              {p.name.replace('NBME ', '')}
                            </span>
                          ))}
                          {nbmePrograms.length > 4 && <span style={{fontSize: 10.5, color: 'rgba(255,255,255,0.3)'}}>+{nbmePrograms.length - 4} more</span>}
                        </div>
                      </div>
                      <div style={{flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: 'rgba(192,120,86,0.2)', border: '1px solid rgba(192,120,86,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 16}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c07856" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div style={{marginTop: 'auto', paddingTop: 32}}>
              <div style={{height: '1px', background: 'linear-gradient(90deg, rgba(201,168,76,0.3) 0%, transparent 75%)', marginBottom: 18}} />
              <div style={{fontFamily: 'Georgia, serif', fontSize: 12, color: 'rgba(255,255,255,0.18)', fontStyle: 'italic', lineHeight: 1.8}}>
                "Every question you do today is a point on your score tomorrow."
              </div>
              <div style={{fontSize: 10.5, color: 'rgba(255,255,255,0.14)', marginTop: 8, letterSpacing: '0.03em'}}>Windsor School of Medicine · Official P2P Mentoring Platform</div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════
            RIGHT  —  Login / Selection Panel
            ══════════════════════════════════ */}
        <div style={{flex: 1, background: '#f5f5f7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 60px', position: 'relative', minHeight: '100vh'}}>

          {/* Top gold accent */}
          <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #c9a84c 0%, rgba(201,168,76,0.25) 60%, transparent 100%)'}} />

          {/* ── IDLE ── */}
          {step === 'idle' && (
            <div className="fade-up" style={{textAlign: 'center', maxWidth: 340}}>
              <div style={{width: 76, height: 76, borderRadius: 24, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 6px 30px rgba(0,0,0,0.1)'}}>
                <div style={{width: 38, height: 38, background: 'linear-gradient(135deg, #d9b84a, #c9a84c)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <div style={{width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '10px solid #0b1e35'}} />
                </div>
              </div>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 32, color: '#1d1d1f', fontWeight: 700, letterSpacing: -0.7, marginBottom: 12, lineHeight: 1.15}}>Welcome back.</div>
              <div style={{fontSize: 15, color: '#8e8e93', lineHeight: 1.7}}>Select your program on the left to sign in.</div>
              <div style={{display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 28, background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, padding: '8px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)'}}>
                <div style={{width: 6, height: 6, borderRadius: '50%', background: '#34c759'}} />
                <span style={{fontSize: 12, color: '#6e6e73', fontWeight: 500}}>Restricted to enrolled members only</span>
              </div>
            </div>
          )}

          {/* ── NBME SUB-MENU ── */}
          {step === 'nbme' && (
            <div className="fade-up" style={{maxWidth: 420, width: '100%'}}>
              <button onClick={() => setStep('idle')}
                style={{all: 'unset', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#aeaeb2', cursor: 'pointer', marginBottom: 36, fontWeight: 500}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                All programs
              </button>

              <div style={{marginBottom: 28}}>
                <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#c07856', marginBottom: 10, fontWeight: 700}}>NBME Shelf Exams</div>
                <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#1d1d1f', fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.1, marginBottom: 8}}>Which course<br/>are you in?</div>
                <div style={{fontSize: 14, color: '#8e8e93'}}>Select your specific shelf exam program.</div>
              </div>

              <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
                {nbmePrograms.map((p: any) => (
                  <div key={p.id} className="nbme-sub-row" onClick={() => { pick(p) }}
                    style={{background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'}}>
                    <div>
                      <div style={{fontSize: 15, color: '#1d1d1f', fontWeight: 600, letterSpacing: -0.2}}>{p.name}</div>
                      <div style={{fontSize: 12, color: '#aeaeb2', marginTop: 3}}>NBME Shelf · Click to sign in</div>
                    </div>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink: 0}}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {step === 'login' && (
            <div className="fade-up" style={{maxWidth: 400, width: '100%'}}>

              {/* Back */}
              <button onClick={() => { setStep(selectedProgram?.type === 'nbme' ? 'nbme' : 'idle'); setSelectedProgram(null) }}
                style={{all: 'unset', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#aeaeb2', cursor: 'pointer', marginBottom: 32, fontWeight: 500}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                {selectedProgram?.type === 'nbme' ? 'NBME courses' : 'All programs'}
              </button>

              {/* Program label */}
              <div style={{marginBottom: 28}}>
                <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#aeaeb2', marginBottom: 8, fontWeight: 600}}>Signing in to</div>
                <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#1d1d1f', fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.1}}>{selectedProgram?.name}</div>
              </div>

              {!forgotMode ? (
                <>
                  {/* Role toggle */}
                  <div style={{display: 'flex', background: '#e8e8ed', borderRadius: 12, padding: 3, marginBottom: 26}}>
                    {(['student', 'tutor', 'admin'] as Role[]).map(r => (
                      <button key={r} className="role-btn" onClick={() => setRole(r)}
                        style={{all: 'unset', flex: 1, textAlign: 'center', padding: '9px 4px', borderRadius: 9, fontSize: 13.5, fontWeight: role === r ? 600 : 400, color: role === r ? '#1d1d1f' : '#8e8e93', background: role === r ? 'white' : 'transparent', boxShadow: role === r ? '0 1px 6px rgba(0,0,0,0.1)' : 'none', textTransform: 'capitalize', letterSpacing: -0.1}}>
                        {r}
                      </button>
                    ))}
                  </div>

                  {/* Email */}
                  <div style={{marginBottom: 13}}>
                    <label style={{fontSize: 11.5, fontWeight: 600, color: '#3a3a3c', display: 'block', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.08em'}}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@university.edu" autoFocus
                      style={{width: '100%', height: 52, borderRadius: 12, border: '1.5px solid #d1d1d6', background: 'white', fontFamily: 'inherit', fontSize: 15, padding: '0 16px', color: '#1d1d1f', transition: 'border-color 0.15s, box-shadow 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)'}}
                    />
                  </div>

                  {/* Password */}
                  <div style={{marginBottom: 10}}>
                    <label style={{fontSize: 11.5, fontWeight: 600, color: '#3a3a3c', display: 'block', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.08em'}}>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••" onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      style={{width: '100%', height: 52, borderRadius: 12, border: '1.5px solid #d1d1d6', background: 'white', fontFamily: 'inherit', fontSize: 15, padding: '0 16px', color: '#1d1d1f', transition: 'border-color 0.15s, box-shadow 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)'}}
                    />
                  </div>

                  <div style={{textAlign: 'right', marginBottom: 22}}>
                    <button onClick={() => { setForgotMode(true); setForgotEmail(email); setForgotSent(false); setForgotError('') }}
                      style={{all: 'unset', fontSize: 13, color: '#c9a84c', cursor: 'pointer', fontWeight: 500}}>
                      Forgot password?
                    </button>
                  </div>

                  {error && (
                    <div style={{background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 10, padding: '13px 16px', marginBottom: 16, fontSize: 13.5, color: '#cf1322', lineHeight: 1.55}}>
                      {error}
                    </div>
                  )}

                  <button className="sign-btn" onClick={handleLogin} disabled={signingIn || !email || !password}
                    style={{all: 'unset', display: 'block', width: '100%', height: 54, background: signingIn || !email || !password ? '#c7c7cc' : '#0b1e35', borderRadius: 13, color: signingIn || !email || !password ? 'white' : '#c9a84c', fontFamily: 'inherit', fontSize: 16, fontWeight: 700, letterSpacing: -0.2, cursor: signingIn || !email || !password ? 'not-allowed' : 'pointer', textAlign: 'center', lineHeight: '54px', boxShadow: signingIn || !email || !password ? 'none' : '0 6px 22px rgba(11,30,53,0.3)'}}>
                    {signingIn ? 'Signing in…' : 'Sign in →'}
                  </button>
                </>
              ) : (
                <div style={{background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: '28px 24px', boxShadow: '0 6px 28px rgba(0,0,0,0.08)'}}>
                  <div style={{fontSize: 17, fontWeight: 700, color: '#1d1d1f', marginBottom: 6, letterSpacing: -0.3}}>Reset password</div>
                  <div style={{fontSize: 13, color: '#6e6e73', marginBottom: 18, lineHeight: 1.65}}>Enter your email to receive a reset link.</div>
                  {forgotSent ? (
                    <>
                      <div style={{fontSize: 14, color: '#34c759', marginBottom: 14, fontWeight: 500}}>✓ Reset link sent — check your inbox.</div>
                      <button onClick={() => setForgotMode(false)} style={{all: 'unset', fontSize: 14, color: '#c9a84c', cursor: 'pointer', fontWeight: 600}}>Back to sign in</button>
                    </>
                  ) : (
                    <>
                      <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                        placeholder="your@email.com"
                        style={{width: '100%', height: 48, borderRadius: 10, border: '1.5px solid #d1d1d6', background: '#fafafa', fontFamily: 'inherit', fontSize: 14, padding: '0 14px', color: '#1d1d1f', marginBottom: 10}}/>
                      {forgotError && <div style={{fontSize: 13, color: '#cf1322', marginBottom: 10}}>{forgotError}</div>}
                      <div style={{display: 'flex', gap: 8}}>
                        <button onClick={handleForgotPassword} disabled={forgotLoading}
                          style={{all: 'unset', flex: 1, height: 44, background: '#0b1e35', borderRadius: 10, color: '#c9a84c', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'center', lineHeight: '44px'}}>
                          {forgotLoading ? 'Sending…' : 'Send reset link'}
                        </button>
                        <button onClick={() => setForgotMode(false)}
                          style={{all: 'unset', height: 44, padding: '0 18px', background: '#f5f5f7', border: '1px solid #d1d1d6', borderRadius: 10, fontFamily: 'inherit', fontSize: 13, color: '#3a3a3c', cursor: 'pointer', lineHeight: '44px'}}>
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
