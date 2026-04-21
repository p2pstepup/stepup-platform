'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'

export default function Assignments() {
  const [user, setUser] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const { data } = await supabase
        .from('assignments')
        .select('*')
        .eq('student_id', user.id)
        .order('due_date', {ascending: true})
      setAssignments(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const toggleComplete = async (id: string, completed: boolean) => {
    setCompleting(id)
    await supabase.from('assignments').update({
      completed: !completed,
      completed_at: !completed ? new Date().toISOString() : null
    }).eq('id', id)
    const { data } = await supabase.from('assignments').select('*').eq('student_id', user.id).order('due_date', {ascending: true})
    setAssignments(data || [])
    setCompleting('')
  }

  const navGroups = [
    {section: 'Overview', items: [{name: 'Dashboard', path: '/dashboard'}]},
    {section: 'My Program', items: [
      {name: 'Daily Course Schedule', path: '/dashboard/schedule'},
      {name: 'My Study Schedule', path: '/dashboard/studyschedule'},
      {name: 'Calendar', path: '/dashboard/calendar'},
      {name: 'Assignments', path: '/dashboard/assignments', active: true},
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
    'Qbank': '#4a8c84',
    'NBME': '#c0574a',
    'Reading': '#6b7c3a',
    'Review': '#c9a84c',
    'General': '#8a7d6a',
  }

  const pending = assignments.filter(a => !a.completed)
  const completed = assignments.filter(a => a.completed)

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
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28}}>
          <div>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5}}>Assignments</div>
            <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Tasks assigned by your tutor · Check them off as you complete them</div>
          </div>
          <div style={{display: 'flex', gap: 12}}>
            <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 10, padding: '10px 16px', textAlign: 'center'}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 24, color: '#0d2340'}}>{pending.length}</div>
              <div style={{fontSize: 11, color: '#8a7d6a', textTransform: 'uppercase', letterSpacing: '0.06em'}}>Pending</div>
            </div>
            <div style={{background: '#f0f7f2', border: '0.5px solid #6b7c3a', borderRadius: 10, padding: '10px 16px', textAlign: 'center'}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 24, color: '#2d6a4f'}}>{completed.length}</div>
              <div style={{fontSize: 11, color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.06em'}}>Done</div>
            </div>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '60px', textAlign: 'center'}}>
            <div style={{fontSize: 16, fontWeight: 500, color: '#0d2340', marginBottom: 8}}>No assignments yet</div>
            <div style={{fontSize: 14, color: '#8a7d6a'}}>Your tutor will assign tasks here before the program starts. Check back on May 4th!</div>
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
            {pending.length > 0 && (
              <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
                <div style={{background: '#0d2340', padding: '12px 20px'}}>
                  <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>Pending · {pending.length} task{pending.length !== 1 ? 's' : ''}</div>
                </div>
                {pending.map((a, i) => (
                  <div key={a.id} style={{display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 20px', borderBottom: i < pending.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
                    <div onClick={() => toggleComplete(a.id, a.completed)}
                      style={{width: 22, height: 22, borderRadius: 6, border: '2px solid #e8dfc8', background: 'white', cursor: 'pointer', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      {completing === a.id && <div style={{width: 10, height: 10, borderRadius: '50%', background: '#c9a84c'}}/>}
                    </div>
                    <div style={{flex: 1}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4}}>
                        <div style={{fontSize: 14, fontWeight: 500, color: '#0d2340'}}>{a.title}</div>
                        <span style={{fontSize: 11, padding: '2px 8px', borderRadius: 10, background: `${tagColors[a.tag] || '#8a7d6a'}18`, color: tagColors[a.tag] || '#8a7d6a', fontWeight: 500}}>{a.tag}</span>
                      </div>
                      {a.description && <div style={{fontSize: 13, color: '#8a7d6a', marginBottom: 4, lineHeight: 1.5}}>{a.description}</div>}
                      {a.due_date && (
                        <div style={{fontSize: 12, color: new Date(a.due_date) < new Date() ? '#c0574a' : '#a89870'}}>
                          Due {new Date(a.due_date).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}
                          {a.due_time && ` · ${a.due_time}`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {completed.length > 0 && (
              <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden', opacity: 0.7}}>
                <div style={{background: '#2d6a4f', padding: '12px 20px'}}>
                  <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>Completed · {completed.length} task{completed.length !== 1 ? 's' : ''}</div>
                </div>
                {completed.map((a, i) => (
                  <div key={a.id} style={{display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px', borderBottom: i < completed.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
                    <div onClick={() => toggleComplete(a.id, a.completed)}
                      style={{width: 22, height: 22, borderRadius: 6, border: '2px solid #6b7c3a', background: '#6b7c3a', cursor: 'pointer', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </div>
                    <div style={{flex: 1}}>
                      <div style={{fontSize: 14, color: '#8a7d6a', textDecoration: 'line-through'}}>{a.title}</div>
                      {a.completed_at && <div style={{fontSize: 11, color: '#a89870', marginTop: 3}}>Completed {new Date(a.completed_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}