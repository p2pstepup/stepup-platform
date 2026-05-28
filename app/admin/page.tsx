'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase'
import { getActiveProgram } from '../../utils/program-context'
import {
  StudentProfiles, AnnouncementForm, FeedbackTab, SlidesManager, RecordingsManager,
  NotesManager, ResourcesManager, ExamsManager, ScheduleManager, AssignmentsManager,
  StudyScheduleManager, CourseDocsManager, ExamReports, StudentPerformance, AttendanceLogger
} from '../tutor/components'
import ExamManager from './components/ExamManager'

const label = (style: object, children: React.ReactNode) =>
  <div style={{fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: '#8a7d6a', marginBottom: 4, ...style}}>{children}</div>

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [tutors, setTutors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window === 'undefined') return 'overview'
    const params = new URLSearchParams(window.location.search)
    return params.get('tab') || sessionStorage.getItem('admin_activeTab') || 'overview'
  })
  const [success, setSuccess] = useState('')
  const [activeProgram] = useState<ReturnType<typeof getActiveProgram>>(() => getActiveProgram())
  const router = useRouter()
  const supabase = createClient()

  const navTo = (tab: string) => {
    setActiveTab(tab)
    sessionStorage.setItem('admin_activeTab', tab)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const { data: adminProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(adminProfile)
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
      {name: 'Student Performance', tab: 'studentperformance'},
      {name: 'Exam Performance', tab: 'examperformance'},
      {name: 'Attendance Report', tab: 'attendancereport'},
      {name: 'Log Attendance', tab: 'logattendance'},
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
      {name: 'Exam Center', tab: 'examcenter'},
      {name: 'Manage Questions', tab: 'questions'},
      {name: 'Course Documents', tab: 'coursedocs'},
    ]},
    {section: 'Manage', items: [
      {name: 'Student Profiles', tab: 'profiles'},
      {name: 'Assign Tasks', tab: 'assignments'},
      {name: 'Study Schedules', tab: 'studyschedule'},
      {name: 'User Management', tab: 'usermanagement'},
    ]},
    {section: 'Tools', items: [
      {name: 'AMBOSS Rescore', tab: 'ambossrescore'},
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
        {activeProgram && (
          <div style={{padding: '10px 14px', borderBottom: '0.5px solid rgba(201,168,76,0.15)', background: 'rgba(201,168,76,0.06)'}}>
            <div style={{fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 4}}>Active Program</div>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6}}>
              <div style={{fontSize: 12, color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{activeProgram.name}</div>
              <div onClick={() => router.push('/programs')} style={{fontSize: 10, color: '#c9a84c', cursor: 'pointer', flexShrink: 0, padding: '2px 7px', border: '0.5px solid rgba(201,168,76,0.35)', borderRadius: 4}}>Switch</div>
            </div>
          </div>
        )}
        <div style={{padding: '8px 10px', flex: 1, overflowY: 'auto'}}>
          {navGroups.map(group => (
            <div key={group.section}>
              <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.28)', padding: '0 8px', margin: '12px 0 4px'}}>{group.section}</div>
              {group.items.map(item => (
                <div key={item.tab} onClick={() => navTo(item.tab)}
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
              <div style={{fontSize: 12, color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{profile?.full_name || user?.email?.split('@')[0]}</div>
              <div style={{fontSize: 10, color: 'rgba(255,255,255,0.35)'}}>Admin</div>
            </div>
            <div onClick={handleSignOut} style={{fontSize: 11, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, border: '0.5px solid rgba(255,255,255,0.15)', flexShrink: 0}}>Sign Out</div>
          </div>
        </div>
      </nav>

      <div style={{flex: 1, minWidth: 0, overflowY: 'auto', padding: '32px 36px'}}>
        {success && (
          <div style={{background: '#f0f7f2', border: '1px solid #6b7c3a', borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: 14, color: '#2d6a4f', fontWeight: 500}}>✓ {success}</div>
        )}

        {activeTab === 'overview' && <AdminOverview supabase={supabase} students={students} tutors={tutors} onNavigate={navTo} />}

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

        {activeTab === 'studentperformance' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Student Performance</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Qbank accuracy · Question log analysis · Weakness breakdown by topic</div>
            </div>
            <StudentPerformance supabase={supabase} students={students} />
          </div>
        )}

        {activeTab === 'examperformance' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Exam Performance</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>All student exam sessions and answer sheets</div>
            </div>
            <ExamReports supabase={supabase} students={students} returnPath="/admin?tab=examperformance" />
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

        {activeTab === 'logattendance' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Log Attendance</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Mark attendance for each session · Reported to admin</div>
            </div>
            <AttendanceLogger supabase={supabase} students={students} tutorId={user?.id} />
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
        {activeTab === 'examcenter'  && <div><div style={{marginBottom:24}}><div style={{fontFamily:'Georgia,serif',fontSize:28,color:'#0d2340',letterSpacing:-0.5}}>Exam Center</div></div><ExamManager /></div>}
        {activeTab === 'questions'   && <div><div style={{marginBottom:24}}><div style={{fontFamily:'Georgia,serif',fontSize:28,color:'#0d2340',letterSpacing:-0.5}}>Manage Questions</div></div><QuestionBuilder supabase={supabase}/></div>}
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

        {activeTab === 'ambossrescore' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>AMBOSS Rescore</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Upload the correct PDF answer key to storage, then re-grade all 200Q exam attempts.</div>
            </div>
            <FixAnswerKey />
            <div style={{marginTop: 32}}>
              <AmbossRescore supabase={supabase} />
            </div>
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
    const res = await fetch('/api/admin/attendance')
    const data = await res.json()
    setRecords(Array.isArray(data) ? data : [])
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
    const res = await fetch('/api/admin/accountability')
    const data = await res.json()
    setReports(Array.isArray(data) ? data : [])
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
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 12, paddingTop: 14}}>
                  {[
                    {l:'Understanding',v:r.understanding != null ? `${r.understanding}/5` : '—'},
                    {l:'Engagement',v:r.engagement != null ? `${r.engagement}/5` : '—'},
                    {l:'Stress',v:r.stress_levels || '—'},
                    {l:'Submitted',v:new Date(r.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})},
                  ].map(f => (
                    <div key={f.l} style={{background: '#f7f4ee', borderRadius: 8, padding: '10px 14px'}}>
                      <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8a7d6a', marginBottom: 4}}>{f.l}</div>
                      <div style={{fontSize: 14, color: '#0d2340', fontWeight: 500}}>{f.v}</div>
                    </div>
                  ))}
                </div>
                {[
                  {l:'Topics Covered',v:r.topics_covered},
                  {l:'Areas of Difficulty',v:r.areas_of_difficulty},
                  {l:'Next Steps',v:r.next_steps},
                  {l:'Mentor Notes',v:r.mentor_notes},
                ].filter(f=>f.v).map(f => (
                  <div key={f.l} style={{marginBottom: 10}}>
                    <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8a7d6a', marginBottom: 4}}>{f.l}</div>
                    <div style={{fontSize: 13, color: '#3d3020', lineHeight: 1.6}}>{f.v}</div>
                  </div>
                ))}
                <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 8, borderTop: '0.5px solid #f5f0e8'}}>
                  <span style={{fontSize: 11, padding: '3px 10px', borderRadius: 8, background: r.completed_study_goals === 'Y' ? '#f0f7f2' : '#fdf0f0', color: r.completed_study_goals === 'Y' ? '#2d6a4f' : '#c0574a'}}>
                    Goals: {r.completed_study_goals === 'Y' ? 'Completed ✓' : 'Incomplete'}
                  </span>
                  {r.took_practice_test && r.took_practice_test !== 'No' && r.took_practice_test !== 'Not Assigned' && (
                    <span style={{fontSize: 11, padding: '3px 10px', borderRadius: 8, background: '#f7f4ee', color: '#5c4f35'}}>
                      Practice test: {r.took_practice_test}{r.nbme_score ? ` · Score: ${r.nbme_score}` : ''}
                    </span>
                  )}
                  {r.was_prepared && <span style={{fontSize: 11, padding: '3px 10px', borderRadius: 8, background: '#f7f4ee', color: '#5c4f35'}}>Prepared: {r.was_prepared}</span>}
                  {r.follow_up_needed === 'Yes' && <span style={{fontSize: 11, padding: '3px 10px', borderRadius: 8, background: '#fff8e8', color: '#c07040', fontWeight: 600}}>⚠ Follow-up needed</span>}
                  {r.mentor_name && <span style={{fontSize: 11, padding: '3px 10px', borderRadius: 8, background: '#f7f4ee', color: '#5c4f35'}}>Mentor: {r.mentor_name}</span>}
                </div>
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
export function QuestionBuilder({ supabase }: any) {
  const [exams, setExams] = useState<any[]>([])
  const [selectedExam, setSelectedExam] = useState('')
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newQ, setNewQ] = useState({
    question_number: 1, question_text: '', choice_a: '', choice_b: '',
    choice_c: '', choice_d: '', correct_answer: 'A', topic: 'Mixed', explanation: ''
  })

  const TOPICS = ['Cardiology','Psychiatry','Renal','Biochemistry','Pharmacology',
    'Microbiology','Anatomy','Pathology','Physiology','Reproductive',
    'Neurology','Endocrinology','Immunology','Mixed']

  useEffect(() => {
    supabase.from('exams').select('*').order('sort_order').then(({data}:any) => setExams(data||[]))
  }, [])

  const loadQuestions = async (examId: string) => {
    setLoading(true)
    const { data } = await supabase.from('questions').select('*').eq('exam_id', examId).order('question_number')
    setQuestions(data || [])
    const nextNum = data && data.length > 0 ? Math.max(...data.map((q:any) => q.question_number)) + 1 : 1
    setNewQ(prev => ({...prev, question_number: nextNum}))
    setLoading(false)
  }

  const addQuestion = async () => {
    if (!selectedExam || !newQ.question_text || !newQ.choice_a || !newQ.choice_b || !newQ.choice_c || !newQ.choice_d) return
    setSaving(true)
    await supabase.from('questions').insert({...newQ, exam_id: selectedExam})
    await loadQuestions(selectedExam)
    setNewQ(prev => ({...prev, question_number: prev.question_number + 1, question_text: '', choice_a: '', choice_b: '', choice_c: '', choice_d: '', explanation: ''}))
    setSaving(false)
  }

  const deleteQuestion = async (id: string) => {
    await supabase.from('questions').delete().eq('id', id)
    await loadQuestions(selectedExam)
  }

  const inp = {width:'100%',height:40,borderRadius:7,border:'1px solid #e8dfc8',fontFamily:'Sora,sans-serif',fontSize:13,padding:'0 10px',color:'#1a1008',outline:'none',boxSizing:'border-box' as const}

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{background:'white',border:'0.5px solid #e8dfc8',borderRadius:12,padding:'20px 24px'}}>
        <div style={{fontSize:15,fontWeight:600,color:'#0d2340',marginBottom:14}}>Select exam to manage questions</div>
        <select value={selectedExam} onChange={e => { setSelectedExam(e.target.value); if(e.target.value) loadQuestions(e.target.value) }}
          style={{height:42,borderRadius:8,border:'1px solid #e8dfc8',fontFamily:'Sora,sans-serif',fontSize:14,padding:'0 12px',color:'#1a1008',outline:'none',minWidth:280}}>
          <option value="">Choose an exam...</option>
          {exams.map((e:any) => <option key={e.id} value={e.id}>{e.name} ({e.questions}Q)</option>)}
        </select>
        {selectedExam && <div style={{fontSize:13,color:'#8a7d6a',marginTop:8}}>{questions.length} questions added so far</div>}
      </div>

      {selectedExam && (
        <div style={{background:'white',border:'0.5px solid #e8dfc8',borderRadius:12,padding:'24px'}}>
          <div style={{fontSize:15,fontWeight:600,color:'#0d2340',marginBottom:20}}>Add question #{newQ.question_number}</div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,fontWeight:500,color:'#5c4f35',display:'block',marginBottom:5,textTransform:'uppercase'}}>Question text</label>
            <textarea value={newQ.question_text} onChange={e => setNewQ({...newQ,question_text:e.target.value})}
              placeholder="A 45-year-old man presents with..." rows={4}
              style={{width:'100%',borderRadius:8,border:'1px solid #e8dfc8',fontFamily:'Sora,sans-serif',fontSize:14,padding:'10px 12px',color:'#1a1008',outline:'none',boxSizing:'border-box',resize:'vertical'}}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
            {['a','b','c','d'].map(opt => (
              <div key={opt}>
                <label style={{fontSize:11,fontWeight:500,color:'#5c4f35',display:'block',marginBottom:5,textTransform:'uppercase'}}>Choice {opt.toUpperCase()}</label>
                <input type="text" value={(newQ as any)[`choice_${opt}`]} onChange={e => setNewQ({...newQ,[`choice_${opt}`]:e.target.value})}
                  placeholder={`Option ${opt.toUpperCase()}...`} style={inp}/>
              </div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
            <div>
              <label style={{fontSize:11,fontWeight:500,color:'#5c4f35',display:'block',marginBottom:5,textTransform:'uppercase'}}>Correct answer</label>
              <select value={newQ.correct_answer} onChange={e => setNewQ({...newQ,correct_answer:e.target.value})}
                style={{...inp,height:40}}>
                {['A','B','C','D'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:500,color:'#5c4f35',display:'block',marginBottom:5,textTransform:'uppercase'}}>Topic</label>
              <select value={newQ.topic} onChange={e => setNewQ({...newQ,topic:e.target.value})}
                style={{...inp,height:40}}>
                {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:500,color:'#5c4f35',display:'block',marginBottom:5,textTransform:'uppercase'}}>Q number</label>
              <input type="number" value={newQ.question_number} onChange={e => setNewQ({...newQ,question_number:parseInt(e.target.value)})} style={inp}/>
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:11,fontWeight:500,color:'#5c4f35',display:'block',marginBottom:5,textTransform:'uppercase'}}>Explanation (optional)</label>
            <textarea value={newQ.explanation} onChange={e => setNewQ({...newQ,explanation:e.target.value})}
              placeholder="Why is this the correct answer..." rows={2}
              style={{width:'100%',borderRadius:8,border:'1px solid #e8dfc8',fontFamily:'Sora,sans-serif',fontSize:13,padding:'10px 12px',color:'#1a1008',outline:'none',boxSizing:'border-box',resize:'none'}}/>
          </div>
          <button onClick={addQuestion} disabled={saving||!newQ.question_text||!newQ.choice_a||!newQ.choice_b||!newQ.choice_c||!newQ.choice_d}
            style={{width:'100%',height:46,background:'#0d2340',border:'none',borderRadius:9,color:'#c9a84c',fontFamily:'Sora,sans-serif',fontSize:15,fontWeight:600,cursor:'pointer'}}>
            {saving ? 'Saving...' : `Save question #${newQ.question_number} →`}
          </button>
        </div>
      )}

      {selectedExam && questions.length > 0 && (
        <div style={{background:'white',border:'0.5px solid #e8dfc8',borderRadius:12,overflow:'hidden'}}>
          <div style={{background:'#0d2340',padding:'12px 20px'}}>
            <div style={{fontSize:14,fontWeight:600,color:'white'}}>{questions.length} questions added</div>
          </div>
          {loading ? <div style={{padding:24,fontSize:14,color:'#8a7d6a'}}>Loading...</div>
          : questions.map((q, i) => (
            <div key={q.id} style={{padding:'14px 20px',borderBottom:i<questions.length-1?'0.5px solid #f5f0e8':'none',display:'flex',gap:16,alignItems:'flex-start'}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'#0d2340',color:'#c9a84c',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{q.question_number}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,color:'#0d2340',fontWeight:500,marginBottom:6,lineHeight:1.5}}>{q.question_text.substring(0,120)}{q.question_text.length>120?'...':''}</div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {['a','b','c','d'].map(opt => (
                    <span key={opt} style={{fontSize:12,padding:'2px 8px',borderRadius:6,
                      background: q.correct_answer===opt.toUpperCase() ? '#f0f7f2' : '#f7f4ee',
                      color: q.correct_answer===opt.toUpperCase() ? '#2d6a4f' : '#8a7d6a',
                      fontWeight: q.correct_answer===opt.toUpperCase() ? 700 : 400,
                      border: q.correct_answer===opt.toUpperCase() ? '1px solid #b8dfc8' : 'none'}}>
                      {opt.toUpperCase()}: {q[`choice_${opt}`]?.substring(0,30)}
                    </span>
                  ))}
                </div>
                {q.topic && <span style={{fontSize:11,marginTop:6,display:'inline-block',padding:'2px 8px',borderRadius:8,background:'#f0f4ff',color:'#3d5a99'}}>{q.topic}</span>}
              </div>
              <button onClick={() => deleteQuestion(q.id)}
                style={{fontSize:11,color:'#c0574a',background:'none',border:'none',cursor:'pointer',padding:'4px 8px',flexShrink:0}}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Fix Answer Key ────────────────────────────────────────────────────────────

function FixAnswerKey() {
  const [status, setStatus] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  const handleFix = async () => {
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch('/api/admin/fix-amboss-key', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setStatus('Error: ' + (json.error || res.statusText))
      } else {
        const lines = (json.results as Array<{examName:string,status:string,path?:string,error?:string}>)
          .map(r => `${r.examName}: ${r.status}${r.error ? ' — ' + r.error : ''}`)
          .join('\n')
        setStatus(lines || 'Done')
      }
    } catch (e: unknown) {
      setStatus('Network error: ' + String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{padding: '16px 20px', background: '#f7f4ef', borderRadius: 8, border: '1px solid #e8e2d8', maxWidth: 520}}>
      <div style={{fontWeight: 600, marginBottom: 8, color: '#0d2340'}}>Step 1 — Upload Correct Answer Key</div>
      <div style={{fontSize: 13, color: '#6b5f50', marginBottom: 14}}>
        Replaces the wrong JSON in Supabase Storage with the authoritative PDF answer key (200 entries). After uploading, score reports will re-grade automatically from the correct key.
      </div>
      <button
        onClick={handleFix}
        disabled={loading}
        style={{padding: '8px 20px', background: loading ? '#aaa' : '#0d2340', color: '#fff', border: 'none', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600}}
      >
        {loading ? 'Uploading…' : 'Upload Correct Answer Key'}
      </button>
      {status && (
        <pre style={{marginTop: 12, fontSize: 12, color: status.startsWith('Error') ? '#c0392b' : '#27ae60', whiteSpace: 'pre-wrap'}}>{status}</pre>
      )}
    </div>
  )
}

// ─── AMBOSS Rescore ────────────────────────────────────────────────────────────

type GradingAction = 'GRADE_NORMALLY' | 'RESCORE_WITH_SHIFT' | 'AWARD_AUTO_CREDIT'
interface RescoreEntry { q: number; ans: string; system: string; topic: string; action: GradingAction; orig: number | null }

const RESCORING_MAP: RescoreEntry[] = [
  {q:1,ans:"E",system:"Biochemistry & Genetics",topic:"X-linked recessive inheritance",action:"GRADE_NORMALLY",orig:1},
  {q:2,ans:"B",system:"Biochemistry & Genetics",topic:"Pleiotropy — PKU",action:"GRADE_NORMALLY",orig:2},
  {q:3,ans:"F",system:"Biochemistry & Genetics",topic:"Prader-Willi syndrome — genomic imprinting",action:"GRADE_NORMALLY",orig:3},
  {q:4,ans:"C",system:"Biochemistry & Genetics",topic:"Fragile X — CGG repeat expansion",action:"GRADE_NORMALLY",orig:4},
  {q:5,ans:"E",system:"Biochemistry & Genetics",topic:"Primary ciliary dyskinesia — dynein arm defect",action:"GRADE_NORMALLY",orig:5},
  {q:6,ans:"A",system:"Biochemistry & Genetics",topic:"Trisomy 18 — Edwards syndrome",action:"GRADE_NORMALLY",orig:6},
  {q:7,ans:"B",system:"Biochemistry & Genetics",topic:"Thiamine (B1) deficiency — Wernicke encephalopathy",action:"GRADE_NORMALLY",orig:7},
  {q:8,ans:"A",system:"Biochemistry & Genetics",topic:"Pompe disease — lysosomal acid maltase deficiency",action:"GRADE_NORMALLY",orig:8},
  {q:9,ans:"E",system:"Biochemistry & Genetics",topic:"Carcinoid syndrome — tryptophan hydroxylase",action:"GRADE_NORMALLY",orig:9},
  {q:10,ans:"A",system:"Biochemistry & Genetics",topic:"Fluoroquinolone mechanism — DNA gyrase inhibition",action:"GRADE_NORMALLY",orig:10},
  {q:11,ans:"F",system:"Biochemistry & Genetics",topic:"Gaucher disease — β-glucocerebrosidase deficiency",action:"GRADE_NORMALLY",orig:11},
  {q:12,ans:"E",system:"Biochemistry & Genetics",topic:"Ehlers-Danlos — lysine/hydroxylysine cross-linking defect",action:"GRADE_NORMALLY",orig:12},
  {q:13,ans:"B",system:"Biochemistry & Genetics",topic:"Insulin metabolic effects",action:"GRADE_NORMALLY",orig:13},
  {q:14,ans:"E",system:"Biochemistry & Genetics",topic:"Vitamin B12 — methylmalonyl-CoA mutase cofactor",action:"GRADE_NORMALLY",orig:14},
  {q:15,ans:"A",system:"Biochemistry & Genetics",topic:"Cystic fibrosis — vitamin D deficiency",action:"GRADE_NORMALLY",orig:15},
  {q:16,ans:"G",system:"Biochemistry & Genetics",topic:"Pyridoxine (B6) — aminotransferase cofactor",action:"GRADE_NORMALLY",orig:16},
  {q:17,ans:"B",system:"General Pathology",topic:"Apoptosis — intrinsic pathway",action:"GRADE_NORMALLY",orig:17},
  {q:18,ans:"A",system:"General Pathology",topic:"Coagulative necrosis — splenic infarct",action:"GRADE_NORMALLY",orig:18},
  {q:19,ans:"C",system:"General Pathology",topic:"Methemoglobinemia — dapsone-induced",action:"GRADE_NORMALLY",orig:19},
  {q:20,ans:"F",system:"General Pathology",topic:"Alpha-1-antitrypsin deficiency — LTB4 chemotaxis",action:"GRADE_NORMALLY",orig:20},
  {q:21,ans:"E",system:"General Pathology",topic:"Wound healing — myofibroblasts",action:"GRADE_NORMALLY",orig:21},
  {q:22,ans:"E",system:"General Pathology",topic:"Vascular permeability — endothelial junction separation",action:"GRADE_NORMALLY",orig:22},
  {q:23,ans:"B",system:"General Pathology",topic:"Tuberculosis — Langhans giant cells from macrophages",action:"GRADE_NORMALLY",orig:23},
  {q:24,ans:"D",system:"General Pathology",topic:"IL-2 (aldesleukin) — activates NK cells and cytotoxic T cells",action:"GRADE_NORMALLY",orig:24},
  {q:25,ans:"D",system:"General Pathology",topic:"TNM staging — mediastinal invasion (T4)",action:"GRADE_NORMALLY",orig:25},
  {q:26,ans:"D",system:"General Pathology",topic:"Lynch syndrome — MLH1 mismatch repair mutation",action:"GRADE_NORMALLY",orig:26},
  {q:27,ans:"C",system:"General Pathology",topic:"Li-Fraumeni syndrome — TP53 mutation",action:"GRADE_NORMALLY",orig:27},
  {q:28,ans:"F",system:"General Pathology",topic:"Brain metastases — lung cancer most common source",action:"AWARD_AUTO_CREDIT",orig:null},
  {q:29,ans:"A",system:"General Pathology",topic:"Prostate cancer — PSA, osteoblastic bone metastases",action:"RESCORE_WITH_SHIFT",orig:28},
  {q:30,ans:"A",system:"General Pharmacology",topic:"Urge incontinence — muscarinic M3 antagonism",action:"RESCORE_WITH_SHIFT",orig:29},
  {q:31,ans:"E",system:"General Pharmacology",topic:"Desmopressin — V2 receptor → adenylyl cyclase (Gs)",action:"RESCORE_WITH_SHIFT",orig:30},
  {q:32,ans:"B",system:"General Pharmacology",topic:"Competitive antagonist — rightward shift of dose-response curve",action:"RESCORE_WITH_SHIFT",orig:31},
  {q:33,ans:"B",system:"General Pharmacology",topic:"Enzyme kinetics — increased Vmax, unchanged Km",action:"RESCORE_WITH_SHIFT",orig:32},
  {q:34,ans:"A",system:"General Pharmacology",topic:"High bioavailability — no difference in dose-corrected AUC",action:"RESCORE_WITH_SHIFT",orig:33},
  {q:35,ans:"F",system:"General Pharmacology",topic:"Phase I clinical trial — safety, tolerability, PK/PD",action:"RESCORE_WITH_SHIFT",orig:34},
  {q:36,ans:"F",system:"General Pharmacology",topic:"CYP450 inducer — griseofulvin decreases warfarin levels",action:"RESCORE_WITH_SHIFT",orig:35},
  {q:37,ans:"C",system:"Microbiology",topic:"Chronic granulomatous disease — Serratia (catalase+)",action:"RESCORE_WITH_SHIFT",orig:36},
  {q:38,ans:"E",system:"Microbiology",topic:"CAP — S. pneumoniae polysaccharide capsule",action:"RESCORE_WITH_SHIFT",orig:37},
  {q:39,ans:"E",system:"Microbiology",topic:"Gram-negative sepsis — Lipid A causes hypotension",action:"RESCORE_WITH_SHIFT",orig:38},
  {q:40,ans:"A",system:"Microbiology",topic:"Bordetella pertussis — pertussis toxin increases cAMP",action:"RESCORE_WITH_SHIFT",orig:39},
  {q:41,ans:"D",system:"Microbiology",topic:"Mycoplasma pneumoniae — cold agglutinins, atypical pneumonia",action:"RESCORE_WITH_SHIFT",orig:40},
  {q:42,ans:"F",system:"Microbiology",topic:"Bacillus cereus — preformed emetic toxin, reheated rice",action:"RESCORE_WITH_SHIFT",orig:41},
  {q:43,ans:"A",system:"Microbiology",topic:"Primary syphilis — penicillin inhibits transpeptidase",action:"RESCORE_WITH_SHIFT",orig:42},
  {q:44,ans:"C",system:"Microbiology",topic:"Hepatitis C — needlestick injury, porphyria cutanea tarda",action:"RESCORE_WITH_SHIFT",orig:43},
  {q:45,ans:"B",system:"Microbiology",topic:"HIV entry — CCR5 coreceptor on macrophages",action:"RESCORE_WITH_SHIFT",orig:44},
  {q:46,ans:"D",system:"Microbiology",topic:"HIV prophylaxis — TMP-SMX for PCP (CD4 <200)",action:"RESCORE_WITH_SHIFT",orig:45},
  {q:47,ans:"D",system:"Microbiology",topic:"Zidovudine — NRTI, blocks viral DNA elongation",action:"RESCORE_WITH_SHIFT",orig:46},
  {q:48,ans:"A",system:"Microbiology",topic:"Entamoeba histolytica — trophozoites ingesting RBCs",action:"RESCORE_WITH_SHIFT",orig:47},
  {q:49,ans:"C",system:"Microbiology",topic:"Plasmodium falciparum — RBC inclusion bodies, chloroquine-resistant",action:"RESCORE_WITH_SHIFT",orig:48},
  {q:50,ans:"F",system:"Microbiology",topic:"Cryptococcus neoformans — narrow-necked budding, mucicarmine stain",action:"RESCORE_WITH_SHIFT",orig:49},
  {q:51,ans:"F",system:"Microbiology",topic:"Trichomonas vaginalis — motile flagellated protozoa",action:"RESCORE_WITH_SHIFT",orig:50},
  {q:52,ans:"C",system:"Immune System",topic:"Aging — decreased vaccine responsiveness",action:"RESCORE_WITH_SHIFT",orig:51},
  {q:53,ans:"C",system:"Immune System",topic:"Chronic mucocutaneous candidiasis — T cell defect",action:"RESCORE_WITH_SHIFT",orig:52},
  {q:54,ans:"D",system:"Immune System",topic:"Goodpasture syndrome — type II hypersensitivity",action:"RESCORE_WITH_SHIFT",orig:53},
  {q:55,ans:"C",system:"Immune System",topic:"Acute renal allograft rejection — T cell-mediated allorecognition",action:"RESCORE_WITH_SHIFT",orig:54},
  {q:56,ans:"C",system:"Immune System",topic:"Tetanus vaccine — toxoid (denatured bacterial exotoxin)",action:"RESCORE_WITH_SHIFT",orig:55},
  {q:57,ans:"B",system:"Immune System",topic:"Leukocyte adhesion deficiency — beta-2 integrin (CD18) defect",action:"RESCORE_WITH_SHIFT",orig:56},
  {q:58,ans:"A",system:"Immune System",topic:"Terminal complement deficiency — recurrent Neisseria",action:"RESCORE_WITH_SHIFT",orig:57},
  {q:59,ans:"D",system:"Immune System",topic:"EBV/mononucleosis — risk of Hodgkin lymphoma",action:"RESCORE_WITH_SHIFT",orig:58},
  {q:60,ans:"D",system:"Immune System",topic:"Cyclosporine — calcineurin inhibitor",action:"RESCORE_WITH_SHIFT",orig:59},
  {q:61,ans:"E",system:"Blood & Lymphoreticular System",topic:"Sideroblastic anemia — isoniazid/B6 deficiency",action:"RESCORE_WITH_SHIFT",orig:60},
  {q:62,ans:"C",system:"Blood & Lymphoreticular System",topic:"Lead poisoning — ALA dehydratase inhibition",action:"RESCORE_WITH_SHIFT",orig:61},
  {q:63,ans:"E",system:"Blood & Lymphoreticular System",topic:"Hemolytic disease of newborn — ABO incompatibility",action:"RESCORE_WITH_SHIFT",orig:62},
  {q:64,ans:"C",system:"Blood & Lymphoreticular System",topic:"Alpha-thalassemia minor — cis deletion of alpha-globin genes",action:"RESCORE_WITH_SHIFT",orig:63},
  {q:65,ans:"C",system:"Blood & Lymphoreticular System",topic:"Sickle cell anemia — Howell-Jolly bodies (functional asplenia)",action:"RESCORE_WITH_SHIFT",orig:64},
  {q:66,ans:"E",system:"Blood & Lymphoreticular System",topic:"Polycythemia vera — JAK2 V617F mutation",action:"RESCORE_WITH_SHIFT",orig:65},
  {q:67,ans:"A",system:"Blood & Lymphoreticular System",topic:"AML-M3 — myeloperoxidase, Auer rods, t(15;17)",action:"RESCORE_WITH_SHIFT",orig:66},
  {q:68,ans:"A",system:"Blood & Lymphoreticular System",topic:"Multiple myeloma — osteoclast activating factors",action:"RESCORE_WITH_SHIFT",orig:67},
  {q:69,ans:"A",system:"Blood & Lymphoreticular System",topic:"Hemolytic uremic syndrome — normal PT/PTT, low platelets",action:"RESCORE_WITH_SHIFT",orig:68},
  {q:70,ans:"C",system:"Blood & Lymphoreticular System",topic:"Hemophilia — intrinsic pathway, impaired factor X conversion",action:"RESCORE_WITH_SHIFT",orig:69},
  {q:71,ans:"C",system:"Blood & Lymphoreticular System",topic:"Warfarin — inhibits gamma-carboxylation of glutamate residues",action:"RESCORE_WITH_SHIFT",orig:70},
  {q:72,ans:"F",system:"Blood & Lymphoreticular System",topic:"Anthracyclines — dilated cardiomyopathy",action:"AWARD_AUTO_CREDIT",orig:null},
  {q:73,ans:"D",system:"Blood & Lymphoreticular System",topic:"Testicular cancer — para-aortic lymph node spread",action:"RESCORE_WITH_SHIFT",orig:71},
  {q:74,ans:"E",system:"Cardiovascular System",topic:"Beta-1 antagonism — reduces renin/angiotensin II in CHF",action:"RESCORE_WITH_SHIFT",orig:72},
  {q:75,ans:"C",system:"Cardiovascular System",topic:"Persistent truncus arteriosus — neural crest cell migration failure",action:"RESCORE_WITH_SHIFT",orig:73},
  {q:76,ans:"A",system:"Cardiovascular System",topic:"Tetralogy of Fallot — right axis deviation, boot-shaped heart",action:"RESCORE_WITH_SHIFT",orig:74},
  {q:77,ans:"F",system:"Cardiovascular System",topic:"Cor pulmonale — increased capillary hydrostatic pressure",action:"RESCORE_WITH_SHIFT",orig:75},
  {q:78,ans:"D",system:"Cardiovascular System",topic:"Hypovolemic shock — hemodynamic profile",action:"RESCORE_WITH_SHIFT",orig:76},
  {q:79,ans:"D",system:"Cardiovascular System",topic:"Restrictive cardiomyopathy — cardiac sarcoidosis",action:"RESCORE_WITH_SHIFT",orig:77},
  {q:80,ans:"B",system:"Cardiovascular System",topic:"Mitral stenosis — loud S1 (mitral valve closure)",action:"RESCORE_WITH_SHIFT",orig:78},
  {q:81,ans:"C",system:"Cardiovascular System",topic:"S3 heart sound — increased LV end-systolic volume",action:"RESCORE_WITH_SHIFT",orig:79},
  {q:82,ans:"E",system:"Cardiovascular System",topic:"Dressler syndrome — post-MI autoimmune pericarditis",action:"RESCORE_WITH_SHIFT",orig:80},
  {q:83,ans:"C",system:"Cardiovascular System",topic:"Infective endocarditis — antigen-antibody complex deposition in kidney",action:"RESCORE_WITH_SHIFT",orig:81},
  {q:84,ans:"E",system:"Cardiovascular System",topic:"Wolff-Parkinson-White — delta wave, short PR interval",action:"RESCORE_WITH_SHIFT",orig:82},
  {q:85,ans:"B",system:"Cardiovascular System",topic:"Polyarteritis nodosa — medium-vessel vasculitis, HBV association",action:"RESCORE_WITH_SHIFT",orig:83},
  {q:86,ans:"A",system:"Cardiovascular System",topic:"Familial hyperchylomicronemia — acute pancreatitis risk",action:"RESCORE_WITH_SHIFT",orig:84},
  {q:87,ans:"B",system:"Cardiovascular System",topic:"Statin adverse effects — elevated creatine kinase",action:"RESCORE_WITH_SHIFT",orig:85},
  {q:88,ans:"B",system:"Cardiovascular System",topic:"Superior laryngeal nerve — voice pitch limitation",action:"RESCORE_WITH_SHIFT",orig:86},
  {q:89,ans:"A",system:"Endocrine System",topic:"Graves disease — TSH receptor stimulating autoantibodies",action:"RESCORE_WITH_SHIFT",orig:87},
  {q:90,ans:"B",system:"Endocrine System",topic:"Pregnancy thyroid — increased TBG, normal free T3/T4",action:"RESCORE_WITH_SHIFT",orig:88},
  {q:91,ans:"A",system:"Endocrine System",topic:"Secondary hyperparathyroidism — CKD, rugger-jersey spine",action:"RESCORE_WITH_SHIFT",orig:89},
  {q:92,ans:"B",system:"Endocrine System",topic:"Central diabetes insipidus — posterior pituitary damage",action:"RESCORE_WITH_SHIFT",orig:90},
  {q:93,ans:"A",system:"Endocrine System",topic:"Neuroblastoma — Homer-Wright rosettes, HVA/VMA",action:"RESCORE_WITH_SHIFT",orig:91},
  {q:94,ans:"D",system:"Endocrine System",topic:"Addison disease — primary adrenal insufficiency",action:"RESCORE_WITH_SHIFT",orig:92},
  {q:95,ans:"F",system:"Endocrine System",topic:"Cushing syndrome — ectopic ACTH from small cell lung cancer",action:"RESCORE_WITH_SHIFT",orig:93},
  {q:96,ans:"B",system:"Endocrine System",topic:"Type 2 diabetes — islet amyloid polypeptide accumulation",action:"RESCORE_WITH_SHIFT",orig:94},
  {q:97,ans:"A",system:"Endocrine System",topic:"Glucagonoma — pancreatic alpha-cells, necrolytic migratory erythema",action:"RESCORE_WITH_SHIFT",orig:95},
  {q:98,ans:"F",system:"Endocrine System",topic:"Hemochromatosis — defective HFE/transferrin receptor binding",action:"RESCORE_WITH_SHIFT",orig:96},
  {q:99,ans:"D",system:"Endocrine System",topic:"MEN 2 — RET proto-oncogene gain-of-function mutation",action:"RESCORE_WITH_SHIFT",orig:97},
  {q:100,ans:"A",system:"Endocrine System",topic:"TSH receptor — Gs and Gq coupled (TSH-secreting adenoma)",action:"RESCORE_WITH_SHIFT",orig:98},
  {q:101,ans:"C",system:"Endocrine System",topic:"Sulfonylureas — ATP-sensitive K+ channel blockade",action:"RESCORE_WITH_SHIFT",orig:99},
  {q:102,ans:"B",system:"Endocrine System",topic:"Chagas disease — myenteric plexus destruction",action:"RESCORE_WITH_SHIFT",orig:100},
  {q:103,ans:"D",system:"Gastrointestinal System",topic:"Chagas disease — esophageal dysmotility",action:"RESCORE_WITH_SHIFT",orig:101},
  {q:104,ans:"D",system:"Gastrointestinal System",topic:"Bulimia nervosa — Mallory-Weiss syndrome",action:"RESCORE_WITH_SHIFT",orig:102},
  {q:105,ans:"E",system:"Gastrointestinal System",topic:"PUD — H. pylori strongest risk factor",action:"RESCORE_WITH_SHIFT",orig:103},
  {q:106,ans:"E",system:"Gastrointestinal System",topic:"Whipple disease — Tropheryma whipplei, PAS-positive macrophages",action:"RESCORE_WITH_SHIFT",orig:104},
  {q:107,ans:"G",system:"Gastrointestinal System",topic:"Hirschsprung disease — failure of neural crest cell migration",action:"RESCORE_WITH_SHIFT",orig:105},
  {q:108,ans:"B",system:"Gastrointestinal System",topic:"Crohn disease — Th1/Th17 transmural inflammation",action:"RESCORE_WITH_SHIFT",orig:106},
  {q:109,ans:"D",system:"Gastrointestinal System",topic:"Portal hypertension — superior epigastric vein (caput medusae)",action:"RESCORE_WITH_SHIFT",orig:107},
  {q:110,ans:"E",system:"Gastrointestinal System",topic:"Hepatitis B serology — acute active infection",action:"RESCORE_WITH_SHIFT",orig:108},
  {q:111,ans:"E",system:"Gastrointestinal System",topic:"Acute cholecystitis — cystic duct obstruction",action:"RESCORE_WITH_SHIFT",orig:109},
  {q:112,ans:"E",system:"Gastrointestinal System",topic:"Pancreatic cancer — Courvoisier sign, ionizing radiation",action:"RESCORE_WITH_SHIFT",orig:110},
  {q:113,ans:"C",system:"Skin & Musculoskeletal",topic:"Incus — 1st branchial arch derivative",action:"AWARD_AUTO_CREDIT",orig:null},
  {q:114,ans:"A",system:"Skin & Musculoskeletal",topic:"Congenital rubella — postauricular lymphadenopathy",action:"RESCORE_WITH_SHIFT",orig:111},
  {q:115,ans:"D",system:"Skin & Musculoskeletal",topic:"Tinea versicolor — Malassezia globosa overgrowth",action:"RESCORE_WITH_SHIFT",orig:112},
  {q:116,ans:"E",system:"Skin & Musculoskeletal",topic:"Pemphigus vulgaris — IgG against desmoglein (desmosomes)",action:"RESCORE_WITH_SHIFT",orig:113},
  {q:117,ans:"C",system:"Skin & Musculoskeletal",topic:"NMS — ryanodine receptor, dantrolene treatment",action:"RESCORE_WITH_SHIFT",orig:114},
  {q:118,ans:"C",system:"Skin & Musculoskeletal",topic:"Myasthenia gravis — decreased end plate potential",action:"RESCORE_WITH_SHIFT",orig:115},
  {q:119,ans:"D",system:"Skin & Musculoskeletal",topic:"Serotonin syndrome — sumatriptan + SSRI",action:"RESCORE_WITH_SHIFT",orig:116},
  {q:120,ans:"B",system:"Skin & Musculoskeletal",topic:"Muscle contraction — troponin C binds calcium",action:"RESCORE_WITH_SHIFT",orig:117},
  {q:121,ans:"F",system:"Skin & Musculoskeletal",topic:"SLE — anti-Sm (Smith) antibodies",action:"RESCORE_WITH_SHIFT",orig:118},
  {q:122,ans:"F",system:"Skin & Musculoskeletal",topic:"Limited systemic sclerosis — telangiectasia (CREST)",action:"RESCORE_WITH_SHIFT",orig:119},
  {q:123,ans:"C",system:"Skin & Musculoskeletal",topic:"Rheumatoid arthritis — synovial granulation tissue (pannus)",action:"RESCORE_WITH_SHIFT",orig:120},
  {q:124,ans:"E",system:"Skin & Musculoskeletal",topic:"Reactive arthritis — HLA-B27 positive genotype",action:"RESCORE_WITH_SHIFT",orig:121},
  {q:125,ans:"F",system:"Skin & Musculoskeletal",topic:"Dermatomyositis — ovarian adenocarcinoma association",action:"RESCORE_WITH_SHIFT",orig:122},
  {q:126,ans:"E",system:"Skin & Musculoskeletal",topic:"Paget disease of bone — lamellar interspersed with woven bone",action:"RESCORE_WITH_SHIFT",orig:123},
  {q:127,ans:"A",system:"Skin & Musculoskeletal",topic:"Visual pathway — Meyer loop (temporal lobe, superior field)",action:"RESCORE_WITH_SHIFT",orig:124},
  {q:128,ans:"E",system:"Nervous System & Special Senses",topic:"Horner syndrome — Pancoast tumor, stellate ganglion compression",action:"RESCORE_WITH_SHIFT",orig:125},
  {q:129,ans:"E",system:"Nervous System & Special Senses",topic:"CN III palsy — posterior communicating artery aneurysm",action:"RESCORE_WITH_SHIFT",orig:126},
  {q:130,ans:"C",system:"Nervous System & Special Senses",topic:"Facial nerve (CN VII) — exits at cerebellopontine angle",action:"RESCORE_WITH_SHIFT",orig:127},
  {q:131,ans:"D",system:"Nervous System & Special Senses",topic:"Vitamin B12 — subacute combined degeneration, dorsal columns",action:"RESCORE_WITH_SHIFT",orig:128},
  {q:132,ans:"E",system:"Nervous System & Special Senses",topic:"Huntington disease — caudate nucleus (striatum) atrophy",action:"RESCORE_WITH_SHIFT",orig:129},
  {q:133,ans:"F",system:"Nervous System & Special Senses",topic:"Epidural hematoma — arterial bleeding between dura and skull",action:"RESCORE_WITH_SHIFT",orig:130},
  {q:134,ans:"E",system:"Nervous System & Special Senses",topic:"Left ACA stroke — contralateral leg weakness, transcortical motor aphasia",action:"RESCORE_WITH_SHIFT",orig:131},
  {q:135,ans:"H",system:"Nervous System & Special Senses",topic:"Multiple sclerosis — Th1-mediated demyelination",action:"RESCORE_WITH_SHIFT",orig:132},
  {q:136,ans:"C",system:"Nervous System & Special Senses",topic:"Neurofibromatosis type 2 — chromosome 22, merlin, meningioma",action:"RESCORE_WITH_SHIFT",orig:133},
  {q:137,ans:"C",system:"Nervous System & Special Senses",topic:"Anterior cord syndrome — aortic surgery complication",action:"RESCORE_WITH_SHIFT",orig:134},
  {q:138,ans:"B",system:"Nervous System & Special Senses",topic:"Narcolepsy — decreased orexin-A (hypocretin)",action:"RESCORE_WITH_SHIFT",orig:135},
  {q:139,ans:"E",system:"Nervous System & Special Senses",topic:"Poliomyelitis — anterior horn cell destruction, LMN signs",action:"RESCORE_WITH_SHIFT",orig:136},
  {q:140,ans:"B",system:"Nervous System & Special Senses",topic:"Guillain-Barré syndrome — Schwann cell autoimmune attack",action:"RESCORE_WITH_SHIFT",orig:137},
  {q:141,ans:"C",system:"Nervous System & Special Senses",topic:"Alzheimer disease — extracellular amyloid plaques, trisomy 21",action:"RESCORE_WITH_SHIFT",orig:138},
  {q:142,ans:"G",system:"Nervous System & Special Senses",topic:"Radial nerve palsy — midshaft humerus fracture",action:"RESCORE_WITH_SHIFT",orig:139},
  {q:143,ans:"E",system:"Nervous System & Special Senses",topic:"Organophosphate poisoning — atropine (muscarinic antagonism)",action:"RESCORE_WITH_SHIFT",orig:140},
  {q:144,ans:"E",system:"Nervous System & Special Senses",topic:"Behavioral change stages — contemplation",action:"RESCORE_WITH_SHIFT",orig:141},
  {q:145,ans:"C",system:"Nervous System & Special Senses",topic:"Borderline personality disorder — splitting",action:"RESCORE_WITH_SHIFT",orig:142},
  {q:146,ans:"E",system:"Behavioral Health",topic:"Schizophreniform disorder — 1 to 6 months",action:"RESCORE_WITH_SHIFT",orig:143},
  {q:147,ans:"C",system:"Behavioral Health",topic:"Major depressive disorder — anhedonia ≥2 weeks",action:"RESCORE_WITH_SHIFT",orig:144},
  {q:148,ans:"A",system:"Behavioral Health",topic:"Antisocial personality disorder — conduct disorder + ≥3 adult criteria",action:"RESCORE_WITH_SHIFT",orig:145},
  {q:149,ans:"B",system:"Behavioral Health",topic:"Anorexia nervosa — osteoporosis, stress fractures",action:"RESCORE_WITH_SHIFT",orig:146},
  {q:150,ans:"B",system:"Behavioral Health",topic:"Bipolar disorder — antidepressant monotherapy triggers mania",action:"RESCORE_WITH_SHIFT",orig:147},
  {q:151,ans:"C",system:"Behavioral Health",topic:"Lithium monitoring — serum TSH (hypothyroidism)",action:"RESCORE_WITH_SHIFT",orig:148},
  {q:152,ans:"D",system:"Behavioral Health",topic:"Chlorpromazine — low-potency antipsychotic, anticholinergic effects",action:"RESCORE_WITH_SHIFT",orig:149},
  {q:153,ans:"A",system:"Behavioral Health",topic:"Alcohol withdrawal — benzodiazepines (lorazepam)",action:"RESCORE_WITH_SHIFT",orig:150},
  {q:154,ans:"B",system:"Behavioral Health",topic:"MDMA intoxication — serotonin/dopamine/NE release, hyponatremia",action:"RESCORE_WITH_SHIFT",orig:151},
  {q:155,ans:"D",system:"Behavioral Health",topic:"Delirium tremens — lorazepam (alcohol withdrawal)",action:"RESCORE_WITH_SHIFT",orig:152},
  {q:156,ans:"B",system:"Behavioral Health",topic:"MDMA — serotonin syndrome risk, hyponatremia",action:"RESCORE_WITH_SHIFT",orig:153},
  {q:157,ans:"E",system:"Renal & Urinary System",topic:"Acute tubular necrosis — muddy brown casts, basement membrane denudation",action:"RESCORE_WITH_SHIFT",orig:154},
  {q:158,ans:"B",system:"Renal & Urinary System",topic:"Salicylate toxicity — mixed acid-base disorder",action:"RESCORE_WITH_SHIFT",orig:155},
  {q:159,ans:"A",system:"Renal & Urinary System",topic:"Hypokalemia — increased H+/K+ antiporter in alpha-intercalated cells",action:"RESCORE_WITH_SHIFT",orig:156},
  {q:160,ans:"A",system:"Renal & Urinary System",topic:"Prerenal AKI — volume depletion",action:"RESCORE_WITH_SHIFT",orig:157},
  {q:161,ans:"E",system:"Renal & Urinary System",topic:"Poststreptococcal GN — granular IgG/IgM/C3, subepithelial humps",action:"RESCORE_WITH_SHIFT",orig:158},
  {q:162,ans:"A",system:"Renal & Urinary System",topic:"Diabetic nephropathy — hyaline arteriolosclerosis",action:"RESCORE_WITH_SHIFT",orig:159},
  {q:163,ans:"E",system:"Renal & Urinary System",topic:"Struvite kidney stones — magnesium ammonium phosphate (urease bacteria)",action:"RESCORE_WITH_SHIFT",orig:160},
  {q:164,ans:"E",system:"Renal & Urinary System",topic:"Staphylococcus saprophyticus — novobiocin-resistant UTI",action:"RESCORE_WITH_SHIFT",orig:161},
  {q:165,ans:"C",system:"Renal & Urinary System",topic:"Stress incontinence — urethral hypermobility, weakened pelvic floor",action:"RESCORE_WITH_SHIFT",orig:162},
  {q:166,ans:"D",system:"Renal & Urinary System",topic:"Thiazide diuretics — distal convoluted tubule, Na+/Cl- cotransporter",action:"RESCORE_WITH_SHIFT",orig:163},
  {q:167,ans:"B",system:"Pregnancy & Reproductive System",topic:"Carbamazepine teratogenicity — neural tube defects",action:"RESCORE_WITH_SHIFT",orig:164},
  {q:168,ans:"F",system:"Pregnancy & Reproductive System",topic:"Congenital toxoplasmosis — chorioretinitis, hydrocephalus, calcifications",action:"RESCORE_WITH_SHIFT",orig:165},
  {q:169,ans:"C",system:"Pregnancy & Reproductive System",topic:"Meckel diverticulum — patent vitelline duct",action:"RESCORE_WITH_SHIFT",orig:166},
  {q:170,ans:"D",system:"Pregnancy & Reproductive System",topic:"Developmental milestones — 2-year-old",action:"RESCORE_WITH_SHIFT",orig:167},
  {q:171,ans:"E",system:"Pregnancy & Reproductive System",topic:"PCOS — endometrial carcinoma from unopposed estrogen",action:"RESCORE_WITH_SHIFT",orig:168},
  {q:172,ans:"F",system:"Pregnancy & Reproductive System",topic:"Menopause — increased FSH (most reliable marker)",action:"RESCORE_WITH_SHIFT",orig:169},
  {q:173,ans:"C",system:"Pregnancy & Reproductive System",topic:"Turner syndrome — bicuspid aortic valve → aortic stenosis",action:"RESCORE_WITH_SHIFT",orig:170},
  {q:174,ans:"A",system:"Pregnancy & Reproductive System",topic:"Aromatase deficiency — ambiguous genitalia in 46,XX females",action:"RESCORE_WITH_SHIFT",orig:171},
  {q:175,ans:"B",system:"Pregnancy & Reproductive System",topic:"Adenomyosis — endometrial tissue within myometrium",action:"RESCORE_WITH_SHIFT",orig:172},
  {q:176,ans:"F",system:"Pregnancy & Reproductive System",topic:"PID — ectopic pregnancy risk",action:"RESCORE_WITH_SHIFT",orig:173},
  {q:177,ans:"E",system:"Pregnancy & Reproductive System",topic:"Communicating hydrocele — patent processus vaginalis",action:"RESCORE_WITH_SHIFT",orig:174},
  {q:178,ans:"D",system:"Respiratory System",topic:"Post-influenza lung — type II pneumocyte proliferation",action:"RESCORE_WITH_SHIFT",orig:175},
  {q:179,ans:"C",system:"Respiratory System",topic:"Opioid overdose — acute respiratory acidosis",action:"RESCORE_WITH_SHIFT",orig:176},
  {q:180,ans:"E",system:"Respiratory System",topic:"Severe asthma — physical exam findings",action:"RESCORE_WITH_SHIFT",orig:177},
  {q:181,ans:"E",system:"Respiratory System",topic:"Squamous cell carcinoma of lung — cigarette smoking, central cavitation",action:"RESCORE_WITH_SHIFT",orig:178},
  {q:182,ans:"C",system:"Respiratory System",topic:"Emphysema — obstructive spirometry, reduced DLCO",action:"RESCORE_WITH_SHIFT",orig:179},
  {q:183,ans:"B",system:"Respiratory System",topic:"Cystic fibrosis — congenital bilateral absence of vas deferens",action:"RESCORE_WITH_SHIFT",orig:180},
  {q:184,ans:"D",system:"Respiratory System",topic:"Sarcoidosis — elevated CD4+ T cells in BAL",action:"RESCORE_WITH_SHIFT",orig:181},
  {q:185,ans:"G",system:"Respiratory System",topic:"Pulmonary fibrosis — excess collagen deposition (amiodarone)",action:"RESCORE_WITH_SHIFT",orig:182},
  {q:186,ans:"A",system:"Respiratory System",topic:"Pulmonary embolism — DVT from raloxifene (SERM)",action:"RESCORE_WITH_SHIFT",orig:183},
  {q:187,ans:"B",system:"Respiratory System",topic:"Severe asthma — omalizumab downregulates FcεRI",action:"RESCORE_WITH_SHIFT",orig:184},
  {q:188,ans:"C",system:"Biostatistics & Public Health Science",topic:"Relative risk — appropriate measure for cohort studies",action:"RESCORE_WITH_SHIFT",orig:185},
  {q:189,ans:"A",system:"Biostatistics & Public Health Science",topic:"Lowering diagnostic cutoff — increases sensitivity and NPV",action:"RESCORE_WITH_SHIFT",orig:186},
  {q:190,ans:"D",system:"Biostatistics & Public Health Science",topic:"Precision — interrater reliability (reproducibility)",action:"RESCORE_WITH_SHIFT",orig:187},
  {q:191,ans:"A",system:"Biostatistics & Public Health Science",topic:"Case-control study — retrospective, starts with outcome",action:"RESCORE_WITH_SHIFT",orig:188},
  {q:192,ans:"D",system:"Biostatistics & Public Health Science",topic:"Confidence intervals — p-value relationship",action:"RESCORE_WITH_SHIFT",orig:189},
  {q:193,ans:"C",system:"Biostatistics & Public Health Science",topic:"Statistical power — decrease type II error rate",action:"RESCORE_WITH_SHIFT",orig:190},
  {q:194,ans:"C",system:"Biostatistics & Public Health Science",topic:"Confounding",action:"AWARD_AUTO_CREDIT",orig:null},
  {q:195,ans:"B",system:"Biostatistics & Public Health Science",topic:"Bladder cancer — transitional cell carcinoma, cigarette smoking",action:"RESCORE_WITH_SHIFT",orig:191},
  {q:196,ans:"B",system:"Biostatistics & Public Health Science",topic:"Demographic transition — childhood immunization",action:"RESCORE_WITH_SHIFT",orig:192},
  {q:197,ans:"E",system:"Biostatistics & Public Health Science",topic:"Pediatric informed consent — address parental concern empathetically",action:"RESCORE_WITH_SHIFT",orig:193},
  {q:198,ans:"C",system:"Biostatistics & Public Health Science",topic:"Patient confidentiality — HIPAA, no disclosure without consent",action:"RESCORE_WITH_SHIFT",orig:194},
  {q:199,ans:"E",system:"Biostatistics & Public Health Science",topic:"Language barriers — remote medical interpreter",action:"RESCORE_WITH_SHIFT",orig:195},
  {q:200,ans:"F",system:"Biostatistics & Public Health Science",topic:"Shaken baby syndrome — subdural hematoma (bridging vein tear)",action:"RESCORE_WITH_SHIFT",orig:196},
]

function rescoreAnswers(answers: Record<string, string>) {
  let correctedScore = 0
  const questionResults: Array<{
    correctedQ: number; originalQ: number | null; action: string
    correctAnswer: string; studentAnswer: string; correct: boolean
    system: string; topic: string
  }> = []
  for (const entry of RESCORING_MAP) {
    let studentAnswer = ''
    let correct = false
    if (entry.action === 'AWARD_AUTO_CREDIT') {
      correct = true; studentAnswer = '(auto-credit)'; correctedScore++
    } else {
      studentAnswer = (answers[String(entry.orig!)] || '').toUpperCase().trim()
      correct = studentAnswer === entry.ans
      if (correct) correctedScore++
    }
    questionResults.push({ correctedQ: entry.q, originalQ: entry.orig, action: entry.action, correctAnswer: entry.ans, studentAnswer, correct, system: entry.system, topic: entry.topic })
  }
  return { correctedScore, questionResults }
}

interface RescoreResult {
  sessionId: string; studentName: string; examName: string; examDate: string
  originalScore: number; originalPct: number; correctedScore: number; correctedPct: number
  delta: number; hasSheet: boolean; answersCount: number
  questionResults: Array<{correctedQ:number;originalQ:number|null;action:string;correctAnswer:string;studentAnswer:string;correct:boolean;system:string;topic:string}>
  incorrectAfter: Array<{correctedQ:number;originalQ:number|null;action:string;correctAnswer:string;studentAnswer:string;correct:boolean;system:string;topic:string}>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AmbossRescore({ supabase }: { supabase: unknown }) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<RescoreResult[]>([])
  const [error, setError] = useState('')
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  const run = async () => {
    setLoading(true); setError(''); setResults([])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sessions, error: sessErr } = await (supabase as any)
      .from('exam_sessions')
      .select('id, exam_name, student_id, score, created_at, answer_sheets(*), profiles(full_name, email)')
      .order('created_at', { ascending: false })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (sessErr) { setError((sessErr as any).message); setLoading(false); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const amboss = ((sessions as any[]) || []).filter((s: {exam_name?: string}) => {
      const name = (s.exam_name || '').toLowerCase()
      return name.includes('200q') || name.includes('amboss')
    })
    if (amboss.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allNames = [...new Set(((sessions as any[]) || []).map((s: {exam_name?: string}) => s.exam_name))]
      setError(`No 200Q/AMBOSS sessions found. All exam names in database: ${allNames.join(', ')}`)
      setLoading(false); return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processed: RescoreResult[] = amboss.map((session: any) => {
      const sheet = Array.isArray(session.answer_sheets) ? session.answer_sheets[0] : session.answer_sheets
      const answers: Record<string, string> = sheet?.answers || {}
      const studentName = session.profiles?.full_name || session.profiles?.email?.split('@')[0] || 'Unknown'
      const originalScore = session.score ?? 0
      const { correctedScore, questionResults } = rescoreAnswers(answers)
      return {
        sessionId: session.id, studentName,
        examName: session.exam_name,
        examDate: session.created_at?.split('T')[0] || '',
        originalScore, originalPct: Math.round((originalScore / 200) * 1000) / 10,
        correctedScore, correctedPct: Math.round((correctedScore / 200) * 1000) / 10,
        delta: correctedScore - originalScore,
        hasSheet: !!sheet, answersCount: Object.keys(answers).length,
        questionResults,
        incorrectAfter: questionResults.filter((r: any) => !r.correct),
      }
    })
    setResults(processed); setLoading(false)
  }

  const downloadCSV = () => {
    const rows: string[][] = [['Student','Exam Date','Original Score','Original %','Corrected Score','Corrected %','Delta']]
    for (const r of results)
      rows.push([r.studentName, r.examDate, String(r.originalScore), String(r.originalPct), String(r.correctedScore), String(r.correctedPct), r.delta >= 0 ? `+${r.delta}` : String(r.delta)])
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'amboss_rescoring_summary.csv'; a.click()
  }

  const downloadDetailedCSV = () => {
    const rows: string[][] = [['Student','Exam Date','Corrected Q#','Original Q#','Action','System','Topic','Correct Answer','Student Answer','Correct After Rescore']]
    for (const r of results)
      for (const q of r.questionResults)
        rows.push([r.studentName, r.examDate, String(q.correctedQ), q.originalQ != null ? String(q.originalQ) : 'N/A', q.action, q.system, q.topic, q.correctAnswer, q.studentAnswer, q.correct ? 'YES' : 'NO'])
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'amboss_rescoring_detailed.csv'; a.click()
  }

  const cell: React.CSSProperties = {padding:'10px 14px', fontSize:13, color:'#0d2340', borderBottom:'0.5px solid #f0e8d8'}
  const hcell: React.CSSProperties = {padding:'10px 14px', fontSize:11, textTransform:'uppercase', letterSpacing:'0.07em', color:'rgba(255,255,255,0.6)', textAlign:'left'}

  return (
    <div>
      <div style={{background:'white', border:'0.5px solid #e8dfc8', borderRadius:12, padding:24, marginBottom:20}}>
        <div style={{fontSize:14, color:'#4a3f2f', marginBottom:16, lineHeight:1.6}}>
          The original 200Q answer key was missing Q28, Q72, Q113, and Q194, causing a cumulative shift that misgraded 173 of 200 questions for every student. This tool re-grades every submitted answer sheet against the corrected key and produces individual corrected scores.
        </div>
        <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
          <button onClick={run} disabled={loading}
            style={{padding:'10px 24px', background:'#0d2340', color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:loading?'not-allowed':'pointer', opacity:loading?0.6:1}}>
            {loading ? 'Running rescoring...' : 'Run Rescoring'}
          </button>
          {results.length > 0 && <>
            <button onClick={downloadCSV} style={{padding:'10px 18px', background:'#6b7c3a', color:'white', border:'none', borderRadius:8, fontSize:13, cursor:'pointer'}}>
              Download Summary CSV
            </button>
            <button onClick={downloadDetailedCSV} style={{padding:'10px 18px', background:'#1a3a5a', color:'white', border:'none', borderRadius:8, fontSize:13, cursor:'pointer'}}>
              Download Full Breakdown CSV
            </button>
          </>}
        </div>
        {error && <div style={{marginTop:14, padding:'10px 14px', background:'#fef0f0', border:'1px solid #f5c2c2', borderRadius:8, fontSize:13, color:'#8b2020'}}>{error}</div>}
      </div>

      {results.length > 0 && (
        <>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20}}>
            {[
              {label:'Sessions Rescored', value: String(results.length)},
              {label:'Avg Score Change', value:`+${(results.reduce((s,r)=>s+r.delta,0)/results.length).toFixed(1)} pts`},
              {label:'Highest Gain', value:`+${Math.max(...results.map(r=>r.delta))} pts`},
              {label:'Auto-Credit Qs', value:'4 (Q28, Q72, Q113, Q194)'},
            ].map(stat => (
              <div key={stat.label} style={{background:'white', border:'0.5px solid #e8dfc8', borderRadius:10, padding:'16px 18px'}}>
                <div style={{fontSize:11, textTransform:'uppercase', letterSpacing:'0.07em', color:'#8a7d6a', marginBottom:6}}>{stat.label}</div>
                <div style={{fontSize:22, fontWeight:700, color:'#0d2340', fontFamily:'Georgia,serif'}}>{stat.value}</div>
              </div>
            ))}
          </div>

          <div style={{background:'white', border:'0.5px solid #e8dfc8', borderRadius:12, overflow:'hidden'}}>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#0d2340'}}>
                  {['Student','Date','Original','Corrected','Change','Answers','Details'].map(h => (
                    <th key={h} style={hcell}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <React.Fragment key={r.sessionId}>
                    <tr style={{background: expandedStudent === r.sessionId ? '#f7f9f4' : 'white'}}>
                      <td style={cell}><strong>{r.studentName}</strong></td>
                      <td style={cell}>{r.examDate}</td>
                      <td style={cell}>{r.originalScore}/200 ({r.originalPct}%)</td>
                      <td style={{...cell, color:'#2d6a4f', fontWeight:600}}>{r.correctedScore}/200 ({r.correctedPct}%)</td>
                      <td style={{...cell, color: r.delta > 0 ? '#2d6a4f' : r.delta < 0 ? '#8b2020' : '#666', fontWeight:600}}>
                        {r.delta > 0 ? '+' : ''}{r.delta} pts
                      </td>
                      <td style={cell}>{!r.hasSheet ? <span style={{color:'#c0574a',fontSize:12}}>No sheet</span> : `${r.answersCount}`}</td>
                      <td style={cell}>
                        <button onClick={() => setExpandedStudent(expandedStudent === r.sessionId ? null : r.sessionId)}
                          style={{fontSize:12, color:'#0d2340', background:'none', border:'0.5px solid #c0b8a8', borderRadius:6, padding:'4px 10px', cursor:'pointer'}}>
                          {expandedStudent === r.sessionId ? 'Hide' : 'View'} breakdown
                        </button>
                      </td>
                    </tr>
                    {expandedStudent === r.sessionId && (
                      <tr>
                        <td colSpan={7} style={{padding:0, background:'#f7f9f4'}}>
                          <div style={{padding:'16px 20px'}}>
                            <div style={{fontSize:13, fontWeight:600, color:'#0d2340', marginBottom:10}}>
                              Incorrect after rescoring: {r.incorrectAfter.length}/200
                            </div>
                            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:8}}>
                              {r.incorrectAfter.map((q: any) => (
                                <div key={q.correctedQ} style={{background:'white', border:'0.5px solid #e8dfc8', borderRadius:8, padding:'8px 12px', fontSize:12}}>
                                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:3}}>
                                    <strong style={{color:'#0d2340'}}>Q{q.correctedQ}</strong>
                                    <span style={{color:'#8a7d6a', fontSize:11}}>{q.system}</span>
                                  </div>
                                  <div style={{color:'#4a3f2f', marginBottom:4, lineHeight:1.4}}>{q.topic}</div>
                                  <div style={{display:'flex', gap:12, fontSize:11}}>
                                    <span style={{color:'#c0574a'}}>Student: <strong>{q.studentAnswer || '—'}</strong></span>
                                    <span style={{color:'#2d6a4f'}}>Correct: <strong>{q.correctAnswer}</strong></span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
