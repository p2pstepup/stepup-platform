'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'

export default function ExamCenter() {
  const [user, setUser] = useState<any>(null)
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<any>(null)
  const [activeSheet, setActiveSheet] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [pastSessions, setPastSessions] = useState<any[]>([])
  const timerRef = useRef<any>(null)
  const router = useRouter()
  const supabase = createClient()
  const QUESTIONS_PER_PAGE = 20

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const [{ data: examData }, { data: sessionData }] = await Promise.all([
        supabase.from('exams').select('*').order('sort_order'),
        supabase.from('exam_sessions').select('*, answer_sheets(*)').eq('student_id', user.id).order('created_at', {ascending: false})
      ])
      setExams(examData || [])
      setPastSessions(sessionData || [])

      // Resume any in-progress session
      const inProgress = sessionData?.find((s: any) => s.status === 'in_progress')
      if (inProgress) {
        const sheet = inProgress.answer_sheets?.[0]
        if (sheet) {
          const startedAt = new Date(inProgress.started_at)
          const now = new Date()
          const elapsedSeconds = Math.round((now.getTime() - startedAt.getTime()) / 1000)
          const totalSeconds = (inProgress.time_limit_minutes || 240) * 60
          const remaining = Math.max(0, totalSeconds - elapsedSeconds)
          setActiveSession(inProgress)
          setActiveSheet(sheet)
          setAnswers(sheet.answers || {})
          setTimeLeft(remaining)
          setCurrentPage(1)
        }
      }

      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (activeSession && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [activeSession])

  const startExam = async (exam: any) => {
    const timeLimitMinutes = parseTimeLimit(exam.time_limit)
    const { data: session } = await supabase.from('exam_sessions').insert({
      student_id: user.id,
      exam_id: exam.id,
      exam_name: exam.name,
      started_at: new Date().toISOString(),
      time_limit_minutes: timeLimitMinutes,
      status: 'in_progress'
    }).select().single()

    const { data: sheet } = await supabase.from('answer_sheets').insert({
      exam_session_id: session.id,
      student_id: user.id,
      exam_name: exam.name,
      total_questions: exam.questions,
      answers: {}
    }).select().single()

    setActiveSession(session)
    setActiveSheet(sheet)
    setTimeLeft(timeLimitMinutes * 60)
    setAnswers({})
    setCurrentPage(1)
    setSubmitted(false)

    if (exam.link) window.open(exam.link, '_blank')
  }

  const parseTimeLimit = (timeStr: string) => {
    if (!timeStr) return 240
    const match = timeStr.match(/(\d+\.?\d*)\s*hr/)
    if (match) return Math.round(parseFloat(match[1]) * 60)
    return 240
  }

  const saveAnswer = async (qNum: number, answer: string) => {
    const newAnswers = {...answers, [qNum]: answer}
    setAnswers(newAnswers)
    await supabase.from('answer_sheets').update({answers: newAnswers}).eq('id', activeSheet.id)
  }

  const submitExam = async () => {
    setSubmitting(true)
    clearInterval(timerRef.current)
    const submittedAt = new Date()
    const startedAt = new Date(activeSession.started_at)
    const actualMinutes = Math.round((submittedAt.getTime() - startedAt.getTime()) / 60000)
    const withinLimit = activeSession.time_limit_minutes ? actualMinutes <= activeSession.time_limit_minutes : true
    const answeredCount = Object.keys(answers).length

    await supabase.from('exam_sessions').update({
      submitted_at: submittedAt.toISOString(),
      actual_minutes: actualMinutes,
      within_limit: withinLimit,
      status: 'submitted'
    }).eq('id', activeSession.id)

    await supabase.from('answer_sheets').update({answers}).eq('id', activeSheet.id)

    const { data: sessionData } = await supabase
      .from('exam_sessions')
      .select('*, answer_sheets(*)')
      .eq('student_id', user.id)
      .order('created_at', {ascending: false})
    setPastSessions(sessionData || [])

    setSubmitted(true)
    setSubmitting(false)
    setActiveSession({...activeSession, actual_minutes: actualMinutes, within_limit: withinLimit, submitted_at: submittedAt.toISOString()})
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
    return `${m}:${s.toString().padStart(2,'0')}`
  }

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
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

  const totalQuestions = activeSession ? (exams.find(e => e.id === activeSession.exam_id)?.questions || 200) : 200
  const totalPages = Math.ceil(totalQuestions / QUESTIONS_PER_PAGE)
  const answeredCount = Object.keys(answers).length
  const timeWarning = timeLeft > 0 && timeLeft < 1800
  const timeUp = timeLeft === 0 && activeSession && !submitted

  if (loading) return (
    <main style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee'}}>
      <div style={{fontFamily: 'Georgia, serif', fontSize: 24, color: '#0d2340'}}>Loading...</div>
    </main>
  )

  // ACTIVE EXAM VIEW
  if (activeSession && !submitted) {
    const pageStart = (currentPage - 1) * QUESTIONS_PER_PAGE + 1
    const pageEnd = Math.min(currentPage * QUESTIONS_PER_PAGE, totalQuestions)

    return (
      <main style={{minHeight: '100vh', background: '#f7f4ee', fontFamily: 'Sora, sans-serif', fontSize: '17.6px'}}>

        {/* Timer bar */}
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, background: timeWarning ? '#9e2a2a' : '#0d2340', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 18, color: 'white', fontWeight: 600}}>{activeSession.exam_name}</div>
            <div style={{fontSize: 13, color: 'rgba(255,255,255,0.5)'}}>Answer Sheet</div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em'}}>Answered</div>
              <div style={{fontSize: 18, color: '#c9a84c', fontWeight: 700}}>{answeredCount}/{totalQuestions}</div>
            </div>
            {timeLeft > 0 && (
              <div style={{textAlign: 'center'}}>
                <div style={{fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em'}}>Time remaining</div>
                <div style={{fontSize: 24, color: timeWarning ? '#ffaaaa' : '#c9a84c', fontWeight: 700, fontFamily: 'Georgia, serif'}}>{formatTime(timeLeft)}</div>
              </div>
            )}
            <button onClick={submitExam} disabled={submitting}
              style={{padding: '8px 20px', background: '#c9a84c', border: 'none', borderRadius: 8, color: '#0d2340', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700, cursor: 'pointer'}}>
              {submitting ? 'Submitting...' : 'Submit exam →'}
            </button>
          </div>
        </div>

        {/* Time up warning */}
        {timeUp && (
          <div style={{position: 'fixed', top: 60, left: 0, right: 0, zIndex: 999, background: '#9e2a2a', padding: '12px 24px', textAlign: 'center'}}>
            <div style={{fontSize: 16, color: 'white', fontWeight: 600}}>⏰ Time is up! Please submit your exam now and stop answering questions.</div>
          </div>
        )}

        <div style={{paddingTop: 80, padding: '80px 24px 24px'}}>

          {/* Progress bar */}
          <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 10, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14}}>
            <div style={{flex: 1, height: 6, background: '#f0ece0', borderRadius: 3, overflow: 'hidden'}}>
              <div style={{height: '100%', background: '#6b7c3a', borderRadius: 3, width: `${(answeredCount/totalQuestions)*100}%`, transition: 'width 0.3s'}}/>
            </div>
            <div style={{fontSize: 13, color: '#8a7d6a', flexShrink: 0}}>{Math.round((answeredCount/totalQuestions)*100)}% complete</div>
          </div>

          {/* Page navigation */}
          <div style={{display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap'}}>
            {Array.from({length: totalPages}).map((_, i) => {
              const pageNum = i + 1
              const pStart = (pageNum-1)*QUESTIONS_PER_PAGE+1
              const pEnd = Math.min(pageNum*QUESTIONS_PER_PAGE, totalQuestions)
              const pageAnswered = Array.from({length: pEnd-pStart+1}).filter((_, j) => answers[pStart+j]).length
              const pageComplete = pageAnswered === (pEnd-pStart+1)
              return (
                <button key={pageNum} onClick={() => setCurrentPage(pageNum)}
                  style={{padding: '6px 12px', borderRadius: 6, border: currentPage === pageNum ? 'none' : '1px solid #e8dfc8', background: currentPage === pageNum ? '#0d2340' : pageComplete ? '#f0f7f2' : 'white', color: currentPage === pageNum ? '#c9a84c' : pageComplete ? '#2d6a4f' : '#8a7d6a', fontFamily: 'Sora, sans-serif', fontSize: 12, cursor: 'pointer'}}>
                  Q{pStart}–{pEnd} {pageComplete ? '✓' : ''}
                </button>
              )
            })}
          </div>

          {/* Answer grid */}
          <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden', marginBottom: 16}}>
            <div style={{background: '#0d2340', padding: '12px 20px'}}>
              <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>Questions {pageStart}–{pageEnd}</div>
            </div>
            <div style={{padding: '16px 20px'}}>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 32px'}}>
                {Array.from({length: pageEnd - pageStart + 1}).map((_, idx) => {
                  const qNum = pageStart + idx
                  return (
                    <div key={qNum} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '0.5px solid #f5f0e8'}}>
                      <div style={{width: 32, fontSize: 13, fontWeight: 600, color: '#0d2340', flexShrink: 0, textAlign: 'right'}}>{qNum}.</div>
                      <div style={{display: 'flex', gap: 6}}>
                        {['A','B','C','D','E'].map(opt => (
                          <button key={opt} onClick={() => saveAnswer(qNum, opt)}
                            style={{width: 32, height: 32, borderRadius: '50%', border: answers[qNum] === opt ? 'none' : '1.5px solid #e8dfc8', background: answers[qNum] === opt ? '#0d2340' : 'white', color: answers[qNum] === opt ? '#c9a84c' : '#8a7d6a', fontFamily: 'Sora, sans-serif', fontSize: 12, fontWeight: 700, cursor: 'pointer'}}>
                            {opt}
                          </button>
                        ))}
                      </div>
                      {answers[qNum] && <div style={{fontSize: 11, color: '#6b7c3a', flexShrink: 0}}>✓</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Page controls */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <button onClick={() => setCurrentPage(Math.max(1, currentPage-1))} disabled={currentPage === 1}
              style={{padding: '10px 20px', background: currentPage === 1 ? '#f7f4ee' : '#0d2340', border: 'none', borderRadius: 8, color: currentPage === 1 ? '#a89870' : '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, cursor: currentPage === 1 ? 'not-allowed' : 'pointer'}}>
              ← Previous
            </button>
            <div style={{fontSize: 13, color: '#8a7d6a'}}>Page {currentPage} of {totalPages}</div>
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage+1))} disabled={currentPage === totalPages}
              style={{padding: '10px 20px', background: currentPage === totalPages ? '#f7f4ee' : '#0d2340', border: 'none', borderRadius: 8, color: currentPage === totalPages ? '#a89870' : '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'}}>
              Next →
            </button>
          </div>
        </div>
      </main>
    )
  }

  // SUBMITTED VIEW
  if (submitted && activeSession) {
    const actualMin = activeSession.actual_minutes || 0
    return (
      <main style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee', fontFamily: 'Sora, sans-serif', fontSize: '17.6px'}}>
        <div style={{maxWidth: 560, width: '100%', padding: '0 24px'}}>
          <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 16, overflow: 'hidden'}}>
            <div style={{background: '#0d2340', padding: '24px', textAlign: 'center'}}>
              <div style={{fontSize: 40, marginBottom: 8}}>🎉</div>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 24, color: 'white', marginBottom: 4}}>Exam submitted!</div>
              <div style={{fontSize: 14, color: 'rgba(255,255,255,0.5)'}}>{activeSession.exam_name}</div>
            </div>
            <div style={{padding: '24px'}}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 24}}>
                {[
                  {label: 'Questions answered', value: `${answeredCount}/${totalQuestions}`},
                  {label: 'Time spent', value: formatDuration(actualMin)},
                  {label: 'Within time limit', value: activeSession.within_limit ? '✅ Yes' : '⚠️ Over'},
                ].map((s, i) => (
                  <div key={i} style={{background: '#f7f4ee', borderRadius: 10, padding: '12px', textAlign: 'center'}}>
                    <div style={{fontSize: 11, color: '#8a7d6a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6}}>{s.label}</div>
                    <div style={{fontFamily: 'Georgia, serif', fontSize: 20, color: '#0d2340'}}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{background: '#f7f4ee', borderRadius: 10, padding: '14px 16px', marginBottom: 20}}>
                <div style={{fontSize: 14, color: '#0d2340', fontWeight: 500, marginBottom: 6}}>Next steps</div>
                <div style={{fontSize: 13, color: '#8a7d6a', lineHeight: 1.7}}>
                  1. Your answer sheet has been saved automatically<br/>
                  2. Log your official score in NBME Scores once you receive it<br/>
                  3. Review every wrong answer before your next session<br/>
                  4. Discuss weak areas with your mentor at your next 1-on-1
                </div>
              </div>
              <div style={{display: 'flex', gap: 10}}>
                <button onClick={() => { setActiveSession(null); setActiveSheet(null); setSubmitted(false) }}
                  style={{flex: 1, height: 46, background: '#f7f4ee', border: '1px solid #e8dfc8', borderRadius: 10, color: '#0d2340', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer'}}>
                  Back to exams
                </button>
                <button onClick={() => router.push('/dashboard/nbme')}
                  style={{flex: 1, height: 46, background: '#0d2340', border: 'none', borderRadius: 10, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer'}}>
                  Log my score →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // MAIN EXAM CENTER VIEW
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
          <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Start a timed exam · Fill your answer sheet · Track your time · Log your score</div>
        </div>

        {/* How it works */}
        <div style={{background: '#0d2340', borderRadius: 12, padding: '16px 22px', marginBottom: 24, borderLeft: '4px solid #c9a84c'}}>
          <div style={{fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 10}}>How it works</div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16}}>
            {[
              {num: '1', text: 'Click Start — your timer begins and the external exam opens'},
              {num: '2', text: 'Fill in your answers A–E on the answer sheet as you go'},
              {num: '3', text: 'Submit when done — your time and answers are saved automatically'},
              {num: '4', text: 'Log your official score in NBME Scores after receiving it'},
            ].map(s => (
              <div key={s.num} style={{display: 'flex', gap: 10}}>
                <div style={{width: 24, height: 24, borderRadius: '50%', background: 'rgba(201,168,76,0.2)', color: '#c9a84c', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{s.num}</div>
                <div style={{fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5}}>{s.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Exam list */}
        <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden', marginBottom: 24}}>
          <div style={{background: '#0d2340', padding: '14px 20px'}}>
            <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>Available exams</div>
          </div>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr>
                {['Exam', 'Questions', 'Time limit', 'Difficulty', 'Deadline', 'Action'].map(h => (
                  <th key={h} style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a89870', padding: '12px 16px', textAlign: 'left', borderBottom: '0.5px solid #f0ece0'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exams.map((exam, i) => {
                const attempted = pastSessions.filter(s => s.exam_name === exam.name)
                return (
                  <tr key={exam.id} style={{borderBottom: i < exams.length-1 ? '0.5px solid #f5f0e8' : 'none', opacity: exam.available ? 1 : 0.5}}>
                    <td style={{padding: '14px 16px'}}>
                      <div style={{fontSize: 14, fontWeight: 600, color: '#0d2340'}}>{exam.name}</div>
                      {attempted.length > 0 && <div style={{fontSize: 11, color: '#6b7c3a', marginTop: 2}}>Attempted {attempted.length}x</div>}
                    </td>
                    <td style={{fontSize: 13, color: '#3d3020', padding: '14px 16px'}}>{exam.questions}Q</td>
                    <td style={{fontSize: 13, color: '#3d3020', padding: '14px 16px'}}>{exam.time_limit}</td>
                    <td style={{padding: '14px 16px'}}>
                      <span style={{fontSize: 12, padding: '3px 10px', borderRadius: 10, background: `${diffColor(exam.difficulty)}18`, color: diffColor(exam.difficulty), fontWeight: 500}}>{exam.difficulty}</span>
                    </td>
                    <td style={{fontSize: 13, color: exam.deadline ? '#c0574a' : '#a89870', padding: '14px 16px', fontWeight: exam.deadline ? 500 : 400}}>
                      {exam.deadline ? new Date(exam.deadline).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : '—'}
                    </td>
                    <td style={{padding: '14px 16px'}}>
                      {exam.available ? (
                        <button onClick={() => startExam(exam)}
                          style={{padding: '8px 16px', background: '#0d2340', border: 'none', borderRadius: 8, fontSize: 13, color: '#c9a84c', fontWeight: 600, cursor: 'pointer'}}>
                          Start exam →
                        </button>
                      ) : (
                        <span style={{fontSize: 12, color: '#a89870', fontStyle: 'italic'}}>Not available</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Past sessions */}
        {pastSessions.length > 0 && (
          <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
            <div style={{background: '#0d2340', padding: '14px 20px'}}>
              <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>My exam history</div>
            </div>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr>
                  {['Exam', 'Date', 'Time spent', 'Questions answered', 'Within limit', 'Status'].map(h => (
                    <th key={h} style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a89870', padding: '12px 16px', textAlign: 'left', borderBottom: '0.5px solid #f0ece0'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pastSessions.map((session, i) => {
                  const sheet = session.answer_sheets?.[0]
                  const answered = sheet ? Object.keys(sheet.answers || {}).length : 0
                  return (
                    <tr key={session.id} style={{borderBottom: i < pastSessions.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
                      <td style={{fontSize: 14, fontWeight: 500, color: '#0d2340', padding: '12px 16px'}}>{session.exam_name}</td>
                      <td style={{fontSize: 13, color: '#3d3020', padding: '12px 16px'}}>{new Date(session.started_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</td>
                      <td style={{fontSize: 13, color: '#3d3020', padding: '12px 16px'}}>{session.actual_minutes ? formatDuration(session.actual_minutes) : '—'}</td>
                      <td style={{fontSize: 13, color: '#3d3020', padding: '12px 16px'}}>{answered}/{session.time_limit_minutes ? Math.round(session.time_limit_minutes / 1.2) : 200}</td>
                      <td style={{padding: '12px 16px'}}>
                        {session.within_limit === null ? <span style={{fontSize: 12, color: '#a89870'}}>—</span>
                          : session.within_limit
                          ? <span style={{fontSize: 12, color: '#6b7c3a', fontWeight: 500}}>✅ Yes</span>
                          : <span style={{fontSize: 12, color: '#c0574a', fontWeight: 500}}>⚠️ Over limit</span>}
                      </td>
                      <td style={{padding: '12px 16px'}}>
                        <span style={{fontSize: 11, padding: '3px 10px', borderRadius: 10, background: session.status === 'submitted' ? '#f0f7f2' : '#fff8e8', color: session.status === 'submitted' ? '#2d6a4f' : '#c07040', fontWeight: 500}}>
                          {session.status === 'submitted' ? 'Submitted' : 'In progress'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}