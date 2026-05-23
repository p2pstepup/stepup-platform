'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../utils/supabase'
import { setActiveProgram, PROGRAM_TYPE_LABELS, PROGRAM_TYPE_COLORS } from '../utils/program-context'

export default function HomePage() {
  const [programs, setPrograms] = useState<any[]>([])
  const [loadingPrograms, setLoadingPrograms] = useState(true)
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

  const selectProgram = (p: any) => {
    setSelectedProgram(p)
    setError('')
    setForgotMode(false)
  }

  const handleLogin = async () => {
    if (!selectedProgram) return
    setSigningIn(true)
    setError('')
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setSigningIn(false)
      return
    }

    const userId = data.user.id
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()

    if (profile?.role === 'admin') {
      setActiveProgram({ id: selectedProgram.id, name: selectedProgram.name, slug: selectedProgram.slug, type: selectedProgram.type, role: 'admin' })
      router.push('/admin')
      return
    }

    const { data: enrollment } = await supabase
      .from('program_enrollments')
      .select('role')
      .eq('user_id', userId)
      .eq('program_id', selectedProgram.id)
      .single()

    if (!enrollment) {
      setError(`You're not enrolled in ${selectedProgram.name}. Contact your administrator to get access.`)
      await supabase.auth.signOut()
      setSigningIn(false)
      return
    }

    setActiveProgram({ id: selectedProgram.id, name: selectedProgram.name, slug: selectedProgram.slug, type: selectedProgram.type, role: enrollment.role })
    if (enrollment.role === 'tutor') router.push('/tutor')
    else router.push('/dashboard')
  }

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

  const typeColor = selectedProgram ? (PROGRAM_TYPE_COLORS[selectedProgram.type] || PROGRAM_TYPE_COLORS.step1) : null

  return (
    <main style={{minHeight: '100vh', display: 'flex', fontFamily: 'Sora, sans-serif'}}>

      {/* ── LEFT PANEL ── */}
      <div style={{width: '54%', background: '#0d2340', display: 'flex', flexDirection: 'column', padding: '40px 48px', minHeight: '100vh', overflowY: 'auto'}}>

        {/* Logo */}
        <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 52, paddingBottom: 24, borderBottom: '0.5px solid rgba(201,168,76,0.18)'}}>
          <div style={{width: 42, height: 42, background: '#c9a84c', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
            <div style={{width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '12px solid #0d2340'}}/>
          </div>
          <div>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 22, color: 'white', fontWeight: 600}}>StepUp</div>
            <div style={{fontSize: 10, color: 'rgba(201,168,76,0.65)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2}}>P2P Mentoring Program · Windsor SOM</div>
          </div>
        </div>

        {/* Heading */}
        <div style={{marginBottom: 32}}>
          <div style={{fontFamily: 'Georgia, serif', fontSize: 34, color: 'white', lineHeight: 1.2, marginBottom: 12, letterSpacing: -0.3}}>
            Choose your <span style={{color: '#c9a84c'}}>program.</span>
          </div>
          <div style={{fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 400}}>
            Select the program you're enrolled in below to sign in. Access is restricted to enrolled students and tutors only.
          </div>
        </div>

        {/* Program cards */}
        {loadingPrograms ? (
          <div style={{color: 'rgba(255,255,255,0.35)', fontSize: 14, padding: '20px 0'}}>Loading programs...</div>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1}}>
            {programs.map((p: any) => {
              const tc = PROGRAM_TYPE_COLORS[p.type] || PROGRAM_TYPE_COLORS.step1
              const tl = PROGRAM_TYPE_LABELS[p.type] || p.type
              const isSelected = selectedProgram?.id === p.id
              return (
                <div key={p.id} onClick={() => selectProgram(p)}
                  style={{
                    background: isSelected ? 'rgba(201,168,76,0.13)' : 'rgba(255,255,255,0.04)',
                    border: isSelected ? '1.5px solid rgba(201,168,76,0.7)' : '0.5px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: '18px 16px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={el => { if (!isSelected) { el.currentTarget.style.background = 'rgba(255,255,255,0.07)'; el.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}}
                  onMouseLeave={el => { if (!isSelected) { el.currentTarget.style.background = 'rgba(255,255,255,0.04)'; el.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}}>
                  {/* Top accent bar */}
                  <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: tc.bg, opacity: isSelected ? 1 : 0.6}}/>
                  <div style={{marginTop: 6}}>
                    <span style={{fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', padding: '2px 7px', borderRadius: 4, background: tc.bg, color: tc.text, display: 'inline-block', marginBottom: 10}}>
                      {tl}
                    </span>
                    <div style={{fontFamily: 'Georgia, serif', fontSize: 15, color: isSelected ? 'white' : 'rgba(255,255,255,0.85)', fontWeight: 600, lineHeight: 1.35}}>
                      {p.name}
                    </div>
                  </div>
                  {isSelected && (
                    <div style={{position: 'absolute', top: 10, right: 12, width: 18, height: 18, borderRadius: '50%', background: '#c9a84c', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <span style={{fontSize: 10, color: '#0d2340', fontWeight: 700}}>✓</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Footer quote */}
        <div style={{marginTop: 48, paddingTop: 24, borderTop: '0.5px solid rgba(201,168,76,0.12)'}}>
          <div style={{fontFamily: 'Georgia, serif', fontSize: 13, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', lineHeight: 1.7}}>
            "Every question you do today is a point on your score tomorrow."
          </div>
          <div style={{fontSize: 11, color: 'rgba(201,168,76,0.55)', marginTop: 6}}>— P2P Mentoring Program</div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{flex: 1, background: '#f7f4ee', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 56px'}}>

        {selectedProgram ? (
          <div style={{maxWidth: 400, width: '100%'}}>

            {/* Selected program chip */}
            <div style={{background: 'white', border: '1px solid #e8dfc8', borderRadius: 12, padding: '14px 18px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 12px rgba(13,35,64,0.06)'}}>
              <div style={{width: 5, alignSelf: 'stretch', borderRadius: 3, background: typeColor?.bg || '#0d2340', flexShrink: 0, minHeight: 36}}/>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a89870', marginBottom: 3}}>Signing in to</div>
                <div style={{fontFamily: 'Georgia, serif', fontSize: 17, color: '#0d2340', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{selectedProgram.name}</div>
              </div>
              <div onClick={() => setSelectedProgram(null)} style={{fontSize: 11, color: '#a89870', cursor: 'pointer', padding: '4px 8px', borderRadius: 5, border: '0.5px solid #e0d8c4', flexShrink: 0, background: '#fafaf8'}}>Change</div>
            </div>

            {!forgotMode ? (
              <>
                <div style={{marginBottom: 16}}>
                  <label style={{fontSize: 13, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 7}}>Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@university.edu" autoFocus
                    style={{width: '100%', height: 48, borderRadius: 9, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 15, padding: '0 16px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', boxShadow: '0 1px 4px rgba(0,0,0,0.04)'}}
                  />
                </div>

                <div style={{marginBottom: 10}}>
                  <label style={{fontSize: 13, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 7}}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    style={{width: '100%', height: 48, borderRadius: 9, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 15, padding: '0 16px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', boxShadow: '0 1px 4px rgba(0,0,0,0.04)'}}
                  />
                </div>

                <div style={{textAlign: 'right', marginBottom: 24}}>
                  <span onClick={() => { setForgotMode(true); setForgotEmail(email); setForgotSent(false); setForgotError('') }}
                    style={{fontSize: 13, color: '#c9a84c', cursor: 'pointer'}}>Forgot password?</span>
                </div>

                {error && (
                  <div style={{background: '#fdf2ed', border: '0.5px solid #e8c4a8', borderRadius: 9, padding: '12px 16px', marginBottom: 18, fontSize: 13, color: '#6b3010', lineHeight: 1.55}}>
                    {error}
                  </div>
                )}

                <button onClick={handleLogin} disabled={signingIn || !email || !password}
                  style={{width: '100%', height: 50, background: signingIn || !email || !password ? '#9aacbf' : '#0d2340', border: 'none', borderRadius: 10, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 600, cursor: signingIn || !email || !password ? 'not-allowed' : 'pointer', boxShadow: signingIn || !email || !password ? 'none' : '0 4px 16px rgba(13,35,64,0.25)'}}>
                  {signingIn ? 'Signing in...' : 'Sign in →'}
                </button>
              </>
            ) : (
              <div style={{background: 'white', border: '1px solid #e8dfc8', borderRadius: 12, padding: '22px 20px'}}>
                <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 12}}>Reset your password</div>
                {forgotSent ? (
                  <div>
                    <div style={{fontSize: 14, color: '#3a6b3a', marginBottom: 14, lineHeight: 1.6}}>Reset link sent — check your inbox.</div>
                    <span onClick={() => setForgotMode(false)} style={{fontSize: 13, color: '#c9a84c', cursor: 'pointer'}}>Back to sign in</span>
                  </div>
                ) : (
                  <>
                    <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                      placeholder="your@email.com"
                      style={{width: '100%', height: 44, borderRadius: 8, border: '1px solid #e8dfc8', background: '#fafaf8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 14px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', marginBottom: 10}}/>
                    {forgotError && <div style={{fontSize: 13, color: '#c0574a', marginBottom: 10}}>{forgotError}</div>}
                    <div style={{display: 'flex', gap: 8}}>
                      <button onClick={handleForgotPassword} disabled={forgotLoading}
                        style={{flex: 1, height: 40, background: '#0d2340', border: 'none', borderRadius: 8, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer'}}>
                        {forgotLoading ? 'Sending...' : 'Send reset link'}
                      </button>
                      <button onClick={() => setForgotMode(false)}
                        style={{height: 40, padding: '0 16px', background: 'white', border: '0.5px solid #e0d8c4', borderRadius: 8, fontFamily: 'Sora, sans-serif', fontSize: 13, color: '#8a7d6a', cursor: 'pointer'}}>
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          /* No program selected yet */
          <div style={{textAlign: 'center', maxWidth: 300}}>
            <div style={{width: 64, height: 64, borderRadius: '50%', background: 'rgba(13,35,64,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 26}}>
              ←
            </div>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 24, color: '#0d2340', fontWeight: 600, marginBottom: 10}}>Welcome back</div>
            <div style={{fontSize: 14, color: '#8a7d6a', lineHeight: 1.7}}>
              Select the program you're enrolled in on the left to sign in to your StepUp account.
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
