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
      if (!user) {
        router.push('/')
      } else {
        setUser(user)
        setLoading(false)
      }
    }
    getUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <main style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee', fontFamily: 'Sora, sans-serif'}}>
        <div style={{textAlign: 'center'}}>
          <div style={{fontFamily: 'Georgia, serif', fontSize: 22, color: '#0d2340', marginBottom: 8}}>StepUp</div>
          <div style={{fontSize: 13, color: '#8a7d6a'}}>Loading your dashboard...</div>
        </div>
      </main>
    )
  }

  return (
    <main style={{minHeight: '100vh', display: 'flex', background: '#f7f4ee', fontFamily: 'Sora, sans-serif'}}>

      {/* SIDEBAR */}
      <nav style={{width: 175, flexShrink: 0, background: '#0d2340', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0}}>
        
        {/* Logo */}
        <div style={{padding: '15px 14px 12px', borderBottom: '0.5px solid rgba(201,168,76,0.2)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 9}}>
            <div style={{width: 30, height: 30, background: '#c9a84c', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <div style={{width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '9px solid #0d2340'}}/>
            </div>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 15, color: 'white', fontWeight: 600}}>StepUp</div>
          </div>
          <div style={{fontSize: 7.5, color: '#c9a84c', letterSpacing: '0.09em', textTransform: 'uppercase', paddingLeft: 39, marginTop: 2}}>P2P Mentoring Program</div>
        </div>

        {/* Nav items */}
        <div style={{padding: '10px 8px', flex: 1, overflowY: 'auto'}}>
          {[
            {section: 'Overview', items: [{name: 'Dashboard', active: true}]},
            {section: 'My Program', items: [{name: 'Daily Schedule'}, {name: 'Calendar'}, {name: 'Assignments'}, {name: 'Mentor Meetings'}]},
            {section: 'Study Tools', items: [{name: 'Exam Center'}, {name: 'Qbank Tracker'}, {name: 'NBME Scores'}, {name: 'Weakness Map'}]},
            {section: 'Resources', items: [{name: 'HY Topic Notes'}, {name: 'Session Recordings'}, {name: 'Session Slides'}, {name: 'Resource Drive'}, {name: 'Live Feedback'}]},
          ].map((group) => (
            <div key={group.section}>
              <div style={{fontSize: 7.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.28)', padding: '0 8px', margin: '9px 0 3px'}}>{group.section}</div>
              {group.items.map(item => (
                <div key={item.name} style={{display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 6, color: (item as any).active ? '#c9a84c' : 'rgba(255,255,255,0.52)', fontSize: 11, marginBottom: 1, background: (item as any).active ? 'rgba(255,255,255,0.09)' : 'transparent', cursor: 'pointer'}}>
                  <div style={{width: 5, height: 5, borderRadius: '50%', background: 'currentColor', flexShrink: 0}}/>
                  {item.name}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Phase tracker */}
        <div style={{padding: '10px 12px', borderTop: '0.5px solid rgba(201,168,76,0.14)'}}>
          <div style={{background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.22)', borderRadius: 6, padding: '7px 9px', marginBottom: 8}}>
            <div style={{fontSize: 7.5, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 2}}>Current phase</div>
            <div style={{fontSize: 10.5, color: 'white', fontWeight: 500}}>Week 1 — HY Topics</div>
            <div style={{height: 2.5, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 5, overflow: 'hidden'}}>
              <div style={{height: '100%', background: '#c9a84c', width: '12.5%'}}/>
            </div>
          </div>
          {/* User */}
          <div style={{display: 'flex', alignItems: 'center', gap: 7}}>
            <div style={{width: 25, height: 25, borderRadius: '50%', background: '#c9a84c', color: '#0d2340', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div style={{flex: 1, minWidth: 0}}>
              <div style={{fontSize: 10.5, color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{user?.email?.split('@')[0]}</div>
              <div style={{fontSize: 8, color: 'rgba(255,255,255,0.3)'}}>Windsor SOM</div>
            </div>
            <div onClick={handleSignOut} style={{fontSize: 8, color: 'rgba(255,255,255,0.3)', cursor: 'pointer'}}>Out</div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main style={{flex: 1, minWidth: 0, overflowY: 'auto', padding: '22px 24px'}}>
        
        {/* Top bar */}
        <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20}}>
          <div>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 22, color: '#0d2340', letterSpacing: -0.3}}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.email?.split('@')[0]}
            </div>
            <div style={{fontSize: 11, color: '#8a7d6a', marginTop: 3}}>
              {new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})} · Week 1 of 8 · Step 1 in 196 days
            </div>
          </div>
          <div style={{background: '#0d2340', borderRadius: 8, padding: '9px 14px', textAlign: 'right', borderLeft: '3px solid #c9a84c', flexShrink: 0}}>
            <div style={{fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 2}}>Next session</div>
            <div style={{fontSize: 11.5, color: 'white', fontWeight: 500}}>Psychiatry HY — Week 1</div>
            <div style={{fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: 1}}>Tonight · 7:00 PM CST · Zoom</div>
          </div>
        </div>

        {/* Metric cards */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 9, marginBottom: 18}}>
          {[
            {label: 'Qbank avg', value: '—', delta: 'No sessions yet', color: '#a89870'},
            {label: 'Questions done', value: '0', delta: 'Log your first session', color: '#a89870'},
            {label: 'Latest NBME', value: '—', delta: 'No exams logged', color: '#a89870'},
            {label: 'Tasks today', value: '0/0', delta: 'No tasks assigned', color: '#a89870'},
            {label: 'Study streak', value: '0 days', delta: 'Start today!', color: '#c9a84c'},
          ].map((m, i) => (
            <div key={i} style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 9, padding: '10px 12px'}}>
              <div style={{fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a89870', marginBottom: 5}}>{m.label}</div>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 22, color: '#0d2340', letterSpacing: -0.3}}>{m.value}</div>
              <div style={{fontSize: 9, color: m.color, marginTop: 3}}>{m.delta}</div>
            </div>
          ))}
        </div>

        {/* Weakness panel */}
        <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 10, padding: '14px 18px', marginBottom: 16}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10}}>
            <div style={{fontSize: 12, fontWeight: 600, color: '#0d2340'}}>Subject accuracy — weak topics</div>
            <div style={{fontSize: 9.5, color: '#c9a84c', cursor: 'pointer'}}>View full weakness map →</div>
          </div>
          <div style={{fontSize: 12, color: '#8a7d6a', fontStyle: 'italic'}}>
            No Qbank sessions logged yet. Start logging your daily questions to see your weakness analysis here.
          </div>
        </div>

        {/* Bottom grid */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14}}>
          
          {/* Today's tasks */}
          <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 10, padding: '13px 15px'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10}}>
              <div style={{fontSize: 11.5, fontWeight: 600, color: '#0d2340'}}>Today's to-do list</div>
              <div style={{fontSize: 9.5, color: '#c9a84c'}}>Full schedule →</div>
            </div>
            <div style={{fontSize: 12, color: '#8a7d6a', fontStyle: 'italic', padding: '10px 0'}}>
              No tasks assigned yet. Your tutor will assign your daily schedule before the program starts.
            </div>
          </div>

          {/* Upcoming deadlines */}
          <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 10, padding: '13px 15px'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10}}>
              <div style={{fontSize: 11.5, fontWeight: 600, color: '#0d2340'}}>Upcoming deadlines</div>
              <div style={{fontSize: 9.5, color: '#c9a84c'}}>Calendar →</div>
            </div>
            {[
              {date: 'May 4', text: 'Program begins — Week 1', tag: 'Start'},
              {date: 'May 10', text: 'First HY topic session', tag: 'Session'},
              {date: 'May 18', text: '200Q Week 2 assessment', tag: 'Exam'},
            ].map((d, i) => (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < 2 ? '0.5px solid #f5f0e8' : 'none'}}>
                <div style={{fontSize: 8.5, fontWeight: 600, color: '#c9a84c', width: 36, textAlign: 'center', background: '#f7f4ee', borderRadius: 3, padding: '2px 0', flexShrink: 0}}>{d.date}</div>
                <div style={{fontSize: 10.5, color: '#3d3020', flex: 1}}>{d.text}</div>
                <div style={{fontSize: 8.5, padding: '1px 6px', borderRadius: 3, background: '#162032', color: '#c9a84c', flexShrink: 0}}>{d.tag}</div>
              </div>
            ))}
          </div>

          {/* Predicted score + motivation */}
          <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
            <div style={{background: '#0d2340', borderRadius: 10, padding: '13px 15px', flex: 1}}>
              <div style={{fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 6}}>Predicted Step 1 score</div>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 32, color: 'white', letterSpacing: -1, lineHeight: 1}}>—</div>
              <div style={{fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4, marginBottom: 12}}>Log your first NBME to see your prediction</div>
              <div style={{fontSize: 9.5, color: '#c9a84c'}}>Target: 240+ · Program starts May 4</div>
            </div>
            <div style={{background: '#0d2340', borderRadius: 10, padding: '12px 14px'}}>
              <div style={{fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 6}}>Daily motivation</div>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, fontStyle: 'italic'}}>"The secret of getting ahead is getting started."</div>
              <div style={{fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 6}}>— P2P Mentoring Program</div>
            </div>
          </div>
        </div>
      </main>
    </main>
  )
}