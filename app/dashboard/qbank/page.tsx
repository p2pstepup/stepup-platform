'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'

type QuestionLog = {
  id: string
  session_id: string
  question_number: number | null
  topic: string
  subject: string | null
  answer: string
  reason: string | null
  why_missed: string | null
  question_trap: string | null
  key_clues: string | null
  correct_answer: string | null
  differential_diagnosis: string | null
  notes: string | null
  created_at: string
}

const TOPICS = ['Cardiology','Psychiatry','Renal','Biochemistry','Pharmacology','Microbiology','Anatomy','Pathology','Physiology','Reproductive','Neurology','Endocrinology','Immunology','Mixed']
const REASONS = ['Knowledge','Knowledge Gap','Silly Mistake','Luck']

const defaultQForm = {
  question_number: '',
  topic: 'Cardiology',
  subject: '',
  answer: 'Correct' as 'Correct' | 'Wrong',
  reason: '',
  why_missed: '',
  question_trap: '',
  key_clues: '',
  correct_answer: '',
  differential_diagnosis: '',
  notes: '',
}

export default function QbankTracker() {
  const [user, setUser] = useState<{id: string; email?: string} | null>(null)
  const [sessions, setSessions] = useState<Array<{id: string; session_date: string; source: string; topic: string; questions_total: number; questions_correct: number; accuracy: number; mode: string}>>([])
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

  // Question log state
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [questionLogs, setQuestionLogs] = useState<QuestionLog[]>([])
  const [qLoading, setQLoading] = useState(false)
  const [qForm, setQForm] = useState(defaultQForm)
  const [qSubmitting, setQSubmitting] = useState(false)
  const [qSuccess, setQSuccess] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function init() {
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

  async function loadQuestions(sessionId: string) {
    if (!sessionId) return
    setQLoading(true)
    const { data } = await supabase
      .from('qbank_question_logs')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
    setQuestionLogs(data || [])
    setQLoading(false)
  }

  function handleSessionSelect(id: string) {
    setSelectedSessionId(id)
    setQuestionLogs([])
    setQSuccess(false)
    loadQuestions(id)
  }

  const handleSubmit = async () => {
    if (!form.questions_total || !form.questions_correct || !user) return
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
      setForm({ ...form, questions_total: '', questions_correct: '' })
      const { data } = await supabase
        .from('qbank_sessions')
        .select('*')
        .eq('student_id', user!.id)
        .order('session_date', { ascending: false })
      setSessions(data || [])
      setTimeout(() => setSuccess(false), 3000)
    }
    setSubmitting(false)
  }

  const handleQSubmit = async () => {
    if (!selectedSessionId || !qForm.topic) return
    setQSubmitting(true)
    const { error } = await supabase.from('qbank_question_logs').insert({
      session_id: selectedSessionId,
      question_number: qForm.question_number ? parseInt(qForm.question_number) : null,
      topic: qForm.topic,
      subject: qForm.subject || null,
      answer: qForm.answer,
      reason: qForm.reason || null,
      why_missed: qForm.why_missed || null,
      question_trap: qForm.question_trap || null,
      key_clues: qForm.key_clues || null,
      correct_answer: qForm.correct_answer || null,
      differential_diagnosis: qForm.differential_diagnosis || null,
      notes: qForm.notes || null,
    })
    if (!error) {
      setQSuccess(true)
      setQForm(defaultQForm)
      loadQuestions(selectedSessionId)
      setTimeout(() => setQSuccess(false), 3000)
    }
    setQSubmitting(false)
  }

  const totalQ = sessions.reduce((a, s) => a + s.questions_total, 0)
  const totalC = sessions.reduce((a, s) => a + s.questions_correct, 0)
  const avgAcc = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0

  const getAccColor = (acc: number) => {
    if (acc >= 75) return '#6b7c3a'
    if (acc >= 65) return '#c9a84c'
    if (acc >= 55) return '#c07040'
    return '#9e2a2a'
  }

  const selectedSession = sessions.find(s => s.id === selectedSessionId)

  const navGroups = [
    { section: 'Overview', items: [{ name: 'Dashboard', path: '/dashboard' }] },
    { section: 'My Program', items: [
      { name: 'Daily Course Schedule', path: '/dashboard/schedule' },
      { name: 'My Study Schedule', path: '/dashboard/studyschedule' },
      { name: 'Calendar', path: '/dashboard/calendar' },
      { name: 'Assignments', path: '/dashboard/assignments' },
      { name: 'Mentor Meetings', path: '/dashboard/mentor' },
    ]},
    { section: 'Study Tools', items: [
      { name: 'Exam Center', path: '/dashboard/exams' },
      { name: 'Qbank Tracker', path: '/dashboard/qbank', active: true },
      { name: 'NBME Score Tracker', path: '/dashboard/nbme' },
      { name: 'Weakness Map', path: '/dashboard/weakness' },
    ]},
    { section: 'Resources', items: [
      { name: 'HY Topic Notes', path: '/dashboard/notes' },
      { name: 'Session Recordings', path: '/dashboard/recordings' },
      { name: 'Session Slides', path: '/dashboard/slides' },
      { name: 'Resource Drive', path: '/dashboard/resources' },
      { name: 'Course Documents', path: '/dashboard/documents' },
      { name: 'Live Feedback', path: '/dashboard/feedback' },
    ]},
  ]

  if (loading) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee' }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#0d2340' }}>Loading...</div>
    </main>
  )

  const taStyle = (dark?: boolean): React.CSSProperties => ({
    width: '100%', borderRadius: 6, resize: 'vertical' as const,
    border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid #d8cfb8',
    background: dark ? 'rgba(255,255,255,0.08)' : 'white',
    fontFamily: 'Sora, sans-serif', fontSize: 13,
    padding: '8px 10px', color: dark ? 'white' : '#1a1208',
    outline: 'none', boxSizing: 'border-box' as const, minHeight: 52
  })

  const inStyle = (dark?: boolean): React.CSSProperties => ({
    width: '100%', height: 34, borderRadius: 6,
    border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid #d8cfb8',
    background: dark ? 'rgba(255,255,255,0.08)' : 'white',
    fontFamily: 'Sora, sans-serif', fontSize: 13,
    padding: '0 10px', color: dark ? 'white' : '#1a1208',
    outline: 'none', boxSizing: 'border-box' as const
  })

  return (
    <main style={{ minHeight: '100vh', display: 'flex', background: '#f7f4ee', fontFamily: 'Sora, sans-serif', fontSize: '17.6px' }}>

      {/* SIDEBAR */}
      <nav style={{ width: 220, flexShrink: 0, background: '#0d2340', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
        <div style={{ padding: '20px 18px 16px', borderBottom: '0.5px solid rgba(201,168,76,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: '#c9a84c', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '11px solid #0d2340' }}/>
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: 'white', fontWeight: 600 }}>StepUp</div>
          </div>
          <div style={{ fontSize: 10, color: '#c9a84c', letterSpacing: '0.09em', textTransform: 'uppercase', paddingLeft: 46, marginTop: 3 }}>P2P Mentoring Program</div>
        </div>
        <div style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
          {navGroups.map(group => (
            <div key={group.section}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.28)', padding: '0 8px', margin: '12px 0 4px' }}>{group.section}</div>
              {group.items.map((item: {name: string; path: string; active?: boolean}) => (
                <div key={item.name} onClick={() => router.push(item.path)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, color: item.active ? '#c9a84c' : 'rgba(255,255,255,0.55)', fontSize: 13.5, marginBottom: 2, background: item.active ? 'rgba(255,255,255,0.09)' : 'transparent', cursor: 'pointer' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }}/>{item.name}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 14px', borderTop: '0.5px solid rgba(201,168,76,0.14)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#c9a84c', color: '#0d2340', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email?.split('@')[0]}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Windsor SOM</div>
            </div>
            <div onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, border: '0.5px solid rgba(255,255,255,0.15)' }}>Sign out</div>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '32px 36px' }}>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5 }}>Qbank Tracker</div>
          <div style={{ fontSize: 14, color: '#8a7d6a', marginTop: 5 }}>Log UWorld · Amboss · StepUp blocks · All data feeds your Weakness Map</div>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total questions', value: totalQ.toLocaleString(), delta: `${sessions.length} sessions logged` },
            { label: 'Overall accuracy', value: totalQ > 0 ? `${avgAcc}%` : '—', delta: totalQ > 0 ? 'Keep it up!' : 'No sessions yet' },
            { label: 'Sessions logged', value: sessions.length.toString(), delta: 'Across all sources' },
            { label: 'Daily goal', value: '60 Qs', delta: 'Set by Dr. Rivera' },
          ].map((m, i) => (
            <div key={i} style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a89870', marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340' }}>{m.value}</div>
              <div style={{ fontSize: 12, color: '#a89870', marginTop: 4 }}>{m.delta}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Sessions table */}
            <div style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px 0' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0d2340' }}>Recent sessions</div>
              </div>
              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '90px 80px 1fr 60px 60px 70px 70px', padding: '10px 20px 8px', borderBottom: '0.5px solid #f0ece0', marginTop: 10 }}>
                {['Date','Source','Topic','Total','Correct','Accuracy','Mode'].map(h => (
                  <span key={h} style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a89870' }}>{h}</span>
                ))}
              </div>
              {sessions.length === 0 ? (
                <div style={{ fontSize: 14, color: '#8a7d6a', fontStyle: 'italic', padding: '16px 20px' }}>No sessions logged yet. Use the form →</div>
              ) : (
                sessions.map((s, i) => (
                  <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '90px 80px 1fr 60px 60px 70px 70px', alignItems: 'center', padding: '11px 20px', borderBottom: i < sessions.length - 1 ? '0.5px solid #f5f0e8' : 'none' }}>
                    <span style={{ fontSize: 13, color: '#3d3020' }}>{new Date(s.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, fontWeight: 500, display: 'inline-block', background: s.source === 'UWorld' ? '#eef4fb' : s.source === 'Amboss' ? '#f0f9f7' : '#162032', color: s.source === 'UWorld' ? '#1a4a7a' : s.source === 'Amboss' ? '#4a8c84' : '#c9a84c' }}>{s.source}</span>
                    <span style={{ fontSize: 13, color: '#3d3020' }}>{s.topic}</span>
                    <span style={{ fontSize: 13, color: '#3d3020', textAlign: 'center' }}>{s.questions_total}</span>
                    <span style={{ fontSize: 13, color: '#3d3020', textAlign: 'center' }}>{s.questions_correct}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: getAccColor(s.accuracy) }}>{s.accuracy}%</span>
                    <span style={{ fontSize: 13, color: '#6a5e4a' }}>{s.mode}</span>
                  </div>
                ))
              )}
            </div>

            {/* ── QUESTION LOG ── */}
            <div style={{ background: '#0d2340', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px 16px', borderBottom: '0.5px solid rgba(201,168,76,0.2)' }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: 'white' }}>Question Log</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Select a session, then log each question you want to review</div>
              </div>

              <div style={{ padding: '18px 22px' }}>
                {/* Session picker */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Session</div>
                  {sessions.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Log a session first using the form on the right</div>
                  ) : (
                    <select value={selectedSessionId} onChange={e => handleSessionSelect(e.target.value)}
                      style={{ width: '100%', height: 42, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: 'white', outline: 'none' }}>
                      <option value="" style={{ background: '#0d2340' }}>— Pick a session —</option>
                      {sessions.map(s => (
                        <option key={s.id} value={s.id} style={{ background: '#0d2340' }}>
                          {new Date(s.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {s.source} · {s.topic} · {s.questions_total}Q · {s.accuracy}%
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedSessionId && (
                  <>
                    {/* Existing question logs */}
                    {qLoading && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Loading...</div>}
                    {!qLoading && questionLogs.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>{questionLogs.length} question{questionLogs.length !== 1 ? 's' : ''} logged</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {questionLogs.map(q => (
                            <div key={q.id} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 8, padding: '12px 14px', border: '0.5px solid rgba(255,255,255,0.1)' }}>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: q.why_missed || q.key_clues || q.notes ? 8 : 0 }}>
                                {q.question_number && <span style={{ fontSize: 11, background: '#c9a84c', color: '#0d2340', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>Q{q.question_number}</span>}
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{q.topic}</span>
                                {q.subject && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>— {q.subject}</span>}
                                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600, background: q.answer === 'Correct' ? 'rgba(74,122,42,0.4)' : 'rgba(158,42,42,0.4)', color: q.answer === 'Correct' ? '#9FE1CB' : '#f5a0a0' }}>{q.answer}</span>
                                {q.reason && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(201,168,76,0.2)', color: '#c9a84c' }}>{q.reason}</span>}
                              </div>
                              {(q.why_missed || q.question_trap || q.key_clues || q.correct_answer || q.differential_diagnosis || q.notes) && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                                  {q.why_missed && <div><span style={{ color: 'rgba(255,255,255,0.35)' }}>Why missed: </span>{q.why_missed}</div>}
                                  {q.question_trap && <div><span style={{ color: 'rgba(255,255,255,0.35)' }}>Trap: </span>{q.question_trap}</div>}
                                  {q.key_clues && <div><span style={{ color: 'rgba(255,255,255,0.35)' }}>Key clues: </span>{q.key_clues}</div>}
                                  {q.correct_answer && <div><span style={{ color: 'rgba(255,255,255,0.35)' }}>Correct answer: </span>{q.correct_answer}</div>}
                                  {q.differential_diagnosis && <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'rgba(255,255,255,0.35)' }}>DDx: </span>{q.differential_diagnosis}</div>}
                                  {q.notes && <div style={{ gridColumn: '1/-1' }}><span style={{ color: 'rgba(255,255,255,0.35)' }}>Notes: </span>{q.notes}</div>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Divider */}
                    <div style={{ borderTop: '0.5px solid rgba(201,168,76,0.2)', marginBottom: 18 }}/>

                    <div style={{ fontSize: 13, fontWeight: 600, color: '#c9a84c', marginBottom: 14 }}>Log a question</div>

                    {qSuccess && (
                      <div style={{ background: 'rgba(107,124,58,0.25)', border: '0.5px solid #6b7c3a', borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 13, color: '#9FE1CB' }}>✓ Question saved!</div>
                    )}

                    {/* Q# / Topic / Subject */}
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 10, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Q #</div>
                        <input type="number" value={qForm.question_number} onChange={e => setQForm(p => ({ ...p, question_number: e.target.value }))}
                          placeholder="—" style={inStyle(true)} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Topic</div>
                        <select value={qForm.topic} onChange={e => setQForm(p => ({ ...p, topic: e.target.value }))}
                          style={{ ...inStyle(true), height: 34 }}>
                          {TOPICS.map(t => <option key={t} value={t} style={{ background: '#0d2340' }}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Subject</div>
                        <input value={qForm.subject} onChange={e => setQForm(p => ({ ...p, subject: e.target.value }))}
                          placeholder="e.g. Heart failure" style={inStyle(true)} />
                      </div>
                    </div>

                    {/* Answer / Reason */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Answer</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {(['Correct', 'Wrong'] as const).map(v => (
                            <button key={v} onClick={() => setQForm(p => ({ ...p, answer: v }))}
                              style={{ flex: 1, height: 36, border: 'none', borderRadius: 7, fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                background: qForm.answer === v ? (v === 'Correct' ? '#4a7a2a' : '#9e2a2a') : 'rgba(255,255,255,0.08)',
                                color: qForm.answer === v ? 'white' : 'rgba(255,255,255,0.45)' }}>
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Reason</div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {REASONS.map(r => (
                            <button key={r} onClick={() => setQForm(p => ({ ...p, reason: p.reason === r ? '' : r }))}
                              style={{ padding: '5px 9px', border: 'none', borderRadius: 6, fontFamily: 'Sora, sans-serif', fontSize: 11, cursor: 'pointer',
                                background: qForm.reason === r ? '#c9a84c' : 'rgba(255,255,255,0.1)',
                                color: qForm.reason === r ? '#0d2340' : 'rgba(255,255,255,0.5)', fontWeight: qForm.reason === r ? 700 : 400 }}>
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Why missed / Question Trap */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Why I missed it</div>
                        <textarea value={qForm.why_missed} onChange={e => setQForm(p => ({ ...p, why_missed: e.target.value }))} placeholder="Conceptual gap, timing..." style={taStyle(true)} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Question Trap</div>
                        <textarea value={qForm.question_trap} onChange={e => setQForm(p => ({ ...p, question_trap: e.target.value }))} placeholder="What the question was testing..." style={taStyle(true)} />
                      </div>
                    </div>

                    {/* Key Clues / Correct Answer */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Key Clues</div>
                        <textarea value={qForm.key_clues} onChange={e => setQForm(p => ({ ...p, key_clues: e.target.value }))} placeholder="Buzzwords, findings..." style={taStyle(true)} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Correct Answer</div>
                        <textarea value={qForm.correct_answer} onChange={e => setQForm(p => ({ ...p, correct_answer: e.target.value }))} placeholder="The right choice and why..." style={taStyle(true)} />
                      </div>
                    </div>

                    {/* DDx / Notes */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Differential Diagnosis</div>
                        <textarea value={qForm.differential_diagnosis} onChange={e => setQForm(p => ({ ...p, differential_diagnosis: e.target.value }))} placeholder="Other conditions to consider..." style={taStyle(true)} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Notes</div>
                        <textarea value={qForm.notes} onChange={e => setQForm(p => ({ ...p, notes: e.target.value }))} placeholder="Anything else..." style={taStyle(true)} />
                      </div>
                    </div>

                    <button onClick={handleQSubmit} disabled={qSubmitting || !qForm.topic}
                      style={{ width: '100%', height: 44, background: qSubmitting ? '#4a5568' : '#c9a84c', border: 'none', borderRadius: 8, fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700, color: '#0d2340', cursor: qSubmitting ? 'not-allowed' : 'pointer' }}>
                      {qSubmitting ? 'Saving...' : 'Save question ↗'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Accuracy by subject */}
            {sessions.length > 0 && (
              <div style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 14 }}>Accuracy by subject</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px' }}>
                  {TOPICS.filter(t => sessions.some(s => s.topic === t)).map(topic => {
                    const ts = sessions.filter(s => s.topic === topic)
                    const tT = ts.reduce((a, s) => a + s.questions_total, 0)
                    const tC = ts.reduce((a, s) => a + s.questions_correct, 0)
                    const acc = Math.round((tC / tT) * 100)
                    return (
                      <div key={topic} style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: '#3d3020', width: 100, flexShrink: 0 }}>{topic}</span>
                        <div style={{ flex: 1, height: 6, background: '#ede8d8', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 3, background: getAccColor(acc), width: `${acc}%` }}/>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, width: 36, textAlign: 'right', flexShrink: 0, paddingLeft: 8, color: getAccColor(acc) }}>{acc}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: log session form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0d2340', marginBottom: 16 }}>Log a new session</div>

              {success && (
                <div style={{ background: '#f0f7f2', border: '0.5px solid #6b7c3a', borderRadius: 6, padding: '10px 12px', marginBottom: 14, fontSize: 13, color: '#2d6a4f' }}>
                  ✓ Session logged!
                </div>
              )}

              {[
                { label: 'Source', key: 'source', options: ['UWorld', 'Amboss', 'StepUp', 'Other'] },
                { label: 'Topic', key: 'topic', options: TOPICS },
                { label: 'Mode', key: 'mode', options: ['Timed', 'Untimed', 'Tutor'] },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#8a7d6a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{field.label}</div>
                  <select value={(form as Record<string, string>)[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                    style={{ width: '100%', height: 38, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: '#1a1208', outline: 'none' }}>
                    {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                {[{ label: 'Total Qs', key: 'questions_total' }, { label: 'Correct', key: 'questions_correct' }].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize: 11, color: '#8a7d6a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{f.label}</div>
                    <input type="number" value={(form as Record<string, string>)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder="0"
                      style={{ width: '100%', height: 38, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: '#1a1208', outline: 'none', boxSizing: 'border-box' }}/>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#8a7d6a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Date</div>
                <input type="date" value={form.session_date} onChange={e => setForm({ ...form, session_date: e.target.value })}
                  style={{ width: '100%', height: 38, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: '#1a1208', outline: 'none', boxSizing: 'border-box' }}/>
              </div>

              {form.questions_total && form.questions_correct && (
                <div style={{ background: '#f7f4ee', borderRadius: 7, padding: '10px 12px', marginBottom: 14, fontSize: 13, color: '#c9a84c', fontWeight: 600 }}>
                  Accuracy: {Math.round((parseInt(form.questions_correct) / parseInt(form.questions_total)) * 100)}%
                </div>
              )}

              <button onClick={handleSubmit} disabled={submitting || !form.questions_total || !form.questions_correct}
                style={{ width: '100%', height: 42, background: submitting ? '#4a5568' : '#0d2340', border: 'none', borderRadius: 8, fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, color: '#c9a84c', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Logging...' : 'Log session ↗'}
              </button>
            </div>

            {selectedSession && (
              <div style={{ background: '#f7f4ee', border: '1px solid #c9a84c', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a89870', marginBottom: 4 }}>Logging questions for</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0d2340' }}>{selectedSession.source} · {selectedSession.topic}</div>
                <div style={{ fontSize: 12, color: '#8a7d6a', marginTop: 2 }}>{new Date(selectedSession.session_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} · {selectedSession.questions_total}Q · {selectedSession.accuracy}%</div>
                <div style={{ fontSize: 12, color: '#6b7c3a', marginTop: 6, fontWeight: 500 }}>{questionLogs.length} question{questionLogs.length !== 1 ? 's' : ''} logged</div>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}
