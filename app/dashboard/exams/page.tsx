'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'

// ─── Score conversion formulas ────────────────────────────────────────────────
const SCORE_FORMULAS: Record<string, {base: number, multiplier: number, totalQ: number}> = {
  'NBME 25': {base: 277.04, multiplier: 1.113,  totalQ: 200},
  'NBME 26': {base: 277.22, multiplier: 1.138,  totalQ: 200},
  'NBME 27': {base: 275.17, multiplier: 1.1125, totalQ: 200},
  'NBME 28': {base: 274.14, multiplier: 1.0456, totalQ: 200},
  'NBME 29': {base: 272.18, multiplier: 1.09,   totalQ: 200},
  'NBME 30': {base: 278.60, multiplier: 1.150,  totalQ: 200},
  'NBME 31': {base: 270.48, multiplier: 1.08,   totalQ: 200},
  'UWSA 1':  {base: 294.38, multiplier: 1.109,  totalQ: 160},
  'UWSA 2':  {base: 296.94, multiplier: 1.097,  totalQ: 160},
}

const calcStep1Score = (examName: string, wrongCount: number): number | null => {
  const formula = Object.entries(SCORE_FORMULAS).find(([key]) =>
    examName.toLowerCase().includes(key.toLowerCase())
  )
  if (!formula) return null
  return Math.round(formula[1].base - formula[1].multiplier * wrongCount)
}

const TOPICS = ['Cardiology','Psychiatry','Renal','Biochemistry','Pharmacology',
  'Microbiology','Anatomy','Pathology','Physiology','Reproductive',
  'Neurology','Endocrinology','Immunology','Mixed']

