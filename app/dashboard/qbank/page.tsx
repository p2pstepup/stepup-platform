'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'

export default function QbankTracker() {
  const [user, setUser] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    source: 'UWorld',
    topic: 'Cardiology',
    questions_total: '',
    questions_correct: '',
    mode: 'Timed',
    session_date: new Date().toISOString().split('T')[0]
  })
  const [success, setSuccess] = useState(false)
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
        .order('session_date', { ascending: false })
      setSessions(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const handleSubmit = async () => {
    if (!form.questions_total || !form.questions_correct) return
    setSubmitting(true)
    const { error } = await supabase.from('qbank_sessions').insert({
      student_id: user.id,
      source: form.source,
      topic: form.topic,
      questions_total: parseInt(form.questions_total),
      questions_correct: parseInt(form.questions_correct),
      mode: form.mode,
      session_date: form.session_date
    })
    if (!error) {
      setSuccess(true)
      setForm({...form, questions_total: '', questions_correct: ''})
      const { data } = await supabase
        .from('qbank_sessions')
        .select('*')
        .eq('student_id', user.id)
        .order('session_date', { ascending: false })
      setSessions(data || [])
      setTimeout(() => setSuccess(false), 3000)
    }
    setSubmitting(false)
  }

  const totalQ = sessions.reduce((a, s) => a + s.questions_total, 0)
  const totalC = sessions.reduce((a, s) => a + s.questions_correct, 0)
  const avgAcc = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0

  const topics = ['Cardiology','Psychiatry','Renal','Biochemistry','Pharmacology','Microbiology','Anatomy','Pathology','Physiology','Reproductive','Neurology','Endocrinology','Mixed']

  const getAccColor = (acc: number) => {
    if (acc >= 75) return '#6b7c3a'
    if (acc >= 65) return '#c9a84c'
    if (acc >= 55) return '#c07040'
    return '#9e2a2a'
  }

  if (loading) return (
    <main style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee'}}>
      <div style={{fontFamily: 'Georgia, serif', fontSize: 18, color: '#0d2340'}}>Loading...</div>
    </main>
  )

  return (
    <main style={{minHeight: '100vh', display: 'flex', background: '#f7f4ee', fontFamily: 'Sora, sans-serif'}}>

      {/* SIDEBAR */}
      <nav style={{width: 175, flexShrink: 0, background: '#0d2340', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0}}>
        <div style={{padding: '15px 14px 12px', borderBottom: '0.5px solid rgba(201,168,76,0.2)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 9}}>
            <div style={{width: 30, height: 30, background: '#c9a84c', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <div style={{width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '9px solid #0d2340'}}/>
            </div>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 15, color: 'white', fontWeight: 600}}>StepUp</div>
          </div>
          <div style={{fontSize: 7.5, color: '#c9a84c', letterSpacing: '0.09em', textTransform: 'uppercase', paddingLeft: 39, marginTop: 2}}>P2P Mentoring Program</div>
        </div>
        <div style={{padding: '10px 8px', flex: 1, overflowY: 'auto'}}>
          {[
            {section: 'Overview', items: [{name: 'Dashboard', path: '/dashboard'}]},
            {section: 'My Program', items: [{name: 'Daily Schedule', path: '/dashboard/schedule'}, {name: 'Calendar', path: '/dashboard/calendar'}, {name: 'Assignments', path: '/dashboard/assignments'}, {name: 'Mentor Meetings', path: '/dashboard/mentor'}]},
            {section: 'Study Tools', items: [{name: 'Exam Center', path: '/dashboard/exams'}, {name: 'Qbank Tracker', path: '/dashboard/qbank', active: true}, {name: 'NBME Scores', path: '/dashboard/nbme'}, {name: 'Weakness Map', path: '/dashboard/weakness'}]},
            {section: 'Resources', items: [{name: 'HY Topic Notes', path: '/dashboard/notes'}, {name: 'Session Recordings', path: '/dashboard/recordings'}, {name: 'Session Slides', path: '/dashboard/slides'}, {name: 'Resource Drive', path: '/dashboard/resources'}, {name: 'Live Feedback', path: '/dashboard/feedback'}]},
          ].map((group) => (
            <div key={group.section}>
              <div style={{fontSize: 7.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.28)', padding: '0 8px', margin: '9px 0 3px'}}>{group.section}</div>
              {group.items.map((item: any) => (
                <div key={item.name} onClick={() => router.push(item.path)}
                  style={{display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 6, color: item.active ? '#c9a84c' : 'rgba(255,255,255,0.52)', fontSize: 11, marginBottom: 1, background: item.active ? 'rgba(255,255,255,0.09)' : 'transparent', cursor: 'pointer'}}>
                  <div style={{width: 5, height: 5, borderRadius: '50%', background: 'currentColor', flexShrink: 0}}/>{item.name}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{padding: '10px 12px', borderTop: '0.5px solid rgba(201,168,76,0.14)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 7}}>
            <div style={{width: 25, height: 25, borderRadius: '50%', background: '#c9a84c', color: '#0d2340', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div style={{flex: 1, minWidth: 0}}>
              <div style={{fontSize: 10.5, color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{user?.email?.split('@')[0]}</div>
              <div style={{fontSize: 8, color: 'rgba(255,255,255,0.3)'}}>Windsor SOM</div>
            </div>
            <div onClick={async () => { await supabase.auth.signOut(); router.push('/') }} style={{fontSize: 8, color: 'rgba(255,255,255,0.3)', cursor: 'pointer'}}>Out</div>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <div style={{flex: 1, minWidth: 0, overflowY: 'auto', padding: '22px 24px'}}>

        <div style={{marginBottom: 20}}>
          <div style={{fontFamily: 'Georgia, serif', fontSize: 22, color: '#0d2340'}}>Qbank Tracker</div>
          <div style={{fontSize: 11, color: '#8a7d6a', marginTop: 3}}>Log UWorld · Amboss · StepUp blocks · All data feeds your Weakness Map</div>
        </div>

        {/* Metrics */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 9, marginBottom: 18}}>
          {[
            {label: 'Total questions', value: totalQ.toLocaleString(), delta: `${sessions.length} sessions logged`},
            {label: 'Overall accuracy', value: totalQ > 0 ? `${avgAcc}%` : '—', delta: totalQ > 0 ? 'Keep it up!' : 'No sessions yet'},
            {label: 'Sessions logged', value: sessions.length.toString(), delta: 'Across all sources'},
            {label: 'Daily goal', value: '60 Qs', delta: 'Set by Dr. Rivera'},
          ].map((m, i) => (
            <div key={i} style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 9, padding: '10px 12px'}}>
              <div style={{fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a89870', marginBottom: 5}}>{m.label}</div>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 22, color: '#0d2340'}}>{m.value}</div>
              <div style={{fontSize: 9, color: '#a89870', marginTop: 3}}>{m.delta}</div>
            </div>
          ))}
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16}}>

          {/* SESSION LOG TABLE */}
          <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
            <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 10, padding: '14px 16px'}}>
              <div style={{fontSize: 12, fontWeight: 600, color: '#0d2340', marginBottom: 12}}>Recent sessions</div>
              {sessions.length === 0 ? (
                <div style={{fontSize: 12, color: '#8a7d6a', fontStyle: 'italic', padding: '10px 0'}}>No sessions logged yet. Use the form to log your first session!</div>
              ) : (
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr>
                      {['Date', 'Source', 'Topic', 'Questions', 'Correct', 'Accuracy', 'Mode'].map(h => (
                        <th key={h} style={{fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a89870', padding: '0 8px 8px', textAlign: 'left', borderBottom: '0.5px solid #f0ece0'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, i) => (
                      <tr key={s.id}>
                        <td style={{fontSize: 11, color: '#3d3020', padding: '8px', borderBottom: i < sessions.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>{new Date(s.session_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</td>
                        <td style={{padding: '8px', borderBottom: i < sessions.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
                          <span style={{fontSize: 9, padding: '2px 6px', borderRadius: 3, fontWeight: 500, background: s.source === 'UWorld' ? '#eef4fb' : s.source === 'Amboss' ? '#f0f9f7' : '#162032', color: s.source === 'UWorld' ? '#1a4a7a' : s.source === 'Amboss' ? '#4a8c84' : '#c9a84c'}}>{s.source}</span>
                        </td>
                        <td style={{fontSize: 11, color: '#3d3020', padding: '8px', borderBottom: i < sessions.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>{s.topic}</td>
                        <td style={{fontSize: 11, color: '#3d3020', padding: '8px', borderBottom: i < sessions.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>{s.questions_total}</td>
                        <td style={{fontSize: 11, color: '#3d3020', padding: '8px', borderBottom: i < sessions.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>{s.questions_correct}</td>
                        <td style={{padding: '8px', borderBottom: i < sessions.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
                          <span style={{fontSize: 11, fontWeight: 600, color: getAccColor(s.accuracy)}}>{s.accuracy}%</span>
                        </td>
                        <td style={{fontSize: 11, color: '#3d3020', padding: '8px', borderBottom: i < sessions.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>{s.mode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* SUBJECT ACCURACY BARS */}
            {sessions.length > 0 && (
              <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 10, padding: '14px 16px'}}>
                <div style={{fontSize: 12, fontWeight: 600, color: '#0d2340', marginBottom: 12}}>Accuracy by subject</div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px'}}>
                  {topics.filter(t => sessions.some(s => s.topic === t)).map(topic => {
                    const topicSessions = sessions.filter(s => s.topic === topic)
                    const tTotal = topicSessions.reduce((a, s) => a + s.questions_total, 0)
                    const tCorrect = topicSessions.reduce((a, s) => a + s.questions_correct, 0)
                    const acc = Math.round((tCorrect / tTotal) * 100)
                    return (
                      <div key={topic} style={{display: 'flex', alignItems: 'center', gap: 0, marginBottom: 6}}>
                        <span style={{fontSize: 10, color: '#3d3020', width: 88, flexShrink: 0}}>{topic}</span>
                        <div style={{flex: 1, height: 5, background: '#ede8d8', borderRadius: 3, overflow: 'hidden'}}>
                          <div style={{height: '100%', borderRadius: 3, background: getAccColor(acc), width: `${acc}%`}}/>
                        </div>
                        <span style={{fontSize: 10, fontWeight: 600, width: 32, textAlign: 'right', flexShrink: 0, paddingLeft: 6, color: getAccColor(acc)}}>{acc}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* LOG FORM */}
          <div style={{background: '#0d2340', borderRadius: 10, padding: '16px', height: 'fit-content'}}>
            <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 14}}>Log a new session</div>

            {success && (
              <div style={{background: 'rgba(107,124,58,0.2)', border: '0.5px solid #6b7c3a', borderRadius: 6, padding: '8px 10px', marginBottom: 12, fontSize: 11, color: '#9FE1CB'}}>
                ✓ Session logged successfully!
              </div>
            )}

            {[
              {label: 'Source', key: 'source', options: ['UWorld', 'Amboss', 'StepUp', 'Other']},
              {label: 'Topic', key: 'topic', options: topics},
              {label: 'Mode', key: 'mode', options: ['Timed', 'Untimed', 'Tutor']},
            ].map(field => (
              <div key={field.key} style={{marginBottom: 10}}>
                <div style={{fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4}}>{field.label}</div>
                <select value={(form as any)[field.key]} onChange={e => setForm({...form, [field.key]: e.target.value})}
                  style={{width: '100%', height: 32, borderRadius: 6, border: '0.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', fontFamily: 'Sora, sans-serif', fontSize: 11, padding: '0 8px', color: 'white', outline: 'none'}}>
                  {field.options.map(o => <option key={o} value={o} style={{background: '#0d2340'}}>{o}</option>)}
                </select>
              </div>
            ))}

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10}}>
              {[{label: 'Total Qs', key: 'questions_total'}, {label: 'Correct', key: 'questions_correct'}].map(f => (
                <div key={f.key}>
                  <div style={{fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4}}>{f.label}</div>
                  <input type="number" value={(form as any)[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                    placeholder="0"
                    style={{width: '100%', height: 32, borderRadius: 6, border: '0.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', fontFamily: 'Sora, sans-serif', fontSize: 11, padding: '0 8px', color: 'white', outline: 'none', boxSizing: 'border-box'}}/>
                </div>
              ))}
            </div>

            <div style={{marginBottom: 12}}>
              <div style={{fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4}}>Date</div>
              <input type="date" value={form.session_date} onChange={e => setForm({...form, session_date: e.target.value})}
                style={{width: '100%', height: 32, borderRadius: 6, border: '0.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', fontFamily: 'Sora, sans-serif', fontSize: 11, padding: '0 8px', color: 'white', outline: 'none', boxSizing: 'border-box'}}/>
            </div>

            {form.questions_total && form.questions_correct && (
              <div style={{background: 'rgba(201,168,76,0.1)', borderRadius: 6, padding: '8px 10px', marginBottom: 12, fontSize: 11, color: '#c9a84c'}}>
                Accuracy: {Math.round((parseInt(form.questions_correct) / parseInt(form.questions_total)) * 100)}%
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting || !form.questions_total || !form.questions_correct}
              style={{width: '100%', height: 36, background: submitting ? '#4a5568' : '#c9a84c', border: 'none', borderRadius: 7, fontFamily: 'Sora, sans-serif', fontSize: 11, fontWeight: 600, color: '#0d2340', cursor: submitting ? 'not-allowed' : 'pointer'}}>
              {submitting ? 'Logging...' : 'Log session ↗'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}