'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'

export default function WeaknessMap() {
  const [user, setUser] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const { data } = await supabase
        .from('qbank_sessions')
        .select('*')
        .eq('student_id', user.id)
      setSessions(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const topics = ['Cardiology','Psychiatry','Renal','Biochemistry','Pharmacology','Microbiology','Anatomy','Pathology','Physiology','Reproductive','Neurology','Endocrinology','Mixed']

  const getTopicStats = (topic: string) => {
    const ts = sessions.filter(s => s.topic === topic)
    if (ts.length === 0) return null
    const total = ts.reduce((a, s) => a + s.questions_total, 0)
    const correct = ts.reduce((a, s) => a + s.questions_correct, 0)
    const acc = Math.round((correct / total) * 100)
    return {total, correct, acc, sessions: ts.length}
  }

  const getAccColor = (acc: number) => {
    if (acc >= 75) return '#6b7c3a'
    if (acc >= 65) return '#c9a84c'
    if (acc >= 55) return '#c07040'
    return '#9e2a2a'
  }

  const getAccLabel = (acc: number) => {
    if (acc >= 75) return 'Strong'
    if (acc >= 65) return 'Developing'
    if (acc >= 55) return 'Needs work'
    return 'Priority'
  }

  const topicsWithData = topics.filter(t => getTopicStats(t) !== null)
  const topicsWithoutData = topics.filter(t => getTopicStats(t) === null)
  const sorted = [...topicsWithData].sort((a, b) => {
    const aAcc = getTopicStats(a)?.acc || 0
    const bAcc = getTopicStats(b)?.acc || 0
    return aAcc - bAcc
  })

  const navGroups = [
    {section: 'Overview', items: [{name: 'Dashboard', path: '/dashboard'}]},
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
      {name: 'Weakness Map', path: '/dashboard/weakness', active: true},
    ]},
    {section: 'Resources', items: [
      {name: 'HY Topic Notes', path: '/dashboard/notes'},
      {name: 'Session Recordings', path: '/dashboard/recordings'},
      {name: 'Session Slides', path: '/dashboard/slides'},
      {name: 'Resource Drive', path: '/dashboard/resources'},
      {name: 'Live Feedback', path: '/dashboard/feedback'},
    ]},
  ]

  if (loading) return (
    <main style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee'}}>
      <div style={{fontFamily: 'Georgia, serif', fontSize: 24, color: '#0d2340'}}>Loading...</div>
    </main>
  )

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
              <div style={{fontSize: 13, color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{user?.email?.split('@')[0]}</div>
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
          <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5}}>Weakness Map</div>
          <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Auto-generated from your Qbank sessions · Updated every time you log questions</div>
        </div>

        {sessions.length === 0 ? (
          <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '60px', textAlign: 'center'}}>
            <div style={{width: 64, height: 64, background: '#f7f4ee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px'}}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 4a10 10 0 100 20A10 10 0 0014 4zM14 8v6l4 2" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div style={{fontSize: 18, fontWeight: 500, color: '#0d2340', marginBottom: 10}}>No data yet</div>
            <div style={{fontSize: 14, color: '#8a7d6a', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.7}}>
              Your weakness map will automatically build as you log Qbank sessions. Start logging your daily questions and your strengths and weaknesses will appear here.
            </div>
            <div onClick={() => router.push('/dashboard/qbank')}
              style={{display: 'inline-flex', padding: '12px 24px', background: '#0d2340', borderRadius: 10, fontSize: 14, color: '#c9a84c', fontWeight: 600, cursor: 'pointer'}}>
              Log your first session →
            </div>
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>

            {/* Legend */}
            <div style={{display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap'}}>
              {[
                {color: '#9e2a2a', label: 'Priority (<55%)'},
                {color: '#c07040', label: 'Needs work (55–64%)'},
                {color: '#c9a84c', label: 'Developing (65–74%)'},
                {color: '#6b7c3a', label: 'Strong (75%+)'},
              ].map(l => (
                <div key={l.label} style={{display: 'flex', alignItems: 'center', gap: 6}}>
                  <div style={{width: 10, height: 10, borderRadius: '50%', background: l.color}}/>
                  <span style={{fontSize: 12, color: '#8a7d6a'}}>{l.label}</span>
                </div>
              ))}
            </div>

            {/* Priority topics */}
            {sorted.filter(t => (getTopicStats(t)?.acc || 0) < 65).length > 0 && (
              <div style={{background: '#fff5f5', border: '1px solid #f5c6c6', borderRadius: 12, padding: '18px 22px'}}>
                <div style={{fontSize: 15, fontWeight: 600, color: '#9e2a2a', marginBottom: 14}}>🎯 Priority focus areas</div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12}}>
                  {sorted.filter(t => (getTopicStats(t)?.acc || 0) < 65).map(topic => {
                    const stats = getTopicStats(topic)!
                    return (
                      <div key={topic} style={{background: 'white', border: '0.5px solid #f5c6c6', borderRadius: 9, padding: '12px 14px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                          <div style={{fontSize: 14, fontWeight: 600, color: '#0d2340'}}>{topic}</div>
                          <span style={{fontSize: 14, fontWeight: 700, color: getAccColor(stats.acc)}}>{stats.acc}%</span>
                        </div>
                        <div style={{height: 6, background: '#f0ece0', borderRadius: 3, overflow: 'hidden', marginBottom: 6}}>
                          <div style={{height: '100%', background: getAccColor(stats.acc), width: `${stats.acc}%`, borderRadius: 3}}/>
                        </div>
                        <div style={{fontSize: 11, color: '#a89870'}}>{stats.total} questions · {stats.sessions} sessions</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* All topics */}
            <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '18px 22px'}}>
              <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 16}}>All subjects</div>
              <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                {sorted.map(topic => {
                  const stats = getTopicStats(topic)!
                  return (
                    <div key={topic} style={{display: 'flex', alignItems: 'center', gap: 14}}>
                      <div style={{width: 110, fontSize: 13, color: '#3d3020', flexShrink: 0}}>{topic}</div>
                      <div style={{flex: 1, height: 8, background: '#f0ece0', borderRadius: 4, overflow: 'hidden'}}>
                        <div style={{height: '100%', background: getAccColor(stats.acc), width: `${stats.acc}%`, borderRadius: 4}}/>
                      </div>
                      <div style={{width: 36, fontSize: 13, fontWeight: 700, color: getAccColor(stats.acc), textAlign: 'right', flexShrink: 0}}>{stats.acc}%</div>
                      <div style={{width: 80, flexShrink: 0}}>
                        <span style={{fontSize: 11, padding: '2px 8px', borderRadius: 10, background: `${getAccColor(stats.acc)}18`, color: getAccColor(stats.acc), fontWeight: 500}}>{getAccLabel(stats.acc)}</span>
                      </div>
                      <div style={{fontSize: 11, color: '#a89870', width: 80, flexShrink: 0}}>{stats.total}Q · {stats.sessions} sessions</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Not yet logged */}
            {topicsWithoutData.length > 0 && (
              <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '18px 22px'}}>
                <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 14}}>Not yet practiced</div>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                  {topicsWithoutData.map(t => (
                    <span key={t} style={{fontSize: 13, padding: '5px 12px', borderRadius: 8, background: '#f7f4ee', color: '#8a7d6a', border: '0.5px solid #e8dfc8'}}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}