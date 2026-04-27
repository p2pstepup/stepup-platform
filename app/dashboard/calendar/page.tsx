'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'

export default function Calendar() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [schedule, setSchedule] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [meetings, setMeetings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4, 1))
  const [selectedDay, setSelectedDay] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)
      const [{ data: sched }, { data: assign }, { data: meet }] = await Promise.all([
        supabase.from('schedule').select('*').order('sort_order'),
        supabase.from('assignments').select('*').eq('student_id', user.id).not('due_date', 'is', null),
        supabase.from('mentor_meetings').select('*').eq('student_id', user.id),
      ])
      setSchedule(sched || [])
      setAssignments(assign || [])
      setMeetings(meet || [])
      setLoading(false)
    }
    init()
  }, [])

  const navGroups = [
    {section: 'Overview', items: [{name: 'Dashboard', path: '/dashboard'}]},
    {section: 'My Program', items: [
      {name: 'Daily Course Schedule', path: '/dashboard/schedule'},
      {name: 'My Study Schedule', path: '/dashboard/studyschedule'},
      {name: 'Calendar', path: '/dashboard/calendar', active: true},
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const getDateStr = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const getEventsForDay = (day: number) => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const dateStr = getDateStr(year, month, day)
    const sessions = schedule.filter(s => s.session_date === dateStr)
    const dueAssignments = assignments.filter(a => a.due_date === dateStr)
    const dayMeetings = meetings.filter(m => m.meeting_date === dateStr)
    return { sessions, dueAssignments, dayMeetings }
  }

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth)
  const today = new Date()

  const eventColors = {
    session: {bg: '#1a3a5c', text: '#c9a84c', label: 'Course Session'},
    meeting: {bg: '#1a4a2a', text: '#7ecf8e', label: 'Mentor Meeting'},
    assignment: {bg: '#5c1a1a', text: '#f5a0a0', label: 'Assignment Due'},
    exam: {bg: '#5c3a1a', text: '#f5c87e', label: 'Exam'},
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
          {profile?.mentor_name && (
            <div style={{background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.22)', borderRadius: 8, padding: '9px 12px', marginBottom: 10}}>
              <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 3}}>Your mentor</div>
              <div style={{fontSize: 13, color: 'white', fontWeight: 500}}>{profile.mentor_name}</div>
              {profile.mentor_email && <div style={{fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2}}>{profile.mentor_email}</div>}
            </div>
          )}
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

      <div style={{flex: 1, minWidth: 0, overflowY: 'auto', padding: '28px 32px'}}>
        <div style={{marginBottom: 20}}>
          <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5}}>Program Calendar</div>
          <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>All sessions · Mentor meetings · Assignment deadlines</div>
        </div>

        {/* Legend */}
        <div style={{display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap'}}>
          {Object.entries(eventColors).map(([key, val]) => (
            <div key={key} style={{display: 'flex', alignItems: 'center', gap: 6}}>
              <div style={{width: 12, height: 12, borderRadius: 3, background: val.bg, border: `1px solid ${val.text}`}}/>
              <span style={{fontSize: 12, color: '#8a7d6a'}}>{val.label}</span>
            </div>
          ))}
          <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
            <div style={{width: 12, height: 12, borderRadius: '50%', background: '#c9a84c'}}/>
            <span style={{fontSize: 12, color: '#8a7d6a'}}>Today</span>
          </div>
        </div>

        {/* Calendar */}
        <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 14, overflow: 'hidden', marginBottom: 24}}>
          {/* Header */}
          <div style={{background: '#0d2340', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              style={{background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 36, height: 36, color: 'white', cursor: 'pointer', fontSize: 18}}>←</button>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 22, color: 'white'}}>
              {currentMonth.toLocaleDateString('en-US', {month: 'long', year: 'numeric'})}
            </div>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              style={{background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 36, height: 36, color: 'white', cursor: 'pointer', fontSize: 18}}>→</button>
          </div>

          {/* Day headers */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f7f4ee', borderBottom: '0.5px solid #e8dfc8'}}>
            {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d => (
              <div key={d} style={{padding: '10px 8px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#8a7d6a', textTransform: 'uppercase', letterSpacing: '0.05em'}}>{d.substring(0,3)}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)'}}>
            {Array.from({length: firstDay}).map((_, i) => (
              <div key={`empty-${i}`} style={{minHeight: 110, borderRight: '0.5px solid #f0ece0', borderBottom: '0.5px solid #f0ece0', background: '#fafaf8'}}/>
            ))}
            {Array.from({length: daysInMonth}).map((_, i) => {
              const day = i + 1
              const { sessions, dueAssignments, dayMeetings } = getEventsForDay(day)
              const isToday = today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear()
              const hasEvents = sessions.length > 0 || dueAssignments.length > 0 || dayMeetings.length > 0
              const col = (firstDay + i) % 7
              return (
                <div key={day}
                  onClick={() => hasEvents && setSelectedDay({day, sessions, dueAssignments, dayMeetings})}
                  style={{minHeight: 110, borderRight: col < 6 ? '0.5px solid #f0ece0' : 'none', borderBottom: '0.5px solid #f0ece0', padding: '8px 6px', background: isToday ? '#fffdf5' : 'white', cursor: hasEvents ? 'pointer' : 'default'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6}}>
                    <div style={{width: 28, height: 28, borderRadius: '50%', background: isToday ? '#c9a84c' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <span style={{fontSize: 14, fontWeight: isToday ? 700 : 400, color: isToday ? '#0d2340' : '#3d3020'}}>{day}</span>
                    </div>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: 3}}>
                    {sessions.map((s, idx) => (
                      <div key={idx} style={{fontSize: 11, background: eventColors.session.bg, color: eventColors.session.text, borderRadius: 4, padding: '3px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500}}>
                        {s.start_time?.replace(' PM','p').replace(' AM','a')} {s.topic.split(' ')[0]}
                      </div>
                    ))}
                    {dayMeetings.map((m, idx) => (
                      <div key={idx} style={{fontSize: 11, background: eventColors.meeting.bg, color: eventColors.meeting.text, borderRadius: 4, padding: '3px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500}}>
                        👤 Mentor 1-on-1
                      </div>
                    ))}
                    {dueAssignments.map((a, idx) => (
                      <div key={idx} style={{fontSize: 11, background: eventColors.assignment.bg, color: eventColors.assignment.text, borderRadius: 4, padding: '3px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500}}>
                        📋 {a.title.substring(0, 20)}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Day detail panel */}
        {selectedDay && (
          <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden', marginBottom: 24}}>
            <div style={{background: '#0d2340', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 18, color: 'white'}}>
                {currentMonth.toLocaleDateString('en-US', {month: 'long'})} {selectedDay.day}, {currentMonth.getFullYear()}
              </div>
              <button onClick={() => setSelectedDay(null)}
                style={{background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: '4px 12px', color: 'white', cursor: 'pointer', fontSize: 12, fontFamily: 'Sora, sans-serif'}}>Close</button>
            </div>
            <div style={{padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10}}>
              {selectedDay.sessions.map((s: any, i: number) => (
                <div key={i} style={{display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 14px', background: '#f0f4ff', borderRadius: 10, borderLeft: `4px solid ${eventColors.session.bg}`}}>
                  <div style={{width: 10, height: 10, borderRadius: '50%', background: eventColors.session.bg, marginTop: 4, flexShrink: 0}}/>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 3}}>{s.topic}</div>
                    <div style={{fontSize: 13, color: '#8a7d6a'}}>
                      {s.start_time}{s.end_time ? ` — ${s.end_time}` : ''} CST
                      {s.instructor && <span style={{color: '#c9a84c'}}> · {s.instructor}</span>}
                    </div>
                    {s.syllabus && <div style={{fontSize: 12, color: '#8a7d6a', marginTop: 4}}>{s.syllabus}</div>}
                  </div>
                  {s.zoom_link && (
                    <a href={s.zoom_link} target="_blank" rel="noopener noreferrer"
                      style={{padding: '6px 14px', background: '#0d2340', borderRadius: 7, fontSize: 12, color: '#c9a84c', fontWeight: 500, textDecoration: 'none', flexShrink: 0}}>Join ↗</a>
                  )}
                </div>
              ))}
              {selectedDay.dayMeetings.map((m: any, i: number) => (
                <div key={i} style={{display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 14px', background: '#f0fff4', borderRadius: 10, borderLeft: `4px solid ${eventColors.meeting.bg}`}}>
                  <div style={{width: 10, height: 10, borderRadius: '50%', background: '#2d6a4f', marginTop: 4, flexShrink: 0}}/>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 3}}>Mentor 1-on-1</div>
                    <div style={{fontSize: 13, color: '#8a7d6a'}}>{m.duration_minutes} minutes</div>
                    {m.action_items && <div style={{fontSize: 12, color: '#8a7d6a', marginTop: 4}}>Action items: {m.action_items}</div>}
                  </div>
                </div>
              ))}
              {selectedDay.dueAssignments.map((a: any, i: number) => (
                <div key={i} style={{display: 'flex', gap: 14, alignItems: 'flex-start', padding: '12px 14px', background: '#fff5f5', borderRadius: 10, borderLeft: `4px solid ${eventColors.assignment.bg}`}}>
                  <div style={{width: 10, height: 10, borderRadius: '50%', background: '#c0574a', marginTop: 4, flexShrink: 0}}/>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 3}}>{a.title}</div>
                    <div style={{fontSize: 13, color: '#8a7d6a'}}>Due {a.due_time || '11:59 PM'} · {a.tag}</div>
                    {a.description && <div style={{fontSize: 12, color: '#8a7d6a', marginTop: 4}}>{a.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming events */}
        <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '18px 22px'}}>
          <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 16}}>Upcoming this month</div>
          {schedule.filter(s => {
            if (!s.session_date) return false
            const d = new Date(s.session_date + 'T12:00:00')
            return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear() && d >= today
          }).slice(0, 6).map((s, i, arr) => (
            <div key={s.id} style={{display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < arr.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
              <div style={{width: 52, textAlign: 'center', flexShrink: 0}}>
                <div style={{fontSize: 10, color: '#c9a84c', fontWeight: 600, textTransform: 'uppercase'}}>{new Date(s.session_date + 'T12:00:00').toLocaleDateString('en-US', {month: 'short'})}</div>
                <div style={{fontFamily: 'Georgia, serif', fontSize: 22, color: '#0d2340', lineHeight: 1}}>{new Date(s.session_date + 'T12:00:00').getDate()}</div>
              </div>
              <div style={{width: 4, height: 40, background: eventColors.session.bg, borderRadius: 2, flexShrink: 0}}/>
              <div style={{flex: 1}}>
                <div style={{fontSize: 14, fontWeight: 500, color: '#0d2340'}}>{s.topic}</div>
                <div style={{fontSize: 12, color: '#8a7d6a'}}>{s.start_time}{s.end_time ? ` — ${s.end_time}` : ''} CST · Week {s.week_number}</div>
              </div>
              {s.zoom_link && (
                <a href={s.zoom_link} target="_blank" rel="noopener noreferrer"
                  style={{padding: '6px 14px', background: '#0d2340', borderRadius: 7, fontSize: 12, color: '#c9a84c', fontWeight: 500, textDecoration: 'none'}}>Join ↗</a>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}