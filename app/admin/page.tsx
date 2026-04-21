'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase'
import {
  StudentProfiles, AnnouncementForm, FeedbackTab, SlidesManager, RecordingsManager,
  NotesManager, ResourcesManager, ExamsManager, ScheduleManager, AssignmentsManager,
  StudyScheduleManager, CourseDocsManager, ExamReports
} from '../tutor/components'

const label = (style: object, children: React.ReactNode) =>
  <div style={{fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: '#8a7d6a', marginBottom: 4, ...style}}>{children}</div>

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [tutors, setTutors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const [{ data: s }, { data: t }] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'student').order('full_name'),
        supabase.from('profiles').select('*').eq('role', 'tutor').order('full_name'),
      ])
      setStudents(s || [])
      setTutors(t || [])
      setLoading(false)
    }
    init()
  }, [])

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return (
    <main style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee'}}>
      <div style={{fontFamily: 'Georgia, serif', fontSize: 24, color: '#0d2340'}}>Loading admin dashboard...</div>
    </main>
  )

  const navGroups = [
    {section: 'Overview', items: [{name: 'Command Center', tab: 'overview'}]},
    {section: 'Monitor · Students', items: [
      {name: 'Student Roster', tab: 'roster'},
      {name: 'Exam Performance', tab: 'examperformance'},
      {name: 'Attendance Report', tab: 'attendancereport'},
      {name: 'Assignment Progress', tab: 'assignmentprogress'},
    ]},
    {section: 'Monitor · Tutors', items: [
      {name: 'Tutor Activity', tab: 'tutoractivity'},
      {name: 'Student Plans', tab: 'studentplans'},
      {name: 'Meeting Notes', tab: 'meetingnotes'},
      {name: 'Accountability Reports', tab: 'accountability'},
    ]},
    {section: 'Communication', items: [
      {name: 'Notify Students', tab: 'notifystudents'},
      {name: 'Notify Tutors', tab: 'notifytutors'},
      {name: 'Announcements', tab: 'announcements'},
      {name: 'Student Feedback', tab: 'feedback'},
    ]},
    {section: 'Content', items: [
      {name: 'Manage Schedule', tab: 'schedule'},
      {name: 'Manage Slides', tab: 'slides'},
      {name: 'Manage Recordings', tab: 'recordings'},
      {name: 'Manage HY Notes', tab: 'notes'},
      {name: 'Manage Resources', tab: 'resources'},
      {name: 'Manage Exams', tab: 'exams'},
      {name: 'Course Documents', tab: 'coursedocs'},
    ]},
    {section: 'Manage', items: [
      {name: 'Student Profiles', tab: 'profiles'},
      {name: 'Assign Tasks', tab: 'assignments'},
      {name: 'Study Schedules', tab: 'studyschedule'},
      {name: 'User Management', tab: 'usermanagement'},
    ]},
  ]

  return (
    <main style={{minHeight: '100vh', display: 'flex', background: '#f7f4ee', fontFamily: 'Sora, sans-serif', fontSize: '17.6px'}}>
      <nav style={{width: 230, flexShrink: 0, background: '#0d2340', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0}}>
        <div style={{padding: '20px 18px 16px', borderBottom: '0.5px solid rgba(201,168,76,0.2)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <div style={{width: 36, height: 36, background: '#c9a84c', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <div style={{width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '11px solid #0d2340'}}/>
            </div>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 20, color: 'white', fontWeight: 600}}>StepUp</div>
          </div>
          <div style={{fontSize: 10, color: '#c9a84c', letterSpacing: '0.09em', textTransform: 'uppercase', paddingLeft: 46, marginTop: 3}}>Admin Dashboard</div>
        </div>
        <div style={{padding: '8px 10px', flex: 1, overflowY: 'auto'}}>
          {navGroups.map(group => (
            <div key={group.section}>
              <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.28)', padding: '0 8px', margin: '12px 0 4px'}}>{group.section}</div>
              {group.items.map(item => (
                <div key={item.tab} onClick={() => setActiveTab(item.tab)}
                  style={{display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, color: activeTab === item.tab ? '#c9a84c' : 'rgba(255,255,255,0.55)', fontSize: 12.5, marginBottom: 2, background: activeTab === item.tab ? 'rgba(255,255,255,0.09)' : 'transparent', cursor: 'pointer'}}>
                  <div style={{width: 5, height: 5, borderRadius: '50%', background: 'currentColor', flexShrink: 0}}/>{item.name}
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
              <div style={{fontSize: 12, color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{user?.email?.split('@')[0]}</div>
              <div style={{fontSize: 10, color: 'rgba(255,255,255,0.35)'}}>Admin</div>
            </div>
            <div onClick={handleSignOut} style={{fontSize: 11, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, border: '0.5px solid rgba(255,255,255,0.15)', flexShrink: 0}}>Out</div>
          </div>
        </div>
      </nav>

      <div style={{flex: 1, minWidth: 0, overflowY: 'auto', padding: '32px 36px'}}>
        {success && (
          <div style={{background: '#f0f7f2', border: '1px solid #6b7c3a', borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: 14, color: '#2d6a4f', fontWeight: 500}}>✓ {success}</div>
        )}

        {activeTab === 'overview' && <AdminOverview supabase={supabase} students={students} tutors={tutors} onNavigate={setActiveTab} />}

        {activeTab === 'roster' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Student Roster</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>{students.length} students enrolled</div>
            </div>
            <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead><tr style={{background: '#0d2340'}}>
                  {['Student','Email','School','Joined','Status'].map(h => (
                    <th key={h} style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.5)', padding: '12px 16px', textAlign: 'left'}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id} style={{borderBottom: i < students.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
                      <td style={{padding: '14px 16px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                          <div style={{width: 32, height: 32, borderRadius: '50%', background: '#c9a84c', color: '#0d2340', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{(s.full_name||s.email).charAt(0).toUpperCase()}</div>
                          <div style={{fontSize: 14, fontWeight: 500, color: '#0d2340'}}>{s.full_name||s.email.split('@')[0]}</div>
                        </div>
                      </td>
                      <td style={{fontSize: 13, color: '#3d3020', padding: '14px 16px'}}>{s.email}</td>
                      <td style={{fontSize: 13, color: '#3d3020', padding: '14px 16px'}}>{s.school||'Windsor SOM'}</td>
                      <td style={{fontSize: 13, color: '#3d3020', padding: '14px 16px'}}>{new Date(s.created_at).toLocaleDateString('en-US', {month:'short',day:'numeric'})}</td>
                      <td style={{padding: '14px 16px'}}><span style={{fontSize: 11, padding: '3px 10px', borderRadius: 10, background: '#f0f7f2', color: '#2d6a4f', fontWeight: 500}}>Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'examperformance' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Exam Performance</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>All student exam sessions and answer sheets</div>
            </div>
            <ExamReports supabase={supabase} students={students} />
          </div>
        )}

        {activeTab === 'attendancereport' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Attendance Report</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Class attendance by student · Warning thresholds: 2 excused, 1 unexcused</div>
            </div>
            <AttendanceReportAdmin supabase={supabase} students={students} tutors={tutors} onSuccess={flash} />
          </div>
        )}

        {activeTab === 'assignmentprogress' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Assignment Progress</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Track completion across all students</div>
            </div>
            <AssignmentProgressAdmin supabase={supabase} students={students} />
          </div>
        )}

        {activeTab === 'tutoractivity' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Tutor Activity</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Meetings logged, reports submitted, sessions attended per tutor</div>
            </div>
            <TutorActivityAdmin supabase={supabase} tutors={tutors} students={students} />
          </div>
        )}

        {activeTab === 'studentplans' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Student Plans</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Study schedules built by tutors for each student</div>
            </div>
            <StudentPlansAdmin supabase={supabase} students={students} tutors={tutors} />
          </div>
        )}

        {activeTab === 'meetingnotes' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Meeting Notes</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>All mentor 1-on-1 logs across all tutors</div>
            </div>
            <MeetingNotesAdmin supabase={supabase} students={students} tutors={tutors} />
          </div>
        )}

        {activeTab === 'accountability' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Accountability Reports</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Weekly activity reports submitted by tutors</div>
            </div>
            <AccountabilityReportsAdmin supabase={supabase} students={students} tutors={tutors} />
          </div>
        )}

        {activeTab === 'notifystudents' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Notify Students</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Send notifications to one student or all students</div>
            </div>
            <NotifyForm supabase={supabase} recipients={students} label="Student" onSuccess={flash} />
          </div>
        )}

        {activeTab === 'notifytutors' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Notify Tutors</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Send messages and feedback directly to tutors</div>
            </div>
            <NotifyForm supabase={supabase} recipients={tutors} label="Tutor" onSuccess={flash} />
          </div>
        )}

        {activeTab === 'announcements' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Announcements</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Post program-wide messages</div>
            </div>
            <AnnouncementForm students={students} supabase={supabase} onSuccess={() => flash('Announcement posted!')} />
          </div>
        )}

        {activeTab === 'feedback' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Student Feedback</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Read and respond to student messages</div>
            </div>
            <FeedbackTab supabase={supabase} students={students} />
          </div>
        )}

        {activeTab === 'schedule'    && <div><div style={{marginBottom:24}}><div style={{fontFamily:'Georgia,serif',fontSize:28,color:'#0d2340',letterSpacing:-0.5}}>Manage Schedule</div></div><ScheduleManager supabase={supabase} onSuccess={flash}/></div>}
        {activeTab === 'slides'      && <div><div style={{marginBottom:24}}><div style={{fontFamily:'Georgia,serif',fontSize:28,color:'#0d2340',letterSpacing:-0.5}}>Manage Slides</div></div><SlidesManager supabase={supabase} onSuccess={flash}/></div>}
        {activeTab === 'recordings'  && <div><div style={{marginBottom:24}}><div style={{fontFamily:'Georgia,serif',fontSize:28,color:'#0d2340',letterSpacing:-0.5}}>Manage Recordings</div></div><RecordingsManager supabase={supabase} onSuccess={flash}/></div>}
        {activeTab === 'notes'       && <div><div style={{marginBottom:24}}><div style={{fontFamily:'Georgia,serif',fontSize:28,color:'#0d2340',letterSpacing:-0.5}}>Manage HY Notes</div></div><NotesManager supabase={supabase} onSuccess={flash}/></div>}
        {activeTab === 'resources'   && <div><div style={{marginBottom:24}}><div style={{fontFamily:'Georgia,serif',fontSize:28,color:'#0d2340',letterSpacing:-0.5}}>Manage Resources</div></div><ResourcesManager supabase={supabase} onSuccess={flash}/></div>}
        {activeTab === 'exams'       && <div><div style={{marginBottom:24}}><div style={{fontFamily:'Georgia,serif',fontSize:28,color:'#0d2340',letterSpacing:-0.5}}>Manage Exams</div></div><ExamsManager supabase={supabase} onSuccess={flash}/></div>}
        {activeTab === 'coursedocs'  && <div><div style={{marginBottom:24}}><div style={{fontFamily:'Georgia,serif',fontSize:28,color:'#0d2340',letterSpacing:-0.5}}>Course Documents</div></div><CourseDocsManager supabase={supabase} onSuccess={flash}/></div>}
        {activeTab === 'profiles'    && <div><div style={{marginBottom:24}}><div style={{fontFamily:'Georgia,serif',fontSize:28,color:'#0d2340',letterSpacing:-0.5}}>Student Profiles</div></div><StudentProfiles supabase={supabase} students={students} onSuccess={flash}/></div>}
        {activeTab === 'assignments' && <div><div style={{marginBottom:24}}><div style={{fontFamily:'Georgia,serif',fontSize:28,color:'#0d2340',letterSpacing:-0.5}}>Assign Tasks</div></div><AssignmentsManager supabase={supabase} students={students} onSuccess={flash}/></div>}
        {activeTab === 'studyschedule' && <div><div style={{marginBottom:24}}><div style={{fontFamily:'Georgia,serif',fontSize:28,color:'#0d2340',letterSpacing:-0.5}}>Study Schedules</div></div><StudyScheduleManager supabase={supabase} students={students} onSuccess={flash}/></div>}

        {activeTab === 'usermanagement' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>User Management</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Create new student, tutor, or admin accounts directly from the platform</div>
            </div>
            <UserManagementAdmin onSuccess={flash} />
          </div>
        )}
      </div>
    </main>
  )
}

