'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'

export default function MyProgressReports() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const [{ data: profileData }, reportsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        fetch(`/api/dashboard/accountability?student_id=${user.id}`).then(r => r.json()),
      ])
      setProfile(profileData)
      setReports(Array.isArray(reportsRes) ? reportsRes : [])
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
      {name: 'Mentor Meetings', path: '/dashboard/mentor'},
      {name: 'My Progress Reports', path: '/dashboard/accountability', active: true},
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

  const scoreColor = (n: number) => n >= 4 ? '#2d6a4f' : n >= 3 ? '#c07040' : '#c0574a'
  const stressColor = (s: string) => s === 'LOW' ? '#2d6a4f' : s === 'MODERATE' ? '#c07040' : '#c0574a'

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
              <div style={{fontSize: 13, color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{profile?.full_name || user?.email?.split('@')[0]}</div>
              <div style={{fontSize: 10, color: 'rgba(255,255,255,0.35)'}}>Windsor SOM</div>
            </div>
            <div onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              style={{fontSize: 11, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, border: '0.5px solid rgba(255,255,255,0.15)'}}>
              Sign Out
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <div style={{flex: 1, minWidth: 0, overflowY: 'auto', padding: '32px 36px'}}>
        <div style={{marginBottom: 28}}>
          <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5}}>My Progress Reports</div>
          <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Bi-weekly reports submitted by your mentor</div>
        </div>

        {reports.length === 0 ? (
          <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '48px', textAlign: 'center'}}>
            <div style={{fontSize: 16, color: '#0d2340', fontWeight: 500, marginBottom: 8}}>No reports yet</div>
            <div style={{fontSize: 14, color: '#8a7d6a'}}>Your mentor will submit progress reports after each bi-weekly meeting.</div>
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
            {reports.map(r => (
              <div key={r.id} style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
                {/* Header row */}
                <div onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  style={{padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16}}>
                  <div style={{width: 44, height: 44, borderRadius: 10, background: '#0d2340', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                    <div style={{fontSize: 9, color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Week</div>
                    <div style={{fontSize: 18, color: '#c9a84c', fontFamily: 'Georgia, serif', fontWeight: 700, lineHeight: 1}}>{r.week_number}</div>
                  </div>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 2}}>
                      Week {r.week_number} Progress Report
                    </div>
                    <div style={{fontSize: 12, color: '#8a7d6a'}}>
                      {r.report_date ? new Date(r.report_date + 'T12:00:00').toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'}) : ''}
                      {r.mentor_name ? ` · Mentor: ${r.mentor_name}` : ''}
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                    <div style={{textAlign: 'center', padding: '6px 10px', background: '#f7f4ee', borderRadius: 8}}>
                      <div style={{fontSize: 9, color: '#8a7d6a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2}}>Understanding</div>
                      <div style={{fontSize: 16, fontWeight: 700, color: scoreColor(r.understanding), fontFamily: 'Georgia, serif'}}>{r.understanding}/5</div>
                    </div>
                    <div style={{textAlign: 'center', padding: '6px 10px', background: '#f7f4ee', borderRadius: 8}}>
                      <div style={{fontSize: 9, color: '#8a7d6a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2}}>Engagement</div>
                      <div style={{fontSize: 16, fontWeight: 700, color: scoreColor(r.engagement), fontFamily: 'Georgia, serif'}}>{r.engagement}/5</div>
                    </div>
                    <div style={{fontSize: 12, color: '#a89870', marginLeft: 4}}>{expanded === r.id ? '▲' : '▼'}</div>
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded === r.id && (
                  <div style={{borderTop: '0.5px solid #f0ece0', padding: '20px 20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>

                    {r.topics_covered && (
                      <div style={{gridColumn: '1 / -1'}}>
                        <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a89870', marginBottom: 5}}>Topics Covered</div>
                        <div style={{fontSize: 14, color: '#1a1008', lineHeight: 1.6}}>{r.topics_covered}</div>
                      </div>
                    )}

                    {r.areas_of_difficulty && (
                      <div>
                        <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a89870', marginBottom: 5}}>Areas of Difficulty</div>
                        <div style={{fontSize: 14, color: '#1a1008', lineHeight: 1.6}}>{r.areas_of_difficulty}</div>
                      </div>
                    )}

                    {r.next_steps && (
                      <div>
                        <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a89870', marginBottom: 5}}>Next Steps / Study Plan</div>
                        <div style={{fontSize: 14, color: '#1a1008', lineHeight: 1.6}}>{r.next_steps}</div>
                      </div>
                    )}

                    {r.mentor_notes && (
                      <div style={{gridColumn: '1 / -1'}}>
                        <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a89870', marginBottom: 5}}>Mentor Notes</div>
                        <div style={{fontSize: 14, color: '#1a1008', lineHeight: 1.6, fontStyle: 'italic'}}>{r.mentor_notes}</div>
                      </div>
                    )}

                    <div style={{gridColumn: '1 / -1', display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 8, borderTop: '0.5px solid #f0ece0'}}>
                      <span style={{fontSize: 11, padding: '3px 10px', borderRadius: 8, background: r.completed_study_goals === 'Y' ? '#f0f7f2' : '#fdf0f0', color: r.completed_study_goals === 'Y' ? '#2d6a4f' : '#c0574a', fontWeight: 500}}>
                        Goals: {r.completed_study_goals === 'Y' ? 'Completed ✓' : 'Incomplete'}
                      </span>
                      {r.took_practice_test && r.took_practice_test !== 'Not Assigned' && (
                        <span style={{fontSize: 11, padding: '3px 10px', borderRadius: 8, background: '#f7f4ee', color: '#5c4f35'}}>
                          Practice test: {r.took_practice_test}{r.nbme_score ? ` · Score: ${r.nbme_score}` : ''}
                        </span>
                      )}
                      {r.stress_levels && (
                        <span style={{fontSize: 11, padding: '3px 10px', borderRadius: 8, background: '#f7f4ee', color: stressColor(r.stress_levels)}}>
                          Stress: {r.stress_levels}
                        </span>
                      )}
                      {r.was_prepared && (
                        <span style={{fontSize: 11, padding: '3px 10px', borderRadius: 8, background: '#f7f4ee', color: '#5c4f35'}}>
                          Prepared: {r.was_prepared}
                        </span>
                      )}
                      {r.follow_up_needed === 'Yes' && (
                        <span style={{fontSize: 11, padding: '3px 10px', borderRadius: 8, background: '#fff8e8', color: '#c07040', fontWeight: 600}}>
                          ⚠ Follow-up needed
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
