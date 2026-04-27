'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'

const TOPICS = ['Cardiology','Psychiatry','Renal','Biochemistry','Pharmacology','Microbiology','Anatomy','Pathology','Physiology','Reproductive','Neurology','Endocrinology','Immunology','Mixed']
const REASONS = ['Knowledge','Knowledge Gap','Silly Mistake','Luck']

type LogEntry = { topic: string; answer: string; reason: string | null; source: 'qbank' | 'nbme' }

export default function WeaknessMap() {
  const [user, setUser] = useState<{id: string; email?: string} | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [sessions, setSessions] = useState<Array<{id: string; topic: string; questions_total: number; questions_correct: number}>>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
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

      const [{ data: sessionsData }, { data: nbmeData }] = await Promise.all([
        supabase.from('qbank_sessions').select('id, topic, questions_total, questions_correct').eq('student_id', user.id),
        supabase.from('nbme_scores').select('id').eq('student_id', user.id),
      ])

      setSessions(sessionsData || [])

      const sessionIds = (sessionsData || []).map((s: {id: string}) => s.id)
      const examIds = (nbmeData || []).map((s: {id: string}) => s.id)

      const [qLogsRes, nLogsRes] = await Promise.all([
        sessionIds.length > 0
          ? supabase.from('qbank_question_logs').select('topic, answer, reason').in('session_id', sessionIds)
          : Promise.resolve({ data: [] }),
        examIds.length > 0
          ? supabase.from('nbme_question_logs').select('topic, answer, reason').in('exam_id', examIds)
          : Promise.resolve({ data: [] }),
      ])

      const combined: LogEntry[] = [
        ...((qLogsRes.data || []).map((l: {topic: string; answer: string; reason: string | null}) => ({ ...l, source: 'qbank' as const }))),
        ...((nLogsRes.data || []).map((l: {topic: string; answer: string; reason: string | null}) => ({ ...l, source: 'nbme' as const }))),
      ]
      setLogs(combined)
      setLoading(false)
    }
    init()
  }, [])

  const getAccColor = (acc: number) => {
    if (acc >= 75) return '#6b7c3a'
    if (acc >= 65) return '#c9a84c'
    if (acc >= 55) return '#c07040'
    return '#9e2a2a'
  }
  const getAccLabel = (acc: number) => {
    if (acc >= 75) return 'Strong'
    if (acc >= 65) return 'Developing'
    if (acc >= 55) return 'Needs work'
    return 'Priority'
  }

  // Session-level stats per topic
  const sessionStats = (topic: string) => {
    const ts = sessions.filter(s => s.topic === topic)
    if (ts.length === 0) return null
    const total = ts.reduce((a, s) => a + s.questions_total, 0)
    const correct = ts.reduce((a, s) => a + s.questions_correct, 0)
    return { total, correct, acc: Math.round((correct / total) * 100), sessions: ts.length }
  }

  // Question log stats per topic (both sources)
  const logStats = (topic: string) => {
    const tl = logs.filter(l => l.topic === topic)
    if (tl.length === 0) return null
    const wrong = tl.filter(l => l.answer === 'Wrong').length
    const correct = tl.filter(l => l.answer === 'Correct').length
    const total = tl.length
    const acc = Math.round((correct / total) * 100)
    const qbankCount = tl.filter(l => l.source === 'qbank').length
    const nbmeCount = tl.filter(l => l.source === 'nbme').length
    const reasons: Record<string, number> = {}
    tl.filter(l => l.answer === 'Wrong' && l.reason).forEach(l => {
      reasons[l.reason!] = (reasons[l.reason!] || 0) + 1
    })
    return { total, correct, wrong, acc, qbankCount, nbmeCount, reasons }
  }

  const topicsWithSessions = TOPICS.filter(t => sessionStats(t) !== null)
  const topicsWithLogs = TOPICS.filter(t => logStats(t) !== null)
  const topicsWithoutData = TOPICS.filter(t => sessionStats(t) === null && logStats(t) === null)

  const sortedBySessions = [...topicsWithSessions].sort((a, b) => (sessionStats(a)?.acc || 0) - (sessionStats(b)?.acc || 0))
  const sortedByLogs = [...topicsWithLogs].sort((a, b) => (logStats(b)?.wrong || 0) - (logStats(a)?.wrong || 0))

  const totalLogged = logs.length
  const totalWrong = logs.filter(l => l.answer === 'Wrong').length
  const totalCorrect = logs.filter(l => l.answer === 'Correct').length
  const overallLogAcc = totalLogged > 0 ? Math.round((totalCorrect / totalLogged) * 100) : null

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

  const hasAnyData = sessions.length > 0 || logs.length > 0

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
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5 }}>Weakness Map</div>
          <div style={{ fontSize: 14, color: '#8a7d6a', marginTop: 5 }}>Built from Qbank sessions · Qbank question logs · NBME question logs</div>
        </div>

        {!hasAnyData ? (
          <div style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#0d2340', marginBottom: 10 }}>No data yet</div>
            <div style={{ fontSize: 14, color: '#8a7d6a', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.7 }}>
              Log Qbank sessions, then use the Question Log on the Qbank Tracker or NBME Score Tracker to review individual questions. Your weakness map builds automatically.
            </div>
            <div onClick={() => router.push('/dashboard/qbank')}
              style={{ display: 'inline-flex', padding: '12px 24px', background: '#0d2340', borderRadius: 10, fontSize: 14, color: '#c9a84c', fontWeight: 600, cursor: 'pointer' }}>
              Go to Qbank Tracker →
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
              {[
                { label: 'Qbank sessions', value: sessions.length.toString(), delta: `${sessions.reduce((a,s) => a + s.questions_total, 0).toLocaleString()} total questions` },
                { label: 'Questions reviewed', value: totalLogged.toString(), delta: `${logs.filter(l=>l.source==='qbank').length} Qbank · ${logs.filter(l=>l.source==='nbme').length} NBME` },
                { label: 'Log accuracy', value: overallLogAcc !== null ? `${overallLogAcc}%` : '—', delta: overallLogAcc !== null ? `${totalWrong} wrong logged` : 'Log questions to see' },
                { label: 'Topics covered', value: topicsWithSessions.length.toString(), delta: `${topicsWithoutData.length} not yet practiced` },
              ].map((m, i) => (
                <div key={i} style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a89870', marginBottom: 8 }}>{m.label}</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340' }}>{m.value}</div>
                  <div style={{ fontSize: 12, color: '#a89870', marginTop: 4 }}>{m.delta}</div>
                </div>
              ))}
            </div>

            {/* Priority topics from sessions */}
            {sortedBySessions.filter(t => (sessionStats(t)?.acc || 0) < 65).length > 0 && (
              <div style={{ background: '#fff5f5', border: '1px solid #f5c6c6', borderRadius: 12, padding: '18px 22px' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#9e2a2a', marginBottom: 14 }}>Priority focus — session accuracy below 65%</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {sortedBySessions.filter(t => (sessionStats(t)?.acc || 0) < 65).map(topic => {
                    const stats = sessionStats(topic)!
                    return (
                      <div key={topic} style={{ background: 'white', border: '0.5px solid #f5c6c6', borderRadius: 9, padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#0d2340' }}>{topic}</div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: getAccColor(stats.acc) }}>{stats.acc}%</span>
                        </div>
                        <div style={{ height: 6, background: '#f0ece0', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                          <div style={{ height: '100%', background: getAccColor(stats.acc), width: `${stats.acc}%`, borderRadius: 3 }}/>
                        </div>
                        <div style={{ fontSize: 11, color: '#a89870' }}>{stats.total} questions · {stats.sessions} sessions</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Question log analysis */}
            {topicsWithLogs.length > 0 && (
              <div style={{ background: '#0d2340', borderRadius: 12, padding: '18px 22px' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 4 }}>Question Log Analysis</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 18 }}>Per-question data from Qbank + NBME logs · sorted by most wrong answers</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sortedByLogs.map(topic => {
                    const ls = logStats(topic)!
                    const maxWrong = Math.max(...sortedByLogs.map(t => logStats(t)?.wrong || 0))
                    return (
                      <div key={topic} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 16px', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: ls.reasons && Object.keys(ls.reasons).length > 0 ? 10 : 0 }}>
                          <div style={{ width: 120, flexShrink: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{topic}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                              {ls.qbankCount > 0 && `${ls.qbankCount}Q Qbank`}
                              {ls.qbankCount > 0 && ls.nbmeCount > 0 && ' · '}
                              {ls.nbmeCount > 0 && `${ls.nbmeCount}Q NBME`}
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: 3, height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                              <div style={{ background: '#4a7a2a', width: `${(ls.correct / ls.total) * 100}%`, transition: 'width 0.3s' }}/>
                              <div style={{ background: '#9e2a2a', width: `${(ls.wrong / ls.total) * 100}%`, transition: 'width 0.3s' }}/>
                            </div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{ls.correct} correct · {ls.wrong} wrong</div>
                          </div>
                          <div style={{ flexShrink: 0, textAlign: 'right' }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: getAccColor(ls.acc) }}>{ls.acc}%</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{ls.total} logged</div>
                          </div>
                          {/* Wrong answer bar relative to worst topic */}
                          {maxWrong > 0 && ls.wrong > 0 && (
                            <div style={{ width: 80, flexShrink: 0 }}>
                              <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: '#c0574a', borderRadius: 3, width: `${(ls.wrong / maxWrong) * 100}%` }}/>
                              </div>
                              <div style={{ fontSize: 10, color: '#f5a0a0', marginTop: 2 }}>{ls.wrong} wrong</div>
                            </div>
                          )}
                        </div>

                        {/* Reason breakdown */}
                        {Object.keys(ls.reasons).length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 8, borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
                            {REASONS.filter(r => ls.reasons[r]).map(r => (
                              <span key={r} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '0.5px solid rgba(201,168,76,0.3)' }}>
                                {r}: {ls.reasons[r]}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              {[
                { color: '#9e2a2a', label: 'Priority (<55%)' },
                { color: '#c07040', label: 'Needs work (55–64%)' },
                { color: '#c9a84c', label: 'Developing (65–74%)' },
                { color: '#6b7c3a', label: 'Strong (75%+)' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }}/>
                  <span style={{ fontSize: 12, color: '#8a7d6a' }}>{l.label}</span>
                </div>
              ))}
            </div>

            {/* All subjects — session accuracy */}
            {topicsWithSessions.length > 0 && (
              <div style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '18px 22px' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 4 }}>Session accuracy by subject</div>
                <div style={{ fontSize: 12, color: '#8a7d6a', marginBottom: 16 }}>Based on Qbank session blocks</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sortedBySessions.map(topic => {
                    const stats = sessionStats(topic)!
                    return (
                      <div key={topic} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 110, fontSize: 13, color: '#3d3020', flexShrink: 0 }}>{topic}</div>
                        <div style={{ flex: 1, height: 8, background: '#f0ece0', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: getAccColor(stats.acc), width: `${stats.acc}%`, borderRadius: 4 }}/>
                        </div>
                        <div style={{ width: 36, fontSize: 13, fontWeight: 700, color: getAccColor(stats.acc), textAlign: 'right', flexShrink: 0 }}>{stats.acc}%</div>
                        <div style={{ width: 80, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: `${getAccColor(stats.acc)}18`, color: getAccColor(stats.acc), fontWeight: 500 }}>{getAccLabel(stats.acc)}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#a89870', width: 80, flexShrink: 0 }}>{stats.total}Q · {stats.sessions} sessions</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Not yet practiced */}
            {topicsWithoutData.length > 0 && (
              <div style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '18px 22px' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 14 }}>Not yet practiced</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {topicsWithoutData.map(t => (
                    <span key={t} style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8, background: '#f7f4ee', color: '#8a7d6a', border: '0.5px solid #e8dfc8' }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </main>
  )
}
