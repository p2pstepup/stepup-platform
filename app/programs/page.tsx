'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase'
import { setActiveProgram, PROGRAM_TYPE_LABELS, PROGRAM_TYPE_COLORS } from '../../utils/program-context'

export default function ProgramSelect() {
  const router = useRouter()
  const supabase = createClient()
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)

      // Admins with no enrollments see all programs (super-admin)
      if (profileData?.role === 'admin') {
        const { data: allPrograms } = await supabase.from('programs').select('*').eq('is_active', true).order('sort_order')
        const adminEnrollments = (allPrograms || []).map((p: any) => ({ program_id: p.id, role: 'admin', programs: p }))
        setEnrollments(adminEnrollments)
        setLoading(false)
        return
      }

      const { data: enrollData } = await supabase
        .from('program_enrollments')
        .select('*, programs(*)')
        .eq('user_id', user.id)
        .order('enrolled_at')

      const active = (enrollData || []).filter((e: any) => e.programs?.is_active)

      // Auto-redirect if only one program
      if (active.length === 1) {
        const e = active[0]
        setActiveProgram({ id: e.programs.id, name: e.programs.name, slug: e.programs.slug, type: e.programs.type, role: e.role })
        redirectToDashboard(e.role)
        return
      }

      setEnrollments(active)
      setLoading(false)
    }
    init()
  }, [])

  const redirectToDashboard = (role: string) => {
    if (role === 'admin') router.push('/admin')
    else if (role === 'tutor') router.push('/tutor')
    else router.push('/dashboard')
  }

  const selectProgram = (enrollment: any) => {
    const p = enrollment.programs
    setActiveProgram({ id: p.id, name: p.name, slug: p.slug, type: p.type, role: enrollment.role })
    redirectToDashboard(enrollment.role)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f7f4ee',fontFamily:'Sora,sans-serif'}}>
      <div style={{fontSize:14,color:'#8a7d6a'}}>Loading your programs...</div>
    </div>
  )

  if (enrollments.length === 0) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f7f4ee',fontFamily:'Sora,sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:18,fontWeight:600,color:'#0d2340',marginBottom:8}}>No programs found</div>
        <div style={{fontSize:14,color:'#8a7d6a',marginBottom:24}}>You haven't been enrolled in any programs yet. Contact your administrator.</div>
        <button onClick={handleSignOut} style={{padding:'10px 24px',background:'#0d2340',border:'none',borderRadius:8,color:'#c9a84c',fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer'}}>Sign out</button>
      </div>
    </div>
  )

  return (
    <main style={{minHeight:'100vh',background:'#f7f4ee',fontFamily:'Sora,sans-serif'}}>
      {/* Header */}
      <div style={{background:'#0d2340',padding:'16px 40px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:36,height:36,background:'#c9a84c',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <div style={{width:0,height:0,borderLeft:'6px solid transparent',borderRight:'6px solid transparent',borderBottom:'10px solid #0d2340'}}/>
          </div>
          <div>
            <div style={{fontFamily:'Georgia,serif',fontSize:18,color:'white',fontWeight:600}}>StepUp</div>
            <div style={{fontSize:10,color:'rgba(201,168,76,0.7)',letterSpacing:'0.1em',textTransform:'uppercase'}}>P2P Mentoring Program</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.6)'}}>
            {profile?.full_name || profile?.email?.split('@')[0]}
          </div>
          <button onClick={handleSignOut} style={{fontSize:12,color:'rgba(255,255,255,0.5)',background:'rgba(255,255,255,0.08)',border:'0.5px solid rgba(255,255,255,0.15)',borderRadius:6,padding:'5px 12px',cursor:'pointer',fontFamily:'Sora,sans-serif'}}>Sign out</button>
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth:900,margin:'0 auto',padding:'56px 40px'}}>
        <div style={{marginBottom:40}}>
          <div style={{fontFamily:'Georgia,serif',fontSize:32,color:'#0d2340',fontWeight:600,marginBottom:8}}>
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </div>
          <div style={{fontSize:15,color:'#8a7d6a'}}>Select a program to continue</div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16}}>
          {enrollments.map((e: any) => {
            const p = e.programs
            const typeColor = PROGRAM_TYPE_COLORS[p.type] || PROGRAM_TYPE_COLORS.step1
            const typeLabel = PROGRAM_TYPE_LABELS[p.type] || p.type
            return (
              <div key={e.program_id || p.id} onClick={() => selectProgram(e)}
                style={{background:'white',border:'1px solid #e8dfc8',borderRadius:14,padding:'24px',cursor:'pointer',transition:'box-shadow 0.15s',position:'relative',overflow:'hidden'}}
                onMouseEnter={el => (el.currentTarget.style.boxShadow = '0 4px 20px rgba(13,35,64,0.12)')}
                onMouseLeave={el => (el.currentTarget.style.boxShadow = 'none')}>
                {/* Type bar */}
                <div style={{position:'absolute',top:0,left:0,right:0,height:4,background:typeColor.bg}}/>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16,marginTop:4}}>
                  <span style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',padding:'3px 8px',borderRadius:4,background:typeColor.bg,color:typeColor.text}}>
                    {typeLabel}
                  </span>
                  <span style={{fontSize:11,color:'#a89870',background:'#f7f4ee',padding:'3px 8px',borderRadius:4,textTransform:'capitalize'}}>
                    {e.role}
                  </span>
                </div>
                <div style={{fontFamily:'Georgia,serif',fontSize:20,color:'#0d2340',fontWeight:600,lineHeight:1.3,marginBottom:20}}>
                  {p.name}
                </div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end'}}>
                  <span style={{fontSize:13,color:'#c9a84c',fontWeight:600}}>Enter →</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
