'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase'
import {
  AnnouncementForm, FeedbackTab, SlidesManager, RecordingsManager,
  NotesManager, ResourcesManager, ScheduleManager, AssignmentsManager,
  StudyScheduleManager, ExamReports, AttendanceLogger, StudentPerformance
} from './components'

export default function TutorDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
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
      const [{ data: studentData }, { data: profileData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'student').order('full_name'),
        supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      ])
      setStudents(studentData || [])
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
      {name: 'Accountability', tab: 'accountability'},
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
                  {label: 'Accountability report', tab: 'accountability', color: '#c9a84c'},
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

        {activeTab === 'accountability' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Accountability & Student Report</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Log weekly activity reports for each student · Submitted to admin</div>
            </div>
            <AccountabilityReport supabase={supabase} students={students} tutorId={user?.id} onSuccess={(msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }} />
          </div>
        )}
      </div>
    </main>
  )
}

function AccountabilityReport({ supabase, students, tutorId, onSuccess }: any) {
  const blankForm = {student_id: '', week_number: '1', report_date: new Date().toISOString().split('T')[0], attendance: 'present', participation: '3', performance_notes: '', action_items_completed: '', new_action_items: '', concerns: '', status: 'on_track'}
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
    await supabase.from('accountability_reports').insert({...form, tutor_id: tutorId, week_number: parseInt(form.week_number), participation: parseInt(form.participation)})
    setForm(blankForm)
    await load()
    setSaving(false)
    onSuccess('Report submitted!')
  }

  const studentName = (id: string) => {
    const s = (students as Array<{id: string; full_name?: string; email: string}>).find(s => s.id === id)
    return s ? (s.full_name || s.email.split('@')[0]) : 'Unknown'
  }

  const statusStyle = (status: string) => {
    if (status === 'at_risk') return {background: '#fdf0f0', color: '#c0574a', border: '1px solid #f5c6c6'}
    if (status === 'needs_attention') return {background: '#fff8e8', color: '#c07040', border: '1px solid #f5dfa0'}
    return {background: '#f0f7f2', color: '#2d6a4f', border: '1px solid #b8dfc8'}
  }

  const statusLabel = (s: string) => s === 'on_track' ? 'On Track' : s === 'needs_attention' ? 'Needs Attention' : 'At Risk'

  return (
    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start'}}>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
        <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 18}}>Submit weekly report</div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 80px', gap: 12, marginBottom: 14}}>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Student</label>
            <select value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: '#1a1008', outline: 'none'}}>
              <option value="">Select student...</option>
              {students.map((s: any) => <option key={s.id} value={s.id}>{s.full_name || s.email.split('@')[0]}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Week</label>
            <select value={form.week_number} onChange={e => setForm({...form, week_number: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none'}}>
              {[1,2,3,4,5,6,7,8].map(w => <option key={w} value={w}>Wk {w}</option>)}
            </select>
          </div>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14}}>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Report date</label>
            <input type="date" value={form.report_date} onChange={e => setForm({...form, report_date: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Attendance</label>
            <select value={form.attendance} onChange={e => setForm({...form, attendance: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none'}}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="excused">Excused</option>
            </select>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Participation (1–5)</label>
            <select value={form.participation} onChange={e => setForm({...form, participation: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none'}}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} — {['','Poor','Below avg','Average','Good','Excellent'][n]}</option>)}
            </select>
          </div>
        </div>
        <div style={{marginBottom: 14}}>
          <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Performance notes</label>
          <textarea value={form.performance_notes} onChange={e => setForm({...form, performance_notes: e.target.value})} placeholder="How is the student performing this week?" rows={3}
            style={{width: '100%', borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '8px 10px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', resize: 'none'}}/>
        </div>
        <div style={{marginBottom: 14}}>
          <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Previous action items completed?</label>
          <textarea value={form.action_items_completed} onChange={e => setForm({...form, action_items_completed: e.target.value})} placeholder="Which action items did the student complete?" rows={2}
            style={{width: '100%', borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '8px 10px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', resize: 'none'}}/>
        </div>
        <div style={{marginBottom: 14}}>
          <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>New action items for student</label>
          <textarea value={form.new_action_items} onChange={e => setForm({...form, new_action_items: e.target.value})} placeholder="What should the student focus on this week?" rows={2}
            style={{width: '100%', borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '8px 10px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', resize: 'none'}}/>
        </div>
        <div style={{marginBottom: 14}}>
          <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Concerns or flags</label>
          <textarea value={form.concerns} onChange={e => setForm({...form, concerns: e.target.value})} placeholder="Any concerns to flag for admin?" rows={2}
            style={{width: '100%', borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '8px 10px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', resize: 'none'}}/>
        </div>
        <div style={{marginBottom: 20}}>
          <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Overall status</label>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8}}>
            {[{v:'on_track',l:'On Track'},{v:'needs_attention',l:'Needs Attention'},{v:'at_risk',l:'At Risk'}].map(opt => (
              <div key={opt.v} onClick={() => setForm({...form, status: opt.v})}
                style={{padding: '10px 12px', borderRadius: 8, border: `2px solid ${form.status === opt.v ? (opt.v === 'on_track' ? '#6b7c3a' : opt.v === 'needs_attention' ? '#c07040' : '#c0574a') : '#e8dfc8'}`, background: form.status === opt.v ? (opt.v === 'on_track' ? '#f0f7f2' : opt.v === 'needs_attention' ? '#fff8e8' : '#fdf0f0') : 'white', cursor: 'pointer', textAlign: 'center'}}>
                <div style={{fontSize: 12, fontWeight: 600, color: form.status === opt.v ? (opt.v === 'on_track' ? '#2d6a4f' : opt.v === 'needs_attention' ? '#c07040' : '#c0574a') : '#8a7d6a'}}>{opt.l}</div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={submit} disabled={saving || !form.student_id}
          style={{width: '100%', height: 46, background: saving || !form.student_id ? '#4a5568' : '#0d2340', border: 'none', borderRadius: 9, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 600, cursor: saving || !form.student_id ? 'not-allowed' : 'pointer'}}>
          {saving ? 'Submitting...' : 'Submit report to admin ↗'}
        </button>
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        <div style={{background: '#0d2340', borderRadius: 12, padding: '16px 20px'}}>
          <div style={{fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 4}}>Your submitted reports</div>
          <div style={{fontSize: 12, color: 'rgba(255,255,255,0.5)'}}>{reports.length} report{reports.length !== 1 ? 's' : ''} on file</div>
        </div>
        {loading ? (
          <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading...</div>
        ) : reports.length === 0 ? (
          <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '32px', textAlign: 'center'}}>
            <div style={{fontSize: 14, color: '#8a7d6a'}}>No reports submitted yet</div>
          </div>
        ) : reports.map(r => (
          <div key={r.id} style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer'}} onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
              <div>
                <div style={{fontSize: 14, fontWeight: 500, color: '#0d2340'}}>{studentName(r.student_id)}</div>
                <div style={{fontSize: 11, color: '#8a7d6a', marginTop: 2}}>Week {r.week_number} · {new Date(r.report_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</div>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <span style={{fontSize: 11, padding: '3px 10px', borderRadius: 10, fontWeight: 500, ...statusStyle(r.status)}}>{statusLabel(r.status)}</span>
                <span style={{fontSize: 12, color: '#a89870'}}>{expanded === r.id ? '▲' : '▼'}</span>
              </div>
            </div>
            {expanded === r.id && (
              <div style={{padding: '0 18px 16px', borderTop: '0.5px solid #f5f0e8'}}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12}}>
                  <div><div style={{fontSize: 10, color: '#a89870', textTransform: 'uppercase', marginBottom: 2}}>Attendance</div><div style={{fontSize: 13, color: '#0d2340'}}>{r.attendance}</div></div>
                  <div><div style={{fontSize: 10, color: '#a89870', textTransform: 'uppercase', marginBottom: 2}}>Participation</div><div style={{fontSize: 13, color: '#0d2340'}}>{r.participation}/5</div></div>
                </div>
                {r.performance_notes && <div style={{marginTop: 10}}><div style={{fontSize: 10, color: '#a89870', textTransform: 'uppercase', marginBottom: 2}}>Performance notes</div><div style={{fontSize: 13, color: '#3d3020', lineHeight: 1.5}}>{r.performance_notes}</div></div>}
                {r.new_action_items && <div style={{marginTop: 10}}><div style={{fontSize: 10, color: '#a89870', textTransform: 'uppercase', marginBottom: 2}}>Action items</div><div style={{fontSize: 13, color: '#3d3020', lineHeight: 1.5}}>{r.new_action_items}</div></div>}
                {r.concerns && <div style={{marginTop: 10, background: '#fdf0f0', borderRadius: 7, padding: '8px 10px'}}><div style={{fontSize: 10, color: '#c0574a', textTransform: 'uppercase', marginBottom: 2}}>Concerns flagged</div><div style={{fontSize: 13, color: '#c0574a', lineHeight: 1.5}}>{r.concerns}</div></div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
