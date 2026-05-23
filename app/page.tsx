'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../utils/supabase'
import { setActiveProgram } from '../utils/program-context'

type Step = 'idle' | 'nbme' | 'login'
type Role = 'student' | 'tutor' | 'admin'

const ACCENT: Record<string, { color: string; label: string; desc: string }> = {
  step1:    { color: '#2ca89a', label: 'Step 1',           desc: 'Comprehensive preparation for USMLE Step 1 success.' },
  step2:    { color: '#2b8fa8', label: 'Step 2',           desc: 'Clinical knowledge and application mastery.' },
  osce:     { color: '#4aa86a', label: 'OSCE',             desc: 'Sharpen your clinical skills with realistic OSCE scenarios.' },
  research: { color: '#8b6abf', label: 'Research',         desc: 'Build your research skills and strengthen your profile.' },
  nbme:     { color: '#2b7fb8', label: 'NBME Shelf Exams', desc: 'Subject-wise mastery with NBME-aligned practice and assessments.' },
}

export default function HomePage() {
  const [programs, setPrograms]             = useState<any[]>([])
  const [loadingPrograms, setLoadingPrograms] = useState(true)
  const [step, setStep]                     = useState<Step>('idle')
  const [selectedProgram, setSelectedProgram] = useState<any>(null)
  const [role, setRole]                     = useState<Role>('student')
  const [email, setEmail]                   = useState('')
  const [password, setPassword]             = useState('')
  const [showPass, setShowPass]             = useState(false)
  const [signingIn, setSigningIn]           = useState(false)
  const [error, setError]                   = useState('')
  const [forgotMode, setForgotMode]         = useState(false)
  const [forgotEmail, setForgotEmail]       = useState('')
  const [forgotSent, setForgotSent]         = useState(false)
  const [forgotLoading, setForgotLoading]   = useState(false)
  const [forgotError, setForgotError]       = useState('')
  const router   = useRouter()
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
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes goldPulse { 0%,100%{opacity:.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp .28s cubic-bezier(.22,.68,0,1.15) both; }
        .glow-orb { animation: goldPulse 7s ease-in-out infinite; }

        .prog-card {
          background: rgba(255,255,255,0.10);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 14px;
          padding: 20px 18px 18px;
          cursor: pointer;
          position: relative;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
          transition: transform .18s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease;
        }
        .prog-card:hover { transform: translateY(-3px); box-shadow: 0 10px 36px rgba(0,0,0,0.35) !important; background: rgba(255,255,255,0.15) !important; border-color: rgba(255,255,255,0.22) !important; }
        .prog-card.active { background: rgba(255,255,255,0.16) !important; border-color: rgba(255,255,255,0.28) !important; box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important; transform: translateY(-2px); }

        .nbme-card {
          background: rgba(255,255,255,0.10);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 14px;
          padding: 20px 20px 18px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
          transition: transform .18s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease;
        }
        .nbme-card:hover { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(0,0,0,0.35) !important; background: rgba(255,255,255,0.15) !important; border-color: rgba(255,255,255,0.22) !important; }
        .nbme-card.active { background: rgba(255,255,255,0.16) !important; border-color: rgba(255,255,255,0.28) !important; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.28) !important; }

        .arrow-btn { transition: background .15s ease, transform .15s ease; }
        .prog-card:hover .arrow-btn, .nbme-card:hover .arrow-btn { transform: scale(1.08); }

        .nbme-pill { transition: background .15s; }
        .nbme-pill:hover { background: rgba(0,0,0,0.07) !important; }

        .sub-row { transition: background .13s, transform .13s; cursor: pointer; }
        .sub-row:hover { background: #f0f0f5 !important; transform: translateX(3px); }

        .role-btn { transition: all .14s ease; cursor: pointer; border: none; }
        .sign-btn { transition: background .15s, box-shadow .15s; }
        .sign-btn:not(:disabled):hover { background: #1a3457 !important; box-shadow: 0 10px 30px rgba(11,30,53,.4) !important; }

        input:focus { outline: none; border-color: #0b1e35 !important; box-shadow: 0 0 0 3px rgba(11,30,53,.09) !important; }

        .feat-pill { display:inline-flex; align-items:center; gap:8px; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.13); border-radius:10px; padding:9px 14px; cursor:default; }
      `}</style>

      <main style={{minHeight:'100vh', display:'flex', fontFamily:'-apple-system,BlinkMacSystemFont,"Sora",sans-serif', background:'#060f1e'}}>

        {/* ══════════════════════════════
            LEFT — Brand + Programs
            ══════════════════════════════ */}
        <div style={{width:'54%', minHeight:'100vh', position:'relative', display:'flex', flexDirection:'column', overflow:'hidden', flexShrink:0}}>

          {/* Bg layers */}
          <div style={{position:'absolute',inset:0,background:'linear-gradient(160deg,#0d1e38 0%,#070e1c 45%,#03060f 100%)'}}/>
          <div className="glow-orb" style={{position:'absolute',top:'-18%',left:'-12%',width:'80%',height:'80%',background:'radial-gradient(ellipse,rgba(201,168,76,.32) 0%,rgba(201,168,76,.06) 45%,transparent 70%)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',bottom:'-5%',right:'-5%',width:'55%',height:'55%',background:'radial-gradient(ellipse,rgba(20,80,160,.1) 0%,transparent 65%)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(rgba(255,255,255,.026) 1px,transparent 1px)',backgroundSize:'28px 28px',pointerEvents:'none'}}/>

          <div style={{position:'relative',zIndex:1,flex:1,display:'flex',flexDirection:'column'}}>

            {/* ── Header bar ── */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 36px',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
              <div style={{display:'flex',alignItems:'center',gap:11}}>
                <div style={{width:38,height:38,background:'linear-gradient(145deg,#dbbe50 0%,#c9a84c 60%,#b8922a 100%)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 0 0 1px rgba(255,255,255,.1),0 4px 18px rgba(201,168,76,.35)'}}>
                  <div style={{width:0,height:0,borderLeft:'5.5px solid transparent',borderRight:'5.5px solid transparent',borderBottom:'10px solid rgba(6,15,30,.88)'}}/>
                </div>
                <div>
                  <div style={{fontSize:18,color:'white',fontWeight:600,letterSpacing:-0.5,lineHeight:1}}>StepUp</div>
                  <div style={{fontSize:9,color:'rgba(201,168,76,.45)',letterSpacing:'0.16em',textTransform:'uppercase',marginTop:3}}>P2P Mentoring · Windsor SOM</div>
                </div>
              </div>
              {/* Badge */}
              <div style={{display:'flex',alignItems:'center',gap:7,border:'1px solid rgba(201,168,76,.35)',borderRadius:20,padding:'7px 16px',background:'rgba(201,168,76,.07)'}}>
                <span style={{fontSize:14}}>🎓</span>
                <span style={{fontSize:12,color:'rgba(201,168,76,.85)',fontWeight:500,letterSpacing:'0.02em'}}>Windsor SOM · Class of 2026</span>
              </div>
            </div>

            {/* ── Main scrollable content ── */}
            <div style={{flex:1,overflowY:'auto',padding:'36px 36px 32px'}}>

              {/* Hero */}
              <div style={{marginBottom:28}}>
                {/* Main headline */}
                <div style={{fontFamily:'Georgia,"Times New Roman",serif',fontSize:48,color:'white',fontWeight:600,lineHeight:1.05,letterSpacing:-1.2,marginBottom:16}}>
                  Where Strategy<br/>Meets <span style={{color:'#c9a84c',fontStyle:'italic'}}>Success.</span>
                </div>

                {/* Three pillars */}
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,flexWrap:'wrap'}}>
                  {['High-Yield Learning','Real Accountability','Proven Growth'].map((p,i,a) => (
                    <span key={p} style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'rgba(201,168,76,0.75)'}}>{p}</span>
                      {i < a.length-1 && <span style={{color:'rgba(255,255,255,0.2)',fontSize:12}}>·</span>}
                    </span>
                  ))}
                </div>

                {/* Supporting line */}
                <div style={{fontSize:13,color:'rgba(255,255,255,.36)',lineHeight:1.75,marginBottom:20,maxWidth:380}}>
                  Personalized mentorship, question-focused learning, and data-driven study systems designed to help medical students perform at their highest level.
                </div>

                {/* Feature pills */}
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {[
                    { label:'Score Reports', icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 17V13M12 17V9M16 17V12"/></svg> },
                    { label:'Live Sessions', icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> },
                    { label:'NBME Tracking', icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
                    { label:'Mentor Support', icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                  ].map(f => (
                    <div key={f.label} className="feat-pill">
                      <span style={{color:'rgba(201,168,76,.8)'}}>{f.icon}</span>
                      <span style={{fontSize:12,color:'rgba(255,255,255,.7)',fontWeight:500}}>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
                <div style={{flex:1,height:'1px',background:'rgba(255,255,255,.08)'}}/>
                <span style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.15em',color:'rgba(255,255,255,.25)',whiteSpace:'nowrap'}}>Select your program</span>
                <div style={{flex:1,height:'1px',background:'rgba(255,255,255,.08)'}}/>
              </div>

              {/* ── Program Cards ── */}
              {loadingPrograms ? (
                <div style={{color:'rgba(255,255,255,.25)',fontSize:13,padding:'20px 0'}}>Loading programs…</div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>

                  {/* 2-col grid */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                    {mainPrograms.map((p: any) => {
                      const ac = ACCENT[p.type] || ACCENT.step1
                      const isActive = selectedProgram?.id === p.id && step === 'login'
                      return (
                        <div key={p.id} className={`prog-card${isActive?' active':''}`} onClick={() => pick(p)}>
                          {/* Type label */}
                          <div style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:ac.color,marginBottom:8}}>{ac.label}</div>
                          {/* Title */}
                          <div style={{fontFamily:'Georgia,serif',fontSize:16,color:'white',fontWeight:700,lineHeight:1.3,marginBottom:6,letterSpacing:-0.2}}>{p.name}</div>
                          {/* Description */}
                          <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',lineHeight:1.6,marginBottom:16}}>{p.description || ac.desc}</div>
                          {/* Arrow btn */}
                          <div style={{display:'flex',justifyContent:'flex-end'}}>
                            <div className="arrow-btn" style={{width:32,height:32,borderRadius:'50%',border:`1.5px solid ${ac.color}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                              {isActive
                                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ac.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ac.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                              }
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* NBME full-width card */}
                  {nbmePrograms.length > 0 && (
                    <div className={`nbme-card${isNbmeActive?' active':''}`} onClick={() => { setStep('nbme'); setSelectedProgram(null) }}>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:10.5,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:ACCENT.nbme.color,marginBottom:8}}>NBME Shelf Exams</div>
                          <div style={{fontFamily:'Georgia,serif',fontSize:17,color:'white',fontWeight:700,letterSpacing:-0.3,marginBottom:6}}>NBME Courses</div>
                          <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',lineHeight:1.6,marginBottom:14}}>{ACCENT.nbme.desc}</div>
                          {/* Sub-program pills */}
                          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                            {nbmePrograms.map((p: any) => (
                              <span key={p.id} className="nbme-pill" style={{fontSize:11.5,color:'rgba(255,255,255,0.7)',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.15)',padding:'3px 11px',borderRadius:20}}>
                                {p.name.replace(/^NBME\s*/i,'').trim() || p.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="arrow-btn" style={{width:34,height:34,borderRadius:'50%',border:`1.5px solid ${ACCENT.nbme.color}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2}}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ACCENT.nbme.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quote */}
              <div style={{marginTop:28,paddingTop:20,borderTop:'1px solid rgba(255,255,255,.08)'}}>
                <p style={{fontFamily:'Georgia,serif',fontSize:13,color:'rgba(255,255,255,.5)',fontStyle:'italic',lineHeight:1.75}}>
                  <span style={{color:'rgba(201,168,76,.7)',fontSize:16,fontStyle:'normal'}}>"</span>Every question you do today is a point on your score tomorrow.<span style={{color:'rgba(201,168,76,.7)',fontSize:16,fontStyle:'normal'}}>"</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════
            RIGHT — Auth Panel
            ══════════════════════════════ */}
        <div style={{flex:1,background:'#f0f2f5',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 48px',minHeight:'100vh'}}>

          <div style={{width:'100%',maxWidth:420,background:'white',borderRadius:20,boxShadow:'0 8px 40px rgba(0,0,0,0.12)',overflow:'hidden'}}>
            <div style={{padding:'32px 32px 36px'}}>

              {/* ── IDLE ── */}
              {step === 'idle' && (
                <div className="fade-up" style={{textAlign:'center',padding:'24px 0'}}>
                  <div style={{width:68,height:68,borderRadius:20,background:'linear-gradient(145deg,#dbbe50,#c9a84c)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 22px',boxShadow:'0 6px 24px rgba(201,168,76,.3)'}}>
                    <div style={{width:0,height:0,borderLeft:'8px solid transparent',borderRight:'8px solid transparent',borderBottom:'14px solid rgba(6,15,30,.85)'}}/>
                  </div>
                  <div style={{fontFamily:'Georgia,serif',fontSize:26,color:'#0d1f38',fontWeight:700,letterSpacing:-0.5,marginBottom:10}}>Welcome back.</div>
                  <div style={{fontSize:14,color:'#8e9aab',lineHeight:1.7}}>Select a program on the left<br/>to sign in to your account.</div>
                </div>
              )}

              {/* ── NBME SUB-MENU ── */}
              {step === 'nbme' && (
                <div className="fade-up">
                  <button onClick={() => setStep('idle')}
                    style={{all:'unset',display:'inline-flex',alignItems:'center',gap:5,fontSize:13,color:'#8e9aab',cursor:'pointer',marginBottom:28,fontWeight:500}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    All programs
                  </button>
                  <div style={{fontSize:10.5,textTransform:'uppercase',letterSpacing:'0.12em',color:ACCENT.nbme.color,marginBottom:10,fontWeight:700}}>NBME Shelf Exams</div>
                  <div style={{fontFamily:'Georgia,serif',fontSize:26,color:'#0d1f38',fontWeight:700,letterSpacing:-0.5,marginBottom:6}}>Which course<br/>are you in?</div>
                  <div style={{fontSize:13.5,color:'#8e9aab',marginBottom:22}}>Select your specific shelf exam program.</div>
                  <div style={{display:'flex',flexDirection:'column',gap:7}}>
                    {nbmePrograms.map((p: any) => (
                      <div key={p.id} className="sub-row" onClick={() => pick(p)}
                        style={{background:'#f7f8fa',border:'1px solid #eaecf0',borderRadius:12,padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <div style={{fontSize:14.5,color:'#0d1f38',fontWeight:600}}>{p.name}</div>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c7d0dc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── LOGIN FORM ── */}
              {step === 'login' && (
                <div className="fade-up">
                  {/* Back */}
                  <button onClick={() => { setStep(selectedProgram?.type==='nbme'?'nbme':'idle'); setSelectedProgram(null) }}
                    style={{all:'unset',display:'inline-flex',alignItems:'center',gap:5,fontSize:13,color:'#8e9aab',cursor:'pointer',marginBottom:24,fontWeight:500}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    {selectedProgram?.type==='nbme' ? 'NBME courses' : 'All programs'}
                  </button>

                  {/* Program context */}
                  <div style={{marginBottom:24}}>
                    <div style={{fontSize:10.5,textTransform:'uppercase',letterSpacing:'0.12em',color:'#8e9aab',marginBottom:7,fontWeight:600}}>Signing in to</div>
                    <div style={{fontFamily:'Georgia,serif',fontSize:24,color:'#0d1f38',fontWeight:700,letterSpacing:-0.4,lineHeight:1.2}}>{selectedProgram?.name}</div>
                  </div>

                  {!forgotMode ? (<>
                    {/* Role toggle */}
                    <div style={{display:'flex',background:'#eef0f4',borderRadius:11,padding:3,marginBottom:24}}>
                      {(['student','tutor','admin'] as Role[]).map(r => (
                        <button key={r} className="role-btn" onClick={() => setRole(r)}
                          style={{flex:1,padding:'9px 4px',borderRadius:8,fontSize:13.5,fontWeight:role===r?600:400,color:role===r?'white':'#6e7a8a',background:role===r?'#0d1f38':'transparent',boxShadow:role===r?'0 2px 8px rgba(13,31,56,.25)':'none',textTransform:'capitalize',letterSpacing:-0.1}}>
                          {r}
                        </button>
                      ))}
                    </div>

                    {/* Email */}
                    <div style={{marginBottom:14}}>
                      <label style={{fontSize:11,fontWeight:700,color:'#3a4553',display:'block',marginBottom:7,textTransform:'uppercase',letterSpacing:'0.09em'}}>Email</label>
                      <div style={{position:'relative'}}>
                        <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#b0bac6',pointerEvents:'none'}}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        </span>
                        <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                          placeholder="you@university.edu" autoFocus
                          style={{width:'100%',height:50,borderRadius:11,border:'1.5px solid #e8dfc8',background:'#fdf8ed',fontFamily:'inherit',fontSize:14.5,paddingLeft:44,paddingRight:16,color:'#0d1f38',transition:'border-color .15s,box-shadow .15s'}}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div style={{marginBottom:10}}>
                      <label style={{fontSize:11,fontWeight:700,color:'#3a4553',display:'block',marginBottom:7,textTransform:'uppercase',letterSpacing:'0.09em'}}>Password</label>
                      <div style={{position:'relative'}}>
                        <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#b0bac6',pointerEvents:'none'}}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </span>
                        <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                          placeholder="••••••••••" onKeyDown={e=>e.key==='Enter'&&handleLogin()}
                          style={{width:'100%',height:50,borderRadius:11,border:'1.5px solid #e8dfc8',background:'#fdf8ed',fontFamily:'inherit',fontSize:14.5,paddingLeft:44,paddingRight:46,color:'#0d1f38',transition:'border-color .15s,box-shadow .15s'}}
                        />
                        <button onClick={()=>setShowPass(!showPass)}
                          style={{all:'unset',position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',color:'#b0bac6',cursor:'pointer'}}>
                          {showPass
                            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          }
                        </button>
                      </div>
                    </div>

                    <div style={{textAlign:'right',marginBottom:20}}>
                      <button onClick={()=>{setForgotMode(true);setForgotEmail(email);setForgotSent(false);setForgotError('')}}
                        style={{all:'unset',fontSize:13,color:'#c9a84c',cursor:'pointer',fontWeight:500}}>
                        Forgot password?
                      </button>
                    </div>

                    {error && (
                      <div style={{background:'#fff2f0',border:'1px solid #ffccc7',borderRadius:10,padding:'12px 15px',marginBottom:16,fontSize:13,color:'#cf1322',lineHeight:1.55}}>
                        {error}
                      </div>
                    )}

                    <button className="sign-btn" onClick={handleLogin} disabled={signingIn||!email||!password}
                      style={{all:'unset',display:'block',width:'100%',height:52,background:signingIn||!email||!password?'#b0bac6':'#0d1f38',borderRadius:12,color:'white',fontFamily:'inherit',fontSize:16,fontWeight:700,letterSpacing:-0.2,cursor:signingIn||!email||!password?'not-allowed':'pointer',textAlign:'center',lineHeight:'52px',boxShadow:signingIn||!email||!password?'none':'0 4px 20px rgba(13,31,56,.25)',marginBottom:20}}>
                      {signingIn ? 'Signing in…' : 'Sign in →'}
                    </button>

                    <div style={{textAlign:'center',fontSize:13.5,color:'#8e9aab'}}>
                      New here?{' '}
                      <button onClick={()=>setError('Contact your administrator to get access.')}
                        style={{all:'unset',color:'#c9a84c',cursor:'pointer',fontWeight:500}}>
                        Request access
                      </button>
                    </div>
                  </>) : (
                    <div>
                      <div style={{fontSize:17,fontWeight:700,color:'#0d1f38',marginBottom:6,letterSpacing:-0.3}}>Reset password</div>
                      <div style={{fontSize:13,color:'#8e9aab',marginBottom:18,lineHeight:1.65}}>Enter your email to receive a reset link.</div>
                      {forgotSent ? (<>
                        <div style={{fontSize:14,color:'#34c759',marginBottom:14,fontWeight:500}}>✓ Reset link sent — check your inbox.</div>
                        <button onClick={()=>setForgotMode(false)} style={{all:'unset',fontSize:14,color:'#c9a84c',cursor:'pointer',fontWeight:600}}>Back to sign in</button>
                      </>) : (<>
                        <input type="email" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)}
                          placeholder="your@email.com"
                          style={{width:'100%',height:48,borderRadius:10,border:'1.5px solid #e8dfc8',background:'#fdf8ed',fontFamily:'inherit',fontSize:14,padding:'0 14px',color:'#0d1f38',marginBottom:10}}/>
                        {forgotError && <div style={{fontSize:13,color:'#cf1322',marginBottom:10}}>{forgotError}</div>}
                        <div style={{display:'flex',gap:8}}>
                          <button onClick={handleForgotPassword} disabled={forgotLoading}
                            style={{all:'unset',flex:1,height:44,background:'#0d1f38',borderRadius:10,color:'#c9a84c',fontFamily:'inherit',fontSize:13,fontWeight:700,cursor:'pointer',textAlign:'center',lineHeight:'44px'}}>
                            {forgotLoading?'Sending…':'Send reset link'}
                          </button>
                          <button onClick={()=>setForgotMode(false)}
                            style={{all:'unset',height:44,padding:'0 16px',background:'#f0f2f5',border:'1px solid #dde1e8',borderRadius:10,fontFamily:'inherit',fontSize:13,color:'#3a4553',cursor:'pointer',lineHeight:'44px'}}>
                            Cancel
                          </button>
                        </div>
                      </>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
