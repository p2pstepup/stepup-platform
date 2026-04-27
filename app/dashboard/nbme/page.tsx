'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'

type NBMEQuestionLog = {
  id: string
  exam_id: string
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

export default function NBMETracker() {
  const [user, setUser] = useState<{id: string; email?: string} | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [scores, setScores] = useState<Array<{id: string; exam_name: string; score: number; percent_correct: number | null; time_taken: string | null; exam_date: string; notes: string | null}>>([])
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

  // Question log state
  const [selectedExamId, setSelectedExamId] = useState('')
  const [questionLogs, setQuestionLogs] = useState<NBMEQuestionLog[]>([])
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
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)
      const { data } = await supabase
        .from('nbme_scores')
        .select('*')
        .eq('student_id', user.id)
        .order('exam_date', { ascending: false })
      setScores(data || [])
      setLoading(false)
    }
    init()
  }, [])

  async function loadQuestions(examId: string) {
    if (!examId) return
    setQLoading(true)
    const { data } = await supabase
      .from('nbme_question_logs')
      .select('*')
      .eq('exam_id', examId)
      .order('created_at', { ascending: true })
    setQuestionLogs(data || [])
    setQLoading(false)
  }

  function handleExamSelect(id: string) {
    setSelectedExamId(id)
    setQuestionLogs([])
    setQSuccess(false)
    loadQuestions(id)
  }

  const handleSubmit = async () => {
    if (!form.score || !user) return
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
      setForm({ ...form, score: '', percent_correct: '', time_taken: '', notes: '' })
      const { data } = await supabase
        .from('nbme_scores')
        .select('*')
        .eq('student_id', user!.id)
        .order('exam_date', { ascending: false })
      setScores(data || [])
      setTimeout(() => setSuccess(false), 3000)
    }
    setSubmitting(false)
  }

  const handleQSubmit = async () => {
    if (!selectedExamId || !qForm.topic) return
    setQSubmitting(true)
    const { error } = await supabase.from('nbme_question_logs').insert({
      exam_id: selectedExamId,
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
      loadQuestions(selectedExamId)
      setTimeout(() => setQSuccess(false), 3000)
    }
    setQSubmitting(false)
  }

  const latestScore = scores.length > 0 ? scores[0].score : null
  const firstScore = scores.length > 0 ? scores[scores.length - 1].score : null
  const gain = latestScore && firstScore ? latestScore - firstScore : null
  const predicted = latestScore ? Math.round(latestScore + 8) : null

  const selectedExam = scores.find(s => s.id === selectedExamId)

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
      { name: 'Qbank Tracker', path: '/dashboard/qbank' },
      { name: 'NBME Score Tracker', path: '/dashboard/nbme', active: true },
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

  const chronoScores = [...scores].reverse()

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
              <div style={{ fontSize: 13, color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.full_name || user?.email?.split('@')[0]}</div>
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
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5 }}>NBME Score Tracker</div>
          <div style={{ fontSize: 14, color: '#8a7d6a', marginTop: 5 }}>Log every practice exam · Track your trajectory · Predict your Step 1 score</div>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Latest NBME', value: latestScore ? latestScore.toString() : '—', delta: latestScore ? 'Most recent score' : 'No exams logged yet', color: '#2d6a4f' },
            { label: 'Starting score', value: firstScore ? firstScore.toString() : '—', delta: firstScore ? 'Week 1 baseline' : 'Log your first exam', color: '#a89870' },
            { label: 'Total gain', value: gain ? `+${gain} pts` : '—', delta: gain ? 'Since baseline' : 'Keep logging!', color: gain ? '#2d6a4f' : '#a89870' },
            { label: 'Predicted Step 1', value: predicted ? predicted.toString() : '—', delta: predicted ? 'Based on latest NBME' : 'Log an exam to predict', color: '#c9a84c' },
            { label: 'Target score', value: '240+', delta: 'Program goal', color: '#a89870' },
          ].map((m, i) => (
            <div key={i} style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a89870', marginBottom: 8 }}>{m.label}</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340' }}>{m.value}</div>
              <div style={{ fontSize: 12, color: m.color, marginTop: 4 }}>{m.delta}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Score chart */}
            <div style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 16 }}>Score progression</div>
              {scores.length === 0 ? (
                <div style={{ fontSize: 14, color: '#8a7d6a', fontStyle: 'italic', padding: '12px 0' }}>No exams logged yet.</div>
              ) : (
                <div style={{ position: 'relative', height: 180 }}>
                  <svg width="100%" height="180" viewBox="0 0 600 180" preserveAspectRatio="none">
                    <line x1="0" y1="30" x2="600" y2="30" stroke="#f0ece0" strokeWidth="1"/>
                    <line x1="0" y1="75" x2="600" y2="75" stroke="#f0ece0" strokeWidth="1"/>
                    <line x1="0" y1="120" x2="600" y2="120" stroke="#f0ece0" strokeWidth="1"/>
                    <line x1="0" y1="165" x2="600" y2="165" stroke="#f0ece0" strokeWidth="1"/>
                    <text x="2" y="28" fontSize="10" fill="#c9b890">260</text>
                    <text x="2" y="73" fontSize="10" fill="#c9b890">240</text>
                    <text x="2" y="118" fontSize="10" fill="#c9b890">220</text>
                    <text x="2" y="163" fontSize="10" fill="#c9b890">200</text>
                    <line x1="0" y1="75" x2="600" y2="75" stroke="#c9a84c" strokeWidth="1" strokeDasharray="4,3" opacity="0.5"/>
                    {chronoScores.length > 1 && (
                      <polyline
                        points={chronoScores.map((s, i) => {
                          const x = 40 + (i / (chronoScores.length - 1)) * 520
                          const y = 165 - ((s.score - 200) / 60) * 135
                          return `${x},${Math.max(10, Math.min(165, y))}`
                        }).join(' ')}
                        fill="none" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      />
                    )}
                    {chronoScores.map((s, i) => {
                      const x = chronoScores.length === 1 ? 300 : 40 + (i / (chronoScores.length - 1)) * 520
                      const y = 165 - ((s.score - 200) / 60) * 135
                      return (
                        <g key={s.id}>
                          <circle cx={x} cy={Math.max(10, Math.min(165, y))} r="5" fill={i === chronoScores.length - 1 ? '#0d2340' : 'white'} stroke="#c9a84c" strokeWidth="2"/>
                          <text x={x} y={Math.max(10, Math.min(165, y)) - 10} fontSize="11" fill="#0d2340" textAnchor="middle" fontWeight="600">{s.score}</text>
                        </g>
                      )
                    })}
                  </svg>
                </div>
              )}
            </div>

            {/* Exam history table */}
            <div style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px 0' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0d2340' }}>Exam history</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 90px 70px 80px 80px 70px 1fr', padding: '10px 20px 8px', borderBottom: '0.5px solid #f0ece0', marginTop: 10 }}>
                {['Exam','Date','Score','% Correct','Change','Time','Notes'].map(h => (
                  <span key={h} style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a89870' }}>{h}</span>
                ))}
              </div>
              {scores.length === 0 ? (
                <div style={{ fontSize: 14, color: '#8a7d6a', fontStyle: 'italic', padding: '16px 20px' }}>No exams logged yet.</div>
              ) : (
                scores.map((s, i) => {
                  const prev = scores[i + 1]
                  const change = prev ? s.score - prev.score : null
                  return (
                    <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '140px 90px 70px 80px 80px 70px 1fr', alignItems: 'center', padding: '11px 20px', borderBottom: i < scores.length - 1 ? '0.5px solid #f5f0e8' : 'none' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#0d2340' }}>{s.exam_name}</span>
                      <span style={{ fontSize: 13, color: '#3d3020' }}>{new Date(s.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: s.score >= 240 ? '#2d6a4f' : s.score >= 220 ? '#c9a84c' : '#c07040' }}>{s.score}</span>
                      <span style={{ fontSize: 13, color: '#3d3020' }}>{s.percent_correct ? `${s.percent_correct}%` : '—'}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: change === null ? '#a89870' : change >= 0 ? '#2d6a4f' : '#9e2a2a' }}>
                        {change === null ? 'Baseline' : change >= 0 ? `↑ +${change}` : `↓ ${change}`}
                      </span>
                      <span style={{ fontSize: 13, color: '#6a5e4a' }}>{s.time_taken || '—'}</span>
                      <span style={{ fontSize: 12, color: '#8a7d6a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.notes || '—'}</span>
                    </div>
                  )
                })
              )}
            </div>

            {/* ── QUESTION LOG ── */}
            <div style={{ background: '#0d2340', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px 16px', borderBottom: '0.5px solid rgba(201,168,76,0.2)' }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: 'white' }}>Question Log</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Select an exam, then log individual questions you want to review</div>
              </div>

              <div style={{ padding: '18px 22px' }}>
                {/* Exam picker */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Exam</div>
                  {scores.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Log an exam first using the form on the right</div>
                  ) : (
                    <select value={selectedExamId} onChange={e => handleExamSelect(e.target.value)}
                      style={{ width: '100%', height: 42, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: 'white', outline: 'none' }}>
                      <option value="" style={{ background: '#0d2340' }}>— Pick an exam —</option>
                      {scores.map(s => (
                        <option key={s.id} value={s.id} style={{ background: '#0d2340' }}>
                          {s.exam_name} · {new Date(s.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {s.score}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedExamId && (
                  <>
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

                    {/* Why missed / Trap */}
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
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Log exam form */}
            <div style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0d2340', marginBottom: 16 }}>Log a new exam</div>

              {success && (
                <div style={{ background: '#f0f7f2', border: '0.5px solid #6b7c3a', borderRadius: 6, padding: '10px 12px', marginBottom: 14, fontSize: 13, color: '#2d6a4f' }}>
                  ✓ Exam logged!
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#8a7d6a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Exam name</div>
                <select value={form.exam_name} onChange={e => setForm({ ...form, exam_name: e.target.value })}
                  style={{ width: '100%', height: 38, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: '#1a1208', outline: 'none' }}>
                  {['NBME 25','NBME 26','NBME 27','NBME 28','NBME 29','NBME 30','NBME 31','Free 120','UWSA 1','UWSA 2','Other'].map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                {[{ label: 'Score', key: 'score', placeholder: 'e.g. 220' }, { label: '% Correct', key: 'percent_correct', placeholder: 'e.g. 73' }].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize: 11, color: '#8a7d6a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{f.label}</div>
                    <input type="number" value={(form as Record<string, string>)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      style={{ width: '100%', height: 38, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: '#1a1208', outline: 'none', boxSizing: 'border-box' }}/>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#8a7d6a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Date</div>
                  <input type="date" value={form.exam_date} onChange={e => setForm({ ...form, exam_date: e.target.value })}
                    style={{ width: '100%', height: 38, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: '#1a1208', outline: 'none', boxSizing: 'border-box' }}/>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#8a7d6a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Time taken</div>
                  <input type="text" value={form.time_taken} onChange={e => setForm({ ...form, time_taken: e.target.value })}
                    placeholder="e.g. 3h 45m"
                    style={{ width: '100%', height: 38, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: '#1a1208', outline: 'none', boxSizing: 'border-box' }}/>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#8a7d6a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Notes</div>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any notes about this exam..." rows={2}
                  style={{ width: '100%', borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '8px 10px', color: '#1a1208', outline: 'none', boxSizing: 'border-box', resize: 'none' }}/>
              </div>

              <button onClick={handleSubmit} disabled={submitting || !form.score}
                style={{ width: '100%', height: 42, background: submitting ? '#4a5568' : '#0d2340', border: 'none', borderRadius: 8, fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, color: '#c9a84c', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Logging...' : 'Log exam ↗'}
              </button>
            </div>

            {/* NBME Score Converter */}
            <div style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0d2340', marginBottom: 4 }}>NBME Score Converter</div>
              <div style={{ fontSize: 12, color: '#8a7d6a', marginBottom: 14, lineHeight: 1.5 }}>
                Convert your raw NBME score to a 3-digit Step 1 equivalent.
              </div>
              <a href="https://www.muhammadkhabbaz.com/nbme-offline-score-converter/" target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', width: '100%', height: 42, background: '#0d2340', borderRadius: 8, fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, color: '#c9a84c', cursor: 'pointer', textDecoration: 'none', lineHeight: '42px', textAlign: 'center', boxSizing: 'border-box' }}>
                Open Score Converter ↗
              </a>
            </div>

            {/* Predicted score */}
            <div style={{ background: '#0d2340', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 8 }}>Predicted Step 1</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 42, color: 'white', letterSpacing: -1, lineHeight: 1 }}>{predicted || '—'}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                {predicted ? 'Based on your latest NBME score' : 'Log your first NBME to see prediction'}
              </div>
              {predicted && (
                <div style={{ fontSize: 13, color: predicted >= 240 ? '#6b7c3a' : '#c9a84c', marginTop: 8 }}>
                  {predicted >= 240 ? 'At or above target!' : `${240 - predicted} pts to target of 240`}
                </div>
              )}
            </div>

            {selectedExam && (
              <div style={{ background: '#f7f4ee', border: '1px solid #c9a84c', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a89870', marginBottom: 4 }}>Logging questions for</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0d2340' }}>{selectedExam.exam_name} · {selectedExam.score}</div>
                <div style={{ fontSize: 12, color: '#8a7d6a', marginTop: 2 }}>{new Date(selectedExam.exam_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</div>
                <div style={{ fontSize: 12, color: '#6b7c3a', marginTop: 6, fontWeight: 500 }}>{questionLogs.length} question{questionLogs.length !== 1 ? 's' : ''} logged</div>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}
