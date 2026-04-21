'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase'
import {
  StudentProfiles, AnnouncementForm, FeedbackTab, SlidesManager, RecordingsManager,
  NotesManager, ResourcesManager, ExamsManager, ScheduleManager, AssignmentsManager,
  StudyScheduleManager, CourseDocsManager, ExamReports
} from '../tutor/components'

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
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
      const { data: studentData } = await supabase.from('profiles').select('*').eq('role', 'student').order('full_name')
      setStudents(studentData || [])
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
      <div style={{fontFamily: 'Georgia, serif', fontSize: 24, color: '#0d2340'}}>Loading admin dashboard...</div>
    </main>
  )

  const navGroups = [
    {section: 'Home', items: [{name: 'Overview', tab: 'overview'}]},
    {section: 'Students', items: [
      {name: 'Student Profiles', tab: 'profiles'},
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
      {name: 'Manage Exams', tab: 'exams'},
      {name: 'Course Documents', tab: 'coursedocs'},
    ]},
    {section: 'Academics', items: [
      {name: 'Assign Tasks', tab: 'assignments'},
      {name: 'Study Schedules', tab: 'studyschedule'},
      {name: 'Exam Reports', tab: 'examreports'},
    ]},
    {section: 'Reports', items: [
      {name: 'Accountability Reports', tab: 'accountability'},
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
          <div style={{fontSize: 10, color: '#c9a84c', letterSpacing: '0.09em', textTransform: 'uppercase', paddingLeft: 46, marginTop: 3}}>Admin Dashboard</div>
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

        {activeTab === 'overview' && (
          <div>
            <div style={{marginBottom: 28}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5}}>Admin Dashboard</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>P2P Mentoring Program · Windsor SOM · May 2026 Cohort</div>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24}}>
              {[{label: 'Total students', value: students.length.toString(), delta: 'Enrolled in program'}, {label: 'Program start', value: 'May 4', delta: '2026 · Week 1'}, {label: 'Program end', value: 'Jun 29', delta: '8 weeks total'}].map((m, i) => (
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
                  {label: 'Student profiles', tab: 'profiles', color: '#c9a84c'},
                  {label: 'Send notification', tab: 'notifications', color: '#4a8c84'},
                  {label: 'Post announcement', tab: 'announcements', color: '#c0574a'},
                  {label: 'Manage exams', tab: 'exams', color: '#6b7c3a'},
                  {label: 'Course documents', tab: 'coursedocs', color: '#c07040'},
                  {label: 'Accountability reports', tab: 'accountability', color: '#9e2a2a'},
                  {label: 'Exam reports', tab: 'examreports', color: '#4a8c84'},
                  {label: 'Manage schedule', tab: 'schedule', color: '#6b7c3a'},
                  {label: 'View feedback', tab: 'feedback', color: '#c9a84c'},
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

        {activeTab === 'profiles' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Student Profiles</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>View and edit student profile information</div>
            </div>
            <StudentProfiles supabase={supabase} students={students} onSuccess={(msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }} />
          </div>
        )}

        {activeTab === 'students' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Students</div>
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
                    {students.map((s:any) => <option key={s.id} value={s.id}>{s.full_name || s.email.split('@')[0]}</option>)}
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

        {activeTab === 'exams' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Manage Exams</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Create and manage exam question banks</div>
            </div>
            <ExamsManager supabase={supabase} onSuccess={(msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }} />
          </div>
        )}

        {activeTab === 'coursedocs' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Course Documents</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Upload and manage course document links</div>
            </div>
            <CourseDocsManager supabase={supabase} onSuccess={(msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }} />
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
            <StudyScheduleManager supabase={supabase} students={students} onSuccess={(msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }} />
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

        {activeTab === 'accountability' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Accountability Reports</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>View weekly activity reports submitted by tutors</div>
            </div>
            <AccountabilityReportsAdmin supabase={supabase} students={students} />
          </div>
        )}
      </div>
    </main>
  )
}

function AccountabilityReportsAdmin({ supabase, students }: any) {
  const [reports, setReports] = useState<any[]>([])
  const [tutors, setTutors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTutor, setFilterTutor] = useState('all')
  const [filterStudent, setFilterStudent] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [{ data: reportData }, { data: tutorData }] = await Promise.all([
      supabase.from('accountability_reports').select('*').order('created_at', {ascending: false}).limit(200),
      supabase.from('profiles').select('id, full_name, email').eq('role', 'tutor').order('full_name'),
    ])
    setReports(reportData || [])
    setTutors(tutorData || [])
    setLoading(false)
  }

  const personName = (list: Array<{id: string; full_name?: string; email: string}>, id: string) => {
    const p = list.find(x => x.id === id)
    return p ? (p.full_name || p.email.split('@')[0]) : 'Unknown'
  }

  const statusStyle = (status: string) => {
    if (status === 'at_risk') return {background: '#fdf0f0', color: '#c0574a', border: '1px solid #f5c6c6'}
    if (status === 'needs_attention') return {background: '#fff8e8', color: '#c07040', border: '1px solid #f5dfa0'}
    return {background: '#f0f7f2', color: '#2d6a4f', border: '1px solid #b8dfc8'}
  }

  const statusLabel = (s: string) => s === 'on_track' ? 'On Track' : s === 'needs_attention' ? 'Needs Attention' : 'At Risk'

  const filtered = reports.filter(r =>
    (filterTutor === 'all' || r.tutor_id === filterTutor) &&
    (filterStudent === 'all' || r.student_id === filterStudent) &&
    (filterStatus === 'all' || r.status === filterStatus)
  )

  const atRiskCount = reports.filter(r => r.status === 'at_risk').length
  const needsAttentionCount = reports.filter(r => r.status === 'needs_attention').length

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading reports...</div>

  return (
    <div>
      {(atRiskCount > 0 || needsAttentionCount > 0) && (
        <div style={{background: '#fdf0f0', border: '1px solid #f5c6c6', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 20, alignItems: 'center'}}>
          <div style={{fontSize: 13, fontWeight: 600, color: '#c0574a'}}>Flagged students</div>
          {atRiskCount > 0 && <div style={{fontSize: 13, color: '#c0574a'}}>{atRiskCount} At Risk</div>}
          {needsAttentionCount > 0 && <div style={{fontSize: 13, color: '#c07040'}}>{needsAttentionCount} Needs Attention</div>}
        </div>
      )}

      <div style={{display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap'}}>
        <select value={filterTutor} onChange={e => setFilterTutor(e.target.value)}
          style={{height: 38, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
          <option value="all">All tutors</option>
          {tutors.map((t:any) => <option key={t.id} value={t.id}>{t.full_name || t.email.split('@')[0]}</option>)}
        </select>
        <select value={filterStudent} onChange={e => setFilterStudent(e.target.value)}
          style={{height: 38, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
          <option value="all">All students</option>
          {(students as Array<{id: string; full_name?: string; email: string}>).map(s => <option key={s.id} value={s.id}>{s.full_name || s.email.split('@')[0]}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{height: 38, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
          <option value="all">All statuses</option>
          <option value="on_track">On Track</option>
          <option value="needs_attention">Needs Attention</option>
          <option value="at_risk">At Risk</option>
        </select>
        <div style={{fontSize: 13, color: '#8a7d6a', display: 'flex', alignItems: 'center'}}>{filtered.length} report{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      {filtered.length === 0 ? (
        <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '40px', textAlign: 'center'}}>
          <div style={{fontSize: 15, color: '#0d2340', fontWeight: 500, marginBottom: 8}}>No reports found</div>
          <div style={{fontSize: 13, color: '#8a7d6a'}}>Reports submitted by tutors will appear here</div>
        </div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
          {filtered.map(r => (
            <div key={r.id} style={{background: 'white', border: `0.5px solid ${r.status === 'at_risk' ? '#f5c6c6' : r.status === 'needs_attention' ? '#f5dfa0' : '#e8dfc8'}`, borderRadius: 12, overflow: 'hidden'}}>
              <div onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                style={{padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer'}}>
                <div style={{flex: 1, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap'}}>
                  <div style={{fontSize: 14, fontWeight: 600, color: '#0d2340'}}>{personName(students as Array<{id: string; full_name?: string; email: string}>, r.student_id)}</div>
                  <div style={{fontSize: 12, color: '#8a7d6a'}}>Week {r.week_number} · {new Date(r.report_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</div>
                  <div style={{fontSize: 12, color: '#8a7d6a'}}>Tutor: {personName(tutors, r.tutor_id)}</div>
                </div>
                <span style={{fontSize: 11, padding: '3px 10px', borderRadius: 10, fontWeight: 500, ...statusStyle(r.status)}}>{statusLabel(r.status)}</span>
                <div style={{fontSize: 11, color: '#8a7d6a'}}>{expanded === r.id ? '▲' : '▼'}</div>
              </div>
              {expanded === r.id && (
                <div style={{padding: '0 20px 18px', borderTop: '0.5px solid #f5f0e8'}}>
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14, paddingTop: 14}}>
                    <div style={{background: '#f7f4ee', borderRadius: 8, padding: '10px 14px'}}>
                      <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8a7d6a', marginBottom: 4}}>Attendance</div>
                      <div style={{fontSize: 14, color: '#0d2340', fontWeight: 500, textTransform: 'capitalize'}}>{r.attendance}</div>
                    </div>
                    <div style={{background: '#f7f4ee', borderRadius: 8, padding: '10px 14px'}}>
                      <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8a7d6a', marginBottom: 4}}>Participation</div>
                      <div style={{fontSize: 14, color: '#0d2340', fontWeight: 500}}>{r.participation} / 5</div>
                    </div>
                    <div style={{background: '#f7f4ee', borderRadius: 8, padding: '10px 14px'}}>
                      <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8a7d6a', marginBottom: 4}}>Submitted</div>
                      <div style={{fontSize: 13, color: '#0d2340'}}>{new Date(r.created_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</div>
                    </div>
                  </div>
                  {[
                    {label: 'Performance notes', value: r.performance_notes},
                    {label: 'Action items completed', value: r.action_items_completed},
                    {label: 'New action items', value: r.new_action_items},
                    {label: 'Concerns', value: r.concerns},
                  ].filter(f => f.value).map(f => (
                    <div key={f.label} style={{marginBottom: 10}}>
                      <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8a7d6a', marginBottom: 4}}>{f.label}</div>
                      <div style={{fontSize: 13, color: '#3d3020', lineHeight: 1.6}}>{f.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
