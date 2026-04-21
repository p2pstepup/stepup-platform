'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase'

export default function TutorDashboard() {
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

  if (loading) return (
    <main style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee'}}>
      <div style={{fontFamily: 'Georgia, serif', fontSize: 24, color: '#0d2340'}}>Loading tutor dashboard...</div>
    </main>
  )

  const sidebarItems = [
    {name: 'Overview', tab: 'overview'},
    {name: 'My Students', tab: 'students'},
    {name: 'Send Notifications', tab: 'notifications'},
    {name: 'Log Meetings', tab: 'meetings'},
    {name: 'Announcements', tab: 'announcements'},
    {name: 'Student Feedback', tab: 'feedback'},
    {name: 'Manage Slides', tab: 'slides'},
    {name: 'Manage Resources', tab: 'resources'},
    {name: 'Manage Exams', tab: 'exams'},
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
        <div style={{padding: '12px 10px', flex: 1, overflowY: 'auto'}}>
          {sidebarItems.map(item => (
            <div key={item.tab} onClick={() => setActiveTab(item.tab)}
              style={{display: 'flex', alignItems: 'center', gap: 8, padding: '10px 10px', borderRadius: 7, color: activeTab === item.tab ? '#c9a84c' : 'rgba(255,255,255,0.55)', fontSize: 13.5, marginBottom: 2, background: activeTab === item.tab ? 'rgba(255,255,255,0.09)' : 'transparent', cursor: 'pointer'}}>
              <div style={{width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0}}/>{item.name}
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
              <div style={{fontSize: 10, color: '#c9a84c'}}>Tutor · P2P Program</div>
            </div>
            <div onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              style={{fontSize: 11, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, border: '0.5px solid rgba(255,255,255,0.15)'}}>Out</div>
          </div>
        </div>
      </nav>

      <div style={{flex: 1, minWidth: 0, overflowY: 'auto', padding: '32px 36px'}}>
        {success && (
          <div style={{background: '#f0f7f2', border: '1px solid #6b7c3a', borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: 14, color: '#2d6a4f', fontWeight: 500}}>✓ {success}</div>
        )}

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div style={{marginBottom: 28}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5}}>Tutor Dashboard</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>P2P Mentoring Program · Windsor SOM · May 2026 Cohort</div>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 14, marginBottom: 28}}>
              {[
                {label: 'Total students', value: students.length.toString(), delta: 'In your cohort'},
                {label: 'Program start', value: 'May 4', delta: '2026 · Week 1'},
                {label: 'Program end', value: 'Jun 29', delta: '8 weeks total'},
              ].map((m, i) => (
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
                  {label: 'Add resource', tab: 'resources', color: '#4a8c84'},
                  {label: 'Manage exams', tab: 'exams', color: '#6b7c3a'},
                ].map((a, i) => (
                  <div key={i} onClick={() => setActiveTab(a.tab)}
                    style={{padding: '14px 16px', background: '#f7f4ee', border: `1px solid ${a.color}`, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10}}>
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

        {/* STUDENTS */}
        {activeTab === 'students' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>My Students</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>{students.length} students enrolled</div>
            </div>
            {students.length === 0 ? (
              <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '40px', textAlign: 'center'}}>
                <div style={{fontSize: 16, color: '#0d2340', fontWeight: 500, marginBottom: 8}}>No students yet</div>
                <div style={{fontSize: 14, color: '#8a7d6a', marginBottom: 20}}>Invite students via Supabase Authentication → Invite user</div>
                <div style={{background: '#f7f4ee', border: '0.5px solid #e8dfc8', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#0d2340', fontFamily: 'monospace'}}>stepup-platform.vercel.app</div>
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
                            <div style={{width: 32, height: 32, borderRadius: '50%', background: '#c9a84c', color: '#0d2340', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
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

        {/* NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Send Notifications</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Send instant notifications to one student or your entire cohort</div>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20}}>
              <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
                <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 18}}>New notification</div>
                <div style={{marginBottom: 14}}>
                  <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Send to</label>
                  <select value={notifForm.student_id} onChange={e => setNotifForm({...notifForm, student_id: e.target.value})}
                    style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
                    <option value="all">All students ({students.length})</option>
                    {students.map((s:any) => <option key={s.id} value={s.id}>{s.full_name || s.email.split('@')[0]}</option>)}
                  </select>
                </div>
                <div style={{marginBottom: 14}}>
                  <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Type</label>
                  <select value={notifForm.type} onChange={e => setNotifForm({...notifForm, type: e.target.value})}
                    style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
                    {['general','assignment','exam','announcement','feedback','meeting'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                </div>
                <div style={{marginBottom: 14}}>
                  <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Title</label>
                  <input type="text" value={notifForm.title} onChange={e => setNotifForm({...notifForm, title: e.target.value})}
                    placeholder="e.g. New assignment posted"
                    style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
                </div>
                <div style={{marginBottom: 14}}>
                  <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Message</label>
                  <textarea value={notifForm.message} onChange={e => setNotifForm({...notifForm, message: e.target.value})}
                    placeholder="Full notification message..." rows={3}
                    style={{width: '100%', borderRadius: 8, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '10px 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', resize: 'none'}}/>
                </div>
                <div style={{marginBottom: 20}}>
                  <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Link to page (optional)</label>
                  <select value={notifForm.link} onChange={e => setNotifForm({...notifForm, link: e.target.value})}
                    style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
                    <option value="">No link</option>
                    <option value="/dashboard">Dashboard</option>
                    <option value="/dashboard/qbank">Qbank Tracker</option>
                    <option value="/dashboard/nbme">NBME Scores</option>
                    <option value="/dashboard/mentor">Mentor Meetings</option>
                    <option value="/dashboard/exams">Exam Center</option>
                    <option value="/dashboard/slides">Session Slides</option>
                    <option value="/dashboard/resources">Resource Drive</option>
                    <option value="/dashboard/feedback">Live Feedback</option>
                  </select>
                </div>
                <button onClick={sendNotification} disabled={sending || !notifForm.title}
                  style={{width: '100%', height: 46, background: sending ? '#4a5568' : '#0d2340', border: 'none', borderRadius: 9, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer'}}>
                  {sending ? 'Sending...' : `Send to ${notifForm.student_id === 'all' ? 'all students' : 'student'} ↗`}
                </button>
              </div>
              <div style={{background: '#0d2340', borderRadius: 12, padding: '20px 22px', height: 'fit-content'}}>
                <div style={{fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 14}}>Quick templates — click to use</div>
                {[
                  {title: 'Assignment due reminder', msg: 'Reminder: your Qbank block is due tonight. Make sure to log your results before midnight.'},
                  {title: 'Session tonight', msg: 'Class session tonight at 7 PM CST. Make sure you have prepared your questions and reviewed your HY notes.'},
                  {title: 'New slides available', msg: 'Session slides have been posted — check the Session Slides page to download them.'},
                  {title: 'NBME exam scheduled', msg: 'Your next NBME practice exam is scheduled for this Sunday. Block off your full day.'},
                  {title: 'New resource added', msg: 'A new study resource has been added to your Resource Drive. Check it out!'},
                  {title: 'Great progress!', msg: 'Your Qbank scores are trending up this week. Keep up the excellent work!'},
                ].map((t, i) => (
                  <div key={i} onClick={() => setNotifForm({...notifForm, title: t.title, message: t.msg})}
                    style={{padding: '10px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, cursor: 'pointer', marginBottom: 8}}>
                    <div style={{fontSize: 13, color: 'white', fontWeight: 500, marginBottom: 3}}>{t.title}</div>
                    <div style={{fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4}}>{t.msg.substring(0, 60)}...</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MEETINGS */}
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
                  <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Student</label>
                  <select value={meetingForm.student_id} onChange={e => setMeetingForm({...meetingForm, student_id: e.target.value})}
                    style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
                    <option value="">Select student...</option>
                    {students.map((s:any) => <option key={s.id} value={s.id}>{s.full_name || s.email.split('@')[0]}</option>)}
                  </select>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14}}>
                  <div>
                    <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Date</label>
                    <input type="date" value={meetingForm.meeting_date} onChange={e => setMeetingForm({...meetingForm, meeting_date: e.target.value})}
                      style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
                  </div>
                  <div>
                    <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Duration</label>
                    <select value={meetingForm.duration_minutes} onChange={e => setMeetingForm({...meetingForm, duration_minutes: e.target.value})}
                      style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
                      {['15','20','30','45','60'].map(o => <option key={o} value={o}>{o} min</option>)}
                    </select>
                  </div>
                </div>
                <div style={{marginBottom: 14}}>
                  <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Session notes</label>
                  <textarea value={meetingForm.notes} onChange={e => setMeetingForm({...meetingForm, notes: e.target.value})}
                    placeholder="What did you discuss?" rows={4}
                    style={{width: '100%', borderRadius: 8, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '10px 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', resize: 'none'}}/>
                </div>
                <div style={{marginBottom: 14}}>
                  <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Action items for student</label>
                  <textarea value={meetingForm.action_items} onChange={e => setMeetingForm({...meetingForm, action_items: e.target.value})}
                    placeholder="What does the student need to do?" rows={3}
                    style={{width: '100%', borderRadius: 8, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '10px 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', resize: 'none'}}/>
                </div>
                <div style={{marginBottom: 20}}>
                  <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Next meeting date</label>
                  <input type="date" value={meetingForm.next_meeting} onChange={e => setMeetingForm({...meetingForm, next_meeting: e.target.value})}
                    style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
                </div>
                <button onClick={logMeeting} disabled={sending || !meetingForm.student_id}
                  style={{width: '100%', height: 46, background: sending ? '#4a5568' : '#0d2340', border: 'none', borderRadius: 9, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer'}}>
                  {sending ? 'Saving...' : 'Log meeting & notify student ↗'}
                </button>
              </div>
              <div style={{background: '#0d2340', borderRadius: 12, padding: '20px 22px', height: 'fit-content'}}>
                <div style={{fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 14}}>How this works</div>
                {['Select the student from the dropdown', 'Fill in meeting date, notes and action items', 'Set the next meeting date', 'Click "Log meeting" — notes appear instantly on student\'s page', 'Student gets an automatic notification'].map((s, i) => (
                  <div key={i} style={{display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start'}}>
                    <div style={{width: 22, height: 22, borderRadius: '50%', background: 'rgba(201,168,76,0.2)', color: '#c9a84c', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{i+1}</div>
                    <div style={{fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5}}>{s}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Announcements</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Post program-wide messages to all students</div>
            </div>
            <AnnouncementForm students={students} supabase={supabase} onSuccess={() => { setSuccess('Announcement posted!'); setTimeout(() => setSuccess(''), 3000) }} />
          </div>
        )}

        {/* FEEDBACK */}
        {activeTab === 'feedback' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Student Feedback</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Read and respond to student messages</div>
            </div>
            <FeedbackTab supabase={supabase} students={students} />
          </div>
        )}

        {/* MANAGE SLIDES */}
        {activeTab === 'slides' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Manage Slides</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Upload slide links · Toggle availability · Students see changes instantly</div>
            </div>
            <SlidesManager supabase={supabase} onSuccess={(msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }} />
          </div>
        )}

        {/* MANAGE RESOURCES */}
        {activeTab === 'resources' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Manage Resources</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Add · edit · remove resources from the student Resource Drive</div>
            </div>
            <ResourcesManager supabase={supabase} onSuccess={(msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }} />
          </div>
        )}

        {/* MANAGE EXAMS */}
        {activeTab === 'exams' && (
          <div>
            <div style={{marginBottom: 24}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Manage Exams</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Edit exam names · Set deadlines · Add links · Toggle availability</div>
            </div>
            <ExamsManager supabase={supabase} onSuccess={(msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }} />
          </div>
        )}

      </div>
    </main>
  )
}

function AnnouncementForm({ students, supabase, onSuccess }: any) {
  const [form, setForm] = useState({title: '', body: ''})
  const [posting, setPosting] = useState(false)
  const [announcements, setAnnouncements] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('announcements').select('*').order('created_at', {ascending: false}).limit(10)
      setAnnouncements(data || [])
    }
    load()
  }, [])

  const post = async () => {
    if (!form.body) return
    setPosting(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('announcements').insert({posted_by: user.id, title: form.title, body: form.body})
    const { data: studentData } = await supabase.from('profiles').select('id').eq('role', 'student')
    for (const s of (studentData || [])) {
      await supabase.from('notifications').insert({student_id: s.id, title: form.title || 'New announcement', message: form.body.substring(0, 100), type: 'announcement', link: '/dashboard'})
    }
    setForm({title: '', body: ''})
    const { data } = await supabase.from('announcements').select('*').order('created_at', {ascending: false}).limit(10)
    setAnnouncements(data || [])
    setPosting(false)
    onSuccess()
  }

  return (
    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20}}>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
        <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 18}}>New announcement</div>
        <div style={{marginBottom: 14}}>
          <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Title (optional)</label>
          <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
            placeholder="e.g. Saturday session update"
            style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
        </div>
        <div style={{marginBottom: 20}}>
          <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Message</label>
          <textarea value={form.body} onChange={e => setForm({...form, body: e.target.value})}
            placeholder="Type your announcement here..." rows={5}
            style={{width: '100%', borderRadius: 8, border: '1px solid #e8dfc8', background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '10px 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', resize: 'none'}}/>
        </div>
        <button onClick={post} disabled={posting || !form.body}
          style={{width: '100%', height: 46, background: posting ? '#4a5568' : '#0d2340', border: 'none', borderRadius: 9, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 600, cursor: posting ? 'not-allowed' : 'pointer'}}>
          {posting ? 'Posting...' : 'Post to all students ↗'}
        </button>
      </div>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
        <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 16}}>Recent announcements</div>
        {announcements.length === 0 ? (
          <div style={{fontSize: 14, color: '#8a7d6a', fontStyle: 'italic'}}>No announcements posted yet.</div>
        ) : announcements.map((a, i) => (
          <div key={a.id} style={{padding: '12px 0', borderBottom: i < announcements.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
            {a.title && <div style={{fontSize: 14, fontWeight: 600, color: '#0d2340', marginBottom: 4}}>{a.title}</div>}
            <div style={{fontSize: 13, color: '#3d3020', lineHeight: 1.5}}>{a.body}</div>
            <div style={{fontSize: 11, color: '#a89870', marginTop: 5}}>{new Date(a.created_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeedbackTab({ supabase, students }: any) {
  const [selectedStudent, setSelectedStudent] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [response, setResponse] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)

  const loadMessages = async (studentId: string) => {
    setSelectedStudent(studentId)
    const { data } = await supabase.from('feedback').select('*').eq('student_id', studentId).order('created_at', {ascending: true})
    setMessages(data || [])
  }

  const sendResponse = async (messageId: string) => {
    if (!response.trim()) return
    setSending(true)
    await supabase.from('feedback').update({response: response.trim(), responded_at: new Date().toISOString()}).eq('id', messageId)
    await supabase.from('notifications').insert({student_id: selectedStudent, title: 'Your tutor responded to your message', message: response.trim().substring(0, 80), type: 'feedback', link: '/dashboard/feedback'})
    setResponse('')
    await loadMessages(selectedStudent)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    setSending(false)
  }

  const selectedStudentName = students.find((s: any) => s.id === selectedStudent)?.email?.split('@')[0] || ''

  return (
    <div>
      {success && <div style={{background: '#f0f7f2', border: '1px solid #6b7c3a', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, color: '#2d6a4f'}}>✓ Response sent! Student has been notified.</div>}
      <div style={{display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16}}>
        <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
          <div style={{background: '#0d2340', padding: '12px 16px'}}><div style={{fontSize: 12, fontWeight: 600, color: 'white'}}>Select student</div></div>
          {students.length === 0 ? (
            <div style={{padding: '16px', fontSize: 13, color: '#8a7d6a', fontStyle: 'italic'}}>No students yet</div>
          ) : students.map((s: any) => (
            <div key={s.id} onClick={() => loadMessages(s.id)}
              style={{display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer', borderBottom: '0.5px solid #f5f0e8', background: selectedStudent === s.id ? '#fffdf5' : 'white', borderLeft: selectedStudent === s.id ? '3px solid #c9a84c' : '3px solid transparent'}}>
              <div style={{width: 28, height: 28, borderRadius: '50%', background: '#c9a84c', color: '#0d2340', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                {(s.full_name || s.email).charAt(0).toUpperCase()}
              </div>
              <div style={{fontSize: 13, color: '#0d2340', fontWeight: selectedStudent === s.id ? 600 : 400}}>{s.full_name || s.email.split('@')[0]}</div>
            </div>
          ))}
        </div>
        <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 400}}>
          {!selectedStudent ? (
            <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px'}}>
              <div style={{textAlign: 'center', fontSize: 14, color: '#8a7d6a', fontStyle: 'italic'}}>Select a student to view their messages</div>
            </div>
          ) : (
            <>
              <div style={{background: '#0d2340', padding: '12px 18px'}}>
                <div style={{fontSize: 13, fontWeight: 600, color: 'white'}}>{selectedStudentName}</div>
                <div style={{fontSize: 11, color: 'rgba(255,255,255,0.45)'}}>{messages.length} message{messages.length !== 1 ? 's' : ''}</div>
              </div>
              <div style={{flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14}}>
                {messages.length === 0 ? (
                  <div style={{textAlign: 'center', padding: '30px 0', fontSize: 14, color: '#8a7d6a', fontStyle: 'italic'}}>No messages from this student yet</div>
                ) : messages.map((msg) => (
                  <div key={msg.id} style={{border: '0.5px solid #e8dfc8', borderRadius: 10, overflow: 'hidden'}}>
                    <div style={{background: '#f7f4ee', padding: '12px 16px', borderBottom: '0.5px solid #e8dfc8'}}>
                      <div style={{fontSize: 11, color: '#a89870', marginBottom: 6}}>{new Date(msg.created_at).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</div>
                      <div style={{fontSize: 14, color: '#1a1008', lineHeight: 1.6}}>{msg.message}</div>
                    </div>
                    <div style={{padding: '12px 16px'}}>
                      {msg.response ? (
                        <div>
                          <div style={{fontSize: 11, color: '#c9a84c', fontWeight: 500, marginBottom: 6}}>Your response · {msg.responded_at && new Date(msg.responded_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</div>
                          <div style={{fontSize: 14, color: '#3d3020', lineHeight: 1.6}}>{msg.response}</div>
                        </div>
                      ) : (
                        <div>
                          <div style={{fontSize: 11, color: '#a89870', marginBottom: 8}}>No response yet</div>
                          <div style={{display: 'flex', gap: 8}}>
                            <textarea value={response} onChange={e => setResponse(e.target.value)}
                              placeholder="Type your response..." rows={2}
                              style={{flex: 1, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '8px 10px', color: '#1a1008', outline: 'none', resize: 'none'}}/>
                            <button onClick={() => sendResponse(msg.id)} disabled={sending || !response.trim()}
                              style={{padding: '0 14px', background: '#0d2340', border: 'none', borderRadius: 7, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end', height: 36}}>
                              {sending ? '...' : 'Reply →'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SlidesManager({ supabase, onSuccess }: any) {
  const [slides, setSlides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [newSlide, setNewSlide] = useState({week_number: '1', session_date: '', topic: '', link: '', available: false})
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const { data } = await supabase.from('slides').select('*').order('sort_order', {ascending: true})
    setSlides(data || [])
    setLoading(false)
  }

  const updateSlide = async (id: string, updates: any) => {
    setSaving(id)
    await supabase.from('slides').update(updates).eq('id', id)
    await load()
    setSaving('')
    onSuccess('Slide updated!')
  }

  const addSlide = async () => {
    if (!newSlide.session_date || !newSlide.topic) return
    setAdding(true)
    const maxOrder = Math.max(...slides.map(s => s.sort_order || 0), 0)
    await supabase.from('slides').insert({...newSlide, week_number: parseInt(newSlide.week_number), sort_order: maxOrder + 1})
    setNewSlide({week_number: '1', session_date: '', topic: '', link: '', available: false})
    await load()
    setAdding(false)
    onSuccess('Slide added!')
  }

  const deleteSlide = async (id: string) => {
    await supabase.from('slides').delete().eq('id', id)
    await load()
    onSuccess('Slide removed!')
  }

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading slides...</div>

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
      {/* Add new slide */}
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
        <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 18}}>Add new session</div>
        <div style={{display: 'grid', gridTemplateColumns: '100px 1fr 1fr 2fr auto', gap: 12, alignItems: 'end'}}>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Week</label>
            <select value={newSlide.week_number} onChange={e => setNewSlide({...newSlide, week_number: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none'}}>
              {[1,2,3,4,5,6,7,8].map(w => <option key={w} value={w}>Week {w}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Date</label>
            <input type="date" value={newSlide.session_date} onChange={e => setNewSlide({...newSlide, session_date: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Topic</label>
            <input type="text" value={newSlide.topic} onChange={e => setNewSlide({...newSlide, topic: e.target.value})}
              placeholder="e.g. Cardiology HY Review"
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Slide link (Google Drive etc)</label>
            <input type="text" value={newSlide.link} onChange={e => setNewSlide({...newSlide, link: e.target.value})}
              placeholder="https://drive.google.com/..."
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <button onClick={addSlide} disabled={adding}
            style={{height: 40, padding: '0 16px', background: '#0d2340', border: 'none', borderRadius: 7, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'}}>
            {adding ? '...' : 'Add →'}
          </button>
        </div>
      </div>

      {/* Existing slides */}
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
        <div style={{background: '#0d2340', padding: '12px 20px'}}>
          <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>All sessions ({slides.length})</div>
        </div>
        {slides.map((slide, i) => (
          <div key={slide.id} style={{display: 'grid', gridTemplateColumns: '80px 120px 1fr 1fr auto auto', gap: 12, alignItems: 'center', padding: '12px 20px', borderBottom: i < slides.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
            <div style={{fontSize: 12, color: '#c9a84c', background: '#f7f4ee', borderRadius: 4, padding: '3px 6px', textAlign: 'center'}}>Week {slide.week_number}</div>
            <div style={{fontSize: 12, color: '#8a7d6a'}}>{new Date(slide.session_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</div>
            <div style={{fontSize: 13, color: '#0d2340', fontWeight: 500}}>{slide.topic}</div>
            <input type="text" defaultValue={slide.link || ''} placeholder="Paste Google Drive link..."
              onBlur={e => { if (e.target.value !== (slide.link || '')) updateSlide(slide.id, {link: e.target.value}) }}
              style={{height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 12, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
            <div style={{display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'}}
              onClick={() => updateSlide(slide.id, {available: !slide.available})}>
              <div style={{width: 36, height: 20, borderRadius: 10, background: slide.available ? '#6b7c3a' : '#e8dfc8', position: 'relative', transition: 'background 0.2s'}}>
                <div style={{position: 'absolute', top: 2, left: slide.available ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s'}}/>
              </div>
              <span style={{fontSize: 11, color: slide.available ? '#6b7c3a' : '#a89870'}}>{slide.available ? 'Live' : 'Hidden'}</span>
            </div>
            <div onClick={() => deleteSlide(slide.id)} style={{fontSize: 11, color: '#c0574a', cursor: 'pointer', padding: '4px 8px'}}>Remove</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResourcesManager({ supabase, onSuccess }: any) {
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newResource, setNewResource] = useState({category: 'Study Strategy', name: '', description: '', link: '', file_type: 'PDF'})
  const [adding, setAdding] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('resources').select('*').order('sort_order', {ascending: true})
    setResources(data || [])
    setLoading(false)
  }

  const updateResource = async (id: string, updates: any) => {
    await supabase.from('resources').update(updates).eq('id', id)
    await load()
    onSuccess('Resource updated!')
  }

  const addResource = async () => {
    if (!newResource.name) return
    setAdding(true)
    const maxOrder = Math.max(...resources.map(r => r.sort_order || 0), 0)
    await supabase.from('resources').insert({...newResource, sort_order: maxOrder + 1})
    setNewResource({category: 'Study Strategy', name: '', description: '', link: '', file_type: 'PDF'})
    await load()
    setAdding(false)
    onSuccess('Resource added!')
  }

  const deleteResource = async (id: string) => {
    await supabase.from('resources').delete().eq('id', id)
    await load()
    onSuccess('Resource removed!')
  }

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading resources...</div>

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
        <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 18}}>Add new resource</div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12}}>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Category</label>
            <select value={newResource.category} onChange={e => setNewResource({...newResource, category: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none'}}>
              {['Study Strategy', 'High Yield References', 'Wellness & Performance'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>File type</label>
            <select value={newResource.file_type} onChange={e => setNewResource({...newResource, file_type: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none'}}>
              {['PDF', 'Video', 'Link', 'Doc', 'Slides'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{marginBottom: 12}}>
          <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Name</label>
          <input type="text" value={newResource.name} onChange={e => setNewResource({...newResource, name: e.target.value})}
            placeholder="Resource name"
            style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
        </div>
        <div style={{marginBottom: 12}}>
          <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Description</label>
          <input type="text" value={newResource.description} onChange={e => setNewResource({...newResource, description: e.target.value})}
            placeholder="Brief description"
            style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
        </div>
        <div style={{marginBottom: 16}}>
          <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Link (Google Drive, URL etc)</label>
          <input type="text" value={newResource.link} onChange={e => setNewResource({...newResource, link: e.target.value})}
            placeholder="https://..."
            style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
        </div>
        <button onClick={addResource} disabled={adding || !newResource.name}
          style={{width: '100%', height: 42, background: '#0d2340', border: 'none', borderRadius: 8, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer'}}>
          {adding ? 'Adding...' : 'Add resource ↗'}
        </button>
      </div>

      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
        <div style={{background: '#0d2340', padding: '12px 20px'}}>
          <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>All resources ({resources.length})</div>
        </div>
        {resources.map((r, i) => (
          <div key={r.id} style={{display: 'grid', gridTemplateColumns: '140px 1fr 1fr auto', gap: 12, alignItems: 'center', padding: '12px 20px', borderBottom: i < resources.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
            <div style={{fontSize: 11, color: '#c9a84c', background: '#f7f4ee', borderRadius: 4, padding: '3px 6px', textAlign: 'center'}}>{r.category}</div>
            <div>
              <div style={{fontSize: 13, color: '#0d2340', fontWeight: 500}}>{r.name}</div>
              <div style={{fontSize: 11, color: '#8a7d6a'}}>{r.description}</div>
            </div>
            <input type="text" defaultValue={r.link || ''} placeholder="Paste link..."
              onBlur={e => { if (e.target.value !== (r.link || '')) updateResource(r.id, {link: e.target.value}) }}
              style={{height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 12, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
            <div onClick={() => deleteResource(r.id)} style={{fontSize: 11, color: '#c0574a', cursor: 'pointer', padding: '4px 8px'}}>Remove</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExamsManager({ supabase, onSuccess }: any) {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newExam, setNewExam] = useState({name: '', questions: '200', time_limit: '4 hrs', difficulty: 'Moderate', recommended_week: '', deadline: '', link: '', notes: '', available: true})
  const [adding, setAdding] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('exams').select('*').order('sort_order', {ascending: true})
    setExams(data || [])
    setLoading(false)
  }

  const updateExam = async (id: string, updates: any) => {
    await supabase.from('exams').update(updates).eq('id', id)
    await load()
    onSuccess('Exam updated!')
  }

  const addExam = async () => {
    if (!newExam.name) return
    setAdding(true)
    const maxOrder = Math.max(...exams.map(e => e.sort_order || 0), 0)
    await supabase.from('exams').insert({...newExam, questions: parseInt(newExam.questions), sort_order: maxOrder + 1, deadline: newExam.deadline || null, link: newExam.link || null})
    setNewExam({name: '', questions: '200', time_limit: '4 hrs', difficulty: 'Moderate', recommended_week: '', deadline: '', link: '', notes: '', available: true})
    await load()
    setAdding(false)
    onSuccess('Exam added!')
  }

  const deleteExam = async (id: string) => {
    await supabase.from('exams').delete().eq('id', id)
    await load()
    onSuccess('Exam removed!')
  }

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading exams...</div>

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
        <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 18}}>Add new exam</div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 100px 120px 140px 1fr', gap: 12, marginBottom: 12}}>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Exam name</label>
            <input type="text" value={newExam.name} onChange={e => setNewExam({...newExam, name: e.target.value})}
              placeholder="e.g. NBME 32"
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Questions</label>
            <input type="number" value={newExam.questions} onChange={e => setNewExam({...newExam, questions: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Time limit</label>
            <input type="text" value={newExam.time_limit} onChange={e => setNewExam({...newExam, time_limit: e.target.value})}
              placeholder="e.g. 4 hrs"
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Difficulty</label>
            <select value={newExam.difficulty} onChange={e => setNewExam({...newExam, difficulty: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none'}}>
              {['Baseline','Moderate','Hard','Hardest','Custom'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Recommended week</label>
            <input type="text" value={newExam.recommended_week} onChange={e => setNewExam({...newExam, recommended_week: e.target.value})}
              placeholder="e.g. Week 3"
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16}}>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Deadline (optional)</label>
            <input type="date" value={newExam.deadline} onChange={e => setNewExam({...newExam, deadline: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Exam link (optional)</label>
            <input type="text" value={newExam.link} onChange={e => setNewExam({...newExam, link: e.target.value})}
              placeholder="https://..."
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Notes (optional)</label>
            <input type="text" value={newExam.notes} onChange={e => setNewExam({...newExam, notes: e.target.value})}
              placeholder="e.g. Week 2 checkpoint"
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
        </div>
        <button onClick={addExam} disabled={adding || !newExam.name}
          style={{width: '100%', height: 42, background: '#0d2340', border: 'none', borderRadius: 8, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer'}}>
          {adding ? 'Adding...' : 'Add exam ↗'}
        </button>
      </div>

      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
        <div style={{background: '#0d2340', padding: '12px 20px'}}>
          <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>All exams ({exams.length})</div>
        </div>
        {exams.map((exam, i) => (
          <div key={exam.id} style={{padding: '14px 20px', borderBottom: i < exams.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 100px 120px 160px 160px auto auto', gap: 10, alignItems: 'center'}}>
              <input type="text" defaultValue={exam.name}
                onBlur={e => { if (e.target.value !== exam.name) updateExam(exam.id, {name: e.target.value}) }}
                style={{height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#0d2340', fontWeight: 500, outline: 'none', boxSizing: 'border-box'}}/>
              <input type="number" defaultValue={exam.questions}
                onBlur={e => { if (parseInt(e.target.value) !== exam.questions) updateExam(exam.id, {questions: parseInt(e.target.value)}) }}
                style={{height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
              <input type="text" defaultValue={exam.time_limit}
                onBlur={e => { if (e.target.value !== exam.time_limit) updateExam(exam.id, {time_limit: e.target.value}) }}
                style={{height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
              <input type="date" defaultValue={exam.deadline || ''}
                onBlur={e => { if (e.target.value !== (exam.deadline || '')) updateExam(exam.id, {deadline: e.target.value || null}) }}
                style={{height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 12, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
              <input type="text" defaultValue={exam.link || ''} placeholder="Paste exam link..."
                onBlur={e => { if (e.target.value !== (exam.link || '')) updateExam(exam.id, {link: e.target.value || null}) }}
                style={{height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 12, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
              <div style={{display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'}}
                onClick={() => updateExam(exam.id, {available: !exam.available})}>
                <div style={{width: 36, height: 20, borderRadius: 10, background: exam.available ? '#6b7c3a' : '#e8dfc8', position: 'relative', transition: 'background 0.2s'}}>
                  <div style={{position: 'absolute', top: 2, left: exam.available ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s'}}/>
                </div>
                <span style={{fontSize: 11, color: exam.available ? '#6b7c3a' : '#a89870', whiteSpace: 'nowrap'}}>{exam.available ? 'Live' : 'Hidden'}</span>
              </div>
              <div onClick={() => deleteExam(exam.id)} style={{fontSize: 11, color: '#c0574a', cursor: 'pointer', padding: '4px 8px'}}>Remove</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}