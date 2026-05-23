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

  const handleMainPick = (p: any) => {
    setSelectedProgram(p)
    setStep('login')
    setError('')
    setForgotMode(false)
  }

  const handleNbmePick = (p: any) => {
    setSelectedProgram(p)
    setStep('login')
    setError('')
    setForgotMode(false)
  }

  const handleLogin = async () => {
    if (!selectedProgram) return
    setSigningIn(true)
    setError('')
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setSigningIn(false); return }

    const userId = data.user.id
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()

    if (profile?.role === 'admin') {
      setActiveProgram({ id: selectedProgram.id, name: selectedProgram.name, slug: selectedProgram.slug, type: selectedProgram.type, role: 'admin' })
      router.push('/admin')
      return
    }

    const { data: enrollment } = await supabase
      .from('program_enrollments').select('role')
      .eq('user_id', userId).eq('program_id', selectedProgram.id).single()

    if (!enrollment) {
      setError(`You're not enrolled in ${selectedProgram.name}. Contact your administrator.`)
      await supabase.auth.signOut()
      setSigningIn(false)
      return
    }

    setActiveProgram({ id: selectedProgram.id, name: selectedProgram.name, slug: selectedProgram.slug, type: selectedProgram.type, role: enrollment.role })
    router.push(enrollment.role === 'tutor' ? '/tutor' : '/dashboard')
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail) { setForgotError('Enter your email address.'); return }
    setForgotLoading(true); setForgotError('')
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo: window.location.origin + '/reset-password' })
    setForgotLoading(false)
    if (error) { setForgotError(error.message); return }
    setForgotSent(true)
  }

  return (
    <main style={{minHeight: '100vh', display: 'flex', fontFamily: '-apple-system, BlinkMacSystemFont, "Sora", sans-serif', background: '#fff'}}>

      {/* ─── LEFT PANEL ─── */}
      <div style={{width: '44%', background: '#0b1e35', display: 'flex', flexDirection: 'column', padding: '44px 44px 36px', minHeight: '100vh', position: 'relative'}}>

        {/* Logo */}
        <div style={{display: 'flex', alignItems: 'center', gap: 11, marginBottom: 56}}>
          <div style={{width: 38, height: 38, background: '#c9a84c', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
            <div style={{width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '11px solid #0b1e35'}}/>
          </div>
          <div>
            <div style={{fontSize: 19, color: 'white', fontWeight: 700, letterSpacing: -0.4}}>StepUp</div>
            <div style={{fontSize: 9.5, color: 'rgba(201,168,76,0.55)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 1}}>Windsor SOM · P2P Mentoring</div>
          </div>
        </div>

        {/* Heading */}
        <div style={{marginBottom: 28}}>
          <div style={{fontSize: 30, color: 'white', fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.15, marginBottom: 10}}>
            Choose your<br/>program.
          </div>
          <div style={{fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.65}}>
            Select the program you're enrolled in to sign in. Access is restricted to enrolled members only.
          </div>
        </div>

        {/* Program list */}
        {loadingPrograms ? (
          <div style={{color: 'rgba(255,255,255,0.25)', fontSize: 13, marginTop: 8}}>Loading...</div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: 7}}>
            {mainPrograms.map((p: any) => {
              const isActive = selectedProgram?.id === p.id && step === 'login'
              return (
                <button key={p.id} onClick={() => handleMainPick(p)}
                  style={{all: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '15px 18px', borderRadius: 14,
                    background: isActive ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isActive ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.07)'}`,
                    cursor: 'pointer', transition: 'all 0.15s ease'}}>
                  <div>
                    <div style={{fontSize: 15, color: 'white', fontWeight: 600, letterSpacing: -0.2}}>{p.name}</div>
                    <div style={{fontSize: 11.5, color: 'rgba(255,255,255,0.38)', marginTop: 2, textTransform: 'capitalize'}}>{p.type?.replace('step', 'Step ')}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#c9a84c' : 'rgba(255,255,255,0.25)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              )
            })}

            {/* NBME group card */}
            {nbmePrograms.length > 0 && (
              <button onClick={() => { setStep('nbme'); setSelectedProgram(null) }}
                style={{all: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '15px 18px', borderRadius: 14,
                  background: step === 'nbme' || selectedProgram?.type === 'nbme' ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${step === 'nbme' || selectedProgram?.type === 'nbme' ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.07)'}`,
                  cursor: 'pointer', transition: 'all 0.15s ease'}}>
                <div>
                  <div style={{fontSize: 15, color: 'white', fontWeight: 600, letterSpacing: -0.2}}>NBME</div>
                  <div style={{fontSize: 11.5, color: 'rgba(255,255,255,0.38)', marginTop: 2}}>{nbmePrograms.length} courses available</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={step === 'nbme' || selectedProgram?.type === 'nbme' ? '#c9a84c' : 'rgba(255,255,255,0.25)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{marginTop: 'auto', paddingTop: 32}}>
          <div style={{fontSize: 12.5, color: 'rgba(255,255,255,0.22)', fontStyle: 'italic', lineHeight: 1.7, fontFamily: 'Georgia, "Times New Roman", serif'}}>
            "Every question you do today is a point on your score tomorrow."
          </div>
          <div style={{fontSize: 11, color: 'rgba(201,168,76,0.4)', marginTop: 5}}>— P2P Mentoring Program</div>
        </div>
      </div>

      {/* ─── RIGHT PANEL ─── */}
      <div style={{flex: 1, background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 64px'}}>

        {/* IDLE */}
        {step === 'idle' && (
          <div style={{textAlign: 'center', maxWidth: 340}}>
            <div style={{width: 60, height: 60, borderRadius: 18, background: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div style={{fontSize: 26, fontWeight: 700, color: '#1d1d1f', letterSpacing: -0.5, marginBottom: 10}}>Welcome back</div>
            <div style={{fontSize: 14, color: '#86868b', lineHeight: 1.65}}>
              Select a program on the left to sign in to your StepUp account.
            </div>
          </div>
        )}

        {/* NBME SUBMENU */}
        {step === 'nbme' && (
          <div style={{maxWidth: 400, width: '100%'}}>
            <button onClick={() => setStep('idle')}
              style={{all: 'unset', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#86868b', cursor: 'pointer', marginBottom: 32}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back to programs
            </button>

            <div style={{fontSize: 26, fontWeight: 700, color: '#1d1d1f', letterSpacing: -0.5, marginBottom: 6}}>NBME Courses</div>
            <div style={{fontSize: 14, color: '#86868b', marginBottom: 28, lineHeight: 1.6}}>Choose the specific course you're enrolled in.</div>

            <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
              {nbmePrograms.map((p: any) => (
                <button key={p.id} onClick={() => handleNbmePick(p)}
                  style={{all: 'unset', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderRadius: 14,
                    background: '#f5f5f7', border: '1px solid transparent',
                    cursor: 'pointer', transition: 'all 0.12s ease'}}>
                  <div style={{fontSize: 15, color: '#1d1d1f', fontWeight: 600, letterSpacing: -0.2}}>{p.name}</div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* LOGIN FORM */}
        {step === 'login' && (
          <div style={{maxWidth: 400, width: '100%'}}>

            {/* Back button */}
            <button onClick={() => { setStep(selectedProgram?.type === 'nbme' ? 'nbme' : 'idle'); setSelectedProgram(null) }}
              style={{all: 'unset', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#86868b', cursor: 'pointer', marginBottom: 32}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back
            </button>

            {/* Context */}
            <div style={{marginBottom: 32}}>
              <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#86868b', marginBottom: 6}}>Signing in to</div>
              <div style={{fontSize: 26, fontWeight: 700, color: '#1d1d1f', letterSpacing: -0.5}}>{selectedProgram?.name}</div>
            </div>

            {!forgotMode ? (
              <>
                <div style={{marginBottom: 14}}>
                  <label style={{fontSize: 13, fontWeight: 500, color: '#3a3a3c', display: 'block', marginBottom: 7}}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@university.edu" autoFocus
                    style={{width: '100%', height: 52, borderRadius: 12, border: '1.5px solid #d1d1d6', background: '#fafafa', fontFamily: 'inherit', fontSize: 15, padding: '0 16px', color: '#1d1d1f', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s'}}
                    onFocus={e => e.target.style.borderColor = '#0b1e35'}
                    onBlur={e => e.target.style.borderColor = '#d1d1d6'}
                  />
                </div>

                <div style={{marginBottom: 8}}>
                  <label style={{fontSize: 13, fontWeight: 500, color: '#3a3a3c', display: 'block', marginBottom: 7}}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••" onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    style={{width: '100%', height: 52, borderRadius: 12, border: '1.5px solid #d1d1d6', background: '#fafafa', fontFamily: 'inherit', fontSize: 15, padding: '0 16px', color: '#1d1d1f', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s'}}
                    onFocus={e => e.target.style.borderColor = '#0b1e35'}
                    onBlur={e => e.target.style.borderColor = '#d1d1d6'}
                  />
                </div>

                <div style={{textAlign: 'right', marginBottom: 24}}>
                  <button onClick={() => { setForgotMode(true); setForgotEmail(email); setForgotSent(false); setForgotError('') }}
                    style={{all: 'unset', fontSize: 13, color: '#c9a84c', cursor: 'pointer', fontWeight: 500}}>
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <div style={{background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 10, padding: '12px 16px', marginBottom: 18, fontSize: 13, color: '#cf1322', lineHeight: 1.55}}>
                    {error}
                  </div>
                )}

                <button onClick={handleLogin} disabled={signingIn || !email || !password}
                  style={{all: 'unset', display: 'block', width: '100%', height: 52, background: signingIn || !email || !password ? '#c7c7cc' : '#0b1e35', borderRadius: 12, color: signingIn || !email || !password ? '#fff' : '#c9a84c', fontFamily: 'inherit', fontSize: 16, fontWeight: 700, letterSpacing: -0.2, cursor: signingIn || !email || !password ? 'not-allowed' : 'pointer', textAlign: 'center', lineHeight: '52px', boxSizing: 'border-box', transition: 'background 0.15s'}}>
                  {signingIn ? 'Signing in…' : 'Sign in'}
                </button>
              </>
            ) : (
              <div style={{background: '#f5f5f7', borderRadius: 16, padding: '24px 22px'}}>
                <div style={{fontSize: 16, fontWeight: 600, color: '#1d1d1f', marginBottom: 14}}>Reset password</div>
                {forgotSent ? (
                  <div>
                    <div style={{fontSize: 14, color: '#34c759', marginBottom: 14, lineHeight: 1.6}}>Reset link sent — check your inbox.</div>
                    <button onClick={() => setForgotMode(false)} style={{all: 'unset', fontSize: 14, color: '#c9a84c', cursor: 'pointer', fontWeight: 500}}>Back to sign in</button>
                  </div>
                ) : (
                  <>
                    <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                      placeholder="your@email.com"
                      style={{width: '100%', height: 48, borderRadius: 10, border: '1.5px solid #d1d1d6', background: 'white', fontFamily: 'inherit', fontSize: 14, padding: '0 14px', color: '#1d1d1f', outline: 'none', boxSizing: 'border-box', marginBottom: 10}}/>
                    {forgotError && <div style={{fontSize: 13, color: '#cf1322', marginBottom: 10}}>{forgotError}</div>}
                    <div style={{display: 'flex', gap: 8}}>
                      <button onClick={handleForgotPassword} disabled={forgotLoading}
                        style={{all: 'unset', flex: 1, height: 42, background: '#0b1e35', borderRadius: 10, color: '#c9a84c', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center', lineHeight: '42px'}}>
                        {forgotLoading ? 'Sending…' : 'Send reset link'}
                      </button>
                      <button onClick={() => setForgotMode(false)}
                        style={{all: 'unset', height: 42, padding: '0 18px', background: 'white', border: '1px solid #d1d1d6', borderRadius: 10, fontFamily: 'inherit', fontSize: 13, color: '#3a3a3c', cursor: 'pointer', lineHeight: '42px'}}>
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
  )
}
