'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'

export default function ExamCenter() {
  const [user, setUser] = useState<any>(null)
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const { data } = await supabase
        .from('exams')
        .select('*')
        .order('sort_order', { ascending: true })
      setExams(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const navGroups = [
    {section: 'Overview', items: [{name: 'Dashboard', path: '/dashboard'}]},
    {section: 'My Program', items: [
      {name: 'Daily Schedule', path: '/dashboard/schedule'},
      {name: 'Calendar', path: '/dashboard/calendar'},
      {name: 'Assignments', path: '/dashboard/assignments'},
      {name: 'Mentor Meetings', path: '/dashboard/mentor'},
    ]},
    {section: 'Study Tools', items: [
      {name: 'Exam Center', path: '/dashboard/exams', active: true},
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

  const diffColor = (d: string) => {
    if (d === 'Baseline') return '#4a8c84'
    if (d === 'Moderate') return '#6b7c3a'
    if (d === 'Hard') return '#c07040'
    if (d === 'Hardest') return '#9e2a2a'
    return '#c9a84c'
  }

  if (loading) return (
    <main style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee'}}>
      <div style={{fontFamily: 'Georgia, serif', fontSize: 24, color: '#0d2340'}}>Loading...</div>
    </main>
  )

  const upcomingExam = exams.find(e => e.deadline && new Date(e.deadline) > new Date())

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
        <div style={{marginBottom: 28}}>
          <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5}}>Exam Center</div>
          <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>NBME practice exams · UWSA · Free 120 · StepUp assessments</div>
        </div>

        {upcomingExam && (
          <div style={{background: '#0d2340', borderRadius: 12, padding: '18px 24px', marginBottom: 24, borderLeft: '4px solid #c9a84c', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div>
              <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 6}}>Upcoming deadline</div>
              <div style={{fontSize: 20, color: 'white', fontWeight: 500}}>{upcomingExam.name}</div>
              <div style={{fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4}}>
                Due {new Date(upcomingExam.deadline).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})} · {upcomingExam.questions} questions · {upcomingExam.time_limit}
              </div>
              {upcomingExam.notes && <div style={{fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4}}>{upcomingExam.notes}</div>}
            </div>
            {upcomingExam.link ? (
              <a href={upcomingExam.link} target="_blank" rel="noopener noreferrer"
                style={{background: '#c9a84c', borderRadius: 10, padding: '10px 18px', fontSize: 13, color: '#0d2340', fontWeight: 600, textDecoration: 'none', flexShrink: 0}}>
                Take exam ↗
              </a>
            ) : (
              <div style={{background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10, padding: '10px 18px', fontSize: 13, color: '#c9a84c', fontWeight: 500, flexShrink: 0}}>Scheduled</div>
            )}
          </div>
        )}

        <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden', marginBottom: 24}}>
          <div style={{background: '#0d2340', padding: '14px 20px'}}>
            <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>Available practice exams</div>
            <div style={{fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3}}>Log your scores in NBME Scores after completing each exam</div>
          </div>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr>
                {['Exam', 'Questions', 'Time limit', 'Difficulty', 'Recommended', 'Deadline', 'Action'].map(h => (
                  <th key={h} style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a89870', padding: '12px 16px', textAlign: 'left', borderBottom: '0.5px solid #f0ece0'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exams.map((exam, i) => (
                <tr key={exam.id} style={{borderBottom: i < exams.length-1 ? '0.5px solid #f5f0e8' : 'none', opacity: exam.available ? 1 : 0.6}}>
                  <td style={{padding: '14px 16px'}}>
                    <div style={{fontSize: 14, fontWeight: 600, color: '#0d2340'}}>{exam.name}</div>
                    {exam.notes && <div style={{fontSize: 11, color: '#8a7d6a', marginTop: 2}}>{exam.notes}</div>}
                  </td>
                  <td style={{fontSize: 13, color: '#3d3020', padding: '14px 16px'}}>{exam.questions}Q</td>
                  <td style={{fontSize: 13, color: '#3d3020', padding: '14px 16px'}}>{exam.time_limit}</td>
                  <td style={{padding: '14px 16px'}}>
                    <span style={{fontSize: 12, padding: '3px 10px', borderRadius: 10, background: `${diffColor(exam.difficulty)}18`, color: diffColor(exam.difficulty), fontWeight: 500}}>{exam.difficulty}</span>
                  </td>
                  <td style={{padding: '14px 16px'}}>
                    <span style={{fontSize: 12, padding: '3px 10px', borderRadius: 10, background: '#f7f4ee', color: '#8a7d6a'}}>{exam.recommended_week}</span>
                  </td>
                  <td style={{fontSize: 13, color: exam.deadline ? '#c0574a' : '#a89870', padding: '14px 16px', fontWeight: exam.deadline ? 500 : 400}}>
                    {exam.deadline ? new Date(exam.deadline).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : '—'}
                  </td>
                  <td style={{padding: '14px 16px'}}>
                    {exam.available && exam.link ? (
                      <a href={exam.link} target="_blank" rel="noopener noreferrer"
                        style={{display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#0d2340', borderRadius: 7, fontSize: 12, color: '#c9a84c', fontWeight: 500, textDecoration: 'none'}}>
                        Take exam ↗
                      </a>
                    ) : exam.available ? (
                      <div onClick={() => router.push('/dashboard/nbme')}
                        style={{display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#f7f4ee', border: '0.5px solid #e8dfc8', borderRadius: 7, fontSize: 12, color: '#3d3020', cursor: 'pointer'}}>
                        Log score →
                      </div>
                    ) : (
                      <div style={{fontSize: 12, color: '#a89870', fontStyle: 'italic'}}>Scheduled</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
          <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '18px 22px'}}>
            <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 14}}>How to take a practice exam</div>
            {[
              'Go to NBME.org or UWorld and start your exam in a fresh distraction-free environment',
              'Complete the full exam in one sitting — timed, exam conditions only',
              'After finishing come back here and log your score in NBME Scores',
              'Review every wrong answer before your next session',
              'Discuss your weak areas with your mentor in your next 1-on-1',
            ].map((tip, i) => (
              <div key={i} style={{display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start'}}>
                <div style={{width: 22, height: 22, borderRadius: '50%', background: '#f7f4ee', border: '1px solid #c9a84c', color: '#c9a84c', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{i+1}</div>
                <div style={{fontSize: 13, color: '#3d3020', lineHeight: 1.6}}>{tip}</div>
              </div>
            ))}
          </div>
          <div style={{background: '#0d2340', borderRadius: 12, padding: '18px 22px'}}>
            <div style={{fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 14}}>Exam schedule recommendation</div>
            {[
              {week: 'Week 1', exam: 'NBME 25 — Baseline assessment'},
              {week: 'Week 2', exam: 'StepUp 200Q — Program checkpoint'},
              {week: 'Week 3', exam: 'NBME 26 or 27'},
              {week: 'Week 4', exam: 'NBME 28'},
              {week: 'Week 5', exam: 'NBME 29 + Free 120'},
              {week: 'Week 6', exam: 'NBME 30 + UWSA 1'},
              {week: 'Week 7', exam: 'NBME 31 + UWSA 2'},
              {week: 'Week 8', exam: 'Review only — no new exams'},
            ].map((s, i) => (
              <div key={i} style={{display: 'flex', gap: 14, padding: '8px 0', borderBottom: i < 7 ? '0.5px solid rgba(255,255,255,0.07)' : 'none'}}>
                <div style={{fontSize: 12, color: '#c9a84c', width: 56, flexShrink: 0}}>{s.week}</div>
                <div style={{fontSize: 13, color: 'rgba(255,255,255,0.7)'}}>{s.exam}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}