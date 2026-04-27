'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase'
import {
  AnnouncementForm, FeedbackTab, SlidesManager, RecordingsManager,
  NotesManager, ResourcesManager, ScheduleManager, AssignmentsManager,
  StudyScheduleManager, ExamReports, AttendanceLogger, StudentPerformance, TutorCalendar
} from './components'

export default function TutorDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [assignedStudents, setAssignedStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [notifForm, setNotifForm] = useState({student_id: 'all', title: '', message: '', type: 'general', link: ''})
  const [meetingForm, setMeetingForm] = useState({student_id: '', meeting_date: new Date().toISOString().split('T')[0], duration_minutes: '30', notes: '', action_items: '', next_meeting: ''})
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const [{ data: studentData }, { data: profileData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'student').order('full_name'),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ])
      setStudents(studentData || [])
      const { data: assignedData } = await supabase.from('profiles').select('*').eq('role', 'student').eq('tutor_id', user.id).order('full_name')
      setAssignedStudents(assignedData && assignedData.length > 0 ? assignedData : (studentData || []))
      setProfile(profileData)
      setLoading(false)
    }
    init()
  }, [])

  const sendNotification = async () => {
    if (!notifForm.title) return
    setSending(true)
    if (notifForm.student_id === 'all') {
      for (const student of students) {
        await supabase.from('notifications').insert({student_id: student.id, title: notifForm.title, message: notifForm.message, type: notifForm.type, link: notifForm.link || null})
      }
    } else {
      await supabase.from('notifications').insert({student_id: notifForm.student_id, title: notifForm.title, message: notifForm.message, type: notifForm.type, link: notifForm.link || null})
    }
    setSuccess('Notification sent!')
    setNotifForm({student_id: 'all', title: '', message: '', type: 'general', link: ''})
    setSending(false)
    setTimeout(() => setSuccess(''), 3000)
  }

  const logMeeting = async () => {
    if (!meetingForm.student_id || !meetingForm.meeting_date) return
    setSending(true)
    await supabase.from('mentor_meetings').insert({student_id: meetingForm.student_id, mentor_id: user.id, meeting_date: meetingForm.meeting_date, duration_minutes: parseInt(meetingForm.duration_minutes), notes: meetingForm.notes, action_items: meetingForm.action_items, next_meeting: meetingForm.next_meeting || null})
    await supabase.from('notifications').insert({student_id: meetingForm.student_id, title: 'Mentor meeting notes posted', message: meetingForm.action_items ? `Action items: ${meetingForm.action_items.substring(0, 80)}` : 'Your mentor has logged notes from your recent 1-on-1.', type: 'meeting', link: '/dashboard/mentor'})
    setSuccess('Meeting logged and student notified!')
    setMeetingForm({student_id: '', meeting_date: new Date().toISOString().split('T')[0], duration_minutes: '30', notes: '', action_items: '', next_meeting: ''})
    setSending(false)
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <main style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee'}}>
      <div style={{fontFamily: 'Georgia, serif', fontSize: 24, color: '#0d2340'}}>Loading tutor dashboard...</div>
    </main>
  )

  const navGroups = [
    {section: 'Home', items: [{name: 'Overview', tab: 'overview'}]},
    {section: 'Students', items: [
      {name: 'Calendar', tab: 'calendar'},
    {name: 'My Students', tab: 'students'},
      {name: 'Send Notifications', tab: 'notifications'},
      {name: 'Log Meetings', tab: 'meetings'},
      {name: 'Student Feedback', tab: 'feedback'},
    ]},
    {section: 'Communication', items: [
      {name: 'Announcements', tab: 'announcements'},
    ]},
    {section: 'Content', items: [
      {name: 'Manage Slides', tab: 'slides'},
      {name: 'Manage Recordings', tab: 'recordings'},
      {name: 'Manage HY Notes', tab: 'notes'},
      {name: 'Manage Resources', tab: 'resources'},
      {name: 'Manage Schedule', tab: 'schedule'},
    ]},
    {section: 'Academics', items: [
      {name: 'Assign Tasks', tab: 'assignments'},
      {name: 'Study Schedules', tab: 'studyschedule'},
      {name: 'Exam Reports', tab: 'examreports'},
      {name: 'Student Performance', tab: 'studentperformance'},
    ]},
    {section: 'Reporting', items: [
      {name: 'Log Attendance', tab: 'attendance'},
      {name: 'Student Progress Report', tab: 'accountability'},
    ]},
  ]

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
          <div style={{fontSize: 10, color: '#c9a84c', letterSpacing: '0.09em', textTransform: 'uppercase', paddingLeft: 46, marginTop: 3}}>Tutor Dashboard</div>
        </div>
        <div style={{padding: '8px 10px', flex: 1, overflowY: 'auto'}}>
          {navGroups.map(group => (
            <div key={group.section}>
              <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.28)', padding: '0 8px', margin: '12px 0 4px'}}>{group.section}</div>
              {group.items.map(item => (
                <div key={item.tab} onClick={() => setActiveTab(item.tab)}
                  style={{display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, color: activeTab === item.tab ? '#c9a84c' : 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 2, background: activeTab === item.tab ? 'rgba(255,255,255,0.09)' : 'transparent', cursor: 'pointer'}}>
                  <div style={{width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0}}/>{item.name}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{padding: '12px 14px', borderTop: '0.5px solid rgba(201,168,76,0.14)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <div style={{width: 30, height: 30, borderRadius: '50%', background: '#c9a84c', color: '#0d2340', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              {(profile?.full_name || user?.email)?.charAt(0).toUpperCase()}
            </div>
            <div style={{flex: 1, minWidth: 0}}>
              <div style={{fontSize: 12, color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{profile?.full_name || user?.email?.split('@')[0]}</div>
              <div style={{fontSize: 10, color: 'rgba(255,255,255,0.35)'}}>Tutor</div>
            </div>
            <div onClick={handleSignOut} style={{fontSize: 11, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, border: '0.5px solid rgba(255,255,255,0.15)', flexShrink: 0}}>Sign Out</div>
          </div>
        </div>
      </nav>

      <div style={{flex: 1, minWidth: 0, overflowY: 'auto', padding: '32px 36px'}}>
        {success && (
          <div style={{background: '#f0f7f2', border: '1px solid #6b7c3a', borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: 14, color: '#2d6a4f', fontWeight: 500}}>✓ {success}</div>
        )}

        {activeTab === 'overview' && (
          <div>
            <div style={{marginBottom: 28}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5}}>Tutor Dashboard</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>P2P Mentoring Program · Windsor SOM · May 2026 Cohort</div>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24}}>
              {[{label: 'Total students', value: students.length.toString(), delta: 'In your cohort'}, {label: 'Program start', value: 'May 4', delta: '2026 · Week 1'}, {label: 'Program end', value: 'Jun 29', delta: '8 weeks total'}].map((m, i) => (
                <div key={i} style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 10, padding: '16px 18px'}}>
                  <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a89870', marginBottom: 8}}>{m.label}</div>
                  <div style={{fontFamily: 'Georgia, serif', fontSize: 32, color: '#0d2340'}}>{m.value}</div>
                  <div style={{fontSize: 12, color: '#a89870', marginTop: 4}}>{m.delta}</div>
                </div>
              ))}
            </div>
            <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px', marginBottom: 20}}>
              <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 16}}>Quick actions</div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12}}>
                {[
                  {label: 'Send notification', tab: 'notifications', color: '#c9a84c'},
                  {label: 'Log a meeting', tab: 'meetings', color: '#4a8c84'},
                  {label: 'View students', tab: 'students', color: '#6b7c3a'},
                  {label: 'Post announcement', tab: 'announcements', color: '#c0574a'},
                  {label: 'Respond to feedback', tab: 'feedback', color: '#c07040'},
                  {label: 'Upload slides', tab: 'slides', color: '#9e2a2a'},
                  {label: 'Add recording', tab: 'recordings', color: '#4a8c84'},
                  {label: 'Assign study schedule', tab: 'studyschedule', color: '#6b7c3a'},
                  {label: 'Student Progress Report', tab: 'accountability', color: '#c9a84c'},
                ].map((a, i) => (
                  <div key={i} onClick={() => setActiveTab(a.tab)}
                    style={{padding: '12px 14px', background: '#f7f4ee', border: `1px solid ${a.color}`, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10}}>
                    <div style={{width: 10, height: 10, borderRadius: '50%', background: a.color, flexShrink: 0}}/>
                    <div style={{fontSize: 13, color: '#0d2340', fontWeight: 500}}>{a.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{background: '#0d2340', borderRadius: 12, padding: '18px 24px'}}>
              <div style={{fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 12}}>Program schedule</div>
              {[
                {dates: 'May 4–17', phase: 'Week 1–2 · Daily sessions Mon–Sat 7–9 PM CST', tag: 'HY Topics'},
                {dates: 'May 18', phase: 'Week 2 assessment · 200-question exam', tag: 'Exam'},
                {dates: 'May 19–Jun 28', phase: 'Week 3–8 · Tue/Thu/Sat · Weakness review', tag: 'Review'},
                {dates: 'Weekly', phase: '30-min mentor 1-on-1 meetings', tag: 'Mentor'},
              ].map((s, i) => (
                <div key={i} style={{display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < 3 ? '0.5px solid rgba(255,255,255,0.08)' : 'none'}}>
                  <div style={{fontSize: 12, color: '#c9a84c', width: 100, flexShrink: 0}}>{s.dates}</div>
                  <div style={{fontSize: 13, color: 'rgba(255,255,255,0.75)', flex: 1}}>{s.phase}</div>
                  <div style={{fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(201,168,76,0.15)', color: '#c9a84c', flexShrink: 0}}>{s.tag}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>My Students</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>{students.length} students enrolled</div>
            </div>
            {students.length === 0 ? (
              <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '40px', textAlign: 'center'}}>
                <div style={{fontSize: 16, color: '#0d2340', fontWeight: 500, marginBottom: 8}}>No students yet</div>
                <div style={{fontSize: 14, color: '#8a7d6a'}}>Students will appear here once they sign up</div>
              </div>
            ) : (
              <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr style={{background: '#0d2340'}}>
                      {['Student', 'Email', 'School', 'Joined', 'Status'].map(h => (
                        <th key={h} style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.5)', padding: '12px 16px', textAlign: 'left'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s.id} style={{borderBottom: i < students.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
                        <td style={{padding: '14px 16px'}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                            <div style={{width: 32, height: 32, borderRadius: '50%', background: '#c9a84c', color: '#0d2340', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                              {(s.full_name || s.email).charAt(0).toUpperCase()}
                            </div>
                            <div style={{fontSize: 14, fontWeight: 500, color: '#0d2340'}}>{s.full_name || s.email.split('@')[0]}</div>
                          </div>
                        </td>
                        <td style={{fontSize: 13, color: '#3d3020', padding: '14px 16px'}}>{s.email}</td>
                        <td style={{fontSize: 13, color: '#3d3020', padding: '14px 16px'}}>{s.school || 'Windsor SOM'}</td>
                        <td style={{fontSize: 13, color: '#3d3020', padding: '14px 16px'}}>{new Date(s.created_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</td>
                        <td style={{padding: '14px 16px'}}><span style={{fontSize: 11, padding: '3px 10px', borderRadius: 10, background: '#f0f7f2', color: '#2d6a4f', fontWeight: 500}}>Active</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Send Notifications</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Send to one student or your entire cohort</div>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20}}>
              <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
                <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 18}}>New notification</div>
                {[{label: 'Send to', key: 'student_id', type: 'select', options: [{v:'all',l:`All students (${students.length})`}, ...students.map((s:any)=>({v:s.id,l:s.full_name||s.email.split('@')[0]}))]}, {label: 'Type', key: 'type', type: 'select', options: ['general','assignment','exam','announcement','feedback','meeting'].map(t=>({v:t,l:t.charAt(0).toUpperCase()+t.slice(1)}))}].map(f => (
                  <div key={f.key} style={{marginBottom: 14}}>
                    <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>{f.label}</label>
                    <select value={(notifForm as any)[f.key]} onChange={e => setNotifForm({...notifForm, [f.key]: e.target.value})}
                      style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
                      {f.options.map((o:any) => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                ))}
                <div style={{marginBottom: 14}}>
                  <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Title</label>
                  <input type="text" value={notifForm.title} onChange={e => setNotifForm({...notifForm, title: e.target.value})} placeholder="Notification title"
                    style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
                </div>
                <div style={{marginBottom: 14}}>
                  <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Message</label>
                  <textarea value={notifForm.message} onChange={e => setNotifForm({...notifForm, message: e.target.value})} placeholder="Message..." rows={3}
                    style={{width: '100%', borderRadius: 8, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '10px 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', resize: 'none'}}/>
                </div>
                <div style={{marginBottom: 20}}>
                  <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Link to page</label>
                  <select value={notifForm.link} onChange={e => setNotifForm({...notifForm, link: e.target.value})}
                    style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
                    <option value="">No link</option>
                    <option value="/dashboard">Dashboard</option>
                    <option value="/dashboard/qbank">Qbank Tracker</option>
                    <option value="/dashboard/nbme">NBME Scores</option>
                    <option value="/dashboard/exams">Exam Center</option>
                    <option value="/dashboard/studyschedule">Study Schedule</option>
                    <option value="/dashboard/assignments">Assignments</option>
                    <option value="/dashboard/mentor">Mentor Meetings</option>
                    <option value="/dashboard/feedback">Live Feedback</option>
                    <option value="/dashboard/slides">Session Slides</option>
                    <option value="/dashboard/documents">Course Documents</option>
                  </select>
                </div>
                <button onClick={sendNotification} disabled={sending || !notifForm.title}
                  style={{width: '100%', height: 46, background: sending ? '#4a5568' : '#0d2340', border: 'none', borderRadius: 9, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer'}}>
                  {sending ? 'Sending...' : 'Send ↗'}
                </button>
              </div>
              <div style={{background: '#0d2340', borderRadius: 12, padding: '20px 22px'}}>
                <div style={{fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 14}}>Quick templates</div>
                {[
                  {title: 'Assignment due reminder', msg: 'Your Qbank block is due tonight. Log your results before midnight.'},
                  {title: 'Session tonight', msg: 'Class tonight at 7 PM CST. Review your HY notes before class.'},
                  {title: 'New slides available', msg: 'Session slides have been posted — check the Session Slides page.'},
                  {title: 'NBME exam scheduled', msg: 'Your next NBME is this Sunday. Block off your full day.'},
                  {title: 'Great progress!', msg: 'Your Qbank scores are trending up. Keep up the excellent work!'},
                ].map((t, i) => (
                  <div key={i} onClick={() => setNotifForm({...notifForm, title: t.title, message: t.msg})}
                    style={{padding: '10px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, cursor: 'pointer', marginBottom: 8}}>
                    <div style={{fontSize: 13, color: 'white', fontWeight: 500, marginBottom: 2}}>{t.title}</div>
                    <div style={{fontSize: 11, color: 'rgba(255,255,255,0.4)'}}>{t.msg.substring(0, 60)}...</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meetings' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Log Mentor Meetings</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Notes appear automatically on the student's page</div>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20}}>
              <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
                <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 18}}>Log a meeting</div>
                <div style={{marginBottom: 14}}>
                  <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase'}}>Student</label>
                  <select value={meetingForm.student_id} onChange={e => setMeetingForm({...meetingForm, student_id: e.target.value})}
                    style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
                    <option value="">Select student...</option>
                    {assignedStudents.map((s:any) => <option key={s.id} value={s.id}>{s.full_name || s.email.split('@')[0]}</option>)}
                  </select>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14}}>
                  <div>
                    <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase'}}>Date</label>
                    <input type="date" value={meetingForm.meeting_date} onChange={e => setMeetingForm({...meetingForm, meeting_date: e.target.value})}
                      style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
                  </div>
                  <div>
                    <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase'}}>Duration</label>
                    <select value={meetingForm.duration_minutes} onChange={e => setMeetingForm({...meetingForm, duration_minutes: e.target.value})}
                      style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
                      {['15','20','30','45','60'].map(o => <option key={o} value={o}>{o} min</option>)}
                    </select>
                  </div>
                </div>
                <div style={{marginBottom: 14}}>
                  <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase'}}>Session notes</label>
                  <textarea value={meetingForm.notes} onChange={e => setMeetingForm({...meetingForm, notes: e.target.value})} placeholder="What did you discuss?" rows={4}
                    style={{width: '100%', borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '10px 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', resize: 'none'}}/>
                </div>
                <div style={{marginBottom: 14}}>
                  <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase'}}>Action items</label>
                  <textarea value={meetingForm.action_items} onChange={e => setMeetingForm({...meetingForm, action_items: e.target.value})} placeholder="What does the student need to do?" rows={3}
                    style={{width: '100%', borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '10px 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', resize: 'none'}}/>
                </div>
                <div style={{marginBottom: 20}}>
                  <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase'}}>Next meeting date</label>
                  <input type="date" value={meetingForm.next_meeting} onChange={e => setMeetingForm({...meetingForm, next_meeting: e.target.value})}
                    style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
                </div>
                <button onClick={logMeeting} disabled={sending || !meetingForm.student_id}
                  style={{width: '100%', height: 46, background: sending ? '#4a5568' : '#0d2340', border: 'none', borderRadius: 9, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer'}}>
                  {sending ? 'Saving...' : 'Log meeting & notify student ↗'}
                </button>
              </div>
              <div style={{background: '#0d2340', borderRadius: 12, padding: '20px 22px', height: 'fit-content'}}>
                <div style={{fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 14}}>How this works</div>
                {['Select the student', 'Fill in date, notes and action items', 'Set the next meeting date', 'Click Log meeting — appears instantly on student page', 'Student gets automatic notification'].map((s, i) => (
                  <div key={i} style={{display: 'flex', gap: 10, marginBottom: 12}}>
                    <div style={{width: 22, height: 22, borderRadius: '50%', background: 'rgba(201,168,76,0.2)', color: '#c9a84c', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{i+1}</div>
                    <div style={{fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5}}>{s}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Announcements</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Post program-wide messages to all students</div>
            </div>
            <AnnouncementForm students={students} supabase={supabase} onSuccess={() => { setSuccess('Announcement posted!'); setTimeout(() => setSuccess(''), 3000) }} />
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

        {activeTab === 'slides' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Manage Slides</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Upload slide links · Toggle availability</div>
            </div>
            <SlidesManager supabase={supabase} onSuccess={(msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }} />
          </div>
        )}

        {activeTab === 'recordings' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Manage Recordings</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Upload recording links · Toggle availability</div>
            </div>
            <RecordingsManager supabase={supabase} onSuccess={(msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }} />
          </div>
        )}

        {activeTab === 'notes' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Manage HY Notes</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Add note links for each topic</div>
            </div>
            <NotesManager supabase={supabase} onSuccess={(msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }} />
          </div>
        )}

        {activeTab === 'resources' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Manage Resources</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Add and edit resources in the student Resource Drive</div>
            </div>
            <ResourcesManager supabase={supabase} onSuccess={(msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }} />
          </div>
        )}

        {activeTab === 'schedule' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Manage Schedule</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Add sessions · Zoom links · Instructor · Syllabus</div>
            </div>
            <ScheduleManager supabase={supabase} onSuccess={(msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }} />
          </div>
        )}

        {activeTab === 'assignments' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Assign Tasks</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Assign tasks to individual students or all students</div>
            </div>
            <AssignmentsManager supabase={supabase} students={students} onSuccess={(msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }} />
          </div>
        )}

        {activeTab === 'studyschedule' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Student Study Schedules</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Build personalized daily study plans for each student</div>
            </div>
            <StudyScheduleManager supabase={supabase} students={assignedStudents} onSuccess={(msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }} />
          </div>
        )}

        {activeTab === 'examreports' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Exam Reports</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>View all student exam sessions · Time reports · Answer sheets</div>
            </div>
            <ExamReports supabase={supabase} students={students} />
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

        {activeTab === 'attendance' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Log Attendance</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Mark attendance for each session · Reported to admin</div>
            </div>
            <AttendanceLogger supabase={supabase} students={students} tutorId={user?.id} />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Tutor Calendar</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Schedule mentor meetings · View all course sessions · Events appear on student calendars</div>
            </div>
            <TutorCalendar supabase={supabase} students={students} tutorId={user?.id} assignedStudents={assignedStudents} />
          </div>
        )}

        {activeTab === 'accountability' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Student Progress Report</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Log bi-weekly 30 minute meeting reports for each student · Submitted to admin</div>
            </div>
            <AccountabilityReport supabase={supabase} students={students} tutorId={user?.id} onSuccess={(msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }} />
          </div>
        )}
      </div>
    </main>
  )
}

function AccountabilityReport({ supabase, students, tutorId, onSuccess }: any) {
  const blankForm = {
    student_id: '', week_number: '1', report_date: new Date().toISOString().split('T')[0],
    mentor_name: '', topics_covered: '', understanding: '3', practice_questions: '',
    areas_of_difficulty: '', engagement: '3', follow_up_needed: 'No', sga_action_needed: 'No',
    completed_study_goals: 'Y', took_practice_test: 'No', nbme_score: '',
    was_prepared: 'Yes', stress_levels: 'LOW', barriers_this_week: 'N',
    barriers_description: '', resources_used: '', next_steps: '', mentor_notes: ''
  }
  const [form, setForm] = useState(blankForm)
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('accountability_reports').select('*').eq('tutor_id', tutorId).order('created_at', {ascending: false}).limit(40)
    setReports(data || [])
    setLoading(false)
  }

  const submit = async () => {
    if (!form.student_id) return
    setSaving(true)
    await supabase.from('accountability_reports').insert({
      ...form, tutor_id: tutorId, week_number: parseInt(form.week_number),
      understanding: parseInt(form.understanding), engagement: parseInt(form.engagement)
    })
    setForm(blankForm)
    await load()
    setSaving(false)
    onSuccess('Report submitted!')
  }

  const studentName = (id: string) => {
    const s = (students as Array<{id: string; full_name?: string; email: string}>).find(s => s.id === id)
    return s ? (s.full_name || s.email.split('@')[0]) : 'Unknown'
  }

  const labelStyle: any = {fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}
  const inputStyle: any = {width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}
  const selectStyle: any = {width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none'}
  const textareaStyle: any = {width: '100%', borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '8px 10px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', resize: 'none'}
  const sectionHeader = (title: string) => (
    <div style={{fontSize: 12, fontWeight: 700, color: '#0d2340', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 0 6px', borderBottom: '1px solid #e8dfc8', marginBottom: 12, marginTop: 16}}>{title}</div>
  )

  return (
    <div style={{display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20, alignItems: 'start'}}>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
        <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 4}}>Bi-Weekly Progress Report</div>
        <div style={{fontSize: 12, color: '#8a7d6a', marginBottom: 18}}>Complete after each mentor meeting</div>

        {sectionHeader('Basic Info')}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: 12, marginBottom: 12}}>
          <div>
            <label style={labelStyle}>Student</label>
            <select value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})} style={selectStyle}>
              <option value="">Select student...</option>
              {students.map((s: any) => <option key={s.id} value={s.id}>{s.full_name || s.email.split('@')[0]}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Week</label>
            <select value={form.week_number} onChange={e => setForm({...form, week_number: e.target.value})} style={selectStyle}>
              {[1,2,3,4,5,6,7,8].map(w => <option key={w} value={w}>Wk {w}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date</label>
            <input type="date" value={form.report_date} onChange={e => setForm({...form, report_date: e.target.value})} style={inputStyle}/>
          </div>
        </div>
        <div style={{marginBottom: 12}}>
          <label style={labelStyle}>Mentor Name</label>
          <input type="text" value={form.mentor_name} onChange={e => setForm({...form, mentor_name: e.target.value})} placeholder="Your full name" style={inputStyle}/>
        </div>

        {sectionHeader('Session Content')}
        <div style={{marginBottom: 12}}>
          <label style={labelStyle}>Topics Covered</label>
          <textarea value={form.topics_covered} onChange={e => setForm({...form, topics_covered: e.target.value})} rows={2} placeholder="List topics discussed this week..." style={textareaStyle}/>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12}}>
          <div>
            <label style={labelStyle}>Understanding (1–5)</label>
            <select value={form.understanding} onChange={e => setForm({...form, understanding: e.target.value})} style={selectStyle}>
              {['1','2','3','4','5'].map(n => <option key={n} value={n}>{n} — {n==='1'?'Poor':n==='2'?'Below Avg':n==='3'?'Average':n==='4'?'Good':'Excellent'}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Engagement (1–5)</label>
            <select value={form.engagement} onChange={e => setForm({...form, engagement: e.target.value})} style={selectStyle}>
              {['1','2','3','4','5'].map(n => <option key={n} value={n}>{n} — {n==='1'?'Poor':n==='2'?'Below Avg':n==='3'?'Average':n==='4'?'Good':'Excellent'}</option>)}
            </select>
          </div>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12}}>
          <div>
            <label style={labelStyle}>No. of Practice Questions Done</label>
            <input type="text" value={form.practice_questions} onChange={e => setForm({...form, practice_questions: e.target.value})} placeholder="e.g. 40" style={inputStyle}/>
          </div>
          <div>
            <label style={labelStyle}>Was Prepared</label>
            <select value={form.was_prepared} onChange={e => setForm({...form, was_prepared: e.target.value})} style={selectStyle}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>
        <div style={{marginBottom: 12}}>
          <label style={labelStyle}>Areas of Difficulty</label>
          <textarea value={form.areas_of_difficulty} onChange={e => setForm({...form, areas_of_difficulty: e.target.value})} rows={2} placeholder="What topics or concepts were most challenging?" style={textareaStyle}/>
        </div>

        {sectionHeader('Practice Tests & NBME')}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12}}>
          <div>
            <label style={labelStyle}>Took Practice Test or NBME</label>
            <select value={form.took_practice_test} onChange={e => setForm({...form, took_practice_test: e.target.value})} style={selectStyle}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Not Assigned">Not Assigned</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>NBME Score (if applicable)</label>
            <input type="text" value={form.nbme_score} onChange={e => setForm({...form, nbme_score: e.target.value})} placeholder="e.g. 210" style={inputStyle}/>
          </div>
        </div>

        {sectionHeader('Study Goals & Resources')}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12}}>
          <div>
            <label style={labelStyle}>Completed Study Goals</label>
            <select value={form.completed_study_goals} onChange={e => setForm({...form, completed_study_goals: e.target.value})} style={selectStyle}>
              <option value="Y">Y — Yes</option>
              <option value="N">N — No</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Stress Levels</label>
            <select value={form.stress_levels} onChange={e => setForm({...form, stress_levels: e.target.value})} style={selectStyle}>
              <option value="LOW">Low</option>
              <option value="MODERATE">Moderate</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>
        <div style={{marginBottom: 12}}>
          <label style={labelStyle}>Resources Used</label>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6}}>
            {['UWorld','First Aid','Pathoma','Sketchy','Amboss','Other'].map(r => (
              <div key={r} onClick={() => {
                const current = form.resources_used.split(',').filter(Boolean)
                const updated = current.includes(r) ? current.filter(x => x !== r) : [...current, r]
                setForm({...form, resources_used: updated.join(',')})
              }} style={{padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'Sora, sans-serif',
                background: form.resources_used.split(',').includes(r) ? '#0d2340' : '#f7f4ee',
                color: form.resources_used.split(',').includes(r) ? '#c9a84c' : '#8a7d6a',
                border: form.resources_used.split(',').includes(r) ? 'none' : '1px solid #e8dfc8'}}>
                {r}
              </div>
            ))}
          </div>
        </div>

        {sectionHeader('Barriers & Follow-Up')}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12}}>
          <div>
            <label style={labelStyle}>Barriers This Week</label>
            <select value={form.barriers_this_week} onChange={e => setForm({...form, barriers_this_week: e.target.value})} style={selectStyle}>
              <option value="N">N — No</option>
              <option value="Y">Y — Yes</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Follow Up Needed</label>
            <select value={form.follow_up_needed} onChange={e => setForm({...form, follow_up_needed: e.target.value})} style={selectStyle}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        </div>
        {form.barriers_this_week === 'Y' && (
          <div style={{marginBottom: 12}}>
            <label style={labelStyle}>If Yes, Describe Barriers (e.g. Work, Family, etc.)</label>
            <textarea value={form.barriers_description} onChange={e => setForm({...form, barriers_description: e.target.value})} rows={2} placeholder="Describe barriers..." style={textareaStyle}/>
          </div>
        )}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12}}>
          <div>
            <label style={labelStyle}>SGA Action Needed</label>
            <select value={form.sga_action_needed} onChange={e => setForm({...form, sga_action_needed: e.target.value})} style={selectStyle}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        </div>

        {sectionHeader('Next Steps & Notes')}
        <div style={{marginBottom: 12}}>
          <label style={labelStyle}>Next Steps / Study Plan Given</label>
          <textarea value={form.next_steps} onChange={e => setForm({...form, next_steps: e.target.value})} rows={2} placeholder="What is the plan for next week?" style={textareaStyle}/>
        </div>
        <div style={{marginBottom: 20}}>
          <label style={labelStyle}>Mentor Notes</label>
          <textarea value={form.mentor_notes} onChange={e => setForm({...form, mentor_notes: e.target.value})} rows={3} placeholder="Additional observations or notes..." style={textareaStyle}/>
        </div>

        <button onClick={submit} disabled={saving || !form.student_id}
          style={{width: '100%', height: 46, background: '#0d2340', border: 'none', borderRadius: 9, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 600, cursor: 'pointer'}}>
          {saving ? 'Submitting...' : 'Submit Report ↗'}
        </button>
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        <div style={{background: '#0d2340', borderRadius: 12, padding: '16px 20px'}}>
          <div style={{fontSize: 13, color: '#c9a84c', fontWeight: 600, marginBottom: 4}}>Past Reports</div>
          <div style={{fontSize: 11, color: 'rgba(255,255,255,0.4)'}}>{reports.length} report{reports.length !== 1 ? 's' : ''} submitted</div>
        </div>
        {loading ? <div style={{fontSize: 13, color: '#8a7d6a'}}>Loading...</div>
        : reports.length === 0 ? (
          <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 10, padding: '20px', textAlign: 'center', fontSize: 13, color: '#8a7d6a', fontStyle: 'italic'}}>No reports yet.</div>
        ) : reports.map(r => (
          <div key={r.id} style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 10, overflow: 'hidden'}}>
            <div onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              style={{padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <div style={{fontSize: 13, fontWeight: 600, color: '#0d2340'}}>{studentName(r.student_id)}</div>
                <div style={{fontSize: 11, color: '#8a7d6a'}}>Week {r.week_number} · {r.report_date}</div>
              </div>
              <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                <span style={{fontSize: 10, padding: '2px 8px', borderRadius: 8, background: '#f7f4ee', color: '#8a7d6a'}}>U:{r.understanding}/5 E:{r.engagement}/5</span>
                <span style={{fontSize: 12, color: '#c9a84c'}}>{expanded === r.id ? '▲' : '▼'}</span>
              </div>
            </div>
            {expanded === r.id && (
              <div style={{padding: '0 16px 14px', borderTop: '0.5px solid #f0ece0', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8}}>
                {r.topics_covered && <div style={{fontSize: 12, color: '#3d3020'}}><strong>Topics:</strong> {r.topics_covered}</div>}
                {r.areas_of_difficulty && <div style={{fontSize: 12, color: '#3d3020'}}><strong>Difficulty:</strong> {r.areas_of_difficulty}</div>}
                {r.took_practice_test && <div style={{fontSize: 12, color: '#3d3020'}}><strong>Practice test:</strong> {r.took_practice_test}{r.nbme_score ? ` · Score: ${r.nbme_score}` : ''}</div>}
                {r.resources_used && <div style={{fontSize: 12, color: '#3d3020'}}><strong>Resources:</strong> {r.resources_used}</div>}
                {r.barriers_this_week === 'Y' && <div style={{fontSize: 12, color: '#c0574a'}}><strong>Barriers:</strong> {r.barriers_description}</div>}
                {r.next_steps && <div style={{fontSize: 12, color: '#3d3020'}}><strong>Next steps:</strong> {r.next_steps}</div>}
                {r.mentor_notes && <div style={{fontSize: 12, color: '#3d3020'}}><strong>Notes:</strong> {r.mentor_notes}</div>}
                <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4}}>
                  <span style={{fontSize: 10, padding: '2px 8px', borderRadius: 8, background: r.follow_up_needed === 'Yes' ? '#fff8e8' : '#f0f7f2', color: r.follow_up_needed === 'Yes' ? '#c07040' : '#2d6a4f'}}>Follow-up: {r.follow_up_needed}</span>
                  <span style={{fontSize: 10, padding: '2px 8px', borderRadius: 8, background: r.sga_action_needed === 'Yes' ? '#fdf0f0' : '#f0f7f2', color: r.sga_action_needed === 'Yes' ? '#c0574a' : '#2d6a4f'}}>SGA: {r.sga_action_needed}</span>
                  <span style={{fontSize: 10, padding: '2px 8px', borderRadius: 8, background: '#f7f4ee', color: '#8a7d6a'}}>Stress: {r.stress_levels}</span>
                  <span style={{fontSize: 10, padding: '2px 8px', borderRadius: 8, background: r.completed_study_goals === 'Y' ? '#f0f7f2' : '#fdf0f0', color: r.completed_study_goals === 'Y' ? '#2d6a4f' : '#c0574a'}}>Goals: {r.completed_study_goals}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


