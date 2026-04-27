'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'

export default function StudySchedule() {
  const [user, setUser] = useState<any>(null)
  const [schedule, setSchedule] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const { data } = await supabase
        .from('study_schedule')
        .select('*')
        .eq('student_id', user.id)
        .order('schedule_date', {ascending: true})
      setSchedule(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const toggleTask = async (scheduleId: string, taskIndex: number) => {
    const entry = schedule.find(s => s.id === scheduleId)
    if (!entry) return
    const updatedTasks = [...entry.tasks]
    updatedTasks[taskIndex] = {...updatedTasks[taskIndex], completed: !updatedTasks[taskIndex].completed}
    await supabase.from('study_schedule').update({tasks: updatedTasks}).eq('id', scheduleId)
    setSchedule(schedule.map(s => s.id === scheduleId ? {...s, tasks: updatedTasks} : s))
  }

  const navGroups = [
    {section: 'Overview', items: [{name: 'Dashboard', path: '/dashboard'}]},
    {section: 'My Program', items: [
      {name: 'Daily Course Schedule', path: '/dashboard/schedule'},
      {name: 'My Study Schedule', path: '/dashboard/studyschedule', active: true},
      {name: 'Calendar', path: '/dashboard/calendar'},
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

  const tagColors: Record<string, string> = {
    'Qbank': '#4a8c84', 'Reading': '#6b7c3a', 'Review': '#c9a84c',
    'NBME': '#c0574a', 'Anki': '#c07040', 'Sketchy': '#9e2a2a',
    'Pathoma': '#4a8c84', 'General': '#8a7d6a',
  }

  const todayEntry = schedule.find(s => s.schedule_date === selectedDate)

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
              <div style={{fontSize: 13, color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{profile?.full_name || user?.email?.split('@')[0]}</div>
              <div style={{fontSize: 10, color: 'rgba(255,255,255,0.35)'}}>Windsor SOM</div>
            </div>
            <div onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              style={{fontSize: 11, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, border: '0.5px solid rgba(255,255,255,0.15)'}}>Sign out</div>
          </div>
        </div>
      </nav>

      <div style={{flex: 1, minWidth: 0, overflowY: 'auto', padding: '32px 36px'}}>
        <div style={{marginBottom: 28}}>
          <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5}}>My Study Schedule</div>
          <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Your personalized daily study plan · Assigned by your mentor · Check off tasks as you complete them</div>
        </div>

        {schedule.length === 0 ? (
          <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '60px', textAlign: 'center'}}>
            <div style={{width: 64, height: 64, background: '#f7f4ee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px'}}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M4 6h20M4 12h20M4 18h12" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div style={{fontSize: 18, fontWeight: 500, color: '#0d2340', marginBottom: 10}}>No study schedule yet</div>
            <div style={{fontSize: 14, color: '#8a7d6a', maxWidth: 400, margin: '0 auto', lineHeight: 1.7}}>
              Your mentor will build your personalized daily study plan before May 4th. Each day you'll see exactly what to study, how many questions to do, and what topics to focus on.
            </div>
          </div>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20}}>
            <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden', height: 'fit-content'}}>
              <div style={{background: '#0d2340', padding: '12px 16px'}}>
                <div style={{fontSize: 13, fontWeight: 600, color: 'white'}}>Select a day</div>
              </div>
              {schedule.map((entry) => {
                const tasks = entry.tasks || []
                const completed = tasks.filter((t: any) => t.completed).length
                const isSelected = entry.schedule_date === selectedDate
                const isToday = entry.schedule_date === new Date().toISOString().split('T')[0]
                return (
                  <div key={entry.id} onClick={() => setSelectedDate(entry.schedule_date)}
                    style={{padding: '12px 16px', cursor: 'pointer', borderBottom: '0.5px solid #f5f0e8', background: isSelected ? '#fffdf5' : 'white', borderLeft: isSelected ? '3px solid #c9a84c' : '3px solid transparent'}}>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4}}>
                      <div style={{fontSize: 13, fontWeight: isSelected ? 600 : 500, color: '#0d2340'}}>
                        {new Date(entry.schedule_date).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}
                        {isToday && <span style={{marginLeft: 6, fontSize: 10, background: '#c9a84c', color: '#0d2340', padding: '1px 6px', borderRadius: 8, fontWeight: 700}}>TODAY</span>}
                      </div>
                      <div style={{fontSize: 11, color: completed === tasks.length && tasks.length > 0 ? '#6b7c3a' : '#a89870'}}>{completed}/{tasks.length}</div>
                    </div>
                    <div style={{height: 4, background: '#f0ece0', borderRadius: 2, overflow: 'hidden'}}>
                      <div style={{height: '100%', background: completed === tasks.length && tasks.length > 0 ? '#6b7c3a' : '#c9a84c', width: tasks.length > 0 ? `${(completed/tasks.length)*100}%` : '0%', borderRadius: 2}}/>
                    </div>
                  </div>
                )
              })}
            </div>

            <div>
              {todayEntry ? (
                <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
                  <div style={{background: '#0d2340', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <div>
                      <div style={{fontSize: 15, fontWeight: 600, color: 'white'}}>
                        {new Date(todayEntry.schedule_date).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}
                      </div>
                      {todayEntry.notes && <div style={{fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3}}>{todayEntry.notes}</div>}
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <div style={{fontFamily: 'Georgia, serif', fontSize: 24, color: '#c9a84c'}}>
                        {(todayEntry.tasks || []).filter((t: any) => t.completed).length}/{(todayEntry.tasks || []).length}
                      </div>
                      <div style={{fontSize: 11, color: 'rgba(255,255,255,0.4)'}}>tasks done</div>
                    </div>
                  </div>
                  <div style={{padding: '12px 20px', borderBottom: '0.5px solid #f0ece0'}}>
                    <div style={{height: 6, background: '#f0ece0', borderRadius: 3, overflow: 'hidden'}}>
                      <div style={{height: '100%', background: '#6b7c3a', borderRadius: 3, width: `${((todayEntry.tasks || []).filter((t: any) => t.completed).length / Math.max(1, (todayEntry.tasks || []).length)) * 100}%`, transition: 'width 0.3s'}}/>
                    </div>
                  </div>
                  <div style={{padding: '8px 0'}}>
                    {(todayEntry.tasks || []).map((task: any, idx: number) => (
                      <div key={idx} style={{display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px', borderBottom: idx < (todayEntry.tasks || []).length - 1 ? '0.5px solid #f5f0e8' : 'none'}}>
                        <div onClick={() => toggleTask(todayEntry.id, idx)}
                          style={{width: 24, height: 24, borderRadius: 7, border: task.completed ? 'none' : '2px solid #e8dfc8', background: task.completed ? '#6b7c3a' : 'white', cursor: 'pointer', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          {task.completed && <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3.5 3.5 5.5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <div style={{flex: 1}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: task.description ? 4 : 0}}>
                            <div style={{fontSize: 14, fontWeight: 500, color: task.completed ? '#a89870' : '#0d2340', textDecoration: task.completed ? 'line-through' : 'none'}}>{task.title}</div>
                            {task.tag && <span style={{fontSize: 11, padding: '2px 8px', borderRadius: 10, background: `${tagColors[task.tag] || '#8a7d6a'}18`, color: tagColors[task.tag] || '#8a7d6a', fontWeight: 500}}>{task.tag}</span>}
                            {task.duration && <span style={{fontSize: 11, color: '#a89870'}}>~{task.duration}</span>}
                          </div>
                          {task.description && <div style={{fontSize: 13, color: '#8a7d6a', lineHeight: 1.5}}>{task.description}</div>}
                          {task.resource_link && (
                            <a href={task.resource_link} target="_blank" rel="noopener noreferrer"
                              style={{fontSize: 12, color: '#c9a84c', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4}}>
                              Open resource ↗
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '40px', textAlign: 'center'}}>
                  <div style={{fontSize: 15, color: '#0d2340', fontWeight: 500, marginBottom: 8}}>No plan for this day yet</div>
                  <div style={{fontSize: 13, color: '#8a7d6a'}}>Your mentor hasn't assigned a study plan for this day yet. Check back soon!</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}