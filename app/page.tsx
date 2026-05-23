'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../utils/supabase'
import { setActiveProgram } from '../utils/program-context'

type Step = 'idle' | 'nbme' | 'login'

export default function HomePage() {
  const [programs, setPrograms] = useState<any[]>([])
  const [loadingPrograms, setLoadingPrograms] = useState(true)
  const [step, setStep] = useState<Step>('idle')
  const [selectedProgram, setSelectedProgram] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState('')
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [hoveredProgram, setHoveredProgram] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetch('/api/programs').then(r => r.json()).then(data => {
      setPrograms(Array.isArray(data) ? data : [])
      setLoadingPrograms(false)
    })
  }, [])

  const mainPrograms = programs.filter(p => p.type !== 'nbme')
  const nbmePrograms = programs.filter(p => p.type === 'nbme')

  const handleMainPick = (p: any) => { setSelectedProgram(p); setStep('login'); setError(''); setForgotMode(false) }
  const handleNbmePick = (p: any) => { setSelectedProgram(p); setStep('login'); setError(''); setForgotMode(false) }

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
      setError(`You're not enrolled in ${selectedProgram.name}. Contact your administrator.`)
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
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        .prog-row { transition: all 0.18s ease; }
        .prog-row:hover { background: rgba(255,255,255,0.04) !important; }
        .prog-row.active-row { background: rgba(201,168,76,0.08) !important; }
        .prog-row .row-label { transition: color 0.18s; }
        .prog-row:hover .row-label { color: rgba(255,255,255,0.95) !important; }
        .prog-row .row-chevron { transition: all 0.18s; opacity: 0.3; }
        .prog-row:hover .row-chevron, .prog-row.active-row .row-chevron { opacity: 1 !important; color: #c9a84c !important; }
        .nbme-sub-card { transition: all 0.15s ease; }
        .nbme-sub-card:hover { background: #f0f0f5 !important; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important; }
        .sign-in-btn { transition: all 0.15s ease; }
        .sign-in-btn:not(:disabled):hover { background: #1a3355 !important; box-shadow: 0 8px 28px rgba(11,30,53,0.35) !important; }
        @keyframes shimmer { 0% { opacity: 0.06; } 50% { opacity: 0.11; } 100% { opacity: 0.06; } }
        .glow { animation: shimmer 6s ease-in-out infinite; }
        input:focus { outline: none !important; border-color: #0b1e35 !important; box-shadow: 0 0 0 4px rgba(11,30,53,0.08) !important; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.28s ease both; }
      `}</style>

      <main style={{minHeight: '100vh', display: 'flex', fontFamily: '-apple-system, BlinkMacSystemFont, "Sora", sans-serif', background: '#060f1e'}}>

        {/* ═══════════════════════════════
            LEFT  —  Brand + Program Picker
            ═══════════════════════════════ */}
        <div style={{width: '52%', minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0}}>

          {/* Layered background */}
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(150deg, #0e2140 0%, #060f1e 65%, #030a14 100%)'}} />
          <div className="glow" style={{position: 'absolute', top: '-10%', left: '-5%', width: '70%', height: '70%', background: 'radial-gradient(ellipse, rgba(201,168,76,0.18) 0%, transparent 70%)', pointerEvents: 'none'}} />
          <div style={{position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none'}} />
          <div style={{position: 'absolute', bottom: 0, right: 0, width: '60%', height: '50%', background: 'radial-gradient(ellipse at bottom right, rgba(13,60,130,0.12) 0%, transparent 70%)', pointerEvents: 'none'}} />

          {/* Content */}
          <div style={{position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, padding: '44px 52px 40px'}}>

            {/* Logo */}
            <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64}}>
              <div style={{width: 40, height: 40, background: 'linear-gradient(135deg, #d4a93a 0%, #c9a84c 60%, #b8922a 100%)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 16px rgba(201,168,76,0.35)'}}>
                <div style={{width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '11px solid rgba(6,15,30,0.85)'}} />
              </div>
              <div>
                <div style={{fontSize: 20, color: 'white', fontWeight: 800, letterSpacing: -0.5, lineHeight: 1}}>StepUp</div>
                <div style={{fontSize: 9.5, color: 'rgba(201,168,76,0.5)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 3}}>P2P Mentoring · Windsor SOM</div>
              </div>
            </div>

            {/* Hero copy */}
            <div style={{marginBottom: 52}}>
              <div style={{fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 46, color: 'white', fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.2, marginBottom: 18}}>
                Your path to<br/><span style={{color: '#c9a84c'}}>passing starts</span><br/>here.
              </div>
              <div style={{fontSize: 14, color: 'rgba(255,255,255,0.38)', lineHeight: 1.75, maxWidth: 360}}>
                Structured mentoring, high-yield content, and real-time performance tracking — built for Windsor SOM students.
              </div>
            </div>

            {/* Divider */}
            <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28}}>
              <div style={{flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)'}} />
              <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.28)', whiteSpace: 'nowrap'}}>Select your program</div>
              <div style={{flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)'}} />
            </div>

            {/* Program rows */}
            {loadingPrograms ? (
              <div style={{color: 'rgba(255,255,255,0.2)', fontSize: 13}}>Loading programs…</div>
            ) : (
              <div style={{borderTop: '1px solid rgba(255,255,255,0.07)'}}>
                {mainPrograms.map((p: any) => {
                  const isActive = selectedProgram?.id === p.id && step === 'login'
                  return (
                    <div key={p.id}
                      className={`prog-row${isActive ? ' active-row' : ''}`}
                      onClick={() => handleMainPick(p)}
                      style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '17px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', borderLeft: isActive ? '2px solid #c9a84c' : '2px solid transparent', paddingLeft: isActive ? 12 : 14, borderRadius: 2}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                        <div style={{width: 7, height: 7, borderRadius: '50%', background: isActive ? '#c9a84c' : 'rgba(255,255,255,0.18)', flexShrink: 0, boxShadow: isActive ? '0 0 8px rgba(201,168,76,0.6)' : 'none', transition: 'all 0.18s'}} />
                        <div>
                          <div className="row-label" style={{fontSize: 15, color: isActive ? 'white' : 'rgba(255,255,255,0.65)', fontWeight: 600, letterSpacing: -0.2}}>{p.name}</div>
                          <div style={{fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em'}}>{p.type?.replace('step', 'Step ')}</div>
                        </div>
                      </div>
                      <svg className="row-chevron" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color: isActive ? '#c9a84c' : 'white', flexShrink: 0}}>
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  )
                })}

                {nbmePrograms.length > 0 && (
                  <div
                    className={`prog-row${isNbmeActive ? ' active-row' : ''}`}
                    onClick={() => { setStep('nbme'); setSelectedProgram(null) }}
                    style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '17px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', borderLeft: isNbmeActive ? '2px solid #c9a84c' : '2px solid transparent', paddingLeft: isNbmeActive ? 12 : 14, borderRadius: 2}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                      <div style={{width: 7, height: 7, borderRadius: '50%', background: isNbmeActive ? '#c9a84c' : 'rgba(255,255,255,0.18)', flexShrink: 0, boxShadow: isNbmeActive ? '0 0 8px rgba(201,168,76,0.6)' : 'none', transition: 'all 0.18s'}} />
                      <div>
                        <div className="row-label" style={{fontSize: 15, color: isNbmeActive ? 'white' : 'rgba(255,255,255,0.65)', fontWeight: 600, letterSpacing: -0.2}}>NBME</div>
                        <div style={{fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em'}}>{nbmePrograms.length} courses available</div>
                      </div>
                    </div>
                    <svg className="row-chevron" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color: isNbmeActive ? '#c9a84c' : 'white', flexShrink: 0}}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div style={{marginTop: 'auto', paddingTop: 36}}>
              <div style={{height: '1px', background: 'linear-gradient(90deg, rgba(201,168,76,0.25) 0%, transparent 80%)', marginBottom: 20}} />
              <div style={{fontFamily: 'Georgia, serif', fontSize: 12.5, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', lineHeight: 1.8, marginBottom: 16}}>
                "Every question you do today is a point on your score tomorrow."
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <div style={{width: 5, height: 5, borderRadius: '50%', background: '#c9a84c', opacity: 0.5}} />
                <span style={{fontSize: 11, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.05em'}}>Windsor School of Medicine · Official P2P Platform</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════
            RIGHT  —  Login / Sub-selection
            ═══════════════════════════════ */}
        <div style={{flex: 1, background: '#f5f5f7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 56px', position: 'relative', minHeight: '100vh'}}>

          {/* Subtle top accent */}
          <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #c9a84c 0%, rgba(201,168,76,0.3) 60%, transparent 100%)'}} />

          {/* IDLE */}
          {step === 'idle' && (
            <div className="fade-up" style={{textAlign: 'center', maxWidth: 360}}>
              <div style={{width: 72, height: 72, borderRadius: 22, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)'}}>
                <div style={{width: 36, height: 36, background: 'linear-gradient(135deg, #d4a93a, #c9a84c)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <div style={{width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '9px solid #0b1e35'}} />
                </div>
              </div>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#1d1d1f', fontWeight: 700, letterSpacing: -0.6, marginBottom: 12, lineHeight: 1.2}}>Welcome back.</div>
              <div style={{fontSize: 14.5, color: '#6e6e73', lineHeight: 1.75}}>
                Choose your program on the left<br/>to sign in to your StepUp account.
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 32}}>
                <div style={{width: 6, height: 6, borderRadius: '50%', background: '#c9a84c'}} />
                <span style={{fontSize: 12, color: '#aeaeb2', letterSpacing: '0.04em'}}>Restricted to enrolled members</span>
              </div>
            </div>
          )}

          {/* NBME SUB-MENU */}
          {step === 'nbme' && (
            <div className="fade-up" style={{maxWidth: 420, width: '100%'}}>
              <button onClick={() => setStep('idle')}
                style={{all: 'unset', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#aeaeb2', cursor: 'pointer', marginBottom: 36, fontWeight: 500}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                All programs
              </button>

              <div style={{marginBottom: 32}}>
                <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#aeaeb2', marginBottom: 10, fontWeight: 600}}>NBME Courses</div>
                <div style={{fontFamily: 'Georgia, serif', fontSize: 32, color: '#1d1d1f', fontWeight: 700, letterSpacing: -0.7, lineHeight: 1.1}}>Which course<br/>are you in?</div>
              </div>

              <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                {nbmePrograms.map((p: any) => (
                  <div key={p.id} className="nbme-sub-card" onClick={() => handleNbmePick(p)}
                    style={{background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'}}>
                    <div>
                      <div style={{fontSize: 15, color: '#1d1d1f', fontWeight: 600, letterSpacing: -0.2}}>{p.name}</div>
                      <div style={{fontSize: 12, color: '#aeaeb2', marginTop: 3}}>NBME Shelf Exam Course</div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink: 0}}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LOGIN FORM */}
          {step === 'login' && (
            <div className="fade-up" style={{maxWidth: 400, width: '100%'}}>
              <button onClick={() => { setStep(selectedProgram?.type === 'nbme' ? 'nbme' : 'idle'); setSelectedProgram(null) }}
                style={{all: 'unset', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#aeaeb2', cursor: 'pointer', marginBottom: 36, fontWeight: 500}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                {selectedProgram?.type === 'nbme' ? 'NBME courses' : 'All programs'}
              </button>

              {/* Program heading */}
              <div style={{marginBottom: 36}}>
                <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#aeaeb2', marginBottom: 10, fontWeight: 600}}>Signing in to</div>
                <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#1d1d1f', fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.1}}>{selectedProgram?.name}</div>
              </div>

              {!forgotMode ? (
                <>
                  {/* Email */}
                  <div style={{marginBottom: 14}}>
                    <label style={{fontSize: 12, fontWeight: 600, color: '#3a3a3c', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em'}}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@university.edu" autoFocus
                      style={{width: '100%', height: 52, borderRadius: 12, border: '1.5px solid #d1d1d6', background: 'white', fontFamily: 'inherit', fontSize: 15, padding: '0 18px', color: '#1d1d1f', transition: 'border-color 0.15s, box-shadow 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)'}}
                    />
                  </div>

                  {/* Password */}
                  <div style={{marginBottom: 10}}>
                    <label style={{fontSize: 12, fontWeight: 600, color: '#3a3a3c', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em'}}>Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••" onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      style={{width: '100%', height: 52, borderRadius: 12, border: '1.5px solid #d1d1d6', background: 'white', fontFamily: 'inherit', fontSize: 15, padding: '0 18px', color: '#1d1d1f', transition: 'border-color 0.15s, box-shadow 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)'}}
                    />
                  </div>

                  <div style={{textAlign: 'right', marginBottom: 24}}>
                    <button onClick={() => { setForgotMode(true); setForgotEmail(email); setForgotSent(false); setForgotError('') }}
                      style={{all: 'unset', fontSize: 13, color: '#c9a84c', cursor: 'pointer', fontWeight: 500}}>
                      Forgot password?
                    </button>
                  </div>

                  {error && (
                    <div style={{background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 10, padding: '13px 16px', marginBottom: 18, fontSize: 13.5, color: '#cf1322', lineHeight: 1.55}}>
                      {error}
                    </div>
                  )}

                  <button className="sign-in-btn" onClick={handleLogin} disabled={signingIn || !email || !password}
                    style={{all: 'unset', display: 'block', width: '100%', height: 54, background: signingIn || !email || !password ? '#c7c7cc' : '#0b1e35', borderRadius: 13, color: signingIn || !email || !password ? 'white' : '#c9a84c', fontFamily: 'inherit', fontSize: 16, fontWeight: 700, letterSpacing: -0.2, cursor: signingIn || !email || !password ? 'not-allowed' : 'pointer', textAlign: 'center', lineHeight: '54px', boxShadow: signingIn || !email || !password ? 'none' : '0 4px 20px rgba(11,30,53,0.28)'}}>
                    {signingIn ? 'Signing in…' : 'Sign in →'}
                  </button>
                </>
              ) : (
                <div style={{background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: '26px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)'}}>
                  <div style={{fontSize: 17, fontWeight: 700, color: '#1d1d1f', marginBottom: 6, letterSpacing: -0.3}}>Reset password</div>
                  <div style={{fontSize: 13, color: '#6e6e73', marginBottom: 18, lineHeight: 1.6}}>Enter your email and we'll send a reset link.</div>
                  {forgotSent ? (
                    <div>
                      <div style={{fontSize: 14, color: '#34c759', marginBottom: 14, lineHeight: 1.6, fontWeight: 500}}>✓ Reset link sent — check your inbox.</div>
                      <button onClick={() => setForgotMode(false)} style={{all: 'unset', fontSize: 14, color: '#c9a84c', cursor: 'pointer', fontWeight: 600}}>Back to sign in</button>
                    </div>
                  ) : (
                    <>
                      <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                        placeholder="your@email.com"
                        style={{width: '100%', height: 48, borderRadius: 10, border: '1.5px solid #d1d1d6', background: '#fafafa', fontFamily: 'inherit', fontSize: 14, padding: '0 14px', color: '#1d1d1f', marginBottom: 10}}/>
                      {forgotError && <div style={{fontSize: 13, color: '#cf1322', marginBottom: 10}}>{forgotError}</div>}
                      <div style={{display: 'flex', gap: 8}}>
                        <button onClick={handleForgotPassword} disabled={forgotLoading}
                          style={{all: 'unset', flex: 1, height: 42, background: '#0b1e35', borderRadius: 10, color: '#c9a84c', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'center', lineHeight: '42px'}}>
                          {forgotLoading ? 'Sending…' : 'Send reset link'}
                        </button>
                        <button onClick={() => setForgotMode(false)}
                          style={{all: 'unset', height: 42, padding: '0 18px', background: '#f5f5f7', border: '1px solid #d1d1d6', borderRadius: 10, fontFamily: 'inherit', fontSize: 13, color: '#3a3a3c', cursor: 'pointer', lineHeight: '42px'}}>
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