export default function ExamCenter() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<any>(null)
  const [activeSheet, setActiveSheet] = useState<any>(null)
  const [activeExam, setActiveExam] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [currentQ, setCurrentQ] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [pastSessions, setPastSessions] = useState<any[]>([])
  const [view, setView] = useState<'list'|'exam'|'results'>('list')
  const timerRef = useRef<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)
      const [{ data: examData }, { data: sessionData }] = await Promise.all([
        supabase.from('exams').select('*').eq('available', true).order('sort_order'),
        supabase.from('exam_sessions').select('*, answer_sheets(*)').eq('student_id', user.id).order('created_at', {ascending: false})
      ])
      setExams(examData || [])
      setPastSessions(sessionData || [])
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (view === 'exam' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); handleTimeUp(); return 0 }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [view, timeLeft > 0])

  const parseTimeLimit = (timeStr: string) => {
    if (!timeStr) return 240
    const match = timeStr.match(/(\d+\.?\d*)\s*hr/)
    if (match) return Math.round(parseFloat(match[1]) * 60)
    return 240
  }

  const startExam = async (exam: any) => {
    const { data: qs } = await supabase.from('questions')
      .select('*').eq('exam_id', exam.id).order('question_number')
    if (!qs || qs.length === 0) {
      alert('This exam has no questions yet. Please contact your admin.')
      return
    }
    const timeLimitMinutes = parseTimeLimit(exam.time_limit)
    const { data: session } = await supabase.from('exam_sessions').insert({
      student_id: user.id, exam_id: exam.id, exam_name: exam.name,
      started_at: new Date().toISOString(), time_limit_minutes: timeLimitMinutes,
      total_questions: qs.length, status: 'in_progress'
    }).select().single()
    const { data: sheet } = await supabase.from('answer_sheets').insert({
      exam_session_id: session.id, student_id: user.id,
      exam_name: exam.name, total_questions: qs.length, answers: {}
    }).select().single()
    setActiveSession(session)
    setActiveSheet(sheet)
    setActiveExam(exam)
    setQuestions(qs)
    setAnswers({})
    setCurrentQ(1)
    setTimeLeft(timeLimitMinutes * 60)
    setView('exam')
  }

  const saveAnswer = async (qNum: number, answer: string) => {
    const newAnswers = {...answers, [qNum]: answer}
    setAnswers(newAnswers)
    await supabase.from('answer_sheets').update({answers: newAnswers}).eq('id', activeSheet.id)
  }

  const handleTimeUp = () => { submitExam(true) }

  const submitExam = async (timeUp = false) => {
    setSubmitting(true)
    clearInterval(timerRef.current)

    const submittedAt = new Date()
    const startedAt = new Date(activeSession.started_at)
    const actualMinutes = Math.round((submittedAt.getTime() - startedAt.getTime()) / 60000)
    const withinLimit = actualMinutes <= (activeSession.time_limit_minutes || 240)

    // Score the exam
    let correct = 0
    let wrongCount = 0
    const topicBreakdown: Record<string, {correct: number, total: number}> = {}
    const wrongQuestions: any[] = []

    questions.forEach(q => {
      const studentAnswer = answers[q.question_number]
      const isCorrect = studentAnswer === q.correct_answer
      if (isCorrect) correct++
      else {
        wrongCount++
        wrongQuestions.push(q)
      }
      if (q.topic) {
        if (!topicBreakdown[q.topic]) topicBreakdown[q.topic] = {correct: 0, total: 0}
        topicBreakdown[q.topic].total++
        if (isCorrect) topicBreakdown[q.topic].correct++
      }
    })

    const totalQ = questions.length
    const percentCorrect = Math.round((correct / totalQ) * 100)
    const predictedStep1 = calcStep1Score(activeSession.exam_name, wrongCount)

    // Save to exam_sessions
    await supabase.from('exam_sessions').update({
      submitted_at: submittedAt.toISOString(),
      actual_minutes: actualMinutes,
      within_limit: withinLimit,
      status: 'submitted',
      score: correct,
      wrong_count: wrongCount,
      total_questions: totalQ,
      percent_correct: percentCorrect,
      predicted_step1: predictedStep1,
      topic_breakdown: topicBreakdown,
    }).eq('id', activeSession.id)

    await supabase.from('answer_sheets').update({answers}).eq('id', activeSheet.id)

    // Feed wrong answers into weakness map (qbank_question_logs)
    if (wrongQuestions.length > 0) {
      const logs = wrongQuestions.map(q => ({
        student_id: user.id,
        topic: q.topic || 'Mixed',
        answer: 'Wrong',
        reason: 'Knowledge Gap',
        source: 'exam',
      }))
      await supabase.from('qbank_question_logs').insert(logs)
    }

    // Refresh sessions
    const { data: sessionData } = await supabase.from('exam_sessions')
      .select('*, answer_sheets(*)').eq('student_id', user.id).order('created_at', {ascending: false})
    setPastSessions(sessionData || [])

    setResults({
      correct, wrongCount, totalQ, percentCorrect,
      predictedStep1, topicBreakdown, actualMinutes, withinLimit,
      examName: activeSession.exam_name, timeUp
    })
    setSubmitting(false)
    setView('results')
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
    return `${m}:${s.toString().padStart(2,'0')}`
  }

  const formatDuration = (min: number) => {
    const h = Math.floor(min / 60); const m = min % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const diffColor = (d: string) => ({
    Baseline: '#4a8c84', Moderate: '#6b7c3a', Hard: '#c07040', Hardest: '#9e2a2a'
  }[d] || '#c9a84c')

  const scoreColor = (pct: number) => {
    if (pct >= 75) return '#6b7c3a'
    if (pct >= 65) return '#c9a84c'
    if (pct >= 55) return '#c07040'
    return '#c0574a'
  }

  const navGroups = [
    {section: 'Overview', items: [{name: 'Dashboard', path: '/dashboard'}]},
    {section: 'My Program', items: [
      {name: 'Daily Course Schedule', path: '/dashboard/schedule'},
      {name: 'My Study Schedule', path: '/dashboard/studyschedule'},
      {name: 'Calendar', path: '/dashboard/calendar'},
      {name: 'Assignments', path: '/dashboard/assignments'},
      {name: 'Mentor Meetings', path: '/dashboard/mentor'},
    ]},
    {section: 'Study Tools', items: [
      {name: 'Exam Center', path: '/dashboard/exams', active: true},
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

  if (loading) return (
    <main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f7f4ee'}}>
      <div style={{fontFamily:'Georgia,serif',fontSize:24,color:'#0d2340'}}>Loading...</div>
    </main>
  )

  // ─── EXAM VIEW ───────────────────────────────────────────────────────────────
  if (view === 'exam' && activeSession) {
    const q = questions[currentQ - 1]
    const totalQ = questions.length
    const answeredCount = Object.keys(answers).length
    const timeWarning = timeLeft > 0 && timeLeft < 1800
    const progress = Math.round((answeredCount / totalQ) * 100)

    return (
      <main style={{minHeight:'100vh', background:'#f7f4ee', fontFamily:'Sora, sans-serif'}}>
        {/* Top bar */}
        <div style={{position:'fixed',top:0,left:0,right:0,zIndex:1000,background: timeWarning ? '#9e2a2a' : '#0d2340',padding:'10px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:18,color:'white',fontWeight:600}}>{activeSession.exam_name}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>Question {currentQ} of {totalQ}</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:24}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Answered</div>
              <div style={{fontSize:18,color:'#c9a84c',fontWeight:700}}>{answeredCount}/{totalQ}</div>
            </div>
            {timeLeft > 0 && (
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Time remaining</div>
                <div style={{fontSize:24,color:timeWarning?'#ffaaaa':'#c9a84c',fontWeight:700,fontFamily:'Georgia,serif'}}>{formatTime(timeLeft)}</div>
              </div>
            )}
            <button onClick={() => submitExam()} disabled={submitting}
              style={{padding:'8px 20px',background:'#c9a84c',border:'none',borderRadius:8,color:'#0d2340',fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:700,cursor:'pointer'}}>
              {submitting ? 'Scoring...' : 'Submit →'}
            </button>
          </div>
        </div>

        <div style={{padding:'80px 0 40px',display:'grid',gridTemplateColumns:'200px 1fr 220px',gap:0,minHeight:'100vh'}}>

          {/* Left — question navigator */}
          <div style={{background:'white',borderRight:'0.5px solid #e8dfc8',padding:'16px 12px',overflowY:'auto',position:'sticky',top:60,height:'calc(100vh - 60px)'}}>
            <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.07em',color:'#8a7d6a',marginBottom:10}}>Questions</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4}}>
              {questions.map((_, idx) => {
                const qNum = idx + 1
                const answered = !!answers[qNum]
                const isCurrent = qNum === currentQ
                return (
                  <button key={qNum} onClick={() => setCurrentQ(qNum)}
                    style={{width:36,height:36,borderRadius:6,border:'none',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'Sora,sans-serif',
                      background: isCurrent ? '#0d2340' : answered ? '#f0f7f2' : '#f7f4ee',
                      color: isCurrent ? '#c9a84c' : answered ? '#2d6a4f' : '#a89870'}}>
                    {qNum}
                  </button>
                )
              })}
            </div>
            <div style={{marginTop:16,padding:'10px 8px',background:'#f7f4ee',borderRadius:8}}>
              <div style={{fontSize:11,color:'#8a7d6a',marginBottom:6}}>Progress</div>
              <div style={{height:5,background:'#e8dfc8',borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',background:'#6b7c3a',width:`${progress}%`,borderRadius:3}}/>
              </div>
              <div style={{fontSize:11,color:'#6b7c3a',marginTop:4,fontWeight:600}}>{progress}% complete</div>
            </div>
          </div>

          {/* Center — question */}
          <div style={{padding:'24px 32px'}}>
            {q && (
              <div>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:'#0d2340',color:'#c9a84c',fontSize:14,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{currentQ}</div>
                  {q.topic && <span style={{fontSize:12,padding:'3px 10px',borderRadius:10,background:'#f0f4ff',color:'#3d5a99',fontWeight:500}}>{q.topic}</span>}
                </div>

                <div style={{background:'white',border:'0.5px solid #e8dfc8',borderRadius:14,padding:'28px 32px',marginBottom:20,fontSize:15,color:'#1a1008',lineHeight:1.8,fontFamily:'Georgia,serif'}}>
                  {q.question_text}
                </div>

                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {['A','B','C','D'].map(opt => {
                    const text = q[`choice_${opt.toLowerCase()}`]
                    const selected = answers[currentQ] === opt
                    return (
                      <button key={opt} onClick={() => saveAnswer(currentQ, opt)}
                        style={{display:'flex',alignItems:'flex-start',gap:14,padding:'14px 18px',borderRadius:10,border: selected ? '2px solid #0d2340' : '1.5px solid #e8dfc8',background: selected ? '#f0f4ff' : 'white',cursor:'pointer',textAlign:'left',fontFamily:'Sora,sans-serif',transition:'all 0.15s'}}>
                        <div style={{width:28,height:28,borderRadius:'50%',background: selected ? '#0d2340' : '#f7f4ee',color: selected ? '#c9a84c' : '#8a7d6a',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{opt}</div>
                        <div style={{fontSize:14,color: selected ? '#0d2340' : '#3d3020',lineHeight:1.6,fontWeight: selected ? 500 : 400,paddingTop:2}}>{text}</div>
                      </button>
                    )
                  })}
                </div>

                <div style={{display:'flex',justifyContent:'space-between',marginTop:24}}>
                  <button onClick={() => setCurrentQ(Math.max(1,currentQ-1))} disabled={currentQ===1}
                    style={{padding:'10px 24px',background:currentQ===1?'#f7f4ee':'#0d2340',border:'none',borderRadius:8,color:currentQ===1?'#a89870':'#c9a84c',fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:600,cursor:currentQ===1?'not-allowed':'pointer'}}>
                    ← Previous
                  </button>
                  <button onClick={() => setCurrentQ(Math.min(totalQ,currentQ+1))} disabled={currentQ===totalQ}
                    style={{padding:'10px 24px',background:currentQ===totalQ?'#f7f4ee':'#0d2340',border:'none',borderRadius:8,color:currentQ===totalQ?'#a89870':'#c9a84c',fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:600,cursor:currentQ===totalQ?'not-allowed':'pointer'}}>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right — exam info */}
          <div style={{background:'white',borderLeft:'0.5px solid #e8dfc8',padding:'16px 14px',position:'sticky',top:60,height:'calc(100vh - 60px)',overflowY:'auto'}}>
            <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.07em',color:'#8a7d6a',marginBottom:12}}>Exam Info</div>
            {[
              {label:'Exam',value:activeSession.exam_name},
              {label:'Total questions',value:totalQ},
              {label:'Time limit',value:formatDuration(activeSession.time_limit_minutes)},
              {label:'Answered',value:`${answeredCount}/${totalQ}`},
              {label:'Unanswered',value:totalQ-answeredCount},
            ].map(s => (
              <div key={s.label} style={{marginBottom:12,paddingBottom:12,borderBottom:'0.5px solid #f5f0e8'}}>
                <div style={{fontSize:11,color:'#a89870',marginBottom:2}}>{s.label}</div>
                <div style={{fontSize:14,color:'#0d2340',fontWeight:500}}>{s.value}</div>
              </div>
            ))}
            <div style={{background:'#f7f4ee',borderRadius:8,padding:'10px 12px',marginTop:8}}>
              <div style={{fontSize:11,color:'#8a7d6a',lineHeight:1.6}}>
                Click any question number on the left to jump to it. Your answers save automatically.
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ─── RESULTS VIEW ────────────────────────────────────────────────────────────
  if (view === 'results' && results) {
    const step1Color = results.predictedStep1
      ? results.predictedStep1 >= 240 ? '#6b7c3a'
        : results.predictedStep1 >= 220 ? '#c9a84c'
        : results.predictedStep1 >= 196 ? '#c07040'
        : '#c0574a'
      : '#8a7d6a'

    return (
      <main style={{minHeight:'100vh',background:'#f7f4ee',fontFamily:'Sora,sans-serif',padding:'40px 24px'}}>
        <div style={{maxWidth:760,margin:'0 auto'}}>

          {/* Header */}
          <div style={{background:'#0d2340',borderRadius:16,padding:'32px',textAlign:'center',marginBottom:20}}>
            <div style={{fontSize:48,marginBottom:12}}>{results.timeUp ? '⏰' : '🎉'}</div>
            <div style={{fontFamily:'Georgia,serif',fontSize:28,color:'white',marginBottom:6}}>
              {results.timeUp ? 'Time\'s up!' : 'Exam submitted!'}
            </div>
            <div style={{fontSize:15,color:'rgba(255,255,255,0.5)'}}>{results.examName}</div>
          </div>

          {/* Score cards */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:20}}>
            <div style={{background:'white',border:'0.5px solid #e8dfc8',borderRadius:12,padding:'20px',textAlign:'center'}}>
              <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.07em',color:'#a89870',marginBottom:8}}>Raw Score</div>
              <div style={{fontFamily:'Georgia,serif',fontSize:40,color:scoreColor(results.percentCorrect),fontWeight:700}}>{results.correct}/{results.totalQ}</div>
              <div style={{fontSize:16,color:scoreColor(results.percentCorrect),fontWeight:600,marginTop:4}}>{results.percentCorrect}%</div>
            </div>
            <div style={{background:'white',border:'0.5px solid #e8dfc8',borderRadius:12,padding:'20px',textAlign:'center'}}>
              <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.07em',color:'#a89870',marginBottom:8}}>Wrong Answers</div>
              <div style={{fontFamily:'Georgia,serif',fontSize:40,color:'#c0574a',fontWeight:700}}>{results.wrongCount}</div>
              <div style={{fontSize:13,color:'#8a7d6a',marginTop:4}}>out of {results.totalQ}</div>
            </div>
            <div style={{background: results.predictedStep1 ? '#0d2340' : 'white',border:'0.5px solid #e8dfc8',borderRadius:12,padding:'20px',textAlign:'center'}}>
              <div style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.07em',color: results.predictedStep1 ? 'rgba(255,255,255,0.5)' : '#a89870',marginBottom:8}}>Predicted Step 1</div>
              {results.predictedStep1 ? (
                <>
                  <div style={{fontFamily:'Georgia,serif',fontSize:40,color:step1Color,fontWeight:700}}>{results.predictedStep1}</div>
                  <div style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginTop:4}}>
                    {results.predictedStep1 >= 240 ? 'Excellent' : results.predictedStep1 >= 220 ? 'Good' : results.predictedStep1 >= 196 ? 'Passing' : 'Below passing'}
                  </div>
                </>
              ) : (
                <div style={{fontSize:14,color:'#8a7d6a',marginTop:8}}>No formula for this exam</div>
              )}
            </div>
          </div>

          {/* Time info */}
          <div style={{background:'white',border:'0.5px solid #e8dfc8',borderRadius:12,padding:'16px 20px',marginBottom:20,display:'flex',gap:24}}>
            {[
              {label:'Time spent',value:formatDuration(results.actualMinutes)},
              {label:'Within time limit',value:results.withinLimit ? '✅ Yes' : '⚠️ Over limit'},
              {label:'Questions answered',value:`${Object.keys(answers).length}/${results.totalQ}`},
            ].map(s => (
              <div key={s.label}>
                <div style={{fontSize:11,color:'#a89870',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>{s.label}</div>
                <div style={{fontSize:14,color:'#0d2340',fontWeight:500}}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Topic breakdown */}
          {Object.keys(results.topicBreakdown).length > 0 && (
            <div style={{background:'white',border:'0.5px solid #e8dfc8',borderRadius:12,padding:'20px',marginBottom:20}}>
              <div style={{fontSize:15,fontWeight:600,color:'#0d2340',marginBottom:16}}>Performance by topic</div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {Object.entries(results.topicBreakdown)
                  .sort(([,a]:any,[,b]:any) => (a.correct/a.total) - (b.correct/b.total))
                  .map(([topic, stats]:any) => {
                    const pct = Math.round((stats.correct/stats.total)*100)
                    return (
                      <div key={topic} style={{display:'flex',alignItems:'center',gap:12}}>
                        <div style={{width:110,fontSize:13,color:'#3d3020',flexShrink:0}}>{topic}</div>
                        <div style={{flex:1,height:8,background:'#f0ece0',borderRadius:4,overflow:'hidden'}}>
                          <div style={{height:'100%',background:scoreColor(pct),width:`${pct}%`,borderRadius:4}}/>
                        </div>
                        <div style={{width:40,fontSize:13,fontWeight:700,color:scoreColor(pct),textAlign:'right',flexShrink:0}}>{pct}%</div>
                        <div style={{fontSize:11,color:'#a89870',width:60,flexShrink:0}}>{stats.correct}/{stats.total}</div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{display:'flex',gap:12}}>
            <button onClick={() => { setView('list'); setActiveSession(null); setActiveSheet(null); setActiveExam(null); setResults(null) }}
              style={{flex:1,height:48,background:'white',border:'1px solid #e8dfc8',borderRadius:10,color:'#0d2340',fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer'}}>
              Back to exams
            </button>
            <button onClick={() => router.push('/dashboard/weakness')}
              style={{flex:1,height:48,background:'#0d2340',border:'none',borderRadius:10,color:'#c9a84c',fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer'}}>
              View weakness map →
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ─── MAIN LIST VIEW ──────────────────────────────────────────────────────────
  return (
    <main style={{minHeight:'100vh',display:'flex',background:'#f7f4ee',fontFamily:'Sora,sans-serif',fontSize:'17.6px'}}>
      <nav style={{width:220,flexShrink:0,background:'#0d2340',display:'flex',flexDirection:'column',height:'100vh',position:'sticky',top:0}}>
        <div style={{padding:'20px 18px 16px',borderBottom:'0.5px solid rgba(201,168,76,0.2)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,background:'#c9a84c',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <div style={{width:0,height:0,borderLeft:'6px solid transparent',borderRight:'6px solid transparent',borderBottom:'11px solid #0d2340'}}/>
            </div>
            <div style={{fontFamily:'Georgia,serif',fontSize:20,color:'white',fontWeight:600}}>StepUp</div>
          </div>
          <div style={{fontSize:10,color:'#c9a84c',letterSpacing:'0.09em',textTransform:'uppercase',paddingLeft:46,marginTop:3}}>P2P Mentoring Program</div>
        </div>
        <div style={{padding:'12px 10px',flex:1,overflowY:'auto'}}>
          {navGroups.map(group => (
            <div key={group.section}>
              <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.12em',color:'rgba(255,255,255,0.28)',padding:'0 8px',margin:'12px 0 4px'}}>{group.section}</div>
              {group.items.map((item:any) => (
                <div key={item.name} onClick={() => router.push(item.path)}
                  style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:7,color:item.active?'#c9a84c':'rgba(255,255,255,0.55)',fontSize:13.5,marginBottom:2,background:item.active?'rgba(255,255,255,0.09)':'transparent',cursor:'pointer'}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:'currentColor',flexShrink:0}}/>{item.name}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{padding:'12px 14px',borderTop:'0.5px solid rgba(201,168,76,0.14)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:30,height:30,borderRadius:'50%',background:'#c9a84c',color:'#0d2340',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,color:'white',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{profile?.full_name||user?.email?.split('@')[0]}</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.35)'}}>Windsor SOM</div>
            </div>
            <div onClick={async()=>{await supabase.auth.signOut();router.push('/')}}
              style={{fontSize:11,color:'rgba(255,255,255,0.35)',cursor:'pointer',padding:'4px 8px',borderRadius:4,border:'0.5px solid rgba(255,255,255,0.15)'}}>Sign out</div>
          </div>
        </div>
      </nav>

      <div style={{flex:1,minWidth:0,overflowY:'auto',padding:'32px 36px'}}>
        <div style={{marginBottom:28}}>
          <div style={{fontFamily:'Georgia,serif',fontSize:30,color:'#0d2340',letterSpacing:-0.5}}>Exam Center</div>
          <div style={{fontSize:14,color:'#8a7d6a',marginTop:5}}>Take timed exams · Get scored instantly · Track your Step 1 prediction</div>
        </div>

        <div style={{background:'white',border:'0.5px solid #e8dfc8',borderRadius:12,overflow:'hidden',marginBottom:24}}>
          <div style={{background:'#0d2340',padding:'14px 20px'}}>
            <div style={{fontSize:14,fontWeight:600,color:'white'}}>Available exams</div>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                {['Exam','Questions','Time limit','Difficulty','Deadline','Your best','Action'].map(h => (
                  <th key={h} style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.07em',color:'#a89870',padding:'12px 16px',textAlign:'left',borderBottom:'0.5px solid #f0ece0'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exams.map((exam, i) => {
                const attempted = pastSessions.filter(s => s.exam_id === exam.id && s.status === 'submitted')
                const bestScore = attempted.length > 0
                  ? Math.max(...attempted.map((s:any) => s.predicted_step1 || s.percent_correct || 0))
                  : null
                const bestSession = attempted.find((s:any) => (s.predicted_step1||s.percent_correct||0) === bestScore)
                return (
                  <tr key={exam.id} style={{borderBottom:i<exams.length-1?'0.5px solid #f5f0e8':'none'}}>
                    <td style={{padding:'14px 16px'}}>
                      <div style={{fontSize:14,fontWeight:600,color:'#0d2340'}}>{exam.name}</div>
                      {attempted.length > 0 && <div style={{fontSize:11,color:'#6b7c3a',marginTop:2}}>Taken {attempted.length}x</div>}
                    </td>
                    <td style={{fontSize:13,color:'#3d3020',padding:'14px 16px'}}>{exam.questions}Q</td>
                    <td style={{fontSize:13,color:'#3d3020',padding:'14px 16px'}}>{exam.time_limit}</td>
                    <td style={{padding:'14px 16px'}}>
                      <span style={{fontSize:12,padding:'3px 10px',borderRadius:10,background:`${diffColor(exam.difficulty)}18`,color:diffColor(exam.difficulty),fontWeight:500}}>{exam.difficulty}</span>
                    </td>
                    <td style={{fontSize:13,color:exam.deadline?'#c0574a':'#a89870',padding:'14px 16px',fontWeight:exam.deadline?500:400}}>
                      {exam.deadline ? new Date(exam.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '—'}
                    </td>
                    <td style={{padding:'14px 16px'}}>
                      {bestSession?.predicted_step1 ? (
                        <span style={{fontSize:14,fontWeight:700,color:scoreColor(bestSession.percent_correct||0)}}>{bestSession.predicted_step1}</span>
                      ) : bestSession?.percent_correct ? (
                        <span style={{fontSize:13,color:scoreColor(bestSession.percent_correct)}}>{bestSession.percent_correct}%</span>
                      ) : <span style={{fontSize:12,color:'#a89870'}}>—</span>}
                    </td>
                    <td style={{padding:'14px 16px'}}>
                      <button onClick={() => startExam(exam)}
                        style={{padding:'8px 16px',background:'#0d2340',border:'none',borderRadius:8,fontSize:13,color:'#c9a84c',fontWeight:600,cursor:'pointer'}}>
                        {attempted.length > 0 ? 'Retake →' : 'Start →'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {pastSessions.filter(s => s.status === 'submitted').length > 0 && (
          <div style={{background:'white',border:'0.5px solid #e8dfc8',borderRadius:12,overflow:'hidden'}}>
            <div style={{background:'#0d2340',padding:'14px 20px'}}>
              <div style={{fontSize:14,fontWeight:600,color:'white'}}>My exam history</div>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr>
                  {['Exam','Date','Score','Wrong','Predicted Step 1','Time','Status'].map(h => (
                    <th key={h} style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.07em',color:'#a89870',padding:'12px 16px',textAlign:'left',borderBottom:'0.5px solid #f0ece0'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pastSessions.filter(s=>s.status==='submitted').map((session, i, arr) => (
                  <tr key={session.id} style={{borderBottom:i<arr.length-1?'0.5px solid #f5f0e8':'none'}}>
                    <td style={{fontSize:14,fontWeight:500,color:'#0d2340',padding:'12px 16px'}}>{session.exam_name}</td>
                    <td style={{fontSize:13,color:'#3d3020',padding:'12px 16px'}}>{new Date(session.started_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</td>
                    <td style={{padding:'12px 16px'}}>
                      {session.percent_correct != null
                        ? <span style={{fontSize:13,fontWeight:600,color:scoreColor(session.percent_correct)}}>{session.score}/{session.total_questions} ({session.percent_correct}%)</span>
                        : <span style={{fontSize:12,color:'#a89870'}}>—</span>}
                    </td>
                    <td style={{fontSize:13,color:'#c0574a',fontWeight:500,padding:'12px 16px'}}>{session.wrong_count ?? '—'}</td>
                    <td style={{padding:'12px 16px'}}>
                      {session.predicted_step1
                        ? <span style={{fontSize:15,fontWeight:700,color:scoreColor(session.percent_correct||0)}}>{session.predicted_step1}</span>
                        : <span style={{fontSize:12,color:'#a89870'}}>—</span>}
                    </td>
                    <td style={{fontSize:13,color:'#3d3020',padding:'12px 16px'}}>{session.actual_minutes ? formatDuration(session.actual_minutes) : '—'}</td>
                    <td style={{padding:'12px 16px'}}>
                      <span style={{fontSize:11,padding:'3px 10px',borderRadius:10,background:'#f0f7f2',color:'#2d6a4f',fontWeight:500}}>Submitted</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}