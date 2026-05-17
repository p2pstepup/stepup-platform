'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'

const accColor = (pct: number) => {
  if (pct >= 75) return '#6b7c3a'
  if (pct >= 65) return '#c9a84c'
  if (pct >= 55) return '#c07040'
  return '#9e2a2a'
}
const accLabel = (pct: number) => {
  if (pct >= 75) return 'Strong'
  if (pct >= 65) return 'Developing'
  if (pct >= 55) return 'Needs work'
  return 'Priority'
}

type SystemStat = {
  system: string
  correct: number
  total: number
  subtopics: Record<string, { correct: number; total: number }>
}

export default function WeaknessMap() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [systemMap, setSystemMap] = useState<Record<string, SystemStat>>({})
  const [examSessionCount, setExamSessionCount] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)

      const map: Record<string, SystemStat> = {}

      const add = (system: string, correct: boolean, topic?: string | null) => {
        if (!system) return
        if (!map[system]) map[system] = { system, correct: 0, total: 0, subtopics: {} }
        map[system].total++
        if (correct) map[system].correct++
        if (topic) {
          if (!map[system].subtopics[topic]) map[system].subtopics[topic] = { correct: 0, total: 0 }
          map[system].subtopics[topic].total++
          if (correct) map[system].subtopics[topic].correct++
        }
      }

      // 1. Qbank question logs (topic = system name)
      const { data: qbSessions } = await supabase.from('qbank_sessions').select('id').eq('student_id', user.id)
      const qbSessionIds = (qbSessions || []).map((s: any) => s.id)
      if (qbSessionIds.length > 0) {
        const { data: qbLogs } = await supabase.from('qbank_question_logs').select('topic, answer').in('session_id', qbSessionIds)
        ;(qbLogs || []).forEach((l: any) => { if (l.topic) add(l.topic, l.answer === 'Correct') })
      }

      // 2. NBME question logs (topic = system name)
      const { data: nbmeScores } = await supabase.from('nbme_scores').select('id').eq('student_id', user.id)
      const nbmeIds = (nbmeScores || []).map((s: any) => s.id)
      if (nbmeIds.length > 0) {
        const { data: nLogs } = await supabase.from('nbme_question_logs').select('topic, answer').in('exam_id', nbmeIds)
        ;(nLogs || []).forEach((l: any) => { if (l.topic) add(l.topic, l.answer === 'Correct') })
      }

      // 3. Exam center question logs (system + topic subtopics)
      const { data: examLogs } = await supabase.from('exam_question_logs').select('system, topic, correct, exam_session_id').eq('student_id', user.id)
      ;(examLogs || []).forEach((l: any) => { if (l.system) add(l.system, l.correct, l.topic) })
      const sessionIds = [...new Set((examLogs || []).map((l: any) => l.exam_session_id).filter(Boolean))]
      setExamSessionCount(sessionIds.length)

      const total = Object.values(map).reduce((a, s) => a + s.total, 0)
      setTotalQuestions(total)
      setSystemMap(map)
      setLoading(false)
    }
    init()
  }, [])

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
      { name: 'NBME Score Tracker', path: '/dashboard/nbme' },
      { name: 'Weakness Map', path: '/dashboard/weakness', active: true },
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

  const systems = Object.values(systemMap).sort((a, b) => {
    const accA = a.total > 0 ? a.correct / a.total : 1
    const accB = b.total > 0 ? b.correct / b.total : 1
    return accA - accB
  })

  const totalCorrect = systems.reduce((a, s) => a + s.correct, 0)
  const overallAcc = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null
  const hasData = systems.length > 0

  return (
    <main style={{ minHeight: '100vh', display: 'flex', background: '#f7f4ee', fontFamily: 'Sora, sans-serif', fontSize: '17.6px' }}>

      {/* Sidebar */}
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
              {group.items.map((item: { name: string; path: string; active?: boolean }) => (
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

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '32px 36px' }}>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5 }}>Weakness Map</div>
          <div style={{ fontSize: 14, color: '#8a7d6a', marginTop: 5 }}>Built from Qbank · NBME logs · Exam Center — sorted by weakest system first</div>
        </div>

        {!hasData ? (
          <div style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#0d2340', marginBottom: 10 }}>No data yet</div>
            <div style={{ fontSize: 14, color: '#8a7d6a', maxWidth: 420, margin: '0 auto 24px', lineHeight: 1.7 }}>
              Complete an exam in the Exam Center or log Qbank sessions to build your weakness map.
            </div>
            <div onClick={() => router.push('/dashboard/exams')}
              style={{ display: 'inline-flex', padding: '12px 24px', background: '#0d2340', borderRadius: 10, fontSize: 14, color: '#c9a84c', fontWeight: 600, cursor: 'pointer' }}>
              Go to Exam Center →
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
              {[
                { label: 'Exams completed', value: examSessionCount.toString(), sub: 'via Exam Center' },
                { label: 'Questions tracked', value: totalQuestions.toLocaleString(), sub: 'across all sources' },
                { label: 'Overall accuracy', value: overallAcc !== null ? `${overallAcc}%` : '—', sub: overallAcc !== null ? accLabel(overallAcc) : 'Log data to see' },
                { label: 'Systems tracked', value: systems.length.toString(), sub: `${systems.filter(s => Math.round((s.correct/s.total)*100) < 65).length} need attention` },
              ].map((m, i) => (
                <div key={i} style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a89870', marginBottom: 8 }}>{m.label}</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340' }}>{m.value}</div>
                  <div style={{ fontSize: 12, color: '#a89870', marginTop: 4 }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* System bars */}
            <div style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '16px 22px', borderBottom: '0.5px solid #f0ece0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#0d2340' }}>Performance by System</div>
                  <div style={{ fontSize: 12, color: '#8a7d6a', marginTop: 2 }}>Click + to expand topic detail</div>
                </div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  {[
                    { color: '#9e2a2a', label: 'Priority <55%' },
                    { color: '#c07040', label: 'Needs work 55–64%' },
                    { color: '#c9a84c', label: 'Developing 65–74%' },
                    { color: '#6b7c3a', label: 'Strong 75%+' },
                  ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }}/>
                      <span style={{ fontSize: 11, color: '#8a7d6a' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {systems.map((s, idx) => {
                const acc = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
                const color = accColor(acc)
                const isOpen = !!expanded[s.system]
                const subtopicList = Object.entries(s.subtopics)
                  .map(([name, d]) => ({ name, acc: Math.round((d.correct / d.total) * 100), correct: d.correct, total: d.total }))
                  .sort((a, b) => a.acc - b.acc)
                const hasSubtopics = subtopicList.length > 0

                return (
                  <div key={s.system} style={{ borderBottom: idx < systems.length - 1 ? '0.5px solid #f0ece0' : 'none' }}>
                    {/* System row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 22px' }}>
                      <div style={{ width: 130, fontSize: 13, fontWeight: 600, color: '#0d2340', flexShrink: 0 }}>{s.system}</div>
                      <div style={{ flex: 1, height: 8, background: '#f0ece0', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${acc}%`, background: color, borderRadius: 4, transition: 'width 0.4s' }}/>
                      </div>
                      <div style={{ width: 40, fontSize: 14, fontWeight: 700, color, textAlign: 'right', flexShrink: 0 }}>{acc}%</div>
                      <div style={{ width: 90, flexShrink: 0 }}>
                        <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 10, background: `${color}18`, color, fontWeight: 600 }}>{accLabel(acc)}</span>
                      </div>
                      <div style={{ width: 60, fontSize: 11, color: '#a89870', flexShrink: 0 }}>{s.correct}/{s.total}</div>
                      <button
                        onClick={() => setExpanded(e => ({ ...e, [s.system]: !e[s.system] }))}
                        disabled={!hasSubtopics}
                        style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #d8cfc0', background: isOpen ? '#0d2340' : '#f7f4ee', color: isOpen ? '#c9a84c' : hasSubtopics ? '#5a4f3a' : '#c8c0b0', fontSize: 15, fontWeight: 700, cursor: hasSubtopics ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, lineHeight: 1 }}>
                        {isOpen ? '−' : '+'}
                      </button>
                    </div>

                    {/* Subtopic expand */}
                    {isOpen && hasSubtopics && (
                      <div style={{ background: '#faf8f4', borderTop: '0.5px solid #f0ece0', padding: '10px 22px 14px 52px' }}>
                        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a89870', marginBottom: 10 }}>Topics within {s.system}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                          {subtopicList.map(t => (
                            <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 220, fontSize: 12, color: '#3d3020', flexShrink: 0 }}>{t.name}</div>
                              <div style={{ flex: 1, height: 5, background: '#e8dfc8', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${t.acc}%`, background: accColor(t.acc), borderRadius: 3 }}/>
                              </div>
                              <div style={{ width: 36, fontSize: 12, fontWeight: 700, color: accColor(t.acc), textAlign: 'right', flexShrink: 0 }}>{t.acc}%</div>
                              <div style={{ width: 44, fontSize: 11, color: '#a89870', flexShrink: 0, textAlign: 'right' }}>{t.correct}/{t.total}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

          </div>
        )}
      </div>
    </main>
  )
}
