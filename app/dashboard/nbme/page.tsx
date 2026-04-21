'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'

export default function NBMETracker() {
  const [user, setUser] = useState<any>(null)
  const [scores, setScores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    exam_name: 'NBME 28',
    score: '',
    percent_correct: '',
    time_taken: '',
    exam_date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const { data } = await supabase
        .from('nbme_scores')
        .select('*')
        .eq('student_id', user.id)
        .order('exam_date', { ascending: true })
      setScores(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const handleSubmit = async () => {
    if (!form.score) return
    setSubmitting(true)
    const { error } = await supabase.from('nbme_scores').insert({
      student_id: user.id,
      exam_name: form.exam_name,
      score: parseInt(form.score),
      percent_correct: form.percent_correct ? parseFloat(form.percent_correct) : null,
      time_taken: form.time_taken,
      exam_date: form.exam_date,
      notes: form.notes
    })
    if (!error) {
      setSuccess(true)
      setForm({...form, score: '', percent_correct: '', time_taken: '', notes: ''})
      const { data } = await supabase
        .from('nbme_scores')
        .select('*')
        .eq('student_id', user.id)
        .order('exam_date', { ascending: true })
      setScores(data || [])
      setTimeout(() => setSuccess(false), 3000)
    }
    setSubmitting(false)
  }

  const latestScore = scores.length > 0 ? scores[scores.length - 1].score : null
  const firstScore = scores.length > 0 ? scores[0].score : null
  const gain = latestScore && firstScore ? latestScore - firstScore : null
  const predicted = latestScore ? Math.round(latestScore + 8) : null

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
      {name: 'NBME Scores', path: '/dashboard/nbme', active: true},
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
          <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5}}>NBME Score Tracker</div>
          <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Log every practice exam · Track your trajectory · Predict your Step 1 score</div>
        </div>

        {/* Metrics */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 12, marginBottom: 24}}>
          {[
            {label: 'Latest NBME', value: latestScore ? latestScore.toString() : '—', delta: latestScore ? 'Most recent score' : 'No exams logged yet', color: '#2d6a4f'},
            {label: 'Starting score', value: firstScore ? firstScore.toString() : '—', delta: firstScore ? 'Week 1 baseline' : 'Log your first exam', color: '#a89870'},
            {label: 'Total gain', value: gain ? `+${gain} pts` : '—', delta: gain ? 'Since baseline' : 'Keep logging!', color: gain ? '#2d6a4f' : '#a89870'},
            {label: 'Predicted Step 1', value: predicted ? predicted.toString() : '—', delta: predicted ? 'Based on latest NBME' : 'Log an exam to predict', color: '#c9a84c'},
            {label: 'Target score', value: '240+', delta: 'Program goal', color: '#a89870'},
          ].map((m, i) => (
            <div key={i} style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 10, padding: '14px 16px'}}>
              <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a89870', marginBottom: 8}}>{m.label}</div>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340'}}>{m.value}</div>
              <div style={{fontSize: 12, color: m.color, marginTop: 4}}>{m.delta}</div>
            </div>
          ))}
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20}}>

          <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>

            {/* SCORE CHART */}
            <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '18px 20px'}}>
              <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 16}}>Score progression</div>
              {scores.length === 0 ? (
                <div style={{fontSize: 14, color: '#8a7d6a', fontStyle: 'italic', padding: '12px 0'}}>No exams logged yet. Log your first NBME to see your score trajectory.</div>
              ) : (
                <div style={{position: 'relative', height: 180}}>
                  <svg width="100%" height="180" viewBox={`0 0 600 180`} preserveAspectRatio="none">
                    <line x1="0" y1="30" x2="600" y2="30" stroke="#f0ece0" strokeWidth="1"/>
                    <line x1="0" y1="75" x2="600" y2="75" stroke="#f0ece0" strokeWidth="1"/>
                    <line x1="0" y1="120" x2="600" y2="120" stroke="#f0ece0" strokeWidth="1"/>
                    <line x1="0" y1="165" x2="600" y2="165" stroke="#f0ece0" strokeWidth="1"/>
                    <text x="2" y="28" fontSize="10" fill="#c9b890">260</text>
                    <text x="2" y="73" fontSize="10" fill="#c9b890">240</text>
                    <text x="2" y="118" fontSize="10" fill="#c9b890">220</text>
                    <text x="2" y="163" fontSize="10" fill="#c9b890">200</text>
                    {/* Target line at 240 */}
                    <line x1="0" y1="75" x2="600" y2="75" stroke="#c9a84c" strokeWidth="1" strokeDasharray="4,3" opacity="0.5"/>
                    {scores.length > 1 && (
                      <polyline
                        points={scores.map((s, i) => {
                          const x = 40 + (i / (scores.length - 1)) * 520
                          const y = 165 - ((s.score - 200) / 60) * 135
                          return `${x},${Math.max(10, Math.min(165, y))}`
                        }).join(' ')}
                        fill="none" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      />
                    )}
                    {scores.map((s, i) => {
                      const x = scores.length === 1 ? 300 : 40 + (i / (scores.length - 1)) * 520
                      const y = 165 - ((s.score - 200) / 60) * 135
                      return (
                        <g key={s.id}>
                          <circle cx={x} cy={Math.max(10, Math.min(165, y))} r="5" fill={i === scores.length-1 ? '#0d2340' : 'white'} stroke="#c9a84c" strokeWidth="2"/>
                          <text x={x} y={Math.max(10, Math.min(165, y)) - 10} fontSize="11" fill="#0d2340" textAnchor="middle" fontWeight="600">{s.score}</text>
                        </g>
                      )
                    })}
                  </svg>
                </div>
              )}
            </div>

            {/* EXAM HISTORY TABLE */}
            <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '18px 20px'}}>
              <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 14}}>Exam history</div>
              {scores.length === 0 ? (
                <div style={{fontSize: 14, color: '#8a7d6a', fontStyle: 'italic'}}>No exams logged yet.</div>
              ) : (
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr>
                      {['Exam', 'Date', 'Score', '% Correct', 'Change', 'Time', 'Notes'].map(h => (
                        <th key={h} style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a89870', padding: '0 10px 10px', textAlign: 'left', borderBottom: '0.5px solid #f0ece0'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...scores].reverse().map((s, i, arr) => {
                      const prev = arr[i + 1]
                      const change = prev ? s.score - prev.score : null
                      return (
                        <tr key={s.id}>
                          <td style={{fontSize: 13, fontWeight: 500, color: '#0d2340', padding: '10px', borderBottom: i < arr.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>{s.exam_name}</td>
                          <td style={{fontSize: 13, color: '#3d3020', padding: '10px', borderBottom: i < arr.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>{new Date(s.exam_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</td>
                          <td style={{padding: '10px', borderBottom: i < arr.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
                            <span style={{fontSize: 14, fontWeight: 700, color: s.score >= 240 ? '#2d6a4f' : s.score >= 220 ? '#c9a84c' : '#c07040'}}>{s.score}</span>
                          </td>
                          <td style={{fontSize: 13, color: '#3d3020', padding: '10px', borderBottom: i < arr.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>{s.percent_correct ? `${s.percent_correct}%` : '—'}</td>
                          <td style={{padding: '10px', borderBottom: i < arr.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
                            {change !== null ? (
                              <span style={{fontSize: 13, fontWeight: 600, color: change >= 0 ? '#2d6a4f' : '#9e2a2a'}}>{change >= 0 ? `↑ +${change}` : `↓ ${change}`}</span>
                            ) : <span style={{fontSize: 13, color: '#a89870'}}>Baseline</span>}
                          </td>
                          <td style={{fontSize: 13, color: '#3d3020', padding: '10px', borderBottom: i < arr.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>{s.time_taken || '—'}</td>
                          <td style={{fontSize: 12, color: '#8a7d6a', padding: '10px', borderBottom: i < arr.length-1 ? '0.5px solid #f5f0e8' : 'none', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{s.notes || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* LOG FORM */}
          <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
            <div style={{background: '#0d2340', borderRadius: 12, padding: '20px', height: 'fit-content'}}>
              <div style={{fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 16}}>Log a new exam</div>

              {success && (
                <div style={{background: 'rgba(107,124,58,0.2)', border: '0.5px solid #6b7c3a', borderRadius: 6, padding: '10px 12px', marginBottom: 14, fontSize: 13, color: '#9FE1CB'}}>
                  ✓ Exam logged successfully!
                </div>
              )}

              <div style={{marginBottom: 12}}>
                <div style={{fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5}}>Exam name</div>
                <select value={form.exam_name} onChange={e => setForm({...form, exam_name: e.target.value})}
                  style={{width: '100%', height: 38, borderRadius: 7, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: 'white', outline: 'none'}}>
                  {['NBME 25','NBME 26','NBME 27','NBME 28','NBME 29','NBME 30','NBME 31','Free 120','UWSA 1','UWSA 2','Other'].map(o => (
                    <option key={o} value={o} style={{background: '#0d2340'}}>{o}</option>
                  ))}
                </select>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12}}>
                {[{label: 'Score', key: 'score', placeholder: 'e.g. 220'}, {label: '% Correct', key: 'percent_correct', placeholder: 'e.g. 73'}].map(f => (
                  <div key={f.key}>
                    <div style={{fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5}}>{f.label}</div>
                    <input type="number" value={(form as any)[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                      placeholder={f.placeholder}
                      style={{width: '100%', height: 38, borderRadius: 7, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: 'white', outline: 'none', boxSizing: 'border-box'}}/>
                  </div>
                ))}
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12}}>
                <div>
                  <div style={{fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5}}>Date</div>
                  <input type="date" value={form.exam_date} onChange={e => setForm({...form, exam_date: e.target.value})}
                    style={{width: '100%', height: 38, borderRadius: 7, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: 'white', outline: 'none', boxSizing: 'border-box'}}/>
                </div>
                <div>
                  <div style={{fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5}}>Time taken</div>
                  <input type="text" value={form.time_taken} onChange={e => setForm({...form, time_taken: e.target.value})}
                    placeholder="e.g. 3h 45m"
                    style={{width: '100%', height: 38, borderRadius: 7, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: 'white', outline: 'none', boxSizing: 'border-box'}}/>
                </div>
              </div>

              <div style={{marginBottom: 14}}>
                <div style={{fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5}}>Notes (optional)</div>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  placeholder="Any notes about this exam..."
                  rows={2}
                  style={{width: '100%', borderRadius: 7, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '8px 10px', color: 'white', outline: 'none', boxSizing: 'border-box', resize: 'none'}}/>
              </div>

              <button onClick={handleSubmit} disabled={submitting || !form.score}
                style={{width: '100%', height: 42, background: submitting ? '#4a5568' : '#c9a84c', border: 'none', borderRadius: 8, fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, color: '#0d2340', cursor: submitting ? 'not-allowed' : 'pointer'}}>
                {submitting ? 'Logging...' : 'Log exam ↗'}
              </button>
            </div>

            {/* PREDICTED SCORE BOX */}
            <div style={{background: '#0d2340', borderRadius: 12, padding: '18px 20px'}}>
              <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 8}}>Predicted Step 1 score</div>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 42, color: 'white', letterSpacing: -1, lineHeight: 1}}>{predicted || '—'}</div>
              <div style={{fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6, marginBottom: 12}}>
                {predicted ? 'Based on your latest NBME score' : 'Log your first NBME to see your prediction'}
              </div>
              {predicted && (
                <div style={{fontSize: 13, color: predicted >= 240 ? '#6b7c3a' : '#c9a84c'}}>
                  {predicted >= 240 ? '🎯 At or above target!' : `${240 - predicted} pts to reach target of 240`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}