'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'

export default function Calendar() {
  const [user, setUser] = useState<any>(null)
  const [schedule, setSchedule] = useState<any[]>([])
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4, 1)) // May 2026
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const [{ data: sched }, { data: examData }] = await Promise.all([
        supabase.from('schedule').select('*').order('sort_order'),
        supabase.from('exams').select('*').not('deadline', 'is', null)
      ])
      setSchedule(sched || [])
      setExams(examData || [])
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const getEventsForDay = (day: number) => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const date = new Date(year, month, day)
    const dateStr = date.toISOString().split('T')[0]
    const sessions = schedule.filter(s => s.session_date === dateStr)
    const examDeadlines = exams.filter(e => e.deadline === dateStr)
    return { sessions, examDeadlines }
  }

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth)
  const today = new Date()

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
          <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5}}>Program Calendar</div>
          <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>All sessions · Exam deadlines · Key dates</div>
        </div>

        {/* Legend */}
        <div style={{display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap'}}>
          {[
            {color: '#0d2340', label: 'Live Session'},
            {color: '#c0574a', label: 'Exam deadline'},
            {color: '#c9a84c', label: 'Today'},
          ].map(l => (
            <div key={l.label} style={{display: 'flex', alignItems: 'center', gap: 6}}>
              <div style={{width: 10, height: 10, borderRadius: '50%', background: l.color}}/>
              <span style={{fontSize: 12, color: '#8a7d6a'}}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden', marginBottom: 24}}>
          {/* Header */}
          <div style={{background: '#0d2340', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              style={{background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, width: 32, height: 32, color: 'white', cursor: 'pointer', fontSize: 16}}>←</button>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 20, color: 'white'}}>
              {currentMonth.toLocaleDateString('en-US', {month: 'long', year: 'numeric'})}
            </div>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              style={{background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, width: 32, height: 32, color: 'white', cursor: 'pointer', fontSize: 16}}>→</button>
          </div>

          {/* Day headers */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#f7f4ee'}}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} style={{padding: '8px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#8a7d6a', textTransform: 'uppercase', letterSpacing: '0.06em'}}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)'}}>
            {Array.from({length: firstDay}).map((_, i) => (
              <div key={`empty-${i}`} style={{minHeight: 80, border: '0.5px solid #f5f0e8'}}/>
            ))}
            {Array.from({length: daysInMonth}).map((_, i) => {
              const day = i + 1
              const { sessions, examDeadlines } = getEventsForDay(day)
              const isToday = today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear()
              return (
                <div key={day} style={{minHeight: 80, border: '0.5px solid #f5f0e8', padding: '6px', background: isToday ? '#fffdf5' : 'white'}}>
                  <div style={{width: 24, height: 24, borderRadius: '50%', background: isToday ? '#c9a84c' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4}}>
                    <span style={{fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? '#0d2340' : '#3d3020'}}>{day}</span>
                  </div>
                  {sessions.map(s => (
                    <div key={s.id} style={{fontSize: 9, background: '#0d2340', color: '#c9a84c', borderRadius: 3, padding: '2px 4px', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                      {s.start_time} {s.topic.split(' ')[0]}
                    </div>
                  ))}
                  {examDeadlines.map(e => (
                    <div key={e.id} style={{fontSize: 9, background: '#c0574a', color: 'white', borderRadius: 3, padding: '2px 4px', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                      📝 {e.name}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming events list */}
        <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '18px 22px'}}>
          <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 16}}>Upcoming sessions this month</div>
          {schedule.filter(s => {
            if (!s.session_date) return false
            const d = new Date(s.session_date)
            return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear() && d >= today
          }).slice(0, 8).map((s, i, arr) => (
            <div key={s.id} style={{display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < arr.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
              <div style={{width: 48, textAlign: 'center', flexShrink: 0}}>
                <div style={{fontSize: 10, color: '#c9a84c', fontWeight: 600, textTransform: 'uppercase'}}>{new Date(s.session_date).toLocaleDateString('en-US', {month: 'short'})}</div>
                <div style={{fontFamily: 'Georgia, serif', fontSize: 20, color: '#0d2340', lineHeight: 1}}>{new Date(s.session_date).getDate()}</div>
              </div>
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