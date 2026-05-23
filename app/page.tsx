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

    // Check profile role
    const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', userId).single()

    // Admins bypass enrollment check
    if (profile?.role === 'admin') {
      setActiveProgram({ id: selectedProgram.id, name: selectedProgram.name, slug: selectedProgram.slug, type: selectedProgram.type, role: 'admin' })
      router.push('/admin')
      return
    }

    // Check enrollment in selected program
    const { data: enrollment } = await supabase
      .from('program_enrollments')
      .select('role')
      .eq('user_id', userId)
      .eq('program_id', selectedProgram.id)
      .single()

    if (!enrollment) {
      setError(`You are not enrolled in ${selectedProgram.name}. Contact your administrator to get access.`)
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

  return (
    <main style={{minHeight: '100vh', background: '#f7f4ee', fontFamily: 'Sora, sans-serif'}}>

      {/* Header */}
      <div style={{background: '#0d2340', padding: '18px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <div style={{width: 40, height: 40, background: '#c9a84c', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
            <div style={{width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '12px solid #0d2340'}}/>
          </div>
          <div>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 22, color: 'white', fontWeight: 600}}>StepUp</div>
            <div style={{fontSize: 10, color: 'rgba(201,168,76,0.75)', letterSpacing: '0.1em', textTransform: 'uppercase'}}>P2P Mentoring Program · Windsor SOM</div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{background: '#0d2340', padding: '48px 48px 56px', borderBottom: '1px solid rgba(201,168,76,0.15)'}}>
        <div style={{maxWidth: 700}}>
          <div style={{fontFamily: 'Georgia, serif', fontSize: 38, color: 'white', lineHeight: 1.2, marginBottom: 14}}>
            Choose your program to <span style={{color: '#c9a84c'}}>sign in.</span>
          </div>
          <div style={{fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7}}>
            Select the program you're enrolled in below. You'll need your StepUp credentials to access it. Not enrolled yet? Contact your administrator.
          </div>
        </div>
      </div>

      {/* Program grid + login panel */}
      <div style={{maxWidth: 1100, margin: '0 auto', padding: '48px 48px'}}>

        {loadingPrograms ? (
          <div style={{textAlign: 'center', padding: '64px 0', color: '#8a7d6a', fontSize: 15}}>Loading programs...</div>
        ) : (
          <div style={{display: 'flex', gap: 40, alignItems: 'flex-start'}}>

            {/* Left: program cards */}
            <div style={{flex: 1}}>
              <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a89870', marginBottom: 16, fontWeight: 600}}>Available Programs</div>
              <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                {programs.map((p: any) => {
                  const typeColor = PROGRAM_TYPE_COLORS[p.type] || PROGRAM_TYPE_COLORS.step1
                  const typeLabel = PROGRAM_TYPE_LABELS[p.type] || p.type
                  const isSelected = selectedProgram?.id === p.id
                  return (
                    <div key={p.id} onClick={() => selectProgram(p)}
                      style={{
                        background: isSelected ? '#0d2340' : 'white',
                        border: isSelected ? '2px solid #c9a84c' : '1.5px solid #e8dfc8',
                        borderRadius: 12,
                        padding: '18px 20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        transition: 'all 0.15s',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      onMouseEnter={el => { if (!isSelected) el.currentTarget.style.borderColor = '#c9a84c' }}
                      onMouseLeave={el => { if (!isSelected) el.currentTarget.style.borderColor = '#e8dfc8' }}>
                      {/* Type stripe */}
                      <div style={{width: 4, height: 40, borderRadius: 4, background: typeColor.bg, flexShrink: 0}}/>
                      <div style={{flex: 1}}>
                        <div style={{fontFamily: 'Georgia, serif', fontSize: 18, color: isSelected ? 'white' : '#0d2340', fontWeight: 600, marginBottom: 4}}>{p.name}</div>
                        <span style={{fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 7px', borderRadius: 4, background: typeColor.bg, color: typeColor.text}}>{typeLabel}</span>
                      </div>
                      {isSelected && (
                        <div style={{fontSize: 18, color: '#c9a84c'}}>→</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right: login panel (appears after selecting a program) */}
            {selectedProgram ? (
              <div style={{width: 360, flexShrink: 0, background: 'white', border: '1.5px solid #e8dfc8', borderRadius: 16, padding: '32px 28px'}}>
                <div style={{marginBottom: 24}}>
                  <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a89870', marginBottom: 6}}>Signing in to</div>
                  <div style={{fontFamily: 'Georgia, serif', fontSize: 20, color: '#0d2340', fontWeight: 600}}>{selectedProgram.name}</div>
                </div>

                {!forgotMode ? (
                  <>
                    <div style={{marginBottom: 16}}>
                      <label style={{fontSize: 13, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6}}>Email address</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="you@university.edu"
                        style={{width: '100%', height: 44, borderRadius: 9, border: '1px solid #e8dfc8', background: '#fafaf8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 14px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}
                      />
                    </div>
                    <div style={{marginBottom: 10}}>
                      <label style={{fontSize: 13, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6}}>Password</label>
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••••"
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        style={{width: '100%', height: 44, borderRadius: 9, border: '1px solid #e8dfc8', background: '#fafaf8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 14px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}
                      />
                    </div>
                    <div style={{textAlign: 'right', marginBottom: 18}}>
                      <span onClick={() => { setForgotMode(true); setForgotEmail(email); setForgotSent(false); setForgotError('') }} style={{fontSize: 13, color: '#c9a84c', cursor: 'pointer'}}>Forgot password?</span>
                    </div>

                    {error && (
                      <div style={{background: '#fdf2ed', border: '0.5px solid #e8c4a8', borderRadius: 8, padding: '11px 14px', marginBottom: 16, fontSize: 13, color: '#6b3010', lineHeight: 1.5}}>
                        {error}
                      </div>
                    )}

                    <button onClick={handleLogin} disabled={signingIn || !email || !password}
                      style={{width: '100%', height: 46, background: signingIn || !email || !password ? '#9aacbf' : '#0d2340', border: 'none', borderRadius: 10, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 600, cursor: signingIn || !email || !password ? 'not-allowed' : 'pointer'}}>
                      {signingIn ? 'Signing in...' : 'Sign in'}
                    </button>
                  </>
                ) : (
                  <div>
                    <div style={{fontSize: 14, fontWeight: 600, color: '#0d2340', marginBottom: 10}}>Reset your password</div>
                    {forgotSent ? (
                      <div>
                        <div style={{fontSize: 14, color: '#3a6b3a', marginBottom: 12}}>Reset link sent! Check your inbox.</div>
                        <span onClick={() => setForgotMode(false)} style={{fontSize: 13, color: '#c9a84c', cursor: 'pointer'}}>Back to sign in</span>
                      </div>
                    ) : (
                      <div>
                        <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                          placeholder="your@email.com"
                          style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', background: '#fafaf8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 14px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', marginBottom: 10}}/>
                        {forgotError && <div style={{fontSize: 13, color: '#c0574a', marginBottom: 8}}>{forgotError}</div>}
                        <div style={{display: 'flex', gap: 8}}>
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
              </div>
            ) : (
              <div style={{width: 360, flexShrink: 0, background: 'white', border: '1.5px dashed #e0d8c4', borderRadius: 16, padding: '40px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 260}}>
                <div style={{width: 48, height: 48, borderRadius: '50%', background: '#f0ece0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 22}}>←</div>
                <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 8}}>Select a program</div>
                <div style={{fontSize: 13, color: '#a89870', lineHeight: 1.6}}>Click a program on the left to sign in.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
