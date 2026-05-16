'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'
import { Document, Page, pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const SCORE_FORMULAS: Record<string, {base: number, multiplier: number}> = {
  'NBME 25': {base: 277.04, multiplier: 1.113},
  'NBME 26': {base: 277.22, multiplier: 1.138},
  'NBME 27': {base: 275.17, multiplier: 1.1125},
  'NBME 28': {base: 274.14, multiplier: 1.0456},
  'NBME 29': {base: 272.18, multiplier: 1.09},
  'NBME 30': {base: 278.60, multiplier: 1.150},
  'NBME 31': {base: 270.48, multiplier: 1.08},
  'UWSA 1':  {base: 294.38, multiplier: 1.109},
  'UWSA 2':  {base: 296.94, multiplier: 1.097},
}

const calcStep1Score = (examName: string, wrongCount: number): number | null => {
  const formula = Object.entries(SCORE_FORMULAS).find(([key]) =>
    examName.toLowerCase().includes(key.toLowerCase())
  )
  if (!formula) return null
  return Math.round(formula[1].base - formula[1].multiplier * wrongCount)
}

const BLOCK_PAGES = [
  { start: 1,   end: 53  },
  { start: 54,  end: 103 },
  { start: 104, end: 153 },
  { start: 154, end: 203 },
]

const LAB_VALUES = [
  { category: 'Blood, Plasma, Serum', values: [
    { name: 'Alanine aminotransferase (ALT)', ref: '8–20 U/L' },
    { name: 'Aspartate aminotransferase (AST)', ref: '8–20 U/L' },
    { name: 'Alkaline phosphatase', ref: '20–70 U/L' },
    { name: 'Amylase, serum', ref: '25–125 U/L' },
    { name: 'Bilirubin, serum (total // direct)', ref: '0.1–1.0 // 0.0–0.3 mg/dL' },
    { name: 'Calcium, serum (Ca²⁺)', ref: '8.4–10.2 mg/dL' },
    { name: 'Cholesterol, serum', ref: '<200 mg/dL' },
    { name: 'Creatinine, serum', ref: '0.6–1.2 mg/dL' },
    { name: 'Sodium (Na⁺)', ref: '135–145 mEq/L' },
    { name: 'Potassium (K⁺)', ref: '3.5–5.0 mEq/L' },
    { name: 'Chloride (Cl⁻)', ref: '95–105 mEq/L' },
    { name: 'Bicarbonate (HCO₃⁻)', ref: '22–28 mEq/L' },
    { name: 'Magnesium (Mg²⁺)', ref: '1.5–2.0 mEq/L' },
    { name: 'Ferritin, serum', ref: '15–200 ng/mL' },
    { name: 'Glucose, serum (fasting)', ref: '70–99 mg/dL' },
    { name: 'Iron, serum', ref: '60–160 μg/dL' },
    { name: 'Lactate dehydrogenase (LDH)', ref: '45–90 U/L' },
    { name: 'Lipase, serum', ref: '10–140 U/L' },
    { name: 'Osmolality, serum', ref: '275–295 mOsmol/kg H₂O' },
    { name: 'Phosphorus (inorganic), serum', ref: '3.0–4.5 mg/dL' },
    { name: 'Protein, serum (total)', ref: '6.0–7.8 g/dL' },
    { name: '  Albumin', ref: '3.5–5.5 g/dL' },
    { name: '  Globulin', ref: '2.3–3.5 g/dL' },
    { name: 'TSH', ref: '0.5–5.0 μU/mL' },
    { name: 'Thyroxine (T4), serum', ref: '5–12 μg/dL' },
    { name: 'Triglycerides, serum', ref: '35–160 mg/dL' },
    { name: 'Urea nitrogen, serum (BUN)', ref: '7–25 mg/dL' },
    { name: 'Uric acid, serum', ref: 'M: 3.5–7.2 mg/dL; F: 2.6–6.0 mg/dL' },
  ]},
  { category: 'Hematology', values: [
    { name: 'Hematocrit', ref: 'M: 41–53%; F: 36–46%' },
    { name: 'Hemoglobin', ref: 'M: 13.5–17.5 g/dL; F: 12.0–16.0 g/dL' },
    { name: 'Leukocyte count (WBC)', ref: '4,500–11,000/mm³' },
    { name: '  Neutrophils', ref: '54–62%' },
    { name: '  Bands', ref: '3–5%' },
    { name: '  Eosinophils', ref: '1–3%' },
    { name: '  Basophils', ref: '0–0.75%' },
    { name: '  Lymphocytes', ref: '25–33%' },
    { name: '  Monocytes', ref: '3–7%' },
    { name: 'MCV', ref: '80–100 μm³' },
    { name: 'MCH', ref: '25–35 pg/cell' },
    { name: 'MCHC', ref: '31–37% Hb/cell' },
    { name: 'Partial thromboplastin time (PTT)', ref: '25–40 sec' },
    { name: 'Platelet count', ref: '150,000–400,000/mm³' },
    { name: 'Prothrombin time (PT)', ref: '11–15 sec' },
    { name: 'Reticulocyte count', ref: '0.5–1.5%' },
    { name: 'ESR', ref: 'M: 0–15 mm/hr; F: 0–20 mm/hr' },
  ]},
  { category: 'Arterial Blood Gas', values: [
    { name: 'pH', ref: '7.35–7.45' },
    { name: 'PCO₂', ref: '35–45 mmHg' },
    { name: 'PO₂', ref: '75–105 mmHg' },
    { name: 'HCO₃⁻', ref: '22–26 mEq/L' },
    { name: 'O₂ saturation', ref: '95–99%' },
  ]},
  { category: 'Cerebrospinal Fluid', values: [
    { name: 'Cell count', ref: '0–5/mm³' },
    { name: 'Chloride', ref: '118–132 mEq/L' },
    { name: 'Glucose', ref: '45–70 mg/dL' },
    { name: 'Opening pressure', ref: '70–180 mm H₂O' },
    { name: 'Protein', ref: '15–45 mg/dL' },
  ]},
  { category: 'Urine', values: [
    { name: 'Calcium', ref: '100–300 mg/24h' },
    { name: 'Creatinine', ref: 'M: 14–26 mg/kg/24h; F: 11–20 mg/kg/24h' },
    { name: 'Osmolality', ref: '50–1,400 mOsmol/kg H₂O' },
    { name: 'Protein', ref: '<150 mg/24h' },
    { name: 'Sodium', ref: '40–220 mEq/L/day' },
    { name: 'Specific gravity', ref: '1.001–1.035' },
  ]},
]

export default function ExamCenter() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pastSessions, setPastSessions] = useState<any[]>([])
  const [view, setView] = useState<'list'|'exam'|'results'>('list')
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<any>(null)

  // Active exam
  const [activeSession, setActiveSession] = useState<any>(null)
  const [activeSheet, setActiveSheet] = useState<any>(null)

  // PDF exam state
  const [pdfUrl, setPdfUrl] = useState<string|null>(null)
  const [answerKey, setAnswerKey] = useState<Record<string, {answer:string, topic?:string, concept?:string, system?:string, discipline?:string}>>({})
  const [resultsFilter, setResultsFilter] = useState<'all'|'correct'|'incorrect'>('all')
  const [resultsTab, setResultsTab] = useState<'system'|'subject'|'topic'|'questions'>('system')
  const [currentSection, setCurrentSection] = useState(1)
  const [sectionAnswers, setSectionAnswers] = useState<Record<number, Record<number, string>>>({1:{},2:{},3:{},4:{}})
  const [sectionTimeLeft, setSectionTimeLeft] = useState(0)
  const [sectionMinutes, setSectionMinutes] = useState(60)
  const [sectionSubmitted, setSectionSubmitted] = useState([false,false,false,false])
  const [sectionTimeExpired, setSectionTimeExpired] = useState(false)

  // PDF page navigation
  const [pdfPage, setPdfPage] = useState(1)
  const [pdfWidth, setPdfWidth] = useState(900)
  const [zoomLevel, setZoomLevel] = useState(1)
  const pdfContainerRef = useRef<HTMLDivElement>(null)

  // Overlays
  const [showLabValues, setShowLabValues] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [calcDisplay, setCalcDisplay] = useState('0')
  const [calcPrev, setCalcPrev] = useState('')
  const [calcOp, setCalcOp] = useState<string|null>(null)
  const [calcFresh, setCalcFresh] = useState(true)

  // Passcode modal
  const [showPasscode, setShowPasscode] = useState(false)
  const [passcodeInput, setPasscodeInput] = useState('')
  const [pendingExam, setPendingExam] = useState<any>(null)

  const timerRef = useRef<any>(null)
  const submitSectionRef = useRef<() => void>(() => {})
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
        supabase.from('exams').select('*').eq('is_live', true).order('sort_order'),
        supabase.from('exam_sessions').select('*, answer_sheets(*)').eq('student_id', user.id).order('created_at', {ascending: false})
      ])
      setExams(examData || [])
      setPastSessions(sessionData || [])
      setLoading(false)
    }
    init()
  }, [])

  // Section timer — restarts on section change
  useEffect(() => {
    if (view !== 'exam') return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setSectionTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); setSectionTimeExpired(true); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [view, currentSection])

  // Set PDF render width when entering exam view
  useEffect(() => {
    if (view === 'exam' && pdfContainerRef.current) {
      setPdfWidth(pdfContainerRef.current.clientWidth - 32)
    }
  }, [view])

  // Trigger submit when time expires (avoids stale closure inside timer)
  useEffect(() => {
    if (sectionTimeExpired) {
      setSectionTimeExpired(false)
      submitSectionRef.current()
    }
  }, [sectionTimeExpired])

  const parseTimeLimit = (timeStr: string) => {
    if (!timeStr) return 240
    const match = timeStr.match(/(\d+\.?\d*)\s*hr/)
    if (match) return Math.round(parseFloat(match[1]) * 60)
    return 240
  }

  const getSignedUrl = async (bucket: string, pathOrUrl: string) => {
    if (!pathOrUrl) return null
    if (pathOrUrl.startsWith('http')) return pathOrUrl
    const { data } = await supabase.storage.from(bucket).createSignedUrl(pathOrUrl, 7200)
    return data?.signedUrl || null
  }

  type AKEntry = { answer: string; topic?: string; concept?: string; system?: string; discipline?: string }

  const parseAnswerKey = (json: any): Record<string, AKEntry> => {
    // Unwrap nested { questions: { "1": {...} } } format
    const data = (json && typeof json === 'object' && !Array.isArray(json) && json.questions)
      ? json.questions
      : json

    const toEntry = (v: any): AKEntry => ({
      answer: v.answer != null ? String(v.answer).toUpperCase() : '',
      system: v.system,
      discipline: v.subject ?? v.discipline,
      topic: v.topic,
      concept: v.concept,
    })
    if (Array.isArray(data)) {
      const out: Record<string, AKEntry> = {}
      data.forEach((item: any) => {
        const q = item.question_number ?? item.question ?? item.q ?? item.num
        if (q != null) out[String(q)] = toEntry(item)
      })
      return out
    }
    return Object.fromEntries(
      Object.entries(data)
        .filter(([, v]) => v && typeof v === 'object')
        .map(([k, v]) => [String(k), toEntry(v)])
    )
  }

  const launchExam = async (exam: any, timeMult = 1) => {
    setShowPasscode(false)

    const pdf = await getSignedUrl('exam-pdfs', exam.pdf_url || '')

    let key: Record<string, AKEntry> = {}
    if (exam.answer_key_url) {
      const keyUrl = await getSignedUrl('exam-keys', exam.answer_key_url)
      console.log('[answerKey] url:', keyUrl)
      if (keyUrl) {
        try {
          const resp = await fetch(keyUrl)
          const raw = await resp.json()
          console.log('[answerKey] raw sample:', JSON.stringify(raw).slice(0, 300))
          key = parseAnswerKey(raw)
          console.log('[answerKey] parsed entries:', Object.keys(key).length)
        } catch (e) {
          console.error('[answerKey] Failed to load answer key', e)
        }
      }
    }

    const baseSecMins = exam.time_per_section_minutes || Math.round(parseTimeLimit(exam.time_limit) / 4)
    const secMins = Math.round(baseSecMins * timeMult)
    const totalMinutes = secMins * (exam.section_count || 4)
    const totalQ = exam.questions || 200

    const { data: session, error: sErr } = await supabase.from('exam_sessions').insert({
      student_id: user.id, exam_id: exam.id, exam_name: exam.name,
      started_at: new Date().toISOString(),
      time_limit_minutes: totalMinutes, total_questions: totalQ, status: 'in_progress'
    }).select().single()
    if (sErr) { alert('Failed to start exam session.'); return }

    const { data: sheet } = await supabase.from('answer_sheets').insert({
      exam_session_id: session.id, student_id: user.id,
      exam_name: exam.name, total_questions: totalQ, answers: {}
    }).select().single()

    setActiveSession(session)
    setActiveSheet(sheet)
    setPdfUrl(pdf)
    setAnswerKey(key)
    setCurrentSection(1)
    setSectionAnswers({1:{},2:{},3:{},4:{}})
    setSectionMinutes(secMins)
    setSectionTimeLeft(secMins * 60)
    setSectionSubmitted([false,false,false,false])
    setPdfPage(1)
    setView('exam')
  }

  const startExam = (exam: any) => {
    const codes = exam.accommodation_codes
    const hasCodes = Array.isArray(codes) && codes.length > 0
    if (hasCodes) {
      setPendingExam(exam)
      setPasscodeInput('')
      setShowPasscode(true)
    } else {
      launchExam(exam, 1)
    }
  }

  const handlePasscodeSubmit = (skip = false) => {
    if (!pendingExam) return
    if (skip) { launchExam(pendingExam, 1); return }
    const codes: {code: string, multiplier: number}[] = pendingExam.accommodation_codes || []
    const match = codes.find(c => c.code.toLowerCase() === passcodeInput.trim().toLowerCase())
    launchExam(pendingExam, match ? match.multiplier : 1)
  }

  const saveSectionAnswer = async (qNum: number, answer: string) => {
    const updated = {
      ...sectionAnswers,
      [currentSection]: {...(sectionAnswers[currentSection] || {}), [qNum]: answer}
    }
    setSectionAnswers(updated)
    const allAnswers = Object.values(updated).reduce((acc, sec) => ({...acc, ...sec}), {})
    await supabase.from('answer_sheets').update({answers: allAnswers}).eq('id', activeSheet.id)
  }

  const submitSection = async (timeUp = false) => {
    clearInterval(timerRef.current)
    const newSubmitted = [...sectionSubmitted]
    newSubmitted[currentSection - 1] = true
    setSectionSubmitted(newSubmitted)

    if (currentSection < 4) {
      const next = currentSection + 1
      setCurrentSection(next)
      setSectionTimeLeft(sectionMinutes * 60)
      setPdfPage(BLOCK_PAGES[next - 1].start)
    } else {
      await submitExam(timeUp)
    }
  }
  submitSectionRef.current = () => submitSection(true)

  const submitExam = async (timeUp = false) => {
    setSubmitting(true)
    clearInterval(timerRef.current)

    try {
      const sheetId = activeSheet?.id
      const allAnswers: Record<string, any> = {}

      if (sheetId) {
        const { data: sheetData } = await supabase.from('answer_sheets').select('answers').eq('id', sheetId).single()
        if (sheetData?.answers) Object.assign(allAnswers, sheetData.answers)
      }

      const submittedAt = new Date()
      const startedAt = new Date(activeSession.started_at)
      const actualMinutes = Math.round((submittedAt.getTime() - startedAt.getTime()) / 60000)
      const withinLimit = actualMinutes <= (activeSession.time_limit_minutes || 240)
      const totalQ = activeSession.total_questions

      let correct = 0
      const systemBreakdown: Record<string, {correct:number, total:number}> = {}
      const topicBreakdown: Record<string, {correct:number, total:number}> = {}
      const disciplineBreakdown: Record<string, {correct:number, total:number}> = {}
      const questionDetails: {qNum:number, studentAnswer:string, correctAnswer:string, correct:boolean, system?:string, topic?:string, concept?:string, discipline?:string}[] = []

      const tally = (bd: Record<string, {correct:number,total:number}>, key: string|undefined, isCorrect: boolean) => {
        if (!key) return
        if (!bd[key]) bd[key] = {correct:0, total:0}
        bd[key].total++
        if (isCorrect) bd[key].correct++
      }

      for (let qNum = 1; qNum <= totalQ; qNum++) {
        const sa = String(allAnswers[String(qNum)] ?? allAnswers[qNum] ?? '').toUpperCase() || ''
        const entry = answerKey[String(qNum)]
        if (!entry) continue
        const isCorrect = !!sa && sa === entry.answer
        if (isCorrect) correct++
        tally(systemBreakdown, entry.system, isCorrect)
        tally(topicBreakdown, entry.topic, isCorrect)
        tally(disciplineBreakdown, entry.discipline, isCorrect)
        questionDetails.push({ qNum, studentAnswer: sa || '—', correctAnswer: entry.answer, correct: isCorrect, system: entry.system, topic: entry.topic, concept: entry.concept, discipline: entry.discipline })
      }

      const wrongCount = totalQ - correct
      const percentCorrect = Math.round((correct / totalQ) * 100)
      const predictedStep1 = calcStep1Score(activeSession.exam_name, wrongCount)

      await supabase.from('exam_sessions').update({
        submitted_at: submittedAt.toISOString(), actual_minutes: actualMinutes,
        within_limit: withinLimit, status: 'submitted',
        score: correct, wrong_count: wrongCount, total_questions: totalQ,
        percent_correct: percentCorrect, predicted_step1: predictedStep1,
      }).eq('id', activeSession.id)

      const { data: sessionData } = await supabase.from('exam_sessions')
        .select('*, answer_sheets(*)').eq('student_id', user.id).order('created_at', {ascending: false})
      setPastSessions(sessionData || [])

      setResultsFilter('all')
      setResultsTab('system')
      setResults({ correct, wrongCount, totalQ, percentCorrect, predictedStep1, actualMinutes, withinLimit, examName: activeSession.exam_name, timeUp, systemBreakdown, topicBreakdown, disciplineBreakdown, questionDetails })
      setView('results')
    } catch (err) {
      console.error('submitExam error:', err)
      alert('Something went wrong generating your score report. Your answers have been saved — contact your admin if this persists.')
      setView('list')
    } finally {
      setSubmitting(false)
    }
  }

  const viewSessionReport = async (session: any) => {
    setSubmitting(true)
    try {
      // Fetch exam directly so it works even if it's no longer is_live
      const { data: examData } = await supabase.from('exams').select('*').eq('id', session.exam_id).single()

      // Load saved answers
      const sheet = session.answer_sheets?.[0]
      const allAnswers: Record<string, any> = {}
      if (sheet?.id) {
        const { data: sheetData } = await supabase.from('answer_sheets').select('answers').eq('id', sheet.id).single()
        if (sheetData?.answers) Object.assign(allAnswers, sheetData.answers)
      }

      // Load answer key
      let ak: Record<string, AKEntry> = {}
      if (examData?.answer_key_url) {
        const keyUrl = await getSignedUrl('exam-keys', examData.answer_key_url)
        console.log('[viewReport] answer_key_url field:', examData.answer_key_url)
        console.log('[viewReport] resolved keyUrl:', keyUrl)
        if (keyUrl) {
          try {
            const resp = await fetch(keyUrl)
            const raw = await resp.json()
            console.log('[viewReport] raw sample:', JSON.stringify(raw).slice(0, 300))
            ak = parseAnswerKey(raw)
            console.log('[viewReport] parsed entries:', Object.keys(ak).length)
          } catch (e) { console.error('[viewReport] answer key load failed', e) }
        }
      } else {
        console.warn('[viewReport] examData.answer_key_url is empty or exam not found. examData:', examData)
      }

      const totalQ = session.total_questions || 200
      let freshCorrect = 0
      const systemBreakdown: Record<string, {correct:number,total:number}> = {}
      const topicBreakdown: Record<string, {correct:number,total:number}> = {}
      const disciplineBreakdown: Record<string, {correct:number,total:number}> = {}
      const questionDetails: {qNum:number,studentAnswer:string,correctAnswer:string,correct:boolean,system?:string,topic?:string,concept?:string,discipline?:string}[] = []

      const tally = (bd: Record<string,{correct:number,total:number}>, key: string|undefined, isCorrect: boolean) => {
        if (!key) return
        if (!bd[key]) bd[key] = {correct:0,total:0}
        bd[key].total++; if (isCorrect) bd[key].correct++
      }

      for (let qNum = 1; qNum <= totalQ; qNum++) {
        const sa = String(allAnswers[String(qNum)] ?? allAnswers[qNum] ?? '').toUpperCase() || ''
        const entry = ak[String(qNum)]
        if (!entry) continue
        const isCorrect = !!sa && sa === entry.answer
        if (isCorrect) freshCorrect++
        tally(systemBreakdown, entry.system, isCorrect)
        tally(topicBreakdown, entry.topic, isCorrect)
        tally(disciplineBreakdown, entry.discipline, isCorrect)
        questionDetails.push({ qNum, studentAnswer: sa||'—', correctAnswer: entry.answer, correct: isCorrect, system: entry.system, topic: entry.topic, concept: entry.concept, discipline: entry.discipline })
      }

      // Use freshly computed scores (saved values were wrong — answer key wasn't loaded at submission)
      const correct = freshCorrect
      const wrongCount = totalQ - freshCorrect
      const percentCorrect = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0
      const predictedStep1 = calcStep1Score(session.exam_name, wrongCount)
      const actualMinutes = session.actual_minutes ?? 0
      const withinLimit = session.within_limit ?? true

      // Persist corrected scores back to DB
      await supabase.from('exam_sessions').update({
        score: correct, wrong_count: wrongCount,
        percent_correct: percentCorrect, predicted_step1: predictedStep1,
      }).eq('id', session.id)

      setResultsFilter('all')
      setResultsTab('system')
      setResults({ correct, wrongCount, totalQ, percentCorrect, predictedStep1, actualMinutes, withinLimit, examName: session.exam_name, timeUp: false, systemBreakdown, topicBreakdown, disciplineBreakdown, questionDetails })
      setView('results')
    } catch (err) {
      console.error('viewSessionReport error:', err)
      alert('Could not load the score report. Try again or contact your admin.')
    } finally {
      setSubmitting(false)
    }
  }

  const calcInput = (digit: string) => {
    if (calcFresh) { setCalcDisplay(digit === '.' ? '0.' : digit); setCalcFresh(false) }
    else { if (digit === '.' && calcDisplay.includes('.')) return; setCalcDisplay(p => p === '0' && digit !== '.' ? digit : p + digit) }
  }
  const calcDoOp = (op: string) => { setCalcPrev(calcDisplay); setCalcOp(op); setCalcFresh(true) }
  const calcEquals = () => {
    if (!calcOp || !calcPrev) return
    const a = parseFloat(calcPrev), b = parseFloat(calcDisplay)
    const res = calcOp==='+' ? a+b : calcOp==='−' ? a-b : calcOp==='×' ? a*b : b!==0 ? a/b : 0
    setCalcDisplay(String(parseFloat(res.toFixed(10)))); setCalcPrev(''); setCalcOp(null); setCalcFresh(true)
  }
  const calcClear = () => { setCalcDisplay('0'); setCalcPrev(''); setCalcOp(null); setCalcFresh(true) }

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

  // ─── EXAM VIEW ────────────────────────────────────────────────────────────────
  if (view === 'exam' && activeSession) {
    const sectionStart = (currentSection - 1) * 50 + 1
    const sectionEnd = currentSection * 50
    const curSecAnswers = sectionAnswers[currentSection] || {}
    const answeredCount = Object.keys(curSecAnswers).length
    const timeWarning = sectionTimeLeft > 0 && sectionTimeLeft < 600

    const blockRange = BLOCK_PAGES[currentSection - 1]

    const btnStyle = (active: boolean) => ({
      padding:'4px 12px', borderRadius:6, border:'1px solid rgba(255,255,255,0.2)',
      background: active ? '#c9a84c' : 'rgba(255,255,255,0.1)',
      color: active ? '#0d2340' : 'white',
      fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Sora,sans-serif'
    })

    return (
      <main style={{height:'100vh',display:'flex',flexDirection:'column',background:'#f7f4ee',fontFamily:'Sora,sans-serif',overflow:'hidden'}}>

        {/* Lab Values panel */}
        {showLabValues && (
          <div style={{position:'fixed',top:60,left:16,zIndex:8000,width:460,maxHeight:'80vh',background:'white',borderRadius:12,boxShadow:'0 8px 40px rgba(0,0,0,0.3)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <div style={{background:'#0d2340',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
              <div style={{color:'white',fontWeight:700,fontSize:13,fontFamily:'Georgia,serif'}}>Reference Laboratory Values</div>
              <button onClick={() => setShowLabValues(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.6)',fontSize:20,cursor:'pointer',lineHeight:1,padding:'0 4px'}}>×</button>
            </div>
            <div style={{overflowY:'auto'}}>
              {LAB_VALUES.map(cat => (
                <div key={cat.category}>
                  <div style={{padding:'8px 16px',background:'#f0ece0',fontSize:11,fontWeight:700,color:'#5a3e1b',textTransform:'uppercase',letterSpacing:'0.07em'}}>{cat.category}</div>
                  {cat.values.map((v,i) => (
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 16px',borderBottom:'0.5px solid #f5f0e8',gap:12}}>
                      <div style={{fontSize:12,color:'#1a1008'}}>{v.name}</div>
                      <div style={{fontSize:12,color:'#1a3a8a',fontWeight:500,flexShrink:0,textAlign:'right'}}>{v.ref}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calculator */}
        {showCalculator && (
          <div style={{position:'fixed',bottom:70,left:16,zIndex:8000,background:'#16213e',borderRadius:12,padding:14,boxShadow:'0 8px 40px rgba(0,0,0,0.5)',width:216}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{color:'rgba(255,255,255,0.4)',fontSize:10,letterSpacing:'0.1em'}}>CALCULATOR</div>
              <button onClick={() => setShowCalculator(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',fontSize:18,cursor:'pointer',padding:'0 2px'}}>×</button>
            </div>
            <div style={{background:'#0a1628',borderRadius:8,padding:'8px 12px',marginBottom:10,textAlign:'right',minHeight:52}}>
              {calcPrev && calcOp && <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:2}}>{calcPrev} {calcOp}</div>}
              <div style={{fontSize:26,color:'white',fontFamily:'Georgia,serif',wordBreak:'break-all'}}>{calcDisplay}</div>
            </div>
            {[['C','±','%','÷'],['7','8','9','×'],['4','5','6','−'],['1','2','3','+'],[' ','0','.','=']].map((row,ri) => (
              <div key={ri} style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:5,marginBottom:5}}>
                {row.map(btn => {
                  const isOp = ['÷','×','−','+','='].includes(btn)
                  const isFn = ['C','±','%'].includes(btn)
                  const isEmpty = btn === ' '
                  return (
                    <button key={btn} disabled={isEmpty}
                      onClick={() => {
                        if (btn==='C') calcClear()
                        else if (btn==='=') calcEquals()
                        else if ('÷×−+'.includes(btn)) calcDoOp(btn)
                        else if (btn==='±') setCalcDisplay(d => String(-parseFloat(d)))
                        else if (btn==='%') setCalcDisplay(d => String(parseFloat(d)/100))
                        else calcInput(btn)
                      }}
                      style={{padding:'9px 0',borderRadius:6,border:'none',
                        background: isEmpty?'transparent': isOp?'#c9a84c': isFn?'#2d3d6b':'#1e2d4a',
                        color: isOp?'#0d2340':'white',
                        fontSize:14,fontWeight:isOp||isFn?700:400,cursor:isEmpty?'default':'pointer',fontFamily:'Sora,sans-serif'}}>
                      {btn}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* Top bar */}
        <div style={{flexShrink:0,background:timeWarning?'#9e2a2a':'#0d2340',padding:'10px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:17,color:'white',fontWeight:600}}>{activeSession.exam_name}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',background:'rgba(255,255,255,0.08)',padding:'3px 10px',borderRadius:10}}>
              Section {currentSection} of 4
            </div>
            <div style={{display:'flex',gap:5}}>
              {sectionSubmitted.map((done, i) => (
                <div key={i} style={{width:8,height:8,borderRadius:'50%',background:done?'#6b7c3a':i===currentSection-1?'#c9a84c':'rgba(255,255,255,0.2)'}}/>
              ))}
            </div>
            <button onClick={() => { setShowLabValues(v => !v); setShowCalculator(false) }} style={btnStyle(showLabValues)}>Lab Values</button>
            <button onClick={() => { setShowCalculator(v => !v); setShowLabValues(false) }} style={btnStyle(showCalculator)}>Calculator</button>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:24}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Answered</div>
              <div style={{fontSize:16,color:'#c9a84c',fontWeight:700}}>{answeredCount}/50</div>
            </div>
            {sectionTimeLeft > 0 && (
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Section time</div>
                <div style={{fontSize:22,color:timeWarning?'#ffaaaa':'#c9a84c',fontWeight:700,fontFamily:'Georgia,serif'}}>{formatTime(sectionTimeLeft)}</div>
              </div>
            )}
            <button
              onClick={() => { if (window.confirm(`End Section ${currentSection}? You cannot return to it.`)) submitSection() }}
              disabled={submitting}
              style={{padding:'8px 20px',background:'#c9a84c',border:'none',borderRadius:8,color:'#0d2340',fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:700,cursor:submitting?'not-allowed':'pointer'}}>
              {submitting ? 'Saving...' : currentSection < 4 ? 'End Block →' : 'Submit Exam →'}
            </button>
          </div>
        </div>

        {/* Body: PDF + Answer Sheet */}
        <div style={{flex:1,display:'flex',overflow:'hidden'}}>
          {/* PDF viewer */}
          <div style={{flex:1,overflow:'hidden',background:'#e8e4dc',display:'flex',flexDirection:'column'}}>
            <div ref={pdfContainerRef} style={{flex:1,overflow:'auto',display:'flex',justifyContent:'center',padding:'16px'}}>
              {pdfUrl ? (
                <Document
                  file={pdfUrl}
                  loading={<div style={{color:'#8a7d6a',padding:40,fontSize:15,fontFamily:'Georgia,serif'}}>Loading PDF...</div>}
                  error={<div style={{color:'#c0574a',padding:40,fontSize:15,fontFamily:'Georgia,serif'}}>Failed to load PDF — contact your admin</div>}
                >
                  <Page pageNumber={pdfPage} width={pdfWidth * zoomLevel} renderTextLayer={false} renderAnnotationLayer={false}/>
                </Document>
              ) : (
                <div style={{color:'#8a7d6a',padding:40,fontSize:15,fontFamily:'Georgia,serif'}}>PDF unavailable — contact your admin</div>
              )}
            </div>
            {/* Page navigation + zoom */}
            <div style={{flexShrink:0,background:'#1a3a5c',padding:'8px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <button onClick={() => setPdfPage(p => Math.max(blockRange.start, p-1))} disabled={pdfPage<=blockRange.start}
                  style={{padding:'5px 14px',background:pdfPage<=blockRange.start?'rgba(255,255,255,0.08)':'#c9a84c',border:'none',borderRadius:6,color:pdfPage<=blockRange.start?'rgba(255,255,255,0.25)':'#0d2340',fontSize:13,fontWeight:700,cursor:pdfPage<=blockRange.start?'not-allowed':'pointer',fontFamily:'Sora,sans-serif'}}>
                  ← Prev
                </button>
                <span style={{fontSize:13,color:'rgba(255,255,255,0.7)',minWidth:90,textAlign:'center'}}>
                  Page {pdfPage} of {blockRange.end}
                </span>
                <button onClick={() => setPdfPage(p => Math.min(blockRange.end, p+1))} disabled={pdfPage>=blockRange.end}
                  style={{padding:'5px 14px',background:pdfPage>=blockRange.end?'rgba(255,255,255,0.08)':'#c9a84c',border:'none',borderRadius:6,color:pdfPage>=blockRange.end?'rgba(255,255,255,0.25)':'#0d2340',fontSize:13,fontWeight:700,cursor:pdfPage>=blockRange.end?'not-allowed':'pointer',fontFamily:'Sora,sans-serif'}}>
                  Next →
                </button>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <button onClick={() => setZoomLevel(z => Math.max(0.5, parseFloat((z-0.1).toFixed(1))))}
                  style={{width:28,height:28,borderRadius:6,border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.1)',color:'white',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                <span style={{fontSize:12,color:'rgba(255,255,255,0.6)',minWidth:36,textAlign:'center'}}>{Math.round(zoomLevel*100)}%</span>
                <button onClick={() => setZoomLevel(z => Math.min(2, parseFloat((z+0.1).toFixed(1))))}
                  style={{width:28,height:28,borderRadius:6,border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.1)',color:'white',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
              </div>
            </div>
          </div>

          {/* Answer sheet */}
          <div style={{width:264,flexShrink:0,background:'white',borderLeft:'0.5px solid #e8dfc8',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'10px 14px',borderBottom:'0.5px solid #f0ece0',flexShrink:0}}>
              <div style={{fontSize:12,fontWeight:600,color:'#0d2340'}}>Section {currentSection} — Answer Sheet</div>
              <div style={{fontSize:11,color:'#8a7d6a',marginTop:1}}>Q{sectionStart}–Q{sectionEnd} · {answeredCount} answered</div>
            </div>
            <div style={{flex:1,overflowY:'auto'}}>
              {Array.from({length:50},(_,i) => {
                const qNum = sectionStart + i
                const sel = curSecAnswers[qNum]
                return (
                  <div key={qNum} style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderBottom:'0.5px solid #faf8f4'}}>
                    <div style={{width:26,fontSize:11,color:'#a89870',fontWeight:500,flexShrink:0,textAlign:'right',paddingRight:4}}>{qNum}</div>
                    {(['A','B','C','D'] as const).map(opt => (
                      <button key={opt} onClick={() => saveSectionAnswer(qNum, opt)}
                        style={{flex:1,height:26,borderRadius:5,border:sel===opt?'none':'1px solid #d8cfc0',background:sel===opt?'#0d2340':'#f7f4ee',color:sel===opt?'#c9a84c':'#8a7d6a',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'Sora,sans-serif'}}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ─── RESULTS VIEW ─────────────────────────────────────────────────────────────
  if (view === 'results' && results) {
    const step1Color = results.predictedStep1
      ? results.predictedStep1 >= 240 ? '#6b7c3a'
        : results.predictedStep1 >= 220 ? '#c9a84c'
        : results.predictedStep1 >= 196 ? '#c07040'
        : '#c0574a'
      : '#8a7d6a'

    const BreakdownTable = ({ title, data }: { title: string, data: Record<string, {correct:number,total:number}> }) => {
      const rows = Object.entries(data).sort(([,a],[,b]) => (b.correct/b.total) - (a.correct/a.total))
      if (rows.length === 0) return null
      return (
        <div style={{background:'white',border:'0.5px solid #e8dfc8',borderRadius:12,overflow:'hidden',marginBottom:16}}>
          <div style={{background:'#0d2340',padding:'11px 18px'}}>
            <div style={{fontSize:13,fontWeight:600,color:'white'}}>{title}</div>
          </div>
          <div style={{padding:'8px 0'}}>
            {rows.map(([name, s]) => {
              const pct = Math.round((s.correct/s.total)*100)
              return (
                <div key={name} style={{display:'flex',alignItems:'center',gap:12,padding:'7px 18px',borderBottom:'0.5px solid #faf8f4'}}>
                  <div style={{width:160,fontSize:13,color:'#1a1008',flexShrink:0}}>{name}</div>
                  <div style={{flex:1,height:7,background:'#f0ece0',borderRadius:4,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${pct}%`,background:scoreColor(pct),borderRadius:4}}/>
                  </div>
                  <div style={{width:36,fontSize:13,fontWeight:700,color:scoreColor(pct),textAlign:'right',flexShrink:0}}>{pct}%</div>
                  <div style={{width:52,fontSize:11,color:'#a89870',flexShrink:0,textAlign:'right'}}>{s.correct}/{s.total}</div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    const filteredQs: typeof results.questionDetails = (results.questionDetails || []).filter((q: any) =>
      resultsFilter === 'all' ? true : resultsFilter === 'correct' ? q.correct : !q.correct
    )

    const hasSystem = Object.keys(results.systemBreakdown || {}).length > 0
    const hasTopic = Object.keys(results.topicBreakdown || {}).length > 0
    const hasDiscipline = Object.keys(results.disciplineBreakdown || {}).length > 0

    return (
      <main style={{minHeight:'100vh',display:'flex',background:'#f7f4ee',fontFamily:'Sora,sans-serif',fontSize:'17.6px'}}>

        {/* Sidebar */}
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

        {/* Content */}
        <div style={{flex:1,minWidth:0,overflowY:'auto',padding:'32px 36px'}}>
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:30,color:'#0d2340',letterSpacing:-0.5}}>Score Report</div>
            <div style={{fontSize:14,color:'#8a7d6a',marginTop:5}}>{results.examName} · {new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>
          </div>

          {/* Answer key warning */}
          {(!results.questionDetails || results.questionDetails.length === 0) && (
            <div style={{background:'#fff3cd',border:'1px solid #ffc107',borderRadius:10,padding:'12px 18px',marginBottom:16,fontSize:13,color:'#856404'}}>
              ⚠ Answer key could not be loaded — breakdown and question details are unavailable. Check the browser console (F12 → Console) for details, or contact your admin to verify the answer key file.
            </div>
          )}

          {/* Header card */}
          <div style={{background:'#0d2340',borderRadius:14,padding:'24px 28px',marginBottom:20,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontFamily:'Georgia,serif',fontSize:22,color:'white',marginBottom:6}}>{results.examName}</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,0.45)'}}>
                {results.timeUp ? '⏰ Time expired · ' : ''}
                {formatDuration(results.actualMinutes)} · {results.withinLimit ? '✓ Within time limit' : '⚠ Over time limit'}
              </div>
            </div>
            {results.predictedStep1 && (
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:4}}>Predicted Step 1</div>
                <div style={{fontFamily:'Georgia,serif',fontSize:48,color:step1Color,fontWeight:700,lineHeight:1}}>{results.predictedStep1}</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,0.35)',marginTop:4}}>
                  {results.predictedStep1>=240?'Excellent':results.predictedStep1>=220?'Good':results.predictedStep1>=196?'Passing':'Below passing'}
                </div>
              </div>
            )}
          </div>

          {/* Score cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
            {[
              {label:'Raw Score', value:`${results.correct}/${results.totalQ}`, sub:null, color:'#0d2340'},
              {label:'Percent Correct', value:`${results.percentCorrect}%`, sub:null, color:scoreColor(results.percentCorrect)},
              {label:'Correct', value:String(results.correct), sub:'questions', color:'#6b7c3a'},
              {label:'Incorrect', value:String(results.wrongCount), sub:'questions', color:'#c0574a'},
            ].map(c => (
              <div key={c.label} style={{background:'white',border:'0.5px solid #e8dfc8',borderRadius:12,padding:'18px',textAlign:'center'}}>
                <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.07em',color:'#a89870',marginBottom:8}}>{c.label}</div>
                <div style={{fontFamily:'Georgia,serif',fontSize:32,color:c.color,fontWeight:700}}>{c.value}</div>
                {c.sub && <div style={{fontSize:11,color:'#8a7d6a',marginTop:3}}>{c.sub}</div>}
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div style={{display:'flex',gap:0,marginBottom:20,borderBottom:'2px solid #e8dfc8'}}>
            {([
              {key:'system', label:'By System', has: hasSystem},
              {key:'subject', label:'By Subject', has: hasDiscipline},
              {key:'topic', label:'By Topic', has: hasTopic},
              {key:'questions', label:'Questions', has: true},
            ] as const).map(t => (
              <button key={t.key} onClick={() => setResultsTab(t.key)}
                style={{padding:'10px 22px',border:'none',borderBottom: resultsTab===t.key ? '2px solid #c9a84c' : '2px solid transparent',marginBottom:-2,
                  background:'transparent',fontSize:13,fontWeight:resultsTab===t.key?700:500,
                  color:resultsTab===t.key?'#0d2340':'#a89870',cursor:'pointer',fontFamily:'Sora,sans-serif',
                  opacity: t.has ? 1 : 0.45}}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {resultsTab === 'system' && (hasSystem
            ? <BreakdownTable title="Performance by Organ System" data={results.systemBreakdown}/>
            : <div style={{padding:'32px',textAlign:'center',color:'#a89870',fontSize:14}}>No system breakdown available</div>
          )}
          {resultsTab === 'subject' && (hasDiscipline
            ? <BreakdownTable title="Performance by Subject" data={results.disciplineBreakdown}/>
            : <div style={{padding:'32px',textAlign:'center',color:'#a89870',fontSize:14}}>No subject breakdown available</div>
          )}
          {resultsTab === 'topic' && (hasTopic
            ? <BreakdownTable title="Performance by Topic" data={results.topicBreakdown}/>
            : <div style={{padding:'32px',textAlign:'center',color:'#a89870',fontSize:14}}>No topic breakdown available</div>
          )}
          {resultsTab === 'questions' && (
            <div style={{background:'white',border:'0.5px solid #e8dfc8',borderRadius:12,overflow:'hidden',marginBottom:24}}>
              <div style={{background:'#0d2340',padding:'12px 18px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{fontSize:14,fontWeight:600,color:'white'}}>Question Review</div>
                <div style={{display:'flex',gap:6}}>
                  {(['all','correct','incorrect'] as const).map(f => (
                    <button key={f} onClick={() => setResultsFilter(f)}
                      style={{padding:'4px 14px',borderRadius:6,border:'none',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Sora,sans-serif',
                        background:resultsFilter===f?'#c9a84c':'rgba(255,255,255,0.12)',
                        color:resultsFilter===f?'#0d2340':'rgba(255,255,255,0.6)'}}>
                      {f==='all'?`All (${results.questionDetails?.length||0})`:f==='correct'?`✓ Correct (${results.correct})`:`✗ Incorrect (${results.wrongCount})`}
                    </button>
                  ))}
                </div>
              </div>
              {filteredQs.length === 0 ? (
                <div style={{padding:'32px',textAlign:'center',color:'#a89870',fontSize:14}}>No questions to display</div>
              ) : (
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead>
                      <tr style={{background:'#faf8f4'}}>
                        {['Q#','System','Subject','Topic','Concept','Your Answer','Correct','Result'].map(h => (
                          <th key={h} style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.07em',color:'#a89870',padding:'9px 14px',textAlign:'left',borderBottom:'0.5px solid #f0ece0',whiteSpace:'nowrap'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQs.map((q: any, i: number) => (
                        <tr key={q.qNum} style={{borderBottom:'0.5px solid #faf8f4',background:i%2===0?'white':'#fdfcfa'}}>
                          <td style={{padding:'9px 14px',fontSize:13,color:'#0d2340',fontWeight:600,width:40}}>{q.qNum}</td>
                          <td style={{padding:'9px 14px',fontSize:12,color:'#3d3020',whiteSpace:'nowrap'}}>{q.system||'—'}</td>
                          <td style={{padding:'9px 14px',fontSize:12,color:'#3d3020',whiteSpace:'nowrap'}}>{q.discipline||'—'}</td>
                          <td style={{padding:'9px 14px',fontSize:12,color:'#3d3020'}}>{q.topic||'—'}</td>
                          <td style={{padding:'9px 14px',fontSize:11,color:'#8a7d6a',maxWidth:220}}>{q.concept||'—'}</td>
                          <td style={{padding:'9px 14px',fontSize:13,fontWeight:700,color:q.correct?'#6b7c3a':'#c0574a',textAlign:'center',width:56}}>{q.studentAnswer}</td>
                          <td style={{padding:'9px 14px',fontSize:13,fontWeight:700,color:'#0d2340',textAlign:'center',width:56}}>{q.correctAnswer||'—'}</td>
                          <td style={{padding:'9px 14px',textAlign:'center',width:44}}>
                            <span style={{fontSize:15,color:q.correct?'#6b7c3a':'#c0574a'}}>{q.correct?'✓':'✗'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{display:'flex',gap:12,maxWidth:500}}>
            <button onClick={() => { setView('list'); setActiveSession(null); setActiveSheet(null); setResults(null) }}
              style={{flex:1,height:46,background:'white',border:'1px solid #e8dfc8',borderRadius:10,color:'#0d2340',fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer'}}>
              ← Back to exams
            </button>
            <button onClick={() => router.push('/dashboard/nbme')}
              style={{flex:1,height:46,background:'#0d2340',border:'none',borderRadius:10,color:'#c9a84c',fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer'}}>
              NBME tracker →
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────────────────
  return (
    <main style={{minHeight:'100vh',display:'flex',background:'#f7f4ee',fontFamily:'Sora,sans-serif',fontSize:'17.6px'}}>

      {/* Passcode modal */}
      {showPasscode && (
        <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'white',borderRadius:16,padding:'32px',width:360,fontFamily:'Sora,sans-serif'}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:20,color:'#0d2340',marginBottom:8}}>Accommodation Passcode</div>
            <div style={{fontSize:13,color:'#8a7d6a',marginBottom:20,lineHeight:1.6}}>
              Enter your accommodation passcode for extended time, or skip to take with standard timing.
            </div>
            <input
              type="text"
              value={passcodeInput}
              onChange={e => setPasscodeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePasscodeSubmit()}
              placeholder="Enter passcode"
              autoFocus
              style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'1.5px solid #d8cfc0',fontSize:14,fontFamily:'Sora,sans-serif',boxSizing:'border-box',marginBottom:14,outline:'none'}}
            />
            <div style={{display:'flex',gap:10}}>
              <button onClick={() => handlePasscodeSubmit(true)}
                style={{flex:1,height:40,background:'#f7f4ee',border:'1px solid #d8cfc0',borderRadius:8,fontSize:13,color:'#3d3020',fontFamily:'Sora,sans-serif',cursor:'pointer',fontWeight:500}}>
                Skip
              </button>
              <button onClick={() => handlePasscodeSubmit(false)}
                style={{flex:2,height:40,background:'#0d2340',border:'none',borderRadius:8,fontSize:13,color:'#c9a84c',fontFamily:'Sora,sans-serif',cursor:'pointer',fontWeight:600}}>
                Apply & Start →
              </button>
            </div>
          </div>
        </div>
      )}

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
              {exams.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{padding:'24px 16px',textAlign:'center',fontSize:14,color:'#8a7d6a'}}>No exams available</td>
                </tr>
              ) : exams.map((exam, i) => {
                const attempted = pastSessions.filter(s => s.exam_id === exam.id && s.status === 'submitted')
                const bestScore = attempted.length > 0 ? Math.max(...attempted.map((s:any) => s.predicted_step1 || s.percent_correct || 0)) : null
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
                  {['Exam','Date','Score','Wrong','Predicted Step 1','Time','Status',''].map(h => (
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
                    <td style={{padding:'12px 16px'}}>
                      <button onClick={() => viewSessionReport(session)} disabled={submitting}
                        style={{padding:'6px 14px',background:'#0d2340',border:'none',borderRadius:8,fontSize:12,color:'#c9a84c',fontWeight:600,cursor:submitting?'not-allowed':'pointer',whiteSpace:'nowrap'}}>
                        View Report
                      </button>
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
