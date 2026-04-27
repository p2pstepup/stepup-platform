'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'

export default function MentorMeetings() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [meetings, setMeetings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)
      const { data } = await supabase
        .from('mentor_meetings')
        .select('*')
        .eq('student_id', user.id)
        .order('meeting_date', { ascending: false })
      setMeetings(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const navGroups = [
    {section: 'Overview', items: [{name: 'Dashboard', path: '/dashboard'}]},
    {section: 'My Program', items: [
      {name: 'Daily Course Schedule', path: '/dashboard/schedule'},
      {name: 'My Study Schedule', path: '/dashboard/studyschedule'},
      {name: 'Calendar', path: '/dashboard/calendar'},
      {name: 'Assignments', path: '/dashboard/assignments'},
      {name: 'Mentor Meetings', path: '/dashboard/mentor', active: true},
    ]},
    {section: 'Study Tools', items: [
      {name: 'Exam Center', path: '/dashboard/exams'},
      {name: 'Qbank Tracker', path: '/dashboard/qbank'},
      {name: 'NBME Score Tracker', path: '/dashboard/nbme'},
      {name: 'Weakness Map', path: '/dashboard/weakness'},
    ]},
    {section: 'Resources', items: [
      {name: 'HY Topic Notes', path: '/dashboard/notes'},
      {name: 'Session Recordings', path: '/dashboard/recordings'},
      {name: 'Session Slides', path: '/dashboard/slides'},
      {name: 'Resource Drive', path: '/dashboard/resources'},
      {name: 'Course Documents', path: '/dashboard/documents'},
      {name: 'Live Feedback', path: '/dashboard/feedback'},
    ]},
  ]

  if (loading) return (
    <main style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee'}}>
      <div style={{fontFamily: 'Georgia, serif', fontSize: 24, color: '#0d2340'}}>Loading...</div>
    </main>
  )

  const upcomingMeeting = meetings.find(m => m.next_meeting && new Date(m.next_meeting) > new Date())

  return (
    <main style={{minHeight: '100vh', display: 'flex', background: '#f7f4ee', fontFamily: 'Sora, sans-serif', fontSize: '17.6px'}}>

      {/* SIDEBAR */}
      <nav style={{width: 220, flexShrink: 0, background: '#0d2340', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0}}>
        <div style={{padding: '20px 18px 16px', borderBottom: '0.5px solid rgba(201,168,76,0.2)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <div style={{width: 36, height: 36, background: '#c9a84c', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <div style={{width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '11px solid #0d2340'}}/>
            </div>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 20, color: 'white', fontWeight: 600}}>StepUp</div>
          </div>
          <div style={{fontSize: 10, color: '#c9a84c', letterSpacing: '0.09em', textTransform: 'uppercase', paddingLeft: 46, marginTop: 3}}>P2P Mentoring Program</div>
        </div>
        <div style={{padding: '12px 10px', flex: 1, overflowY: 'auto'}}>
          {navGroups.map((group) => (
            <div key={group.section}>
              <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.28)', padding: '0 8px', margin: '12px 0 4px'}}>{group.section}</div>
              {group.items.map((item: any) => (
                <div key={item.name} onClick={() => router.push(item.path)}
                  style={{display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, color: item.active ? '#c9a84c' : 'rgba(255,255,255,0.55)', fontSize: 13.5, marginBottom: 2, background: item.active ? 'rgba(255,255,255,0.09)' : 'transparent', cursor: 'pointer'}}>
                  <div style={{width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0}}/>{item.name}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{padding: '12px 14px', borderTop: '0.5px solid rgba(201,168,76,0.14)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <div style={{width: 30, height: 30, borderRadius: '50%', background: '#c9a84c', color: '#0d2340', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div style={{flex: 1, minWidth: 0}}>
              <div style={{fontSize: 13, color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{profile?.full_name || user?.email?.split('@')[0]}</div>
              <div style={{fontSize: 10, color: 'rgba(255,255,255,0.35)'}}>Windsor SOM</div>
            </div>
            <div onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              style={{fontSize: 11, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, border: '0.5px solid rgba(255,255,255,0.15)'}}>Sign out</div>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <div style={{flex: 1, minWidth: 0, overflowY: 'auto', padding: '32px 36px'}}>

        <div style={{marginBottom: 28}}>
          <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5}}>Mentor Meetings</div>
          <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Weekly 30-min 1-on-1 sessions with your assigned mentor</div>
        </div>

        {/* Info banner */}
        <div style={{background: '#f7f4ee', border: '1px solid #c9a84c', borderRadius: 12, padding: '16px 22px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14}}>
          <div style={{width: 40, height: 40, background: '#c9a84c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2a7 7 0 100 14A7 7 0 009 2zM9 8v5M9 6h.01" stroke="#0d2340" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <div>
            <div style={{fontSize: 14, fontWeight: 600, color: '#0d2340', marginBottom: 3}}>Your mentor logs all meeting notes</div>
            <div style={{fontSize: 13, color: '#8a7d6a'}}>After each 1-on-1 session, your mentor will log notes and action items — they'll appear here automatically. No action needed from you.</div>
          </div>
        </div>

        {/* Upcoming meeting */}
        {upcomingMeeting ? (
          <div style={{background: '#0d2340', borderRadius: 12, padding: '18px 24px', marginBottom: 24, borderLeft: '4px solid #c9a84c'}}>
            <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 6}}>Next scheduled meeting</div>
            <div style={{fontSize: 20, color: 'white', fontWeight: 500}}>
              {new Date(upcomingMeeting.next_meeting).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}
            </div>
            <div style={{fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4}}>30 minutes · With your assigned mentor · Zoom</div>
          </div>
        ) : (
          <div style={{background: '#0d2340', borderRadius: 12, padding: '18px 24px', marginBottom: 24, borderLeft: '4px solid rgba(201,168,76,0.3)'}}>
            <div style={{fontSize: 14, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic'}}>No upcoming meetings scheduled yet. Your mentor will schedule your first 1-on-1 before May 4th.</div>
          </div>
        )}

        {/* Meeting history */}
        <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
          <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 18}}>Meeting history</div>

          {meetings.length === 0 ? (
            <div style={{textAlign: 'center', padding: '40px 0'}}>
              <div style={{width: 56, height: 56, background: '#f7f4ee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8 7V3M16 7V3M7 11h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div style={{fontSize: 15, fontWeight: 500, color: '#0d2340', marginBottom: 6}}>No meetings logged yet</div>
              <div style={{fontSize: 13, color: '#8a7d6a'}}>Your mentor will log notes after your first 1-on-1 session.<br/>They'll appear here automatically.</div>
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
              {meetings.map((m) => (
                <div key={m.id} style={{border: '0.5px solid #e8dfc8', borderRadius: 10, overflow: 'hidden'}}>
                  <div style={{background: '#0d2340', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <div style={{fontSize: 15, color: 'white', fontWeight: 500}}>
                      {new Date(m.meeting_date).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'})}
                    </div>
                    <div style={{fontSize: 12, color: '#c9a84c', background: 'rgba(201,168,76,0.15)', padding: '3px 10px', borderRadius: 12}}>{m.duration_minutes} min</div>
                  </div>
                  <div style={{padding: '16px 18px'}}>
                    {m.notes && (
                      <div style={{marginBottom: 14}}>
                        <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a89870', marginBottom: 8}}>Session notes</div>
                        <div style={{fontSize: 14, color: '#3d3020', lineHeight: 1.7}}>{m.notes}</div>
                      </div>
                    )}
                    {m.action_items && (
                      <div style={{background: '#f7f4ee', borderRadius: 8, padding: '12px 16px', borderLeft: '3px solid #c9a84c', marginBottom: 10}}>
                        <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#c9a84c', marginBottom: 8}}>Your action items</div>
                        <div style={{fontSize: 14, color: '#3d3020', lineHeight: 1.7}}>{m.action_items}</div>
                      </div>
                    )}
                    {m.next_meeting && (
                      <div style={{fontSize: 13, color: '#8a7d6a', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6}}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="11" rx="1" stroke="#c9a84c" strokeWidth="1.1"/><path d="M4 1v2M10 1v2M1 6h12" stroke="#c9a84c" strokeWidth="1.1" strokeLinecap="round"/></svg>
                        Next meeting: <span style={{color: '#0d2340', fontWeight: 500}}>{new Date(m.next_meeting).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}