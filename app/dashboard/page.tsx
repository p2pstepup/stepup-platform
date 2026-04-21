'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = async () => {
    if (!user) return
    await supabase.from('notifications').update({read: true}).eq('student_id', user.id)
    setNotifications(notifications.map(n => ({...n, read: true})))
  }

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({read: true}).eq('id', id)
    setNotifications(notifications.map(n => n.id === id ? {...n, read: true} : n))
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
      } else {
        setUser(user)
        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)
        setNotifications(notifs || [])
        setLoading(false)
      }
    }
    getUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <main style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee', fontFamily: 'Sora, sans-serif'}}>
      <div style={{textAlign: 'center'}}>
        <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', marginBottom: 10}}>StepUp</div>
        <div style={{fontSize: 16, color: '#8a7d6a'}}>Loading your dashboard...</div>
      </div>
    </main>
  )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  const navGroups = [
    {section: 'Overview', items: [{name: 'Dashboard', path: '/dashboard', active: true}]},
    {section: 'My Program', items: [
      {name: 'Daily Course Schedule', path: '/dashboard/schedule'},
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

  return (
    <main style={{minHeight: '100vh', display: 'flex', background: '#f7f4ee', fontFamily: 'Sora, sans-serif', fontSize: '17.6px', position: 'relative'}}>

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
                  <div style={{width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0}}/>
                  {item.name}
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

      {/* MAIN CONTENT */}
      </nav>

      {/* MAIN CONTENT */}
      <div style={{flex: 1, minWidth: 0, overflowY: 'auto', padding: '32px 36px'}}>

        {/* TOP BAR WITH NOTIFICATIONS */}
        <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28}}>
          <div>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5}}>
              Good {greeting}, {user?.email?.split('@')[0]}
            </div>
            <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>
              {new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})} · Week 1 of 8 · Step 1 in 196 days
            </div>
          </div>

          <div style={{display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, position: 'relative'}}>

            {/* NOTIFICATION BELL */}
            <div onClick={() => setShowNotifications(!showNotifications)}
              style={{position: 'relative', width: 44, height: 44, background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'}}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2a6 6 0 00-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 00-6-6zM8 16a2 2 0 004 0" stroke="#0d2340" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {unreadCount > 0 && (
                <div style={{position: 'absolute', top: -6, right: -6, width: 20, height: 20, background: '#c0574a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white'}}>
                  {unreadCount}
                </div>
              )}
            </div>

            {/* NOTIFICATION DROPDOWN */}
            {showNotifications && (
              <div style={{position: 'absolute', top: 52, right: 0, width: 360, background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 200}}>
                <div style={{padding: '14px 18px', borderBottom: '0.5px solid #f0ece0', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340'}}>Notifications</div>
                  {unreadCount > 0 && (
                    <div onClick={markAllRead} style={{fontSize: 12, color: '#c9a84c', cursor: 'pointer'}}>Mark all read</div>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{padding: '28px 18px', textAlign: 'center', fontSize: 14, color: '#8a7d6a', fontStyle: 'italic'}}>No notifications yet</div>
                ) : (
                  <div style={{maxHeight: 360, overflowY: 'auto'}}>
                    {notifications.map(n => (
                      <div key={n.id}
                        onClick={() => { markRead(n.id); if(n.link) router.push(n.link); setShowNotifications(false) }}
                        style={{padding: '14px 18px', borderBottom: '0.5px solid #f5f0e8', cursor: 'pointer', background: n.read ? 'white' : '#fffdf5', display: 'flex', gap: 12, alignItems: 'flex-start'}}>
                        <div style={{width: 8, height: 8, borderRadius: '50%', background: n.read ? '#e8dfc8' : '#c9a84c', flexShrink: 0, marginTop: 6}}/>
                        <div style={{flex: 1}}>
                          <div style={{fontSize: 14, fontWeight: n.read ? 400 : 600, color: '#0d2340', marginBottom: 4}}>{n.title}</div>
                          {n.message && <div style={{fontSize: 13, color: '#8a7d6a', lineHeight: 1.5}}>{n.message}</div>}
                          <div style={{fontSize: 11, color: '#a89870', marginTop: 5}}>{new Date(n.created_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* NEXT SESSION BANNER */}
            <div style={{background: '#0d2340', borderRadius: 10, padding: '12px 18px', textAlign: 'right', borderLeft: '3px solid #c9a84c'}}>
              <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 3}}>Next session</div>
              <div style={{fontSize: 14, color: 'white', fontWeight: 500}}>Psychiatry HY — Week 1</div>
              <div style={{fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2}}>Tonight · 7:00 PM CST · Zoom</div>
            </div>
          </div>
        </div>

        {/* METRIC CARDS */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12, marginBottom: 22}}>
          {[
            {label: 'Qbank avg', value: '—', delta: 'No sessions yet', color: '#a89870'},
            {label: 'Questions done', value: '0', delta: 'Log your first session', color: '#a89870'},
            {label: 'Latest NBME', value: '—', delta: 'No exams logged', color: '#a89870'},
            {label: 'Tasks today', value: '0/0', delta: 'No tasks assigned', color: '#a89870'},
            {label: 'Study streak', value: '0 days', delta: 'Start today!', color: '#c9a84c'},
          ].map((m, i) => (
            <div key={i} style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 10, padding: '14px 16px'}}>
              <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a89870', marginBottom: 8}}>{m.label}</div>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>{m.value}</div>
              <div style={{fontSize: 11, color: m.color, marginTop: 5}}>{m.delta}</div>
            </div>
          ))}
        </div>

        {/* WEAKNESS PANEL */}
        <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '18px 22px', marginBottom: 20}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12}}>
            <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340'}}>Subject accuracy — weak topics</div>
            <div onClick={() => router.push('/dashboard/weakness')} style={{fontSize: 12, color: '#c9a84c', cursor: 'pointer'}}>View full weakness map →</div>
          </div>
          <div style={{fontSize: 14, color: '#8a7d6a', fontStyle: 'italic'}}>
            No Qbank sessions logged yet. Start logging your daily questions to see your weakness analysis here.
          </div>
        </div>

        {/* BOTTOM GRID */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18}}>

          <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '16px 18px'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12}}>
              <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340'}}>Today's to-do list</div>
              <div onClick={() => router.push('/dashboard/schedule')} style={{fontSize: 12, color: '#c9a84c', cursor: 'pointer'}}>Full schedule →</div>
            </div>
            <div style={{fontSize: 13, color: '#8a7d6a', fontStyle: 'italic', padding: '10px 0'}}>
              No tasks assigned yet. Your tutor will assign your daily schedule before the program starts.
            </div>
          </div>

          <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '16px 18px'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12}}>
              <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340'}}>Upcoming deadlines</div>
              <div onClick={() => router.push('/dashboard/calendar')} style={{fontSize: 12, color: '#c9a84c', cursor: 'pointer'}}>Calendar →</div>
            </div>
            {[
              {date: 'May 4', text: 'Program begins — Week 1', tag: 'Start'},
              {date: 'May 10', text: 'First HY topic session', tag: 'Session'},
              {date: 'May 18', text: '200Q Week 2 assessment', tag: 'Exam'},
            ].map((d, i) => (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < 2 ? '0.5px solid #f5f0e8' : 'none'}}>
                <div style={{fontSize: 11, fontWeight: 600, color: '#c9a84c', width: 42, textAlign: 'center', background: '#f7f4ee', borderRadius: 4, padding: '3px 0', flexShrink: 0}}>{d.date}</div>
                <div style={{fontSize: 13, color: '#3d3020', flex: 1}}>{d.text}</div>
                <div style={{fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#0d2340', color: '#c9a84c', flexShrink: 0}}>{d.tag}</div>
              </div>
            ))}
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
            <div style={{background: '#0d2340', borderRadius: 12, padding: '16px 18px', flex: 1}}>
              <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 8}}>Predicted Step 1 score</div>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 40, color: 'white', letterSpacing: -1, lineHeight: 1}}>—</div>
              <div style={{fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6, marginBottom: 14}}>Log your first NBME to see your prediction</div>
              <div style={{fontSize: 12, color: '#c9a84c'}}>Target: 240+ · Program starts May 4</div>
            </div>
            <div style={{background: '#0d2340', borderRadius: 12, padding: '14px 18px'}}>
              <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 8}}>Daily motivation</div>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, fontStyle: 'italic'}}>"The secret of getting ahead is getting started."</div>
              <div style={{fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8}}>— P2P Mentoring Program</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}