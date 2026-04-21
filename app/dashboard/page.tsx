'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/') } else { setUser(user); setLoading(false) }
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
    {section: 'Overview', items: [
      {name: 'Dashboard', path: '/dashboard', active: true},
    ]},
    {section: 'My Program', items: [
      {name: 'Daily Schedule', path: '/dashboard/schedule'},
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
      {name: 'Live Feedback', path: '/dashboard/feedback'},
    ]},
  ]

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
                <div key={item.name}
                  onClick={() => router.push(item.path)}
                  style={{display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, color: item.active ? '#c9a84c' : 'rgba(255,255,255,0.55)', fontSize: 13.5, marginBottom: 2, background: item.active ? 'rgba(255,255,255,0.09)' : 'transparent', cursor: 'pointer'}}>
                  <div style={{width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0}}/>
                  {item.name}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{padding: '12px 14px', borderTop: '0.5px solid rgba(201,168,76,0.14)'}}>
          <div style={{background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.22)', borderRadius: 8, padding: '9px 12px', marginBottom: 10}}>
            <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 3}}>Current phase</div>
            <div style={{fontSize: 13, color: 'white', fontWeight: 500}}>Week 1 — HY Topics</div>
            <div style={{height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 6, overflow: 'hidden'}}>
              <div style={{height: '100%', background: '#c9a84c', width: '12.5%'}}/>
            </div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <div style={{width: 30, height: 30, borderRadius: '50%', background: '#c9a84c', color: '#0d2340', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div style={{flex: 1, minWidth: 0}}>
              <div style={{fontSize: 13, color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{user?.email?.split('@')[0]}</div>
              <div style={{fontSize: 10, color: 'rgba(255,255,255,0.35)'}}>Windsor SOM</div>
            </div>
            <div onClick={handleSignOut} style={{fontSize: 11, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, border: '0.5px solid rgba(255,255,255,0.15)'}}>Sign out</div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div style={{flex: 1, minWidth: 0, overflowY: 'auto', padding: '32px 36px'}}>

        <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28}}>
          <div>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5}}>
              Good {greeting}, {user?.email?.split('@')[0]}
            </div>
            <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>
              {new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})} · Week 1 of 8 · Step 1 in 196 days
            </div>
          </div>
          <div style={{background: '#0d2340', borderRadius: 10, padding: '12px 18px', textAlign: 'right', borderLeft: '3px solid #c9a84c', flexShrink: 0}}>
            <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 3}}>Next session</div>
            <div style={{fontSize: 14, color: 'white', fontWeight: 500}}>Psychiatry HY — Week 1</div>
            <div style={{fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2}}>Tonight · 7:00 PM CST · Zoom</div>
          </div>
        </div>

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

        <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '18px 22px', marginBottom: 20}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12}}>
            <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340'}}>Subject accuracy — weak topics</div>
            <div onClick={() => router.push('/dashboard/weakness')} style={{fontSize: 12, color: '#c9a84c', cursor: 'pointer'}}>View full weakness map →</div>
          </div>
          <div style={{fontSize: 14, color: '#8a7d6a', fontStyle: 'italic'}}>
            No Qbank sessions logged yet. Start logging your daily questions to see your weakness analysis here.
          </div>
        </div>

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