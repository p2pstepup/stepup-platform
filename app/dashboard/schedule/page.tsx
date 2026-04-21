'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'

export default function DailySchedule() {
  const [user, setUser] = useState<any>(null)
  const [schedule, setSchedule] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState(1)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const { data } = await supabase.from('schedule').select('*').order('sort_order', {ascending: true})
      setSchedule(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const navGroups = [
    {section: 'Overview', items: [{name: 'Dashboard', path: '/dashboard'}]},
    {section: 'My Program', items: [
      {name: 'Daily Course Schedule', path: '/dashboard/schedule', active: true},
      {name: 'My Study Schedule', path: '/dashboard/studyschedule'},
      {name: 'Calendar', path: '/dashboard/calendar'},
      {name: 'Assignments', path: '/dashboard/assignments'},
      {name: 'Mentor Meetings', path: '/dashboard/mentor'},
    ]},
    {section: 'Study Tools', items: [
      {name: 'Exam Center', path: '/dashboard/exams'},
      {name: 'Qbank Tracker', path: '/dashboard/qbank'},
      {name: 'NBME Scores', path: '/dashboard/nbme'},
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

  const weeks = [...new Set(schedule.map(s => s.week_number))].sort()
  const weekSchedule = schedule.filter(s => s.week_number === selectedWeek)

  const today = new Date().toDateString()

  const typeColors: Record<string, string> = {
    'Live Session': '#0d2340',
    'Mentor Meeting': '#4a8c84',
    'Exam': '#c0574a',
    'Study Day': '#6b7c3a',
    'Rest Day': '#a89870',
  }

  if (loading) return (
    <main style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee'}}>
      <div style={{fontFamily: 'Georgia, serif', fontSize: 24, color: '#0d2340'}}>Loading...</div>
    </main>
  )

  return (
    <main style={{minHeight: '100vh', display: 'flex', background: '#f7f4ee', fontFamily: 'Sora, sans-serif', fontSize: '17.6px'}}>
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
              <div style={{fontSize: 13, color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{user?.email?.split('@')[0]}</div>
              <div style={{fontSize: 10, color: 'rgba(255,255,255,0.35)'}}>Windsor SOM</div>
            </div>
            <div onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              style={{fontSize: 11, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, border: '0.5px solid rgba(255,255,255,0.15)'}}>Sign out</div>
          </div>
        </div>
      </nav>

      <div style={{flex: 1, minWidth: 0, overflowY: 'auto', padding: '32px 36px'}}>
        <div style={{marginBottom: 24}}>
          <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5}}>Daily Course Schedule</div>
          <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Full program schedule · Week by week · All times CST</div>
        </div>

        {/* Week selector */}
        <div style={{display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap'}}>
          {weeks.map(w => (
            <button key={w} onClick={() => setSelectedWeek(w)}
              style={{padding: '8px 18px', borderRadius: 8, border: selectedWeek === w ? 'none' : '1px solid #e8dfc8', background: selectedWeek === w ? '#0d2340' : 'white', color: selectedWeek === w ? '#c9a84c' : '#8a7d6a', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: selectedWeek === w ? 600 : 400, cursor: 'pointer'}}>
              Week {w}
            </button>
          ))}
        </div>

        {weekSchedule.length === 0 ? (
          <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '40px', textAlign: 'center'}}>
            <div style={{fontSize: 14, color: '#8a7d6a', fontStyle: 'italic'}}>No sessions scheduled for this week yet.</div>
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            {weekSchedule.map((session) => {
              const isToday = session.session_date && new Date(session.session_date).toDateString() === today
              const isPast = session.session_date && new Date(session.session_date) < new Date() && !isToday
              const color = typeColors[session.session_type] || '#0d2340'
              return (
                <div key={session.id} style={{background: isToday ? '#fffdf5' : 'white', border: isToday ? '2px solid #c9a84c' : '0.5px solid #e8dfc8', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, opacity: isPast ? 0.6 : 1}}>
                  <div style={{width: 56, textAlign: 'center', flexShrink: 0}}>
                    <div style={{fontSize: 11, fontWeight: 600, color: '#c9a84c', textTransform: 'uppercase'}}>{session.day_of_week.substring(0, 3)}</div>
                    {session.session_date && (
                      <div style={{fontFamily: 'Georgia, serif', fontSize: 22, color: '#0d2340', lineHeight: 1.1}}>{new Date(session.session_date).getDate()}</div>
                    )}
                  </div>
                  <div style={{width: 3, height: 48, background: color, borderRadius: 2, flexShrink: 0}}/>
                  <div style={{flex: 1}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4}}>
                      <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340'}}>{session.topic}</div>
                      {isToday && <span style={{fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#c9a84c', color: '#0d2340', fontWeight: 600}}>TODAY</span>}
                    </div>
                    <div style={{fontSize: 13, color: '#8a7d6a'}}>
                      {session.start_time && `${session.start_time}${session.end_time ? ` — ${session.end_time}` : ''} CST`}
                      {session.session_type && ` · ${session.session_type}`}
                      {session.instructor && <span style={{color: '#c9a84c'}}> · {session.instructor}</span>}
                    </div>
                    {(session.syllabus || session.syllabus_link) && (
                      <div style={{fontSize: 12, color: '#8a7d6a', marginTop: 4, lineHeight: 1.5, background: '#f7f4ee', borderRadius: 6, padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10}}>
                        <span>{session.syllabus}</span>
                        {session.syllabus_link && (
                          <a href={session.syllabus_link} target="_blank" rel="noopener noreferrer"
                            style={{fontSize: 11, color: '#c9a84c', textDecoration: 'none', fontWeight: 500, flexShrink: 0}}>
                            View syllabus ↗
                          </a>
                        )}
                      </div>
                    )}
                    {session.description && <div style={{fontSize: 12, color: '#a89870', marginTop: 4}}>{session.description}</div>}
                  </div>
                  {session.zoom_link && (
                    <a href={session.zoom_link} target="_blank" rel="noopener noreferrer"
                      style={{padding: '8px 16px', background: '#0d2340', borderRadius: 8, fontSize: 13, color: '#c9a84c', fontWeight: 600, textDecoration: 'none', flexShrink: 0}}>
                      Join Zoom ↗
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}