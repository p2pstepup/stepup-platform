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
      {name: 'Qbank Tracker', path: '/dashboard/qbank', active: true},
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

  if (loading) return (
    <main style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee'}}>
      <div style={{fontFamily: 'Georgia, serif', fontSize: 24, color: '#0d2340'}}>Loading...</div>
    </main>
  )

  return (
    <main style={{minHeight: '100vh', display: 'flex', background: '#f7f4ee', fontFamily: 'Sora, sans-serif'}}>

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
          <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5}}>Qbank Tracker</div>
          <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Log UWorld · Amboss · StepUp blocks · All data feeds your Weakness Map</div>
        </div>

        {/* Metrics */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: 24}}>
          {[
            {label: 'Total questions', value: totalQ.toLocaleString(), delta: `${sessions.length} sessions logged`},
            {label: 'Overall accuracy', value: totalQ > 0 ? `${avgAcc}%` : '—', delta: totalQ > 0 ? 'Keep it up!' : 'No sessions yet'},
            {label: 'Sessions logged', value: sessions.length.toString(), delta: 'Across all sources'},
            {label: 'Daily goal', value: '60 Qs', delta: 'Set by Dr. Rivera'},
          ].map((m, i) => (
            <div key={i} style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 10, padding: '14px 16px'}}>
              <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a89870', marginBottom: 8}}>{m.label}</div>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340'}}>{m.value}</div>
              <div style={{fontSize: 12, color: '#a89870', marginTop: 4}}>{m.delta}</div>
            </div>
          ))}
        </div>

        <div style={{display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20}}>

          {/* SESSION LOG */}
          <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
            <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '18px 20px'}}>
              <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 14}}>Recent sessions</div>
              {sessions.length === 0 ? (
                <div style={{fontSize: 14, color: '#8a7d6a', fontStyle: 'italic', padding: '12px 0'}}>No sessions logged yet. Use the form to log your first session!</div>
              ) : (
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr>
                      {['Date', 'Source', 'Topic', 'Questions', 'Correct', 'Accuracy', 'Mode'].map(h => (
                        <th key={h} style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a89870', padding: '0 10px 10px', textAlign: 'left', borderBottom: '0.5px solid #f0ece0'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, i) => (
                      <tr key={s.id}>
                        <td style={{fontSize: 13, color: '#3d3020', padding: '10px', borderBottom: i < sessions.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>{new Date(s.session_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</td>
                        <td style={{padding: '10px', borderBottom: i < sessions.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
                          <span style={{fontSize: 11, padding: '3px 8px', borderRadius: 4, fontWeight: 500, background: s.source === 'UWorld' ? '#eef4fb' : s.source === 'Amboss' ? '#f0f9f7' : '#162032', color: s.source === 'UWorld' ? '#1a4a7a' : s.source === 'Amboss' ? '#4a8c84' : '#c9a84c'}}>{s.source}</span>
                        </td>
                        <td style={{fontSize: 13, color: '#3d3020', padding: '10px', borderBottom: i < sessions.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>{s.topic}</td>
                        <td style={{fontSize: 13, color: '#3d3020', padding: '10px', borderBottom: i < sessions.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>{s.questions_total}</td>
                        <td style={{fontSize: 13, color: '#3d3020', padding: '10px', borderBottom: i < sessions.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>{s.questions_correct}</td>
                        <td style={{padding: '10px', borderBottom: i < sessions.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
                          <span style={{fontSize: 13, fontWeight: 600, color: getAccColor(s.accuracy)}}>{s.accuracy}%</span>
                        </td>
                        <td style={{fontSize: 13, color: '#3d3020', padding: '10px', borderBottom: i < sessions.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>{s.mode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {sessions.length > 0 && (
              <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '18px 20px'}}>
                <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 14}}>Accuracy by subject</div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px'}}>
                  {topics.filter(t => sessions.some(s => s.topic === t)).map(topic => {
                    const ts = sessions.filter(s => s.topic === topic)
                    const tT = ts.reduce((a, s) => a + s.questions_total, 0)
                    const tC = ts.reduce((a, s) => a + s.questions_correct, 0)
                    const acc = Math.round((tC / tT) * 100)
                    return (
                      <div key={topic} style={{display: 'flex', alignItems: 'center', gap: 0, marginBottom: 6}}>
                        <span style={{fontSize: 13, color: '#3d3020', width: 100, flexShrink: 0}}>{topic}</span>
                        <div style={{flex: 1, height: 6, background: '#ede8d8', borderRadius: 3, overflow: 'hidden'}}>
                          <div style={{height: '100%', borderRadius: 3, background: getAccColor(acc), width: `${acc}%`}}/>
                        </div>
                        <span style={{fontSize: 13, fontWeight: 600, width: 36, textAlign: 'right', flexShrink: 0, paddingLeft: 8, color: getAccColor(acc)}}>{acc}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* LOG FORM */}
          <div style={{background: '#0d2340', borderRadius: 12, padding: '20px', height: 'fit-content'}}>
            <div style={{fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 16}}>Log a new session</div>

            {success && (
              <div style={{background: 'rgba(107,124,58,0.2)', border: '0.5px solid #6b7c3a', borderRadius: 6, padding: '10px 12px', marginBottom: 14, fontSize: 13, color: '#9FE1CB'}}>
                ✓ Session logged successfully!
              </div>
            )}

            {[
              {label: 'Source', key: 'source', options: ['UWorld', 'Amboss', 'StepUp', 'Other']},
              {label: 'Topic', key: 'topic', options: topics},
              {label: 'Mode', key: 'mode', options: ['Timed', 'Untimed', 'Tutor']},
            ].map(field => (
              <div key={field.key} style={{marginBottom: 12}}>
                <div style={{fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5}}>{field.label}</div>
                <select value={(form as any)[field.key]} onChange={e => setForm({...form, [field.key]: e.target.value})}
                  style={{width: '100%', height: 38, borderRadius: 7, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: 'white', outline: 'none'}}>
                  {field.options.map(o => <option key={o} value={o} style={{background: '#0d2340'}}>{o}</option>)}
                </select>
              </div>
            ))}

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12}}>
              {[{label: 'Total Qs', key: 'questions_total'}, {label: 'Correct', key: 'questions_correct'}].map(f => (
                <div key={f.key}>
                  <div style={{fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5}}>{f.label}</div>
                  <input type="number" value={(form as any)[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
                    placeholder="0"
                    style={{width: '100%', height: 38, borderRadius: 7, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: 'white', outline: 'none', boxSizing: 'border-box'}}/>
                </div>
              ))}
            </div>

            <div style={{marginBottom: 14}}>
              <div style={{fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5}}>Date</div>
              <input type="date" value={form.session_date} onChange={e => setForm({...form, session_date: e.target.value})}
                style={{width: '100%', height: 38, borderRadius: 7, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: 'white', outline: 'none', boxSizing: 'border-box'}}/>
            </div>

            {form.questions_total && form.questions_correct && (
              <div style={{background: 'rgba(201,168,76,0.15)', borderRadius: 7, padding: '10px 12px', marginBottom: 14, fontSize: 13, color: '#c9a84c'}}>
                Accuracy: {Math.round((parseInt(form.questions_correct) / parseInt(form.questions_total)) * 100)}%
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting || !form.questions_total || !form.questions_correct}
              style={{width: '100%', height: 42, background: submitting ? '#4a5568' : '#c9a84c', border: 'none', borderRadius: 8, fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, color: '#0d2340', cursor: submitting ? 'not-allowed' : 'pointer'}}>
              {submitting ? 'Logging...' : 'Log session ↗'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