// ─── Command Center ───────────────────────────────────────────────────────────

function AdminOverview({ supabase, students, tutors, onNavigate }: any) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const [
      { data: accountability },
      { data: examSessions },
      { data: availableExams },
      { data: attendance },
      { data: meetings },
    ] = await Promise.all([
      supabase.from('accountability_reports').select('student_id, status').eq('status', 'at_risk').limit(100),
      supabase.from('exam_sessions').select('student_id, exam_name').eq('status', 'submitted'),
      supabase.from('exams').select('name').eq('available', true),
      supabase.from('attendance').select('student_id, status'),
      supabase.from('mentor_meetings').select('mentor_id, created_at').gte('created_at', new Date(Date.now() - 7*24*60*60*1000).toISOString()),
    ])
    setData({ accountability: accountability || [], examSessions: examSessions || [], availableExams: availableExams || [], attendance: attendance || [], meetings: meetings || [] })
    setLoading(false)
  }

  const sendWarning = async (studentId: string, type: 'exam' | 'attendance', key: string) => {
    setSending(key)
    const msgs: Record<string, {title: string, message: string}> = {
      exam:       {title: 'Practice exam reminder', message: 'You have a practice exam available that you have not yet started. Please complete it as soon as possible.'},
      attendance: {title: 'Attendance warning', message: 'You are approaching the allowed absence limit for this program. Please contact your tutor if you need accommodations.'},
    }
    await supabase.from('notifications').insert({student_id: studentId, type: 'assignment', ...msgs[type]})
    setSending(null)
  }

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading command center...</div>

  const studentName = (id: string) => {
    const s = (students as Array<{id: string, full_name?: string, email: string}>).find(x => x.id === id)
    return s ? (s.full_name || s.email.split('@')[0]) : 'Unknown'
  }

  // Pending exams: students who haven't submitted a session for each available exam
  const submittedMap: Record<string, Set<string>> = {}
  data.examSessions.forEach((s: {student_id: string, exam_name: string}) => {
    if (!submittedMap[s.student_id]) submittedMap[s.student_id] = new Set()
    submittedMap[s.student_id].add(s.exam_name)
  })
  const pendingExamStudents = students.filter((s: {id: string}) =>
    data.availableExams.some((e: {name: string}) => !submittedMap[s.id]?.has(e.name))
  )

  // Attendance counts per student
  const attCounts: Record<string, {excused: number, unexcused: number}> = {}
  data.attendance.forEach((r: {student_id: string, status: string}) => {
    if (!attCounts[r.student_id]) attCounts[r.student_id] = {excused: 0, unexcused: 0}
    if (r.status === 'excused') attCounts[r.student_id].excused++
    if (r.status === 'unexcused') attCounts[r.student_id].unexcused++
  })
  const absenceWarnings = students.filter((s: {id: string}) => {
    const c = attCounts[s.id]
    return c && (c.unexcused >= 1 || c.excused >= 2)
  })

  const atRiskStudentIds = [...new Set(data.accountability.map((r: {student_id: string}) => r.student_id))]

  const statCards = [
    {label: 'Students enrolled', value: students.length},
    {label: 'Active tutors', value: tutors.length},
    {label: 'Meetings this week', value: data.meetings.length},
    {label: 'Exams available', value: data.availableExams.length},
  ]

  return (
    <div>
      <div style={{marginBottom: 28}}>
        <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5}}>Command Center</div>
        <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>P2P Mentoring Program · Windsor SOM · May 2026 Cohort</div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24}}>
        {statCards.map((c, i) => (
          <div key={i} style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 10, padding: '16px 18px'}}>
            <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a89870', marginBottom: 8}}>{c.label}</div>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 32, color: '#0d2340'}}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>

        {/* Attendance warnings */}
        {absenceWarnings.length > 0 && (
          <div style={{background: '#fdf0f0', border: '1px solid #f5c6c6', borderRadius: 12, overflow: 'hidden'}}>
            <div style={{padding: '14px 20px', background: '#c0574a', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>⚠ Attendance warnings — {absenceWarnings.length} student{absenceWarnings.length !== 1 ? 's' : ''}</div>
              <button onClick={() => onNavigate('attendancereport')} style={{fontSize: 12, color: 'white', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontFamily: 'Sora, sans-serif'}}>View full report →</button>
            </div>
            <div style={{padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8}}>
              {absenceWarnings.map((s: {id: string}) => {
                const c = attCounts[s.id]
                const critical = c.unexcused >= 2 || c.excused >= 2
                return (
                  <div key={s.id} style={{display: 'flex', alignItems: 'center', gap: 14}}>
                    <div style={{flex: 1, fontSize: 14, color: '#0d2340', fontWeight: 500}}>{studentName(s.id)}</div>
                    <div style={{fontSize: 12, color: '#8a7d6a'}}>{c.excused} excused · {c.unexcused} unexcused</div>
                    {critical && <span style={{fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#c0574a', color: 'white', fontWeight: 600}}>At limit</span>}
                    <button onClick={() => sendWarning(s.id, 'attendance', `att-${s.id}`)} disabled={sending === `att-${s.id}`}
                      style={{fontSize: 12, padding: '4px 12px', borderRadius: 7, border: 'none', background: '#0d2340', color: '#c9a84c', cursor: 'pointer', fontFamily: 'Sora, sans-serif', fontWeight: 600}}>
                      {sending === `att-${s.id}` ? '...' : 'Send warning'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Pending practice exams */}
        {pendingExamStudents.length > 0 && (
          <div style={{background: '#fff8e8', border: '1px solid #f5dfa0', borderRadius: 12, overflow: 'hidden'}}>
            <div style={{padding: '14px 20px', background: '#c07040', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>📋 Practice exams pending — {pendingExamStudents.length} student{pendingExamStudents.length !== 1 ? 's' : ''}</div>
              <button onClick={() => onNavigate('examperformance')} style={{fontSize: 12, color: 'white', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontFamily: 'Sora, sans-serif'}}>View performance →</button>
            </div>
            <div style={{padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8}}>
              {pendingExamStudents.slice(0, 8).map((s: {id: string}) => {
                const pending = data.availableExams.filter((e: {name: string}) => !submittedMap[s.id]?.has(e.name))
                return (
                  <div key={s.id} style={{display: 'flex', alignItems: 'center', gap: 14}}>
                    <div style={{flex: 1, fontSize: 14, color: '#0d2340', fontWeight: 500}}>{studentName(s.id)}</div>
                    <div style={{fontSize: 12, color: '#8a7d6a'}}>{pending.map((e: {name: string}) => e.name).join(', ')}</div>
                    <button onClick={() => sendWarning(s.id, 'exam', `exam-${s.id}`)} disabled={sending === `exam-${s.id}`}
                      style={{fontSize: 12, padding: '4px 12px', borderRadius: 7, border: 'none', background: '#0d2340', color: '#c9a84c', cursor: 'pointer', fontFamily: 'Sora, sans-serif', fontWeight: 600}}>
                      {sending === `exam-${s.id}` ? '...' : 'Send reminder'}
                    </button>
                  </div>
                )
              })}
              {pendingExamStudents.length > 8 && <div style={{fontSize: 12, color: '#8a7d6a'}}>+{pendingExamStudents.length - 8} more</div>}
            </div>
          </div>
        )}

        {/* At-risk from accountability reports */}
        {atRiskStudentIds.length > 0 && (
          <div style={{background: '#fdf0f0', border: '1px solid #f5c6c6', borderRadius: 12, overflow: 'hidden'}}>
            <div style={{padding: '14px 20px', background: '#9e2a2a', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>🚨 At-risk students — flagged by tutors — {atRiskStudentIds.length}</div>
              <button onClick={() => onNavigate('accountability')} style={{fontSize: 12, color: 'white', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontFamily: 'Sora, sans-serif'}}>View reports →</button>
            </div>
            <div style={{padding: '12px 20px', display: 'flex', flexWrap: 'wrap', gap: 8}}>
              {(atRiskStudentIds as string[]).map(id => (
                <span key={id} style={{fontSize: 13, padding: '4px 12px', borderRadius: 8, background: '#fdf0f0', border: '1px solid #f5c6c6', color: '#9e2a2a', fontWeight: 500}}>{studentName(id)}</span>
              ))}
            </div>
          </div>
        )}

        {absenceWarnings.length === 0 && pendingExamStudents.length === 0 && atRiskStudentIds.length === 0 && (
          <div style={{background: '#f0f7f2', border: '1px solid #b8dfc8', borderRadius: 12, padding: '20px 24px', fontSize: 14, color: '#2d6a4f', fontWeight: 500}}>
            ✓ No active flags — all students on track
          </div>
        )}

        {/* Quick nav */}
        <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
          <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 14}}>Quick access</div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10}}>
            {[
              {label: 'Attendance report', tab: 'attendancereport', color: '#c0574a'},
              {label: 'Exam performance', tab: 'examperformance', color: '#c07040'},
              {label: 'Accountability reports', tab: 'accountability', color: '#9e2a2a'},
              {label: 'Tutor activity', tab: 'tutoractivity', color: '#4a8c84'},
              {label: 'Student plans', tab: 'studentplans', color: '#6b7c3a'},
              {label: 'Meeting notes', tab: 'meetingnotes', color: '#c9a84c'},
            ].map(a => (
              <div key={a.tab} onClick={() => onNavigate(a.tab)}
                style={{padding: '11px 14px', background: '#f7f4ee', border: `1px solid ${a.color}`, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10}}>
                <div style={{width: 8, height: 8, borderRadius: '50%', background: a.color, flexShrink: 0}}/>
                <div style={{fontSize: 13, color: '#0d2340', fontWeight: 500}}>{a.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Attendance Report ────────────────────────────────────────────────────────

function AttendanceReportAdmin({ supabase, students, tutors, onSuccess }: any) {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)
  const [filterStudent, setFilterStudent] = useState('all')

  useEffect(() => { loadRecords() }, [])

  async function loadRecords() {
    const { data } = await supabase.from('attendance').select('*, schedule(topic, session_date, week_number)').order('created_at', {ascending: false})
    setRecords(data || [])
    setLoading(false)
  }

  const counts: Record<string, {present: number, late: number, excused: number, unexcused: number}> = {}
  students.forEach((s: {id: string}) => { counts[s.id] = {present: 0, late: 0, excused: 0, unexcused: 0} })
  records.forEach((r: {student_id: string, status: string}) => {
    if (counts[r.student_id]) {
      const k = r.status as keyof typeof counts[string]
      if (k in counts[r.student_id]) counts[r.student_id][k]++
    }
  })

  const warnLevel = (c: {excused: number, unexcused: number}) => {
    if (c.unexcused >= 2 || c.excused >= 2) return 'critical'
    if (c.unexcused >= 1 || c.excused >= 1) return 'warning'
    return 'ok'
  }

  const sendWarning = async (studentId: string) => {
    setSending(studentId)
    const c = counts[studentId]
    const critical = c.unexcused >= 2 || c.excused >= 2
    await supabase.from('notifications').insert({
      student_id: studentId,
      title: critical ? 'Final attendance warning' : 'Attendance warning',
      message: critical
        ? `You have reached the maximum allowed absences (${c.excused} excused, ${c.unexcused} unexcused). Further absences may result in removal from the program.`
        : `You currently have ${c.excused} excused absence${c.excused !== 1 ? 's' : ''} and ${c.unexcused} unexcused absence${c.unexcused !== 1 ? 's' : ''}. The program limit is 2 excused and 1 unexcused.`,
      type: 'general',
    })
    setSending(null)
    onSuccess('Warning sent to student!')
  }

  const notifyTutor = async (studentId: string) => {
    const tutorId = tutors[0]?.id
    if (!tutorId) return
    const sName = (students as Array<{id: string, full_name?: string, email: string}>).find(s => s.id === studentId)
    const c = counts[studentId]
    await supabase.from('notifications').insert({
      student_id: tutorId,
      title: 'Attendance alert',
      message: `${sName?.full_name || 'A student'} has ${c.excused} excused and ${c.unexcused} unexcused absences. Please follow up.`,
      type: 'general',
    })
    onSuccess('Tutor notified!')
  }

  const filtered = filterStudent === 'all' ? students : students.filter((s: {id: string}) => s.id === filterStudent)

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading attendance data...</div>

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
      <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
        <select value={filterStudent} onChange={e => setFilterStudent(e.target.value)}
          style={{height: 38, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
          <option value="all">All students</option>
          {students.map((s: any) => <option key={s.id} value={s.id}>{s.full_name || s.email.split('@')[0]}</option>)}
        </select>
        <div style={{fontSize: 12, padding: '6px 12px', borderRadius: 8, background: '#fdf0f0', border: '1px solid #f5c6c6', color: '#c0574a'}}>Limit: 2 excused · 1 unexcused</div>
      </div>

      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead><tr style={{background: '#0d2340'}}>
            {['Student','Present','Late','Excused','Unexcused','Status','Actions'].map(h => (
              <th key={h} style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.5)', padding: '12px 14px', textAlign: 'left'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((s: any, i: number) => {
              const c = counts[s.id] || {present:0,late:0,excused:0,unexcused:0}
              const level = warnLevel(c)
              return (
                <tr key={s.id} style={{borderBottom: i < filtered.length-1 ? '0.5px solid #f5f0e8' : 'none', background: level === 'critical' ? '#fdf8f8' : 'white'}}>
                  <td style={{padding: '12px 14px', fontSize: 14, color: '#0d2340', fontWeight: 500}}>{s.full_name || s.email.split('@')[0]}</td>
                  <td style={{padding: '12px 14px', fontSize: 13, color: '#2d6a4f', fontWeight: 500}}>{c.present}</td>
                  <td style={{padding: '12px 14px', fontSize: 13, color: '#c07040'}}>{c.late}</td>
                  <td style={{padding: '12px 14px', fontSize: 13, color: c.excused >= 2 ? '#c0574a' : c.excused >= 1 ? '#c07040' : '#3d3020', fontWeight: c.excused >= 1 ? 600 : 400}}>{c.excused}</td>
                  <td style={{padding: '12px 14px', fontSize: 13, color: c.unexcused >= 1 ? '#c0574a' : '#3d3020', fontWeight: c.unexcused >= 1 ? 600 : 400}}>{c.unexcused}</td>
                  <td style={{padding: '12px 14px'}}>
                    {level === 'critical' && <span style={{fontSize: 11, padding: '3px 10px', borderRadius: 8, background: '#fdf0f0', color: '#c0574a', fontWeight: 600, border: '1px solid #f5c6c6'}}>At limit</span>}
                    {level === 'warning'  && <span style={{fontSize: 11, padding: '3px 10px', borderRadius: 8, background: '#fff8e8', color: '#c07040', fontWeight: 600, border: '1px solid #f5dfa0'}}>Warning</span>}
                    {level === 'ok'       && <span style={{fontSize: 11, padding: '3px 10px', borderRadius: 8, background: '#f0f7f2', color: '#2d6a4f'}}>Good</span>}
                  </td>
                  <td style={{padding: '12px 14px'}}>
                    {level !== 'ok' && (
                      <div style={{display: 'flex', gap: 6}}>
                        <button onClick={() => sendWarning(s.id)} disabled={sending === s.id}
                          style={{fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#c0574a', color: 'white', cursor: 'pointer', fontFamily: 'Sora, sans-serif', fontWeight: 600}}>
                          {sending === s.id ? '...' : 'Warn student'}
                        </button>
                        <button onClick={() => notifyTutor(s.id)}
                          style={{fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid #e8dfc8', background: 'white', color: '#0d2340', cursor: 'pointer', fontFamily: 'Sora, sans-serif'}}>
                          Alert tutor
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Tutor Activity ───────────────────────────────────────────────────────────

function TutorActivityAdmin({ supabase, tutors, students }: any) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: meetings }, { data: reports }, { data: attendance }] = await Promise.all([
      supabase.from('mentor_meetings').select('mentor_id, student_id, meeting_date, notes, action_items').order('meeting_date', {ascending: false}),
      supabase.from('accountability_reports').select('tutor_id, student_id, week_number, status, created_at').order('created_at', {ascending: false}),
      supabase.from('attendance').select('tutor_id, created_at').order('created_at', {ascending: false}),
    ])
    setData({ meetings: meetings || [], reports: reports || [], attendance: attendance || [] })
    setLoading(false)
  }

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading tutor activity...</div>

  const sName = (id: string) => {
    const s = (students as Array<{id: string, full_name?: string, email: string}>).find(x => x.id === id)
    return s ? (s.full_name || s.email.split('@')[0]) : 'Unknown'
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
      {tutors.map((t: any) => {
        const tMeetings = data.meetings.filter((m: any) => m.mentor_id === t.id)
        const tReports = data.reports.filter((r: any) => r.tutor_id === t.id)
        const tAttendance = data.attendance.filter((a: any) => a.tutor_id === t.id)
        const atRisk = tReports.filter((r: any) => r.status === 'at_risk').length
        return (
          <div key={t.id} style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
            <div onClick={() => setExpanded(expanded === t.id ? null : t.id)}
              style={{padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer'}}>
              <div style={{width: 36, height: 36, borderRadius: '50%', background: '#0d2340', color: '#c9a84c', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                {(t.full_name || t.email).charAt(0).toUpperCase()}
              </div>
              <div style={{flex: 1}}>
                <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340'}}>{t.full_name || t.email.split('@')[0]}</div>
                <div style={{fontSize: 12, color: '#8a7d6a', marginTop: 2}}>{t.email}</div>
              </div>
              <div style={{display: 'flex', gap: 16}}>
                {[{label: 'Meetings', value: tMeetings.length}, {label: 'Reports', value: tReports.length}, {label: 'Sessions logged', value: tAttendance.length}].map(s => (
                  <div key={s.label} style={{textAlign: 'center'}}>
                    <div style={{fontFamily: 'Georgia, serif', fontSize: 22, color: '#0d2340'}}>{s.value}</div>
                    <div style={{fontSize: 10, color: '#a89870', textTransform: 'uppercase', letterSpacing: '0.06em'}}>{s.label}</div>
                  </div>
                ))}
                {atRisk > 0 && <span style={{fontSize: 11, padding: '3px 10px', borderRadius: 8, background: '#fdf0f0', color: '#c0574a', fontWeight: 600, border: '1px solid #f5c6c6', alignSelf: 'center'}}>{atRisk} at-risk</span>}
              </div>
              <div style={{fontSize: 12, color: '#a89870'}}>{expanded === t.id ? '▲' : '▼'}</div>
            </div>
            {expanded === t.id && (
              <div style={{borderTop: '0.5px solid #f5f0e8', padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20}}>
                <div>
                  <div style={{fontSize: 12, fontWeight: 600, color: '#0d2340', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em'}}>Recent meetings</div>
                  {tMeetings.slice(0, 5).map((m: any) => (
                    <div key={m.meeting_date + m.student_id} style={{marginBottom: 8, paddingBottom: 8, borderBottom: '0.5px solid #f5f0e8'}}>
                      <div style={{fontSize: 13, color: '#0d2340', fontWeight: 500}}>{sName(m.student_id)}</div>
                      <div style={{fontSize: 11, color: '#8a7d6a'}}>{new Date(m.meeting_date).toLocaleDateString('en-US', {month:'short',day:'numeric'})}</div>
                    </div>
                  ))}
                  {tMeetings.length === 0 && <div style={{fontSize: 13, color: '#8a7d6a', fontStyle: 'italic'}}>No meetings logged yet</div>}
                </div>
                <div>
                  <div style={{fontSize: 12, fontWeight: 600, color: '#0d2340', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em'}}>Recent reports</div>
                  {tReports.slice(0, 5).map((r: any) => (
                    <div key={r.created_at + r.student_id} style={{marginBottom: 8, paddingBottom: 8, borderBottom: '0.5px solid #f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                      <div>
                        <div style={{fontSize: 13, color: '#0d2340', fontWeight: 500}}>{sName(r.student_id)}</div>
                        <div style={{fontSize: 11, color: '#8a7d6a'}}>Week {r.week_number}</div>
                      </div>
                      <span style={{fontSize: 11, padding: '2px 8px', borderRadius: 8,
                        background: r.status === 'at_risk' ? '#fdf0f0' : r.status === 'needs_attention' ? '#fff8e8' : '#f0f7f2',
                        color: r.status === 'at_risk' ? '#c0574a' : r.status === 'needs_attention' ? '#c07040' : '#2d6a4f'}}>
                        {r.status === 'on_track' ? 'On Track' : r.status === 'needs_attention' ? 'Needs Attention' : 'At Risk'}
                      </span>
                    </div>
                  ))}
                  {tReports.length === 0 && <div style={{fontSize: 13, color: '#8a7d6a', fontStyle: 'italic'}}>No reports submitted yet</div>}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Student Plans ────────────────────────────────────────────────────────────

function StudentPlansAdmin({ supabase, students, tutors }: any) {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStudent, setFilterStudent] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('study_schedule').select('*, profiles!assigned_by(full_name, email)').order('schedule_date', {ascending: false}).limit(200)
    setPlans(data || [])
    setLoading(false)
  }

  const sName = (id: string) => {
    const s = (students as Array<{id: string, full_name?: string, email: string}>).find(x => x.id === id)
    return s ? (s.full_name || s.email.split('@')[0]) : 'Unknown'
  }

  const filtered = filterStudent === 'all' ? plans : plans.filter(p => p.student_id === filterStudent)

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading study plans...</div>

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
      <select value={filterStudent} onChange={e => setFilterStudent(e.target.value)}
        style={{width: 240, height: 38, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
        <option value="all">All students</option>
        {students.map((s: any) => <option key={s.id} value={s.id}>{s.full_name || s.email.split('@')[0]}</option>)}
      </select>

      {filtered.length === 0 ? (
        <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '40px', textAlign: 'center', fontSize: 14, color: '#8a7d6a', fontStyle: 'italic'}}>No study plans found</div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          {filtered.map(p => (
            <div key={p.id} style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
              <div onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                style={{padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer'}}>
                <div style={{flex: 1}}>
                  <div style={{fontSize: 14, fontWeight: 600, color: '#0d2340'}}>{sName(p.student_id)}</div>
                  <div style={{fontSize: 12, color: '#8a7d6a', marginTop: 2}}>
                    {new Date(p.schedule_date).toLocaleDateString('en-US', {weekday:'short',month:'short',day:'numeric'})}
                    {p.profiles && ` · Built by ${p.profiles.full_name || p.profiles.email?.split('@')[0]}`}
                  </div>
                </div>
                <div style={{fontSize: 12, color: '#8a7d6a'}}>{(p.tasks || []).length} task{(p.tasks || []).length !== 1 ? 's' : ''}</div>
                <div style={{fontSize: 11, color: '#a89870'}}>{expanded === p.id ? '▲' : '▼'}</div>
              </div>
              {expanded === p.id && (
                <div style={{borderTop: '0.5px solid #f5f0e8', padding: '14px 20px'}}>
                  {p.notes && <div style={{fontSize: 13, color: '#5c4f35', marginBottom: 12, fontStyle: 'italic'}}>{p.notes}</div>}
                  <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                    {(p.tasks || []).map((task: any, i: number) => (
                      <div key={i} style={{display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: '#f7f4ee', borderRadius: 8}}>
                        <span style={{fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#0d2340', color: '#c9a84c', flexShrink: 0}}>{task.tag}</span>
                        <div style={{flex: 1}}>
                          <div style={{fontSize: 13, color: '#0d2340', fontWeight: 500}}>{task.title}</div>
                          {task.description && <div style={{fontSize: 12, color: '#8a7d6a', marginTop: 2}}>{task.description}</div>}
                        </div>
                        {task.duration && <div style={{fontSize: 12, color: '#a89870', flexShrink: 0}}>{task.duration}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Meeting Notes ────────────────────────────────────────────────────────────

function MeetingNotesAdmin({ supabase, students, tutors }: any) {
  const [meetings, setMeetings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTutor, setFilterTutor] = useState('all')
  const [filterStudent, setFilterStudent] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('mentor_meetings').select('*').order('meeting_date', {ascending: false})
    setMeetings(data || [])
    setLoading(false)
  }

  const name = (list: Array<{id: string, full_name?: string, email: string}>, id: string) => {
    const p = list.find(x => x.id === id)
    return p ? (p.full_name || p.email.split('@')[0]) : 'Unknown'
  }

  const filtered = meetings.filter(m =>
    (filterTutor === 'all' || m.mentor_id === filterTutor) &&
    (filterStudent === 'all' || m.student_id === filterStudent)
  )

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading meeting notes...</div>

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
      <div style={{display: 'flex', gap: 12}}>
        <select value={filterTutor} onChange={e => setFilterTutor(e.target.value)}
          style={{height: 38, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
          <option value="all">All tutors</option>
          {tutors.map((t: any) => <option key={t.id} value={t.id}>{t.full_name || t.email.split('@')[0]}</option>)}
        </select>
        <select value={filterStudent} onChange={e => setFilterStudent(e.target.value)}
          style={{height: 38, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
          <option value="all">All students</option>
          {students.map((s: any) => <option key={s.id} value={s.id}>{s.full_name || s.email.split('@')[0]}</option>)}
        </select>
        <div style={{fontSize: 13, color: '#8a7d6a', display: 'flex', alignItems: 'center'}}>{filtered.length} meeting{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      {filtered.length === 0 ? (
        <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '40px', textAlign: 'center', fontSize: 14, color: '#8a7d6a', fontStyle: 'italic'}}>No meetings found</div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          {filtered.map(m => (
            <div key={m.id} style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
              <div onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                style={{padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer'}}>
                <div style={{flex: 1}}>
                  <div style={{fontSize: 14, fontWeight: 600, color: '#0d2340'}}>{name(students, m.student_id)}</div>
                  <div style={{fontSize: 12, color: '#8a7d6a', marginTop: 2}}>
                    Tutor: {name(tutors, m.mentor_id)} · {new Date(m.meeting_date).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'})} · {m.duration_minutes} min
                  </div>
                </div>
                <div style={{fontSize: 11, color: '#a89870'}}>{expanded === m.id ? '▲' : '▼'}</div>
              </div>
              {expanded === m.id && (
                <div style={{borderTop: '0.5px solid #f5f0e8', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12}}>
                  {m.notes && <div><div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8a7d6a', marginBottom: 4}}>Notes</div><div style={{fontSize: 13, color: '#3d3020', lineHeight: 1.6}}>{m.notes}</div></div>}
                  {m.action_items && <div><div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8a7d6a', marginBottom: 4}}>Action items</div><div style={{fontSize: 13, color: '#3d3020', lineHeight: 1.6}}>{m.action_items}</div></div>}
                  {m.next_meeting && <div style={{fontSize: 12, color: '#8a7d6a'}}>Next meeting: {new Date(m.next_meeting).toLocaleDateString('en-US', {month:'short',day:'numeric'})}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Accountability Reports ───────────────────────────────────────────────────

function AccountabilityReportsAdmin({ supabase, students, tutors }: any) {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTutor, setFilterTutor] = useState('all')
  const [filterStudent, setFilterStudent] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('accountability_reports').select('*').order('created_at', {ascending: false}).limit(200)
    setReports(data || [])
    setLoading(false)
  }

  const name = (list: Array<{id: string, full_name?: string, email: string}>, id: string) => {
    const p = list.find(x => x.id === id)
    return p ? (p.full_name || p.email.split('@')[0]) : 'Unknown'
  }

  const statusStyle = (s: string) => {
    if (s === 'at_risk') return {background: '#fdf0f0', color: '#c0574a', border: '1px solid #f5c6c6'}
    if (s === 'needs_attention') return {background: '#fff8e8', color: '#c07040', border: '1px solid #f5dfa0'}
    return {background: '#f0f7f2', color: '#2d6a4f', border: '1px solid #b8dfc8'}
  }

  const filtered = reports.filter(r =>
    (filterTutor === 'all' || r.tutor_id === filterTutor) &&
    (filterStudent === 'all' || r.student_id === filterStudent) &&
    (filterStatus === 'all' || r.status === filterStatus)
  )

  const atRiskCount = reports.filter(r => r.status === 'at_risk').length

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading reports...</div>

  return (
    <div>
      {atRiskCount > 0 && (
        <div style={{background: '#fdf0f0', border: '1px solid #f5c6c6', borderRadius: 10, padding: '12px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center'}}>
          <div style={{fontSize: 13, fontWeight: 600, color: '#c0574a'}}>{atRiskCount} at-risk flag{atRiskCount !== 1 ? 's' : ''} across all reports</div>
        </div>
      )}
      <div style={{display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap'}}>
        {[
          {value: filterTutor, setter: setFilterTutor, options: [{v:'all',l:'All tutors'}, ...tutors.map((t:any) => ({v:t.id,l:t.full_name||t.email.split('@')[0]}))]},
          {value: filterStudent, setter: setFilterStudent, options: [{v:'all',l:'All students'}, ...students.map((s:any) => ({v:s.id,l:s.full_name||s.email.split('@')[0]}))]},
          {value: filterStatus, setter: setFilterStatus, options: [{v:'all',l:'All statuses'},{v:'on_track',l:'On Track'},{v:'needs_attention',l:'Needs Attention'},{v:'at_risk',l:'At Risk'}]},
        ].map((f, i) => (
          <select key={i} value={f.value} onChange={e => f.setter(e.target.value)}
            style={{height: 38, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
            {f.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        ))}
        <div style={{fontSize: 13, color: '#8a7d6a', display: 'flex', alignItems: 'center'}}>{filtered.length} reports</div>
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
        {filtered.map(r => (
          <div key={r.id} style={{background: 'white', border: `0.5px solid ${r.status === 'at_risk' ? '#f5c6c6' : r.status === 'needs_attention' ? '#f5dfa0' : '#e8dfc8'}`, borderRadius: 12, overflow: 'hidden'}}>
            <div onClick={() => setExpanded(expanded === r.id ? null : r.id)} style={{padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer'}}>
              <div style={{flex: 1, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap'}}>
                <div style={{fontSize: 14, fontWeight: 600, color: '#0d2340'}}>{name(students, r.student_id)}</div>
                <div style={{fontSize: 12, color: '#8a7d6a'}}>Week {r.week_number} · {new Date(r.report_date).toLocaleDateString('en-US', {month:'short',day:'numeric'})}</div>
                <div style={{fontSize: 12, color: '#8a7d6a'}}>Tutor: {name(tutors, r.tutor_id)}</div>
              </div>
              <span style={{fontSize: 11, padding: '3px 10px', borderRadius: 10, fontWeight: 500, ...statusStyle(r.status)}}>
                {r.status === 'on_track' ? 'On Track' : r.status === 'needs_attention' ? 'Needs Attention' : 'At Risk'}
              </span>
              <div style={{fontSize: 11, color: '#8a7d6a'}}>{expanded === r.id ? '▲' : '▼'}</div>
            </div>
            {expanded === r.id && (
              <div style={{padding: '0 20px 18px', borderTop: '0.5px solid #f5f0e8'}}>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12, paddingTop: 14}}>
                  {[{l:'Attendance',v:r.attendance},{l:'Participation',v:`${r.participation}/5`},{l:'Submitted',v:new Date(r.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}].map(f => (
                    <div key={f.l} style={{background: '#f7f4ee', borderRadius: 8, padding: '10px 14px'}}>
                      <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8a7d6a', marginBottom: 4}}>{f.l}</div>
                      <div style={{fontSize: 14, color: '#0d2340', fontWeight: 500, textTransform: 'capitalize'}}>{f.v}</div>
                    </div>
                  ))}
                </div>
                {[{l:'Performance notes',v:r.performance_notes},{l:'Action items completed',v:r.action_items_completed},{l:'New action items',v:r.new_action_items},{l:'Concerns',v:r.concerns}].filter(f=>f.v).map(f => (
                  <div key={f.l} style={{marginBottom: 10}}>
                    <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8a7d6a', marginBottom: 4}}>{f.l}</div>
                    <div style={{fontSize: 13, color: '#3d3020', lineHeight: 1.6}}>{f.v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Assignment Progress ──────────────────────────────────────────────────────

function AssignmentProgressAdmin({ supabase, students }: any) {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStudent, setFilterStudent] = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('assignments').select('*').order('due_date', {ascending: true})
    setAssignments(data || [])
    setLoading(false)
  }

  const filtered = assignments.filter(a => filterStudent === 'all' || a.student_id === filterStudent || a.student_id === 'all')
  const sName = (id: string) => {
    if (id === 'all') return 'All students'
    const s = (students as Array<{id: string, full_name?: string, email: string}>).find(x => x.id === id)
    return s ? (s.full_name || s.email.split('@')[0]) : 'Unknown'
  }

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading assignments...</div>

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
      <select value={filterStudent} onChange={e => setFilterStudent(e.target.value)}
        style={{width: 240, height: 38, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
        <option value="all">All students</option>
        {students.map((s: any) => <option key={s.id} value={s.id}>{s.full_name || s.email.split('@')[0]}</option>)}
      </select>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
          <thead><tr style={{background: '#0d2340'}}>
            {['Assignment','Assigned to','Due date','Tag'].map(h => (
              <th key={h} style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.5)', padding: '12px 14px', textAlign: 'left'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map((a, i) => {
              const overdue = a.due_date && new Date(a.due_date) < new Date()
              return (
                <tr key={a.id} style={{borderBottom: i < filtered.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
                  <td style={{padding: '12px 14px'}}>
                    <div style={{fontSize: 13, color: '#0d2340', fontWeight: 500}}>{a.title}</div>
                    {a.description && <div style={{fontSize: 11, color: '#8a7d6a', marginTop: 2}}>{a.description.substring(0,60)}</div>}
                  </td>
                  <td style={{padding: '12px 14px', fontSize: 13, color: '#3d3020'}}>{sName(a.student_id)}</td>
                  <td style={{padding: '12px 14px'}}>
                    {a.due_date ? (
                      <span style={{fontSize: 12, color: overdue ? '#c0574a' : '#3d3020', fontWeight: overdue ? 600 : 400}}>
                        {new Date(a.due_date).toLocaleDateString('en-US', {month:'short',day:'numeric'})} {a.due_time}
                        {overdue && ' · Overdue'}
                      </span>
                    ) : <span style={{fontSize: 12, color: '#a89870'}}>No due date</span>}
                  </td>
                  <td style={{padding: '12px 14px'}}><span style={{fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#f7f4ee', color: '#8a7d6a'}}>{a.tag}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── User Management ─────────────────────────────────────────────────────────

function UserManagementAdmin({ onSuccess }: { onSuccess: (msg: string) => void }) {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'student' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [recentlyCreated, setRecentlyCreated] = useState<Array<{email: string; role: string; full_name: string}>>([])

  const handleCreate = async () => {
    if (!form.email || !form.password) { setError('Email and password are required'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create user'); setSubmitting(false); return }
      setRecentlyCreated(prev => [{ email: form.email, role: form.role, full_name: form.full_name }, ...prev])
      setForm({ email: '', password: '', full_name: '', role: 'student' })
      onSuccess(`Account created for ${form.email}!`)
    } catch {
      setError('Network error — check your connection')
    }
    setSubmitting(false)
  }

  const roleColors: Record<string, string> = { student: '#4a7a2a', tutor: '#1a4a7a', admin: '#9e2a2a' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

      {/* Create form */}
      <div style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '24px 28px' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 20 }}>Create new account</div>

        {error && (
          <div style={{ background: '#fdf0f0', border: '1px solid #f5c6c6', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#c0574a' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Role</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['student', 'tutor', 'admin'] as const).map(r => (
              <button key={r} onClick={() => setForm(p => ({ ...p, role: r }))}
                style={{ flex: 1, height: 40, border: form.role === r ? 'none' : '1px solid #e8dfc8', borderRadius: 8, fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                  background: form.role === r ? '#0d2340' : 'white', color: form.role === r ? '#c9a84c' : '#6a5e4a' }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {[
          { label: 'Full name', key: 'full_name', placeholder: 'e.g. Jane Smith', type: 'text', required: false },
          { label: 'Email address', key: 'email', placeholder: 'jane@example.com', type: 'email', required: true },
          { label: 'Password', key: 'password', placeholder: 'Min 6 characters', type: 'password', required: true },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {f.label}{f.required && <span style={{ color: '#c0574a', marginLeft: 2 }}>*</span>}
            </label>
            <input type={f.type} value={(form as Record<string, string>)[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              style={{ width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box' }}/>
          </div>
        ))}

        <button onClick={handleCreate} disabled={submitting || !form.email || !form.password}
          style={{ width: '100%', height: 46, background: submitting ? '#4a5568' : '#0d2340', border: 'none', borderRadius: 9, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', marginTop: 6 }}>
          {submitting ? 'Creating account...' : `Create ${form.role} account ↗`}
        </button>

        <div style={{ marginTop: 14, fontSize: 12, color: '#a89870', lineHeight: 1.6 }}>
          The user will be able to sign in immediately with the credentials you set. They can change their password from their profile settings.
        </div>
      </div>

      {/* Right panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Role guide */}
        <div style={{ background: '#0d2340', borderRadius: 12, padding: '20px 22px' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 14 }}>Role permissions</div>
          {[
            { role: 'Student', desc: 'Access to dashboard, schedule, study tools, and resources. Cannot see other student data.' },
            { role: 'Tutor', desc: 'Access to tutor dashboard. Can manage sessions, log attendance, submit reports, and view assigned students.' },
            { role: 'Admin', desc: 'Full access to admin dashboard. Can view all student and tutor data, create accounts, and manage content.' },
          ].map(r => (
            <div key={r.role} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '0.5px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#c9a84c', marginBottom: 3 }}>{r.role}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{r.desc}</div>
            </div>
          ))}
        </div>

        {/* Recently created */}
        {recentlyCreated.length > 0 && (
          <div style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '18px 22px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0d2340', marginBottom: 12 }}>Created this session</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentlyCreated.map((u, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f7f4ee', border: '1px solid #e8dfc8', color: '#0d2340', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {(u.full_name || u.email).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#0d2340', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name || u.email.split('@')[0]}</div>
                    <div style={{ fontSize: 11, color: '#8a7d6a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 600, background: `${roleColors[u.role]}22`, color: roleColors[u.role], textTransform: 'capitalize' }}>{u.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Notify Form ──────────────────────────────────────────────────────────────

function NotifyForm({ supabase, recipients, label, onSuccess }: any) {
  const [form, setForm] = useState({recipient_id: 'all', title: '', message: '', type: 'general'})
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!form.title) return
    setSending(true)
    const targets = form.recipient_id === 'all' ? recipients : recipients.filter((r: any) => r.id === form.recipient_id)
    for (const r of targets) {
      await supabase.from('notifications').insert({student_id: r.id, title: form.title, message: form.message, type: form.type})
    }
    setForm({recipient_id: 'all', title: '', message: '', type: 'general'})
    setSending(false)
    onSuccess(`Message sent to ${targets.length} ${label.toLowerCase()}${targets.length !== 1 ? 's' : ''}!`)
  }

  return (
    <div style={{display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20}}>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
        <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 18}}>New message</div>
        <div style={{marginBottom: 14}}>
          <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase'}}>Send to</label>
          <select value={form.recipient_id} onChange={e => setForm({...form, recipient_id: e.target.value})}
            style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
            <option value="all">All {label.toLowerCase()}s ({recipients.length})</option>
            {recipients.map((r: any) => <option key={r.id} value={r.id}>{r.full_name || r.email.split('@')[0]}</option>)}
          </select>
        </div>
        <div style={{marginBottom: 14}}>
          <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase'}}>Subject</label>
          <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Subject..."
            style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
        </div>
        <div style={{marginBottom: 20}}>
          <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase'}}>Message</label>
          <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Your message..." rows={5}
            style={{width: '100%', borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '10px 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', resize: 'none'}}/>
        </div>
        <button onClick={send} disabled={sending || !form.title}
          style={{width: '100%', height: 46, background: sending ? '#4a5568' : '#0d2340', border: 'none', borderRadius: 9, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer'}}>
          {sending ? 'Sending...' : `Send to ${form.recipient_id === 'all' ? `all ${label.toLowerCase()}s` : label.toLowerCase()} ↗`}
        </button>
      </div>
      <div style={{background: '#0d2340', borderRadius: 12, padding: '20px 22px', height: 'fit-content'}}>
        <div style={{fontSize: 13, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14}}>Who receives this</div>
        <div style={{fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7}}>
          Messages appear in the recipient's notification bell on their dashboard.
          {label === 'Tutor' && ' Tutors see notifications when they log into their dashboard.'}
        </div>
        <div style={{marginTop: 16, fontSize: 13, color: '#c9a84c', fontWeight: 500}}>{recipients.length} {label.toLowerCase()}{recipients.length !== 1 ? 's' : ''} in program</div>
      </div>
    </div>
  )
}
