'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const gate = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, survey_completed, profile_completed, baseline_uploaded')
        .eq('id', user.id)
        .single()
      if (profile?.role === 'student') {
        const done = profile.survey_completed && profile.profile_completed && profile.baseline_uploaded
        if (!done) { router.push('/onboarding'); return }
      }
      setReady(true)
    }
    gate()
  }, [])

  if (!ready) return (
    <main style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee', fontFamily: 'Sora, sans-serif'}}>
      <div style={{textAlign: 'center'}}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 14}}>
          <div style={{width: 38, height: 38, background: '#0d2340', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '11px solid #c9a84c'}}/>
          </div>
          <div style={{fontFamily: 'Georgia, serif', fontSize: 24, color: '#0d2340', fontWeight: 600}}>StepUp</div>
        </div>
        <div style={{fontSize: 14, color: '#8a7d6a'}}>Verifying your access...</div>
      </div>
    </main>
  )

  return <>{children}</>
}
