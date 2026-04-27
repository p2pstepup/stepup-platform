'use client'
import { useState, useEffect } from 'react'

export function StudentProfiles({ supabase, students, onSuccess }: any) {
  const [profiles, setProfiles] = useState<any[]>([])
  const [tutors, setTutors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    const [{ data: studentData }, { data: tutorData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'student').order('full_name'),
      supabase.from('profiles').select('id, full_name, email').in('role', ['tutor', 'admin']).order('full_name')
    ])
    setProfiles(studentData || [])
    setTutors(tutorData || [])
    setLoading(false)
  }

  const updateProfile = async (id: string, updates: any) => {
    setSaving(id)
    await supabase.from('profiles').update(updates).eq('id', id)
    await load()
    setSaving('')
    onSuccess('Profile updated!')
  }

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading...</div>

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
      <div style={{background: '#0d2340', borderRadius: 12, padding: '14px 20px', marginBottom: 4}}>
        <div style={{fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6}}>
          Add mentor names and emails here — they'll appear automatically in each student's dashboard sidebar.
        </div>
      </div>
      {profiles.length === 0 ? (
        <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '40px', textAlign: 'center'}}>
          <div style={{fontSize: 15, color: '#8a7d6a'}}>No students yet.</div>
        </div>
      ) : profiles.map(profile => (
        <div key={profile.id} style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16}}>
            <div style={{width: 40, height: 40, borderRadius: '50%', background: '#c9a84c', color: '#0d2340', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              {(profile.full_name || profile.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340'}}>{profile.full_name || profile.email.split('@')[0]}</div>
              <div style={{fontSize: 12, color: '#8a7d6a'}}>{profile.email}</div>
            </div>
            {saving === profile.id && <div style={{fontSize: 12, color: '#c9a84c', marginLeft: 'auto'}}>Saving...</div>}
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12}}>
            <div>
              <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Full name</label>
              <input type="text" defaultValue={profile.full_name || ''} id={`name-${profile.id}`} placeholder="Student full name"
                style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
            </div>
            <div>
              <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Mentor name</label>
              <input type="text" defaultValue={profile.mentor_name || ''} id={`mentor-name-${profile.id}`} placeholder="e.g. Dr. Rivera"
                style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
            </div>
            <div>
              <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Mentor email</label>
              <input type="text" defaultValue={profile.mentor_email || ''} id={`mentor-email-${profile.id}`} placeholder="mentor@email.com"
                style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
            </div>
            <div>
              <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Assigned tutor</label>
              <select defaultValue={profile.tutor_id || ''}
                onChange={e => updateProfile(profile.id, {tutor_id: e.target.value || null})}
                style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: '#1a1008', outline: 'none'}}>
                <option value="">No tutor assigned</option>
                {tutors.map((t: any) => <option key={t.id} value={t.id}>{t.full_name || t.email.split('@')[0]}</option>)}
              </select>
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end', gridColumn: 'span 1'}}>
              <button onClick={() => {
                const name = (document.getElementById(`name-${profile.id}`) as HTMLInputElement)?.value
                const mentorName = (document.getElementById(`mentor-name-${profile.id}`) as HTMLInputElement)?.value
                const mentorEmail = (document.getElementById(`mentor-email-${profile.id}`) as HTMLInputElement)?.value
                updateProfile(profile.id, {full_name: name, mentor_name: mentorName, mentor_email: mentorEmail})
              }} style={{width: '100%', height: 40, background: '#0d2340', border: 'none', borderRadius: 7, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer'}}>
                Save ↗
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function AnnouncementForm({ students, supabase, onSuccess }: any) {
  const [form, setForm] = useState({title: '', body: ''})
  const [sending, setSending] = useState(false)
  const [announcements, setAnnouncements] = useState<any[]>([])

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', {ascending: false}).limit(20)
    setAnnouncements(data || [])
  }

  const post = async () => {
    if (!form.title) return
    setSending(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('announcements').insert({posted_by: user.id, title: form.title, body: form.body})
    for (const student of students) {
      await supabase.from('notifications').insert({student_id: student.id, title: form.title, message: form.body, type: 'announcement', link: '/dashboard'})
    }
    setForm({title: '', body: ''})
    await load()
    setSending(false)
    onSuccess()
  }

  const deleteAnnouncement = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id)
    await load()
  }

  return (
    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20}}>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
        <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 18}}>New announcement</div>
        <div style={{marginBottom: 14}}>
          <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase'}}>Title</label>
          <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Announcement title"
            style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
        </div>
        <div style={{marginBottom: 20}}>
          <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase'}}>Message</label>
          <textarea value={form.body} onChange={e => setForm({...form, body: e.target.value})} placeholder="Write your announcement..." rows={5}
            style={{width: '100%', borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '10px 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', resize: 'none'}}/>
        </div>
        <button onClick={post} disabled={sending || !form.title}
          style={{width: '100%', height: 46, background: '#0d2340', border: 'none', borderRadius: 9, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 600, cursor: 'pointer'}}>
          {sending ? 'Posting...' : `Post to all ${students.length} students ↗`}
        </button>
      </div>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden', height: 'fit-content'}}>
        <div style={{background: '#0d2340', padding: '12px 20px'}}>
          <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>Past announcements</div>
        </div>
        {announcements.length === 0 ? (
          <div style={{padding: '24px', fontSize: 14, color: '#8a7d6a', fontStyle: 'italic'}}>No announcements yet.</div>
        ) : announcements.map((a, i) => (
          <div key={a.id} style={{padding: '14px 20px', borderBottom: i < announcements.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div style={{flex: 1}}>
                <div style={{fontSize: 14, fontWeight: 500, color: '#0d2340', marginBottom: 4}}>{a.title}</div>
                <div style={{fontSize: 12, color: '#8a7d6a', lineHeight: 1.5}}>{a.body}</div>
                <div style={{fontSize: 11, color: '#a89870', marginTop: 6}}>{new Date(a.created_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</div>
              </div>
              <div onClick={() => deleteAnnouncement(a.id)} style={{fontSize: 11, color: '#c0574a', cursor: 'pointer', padding: '4px 8px', flexShrink: 0}}>Remove</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FeedbackTab({ supabase, students }: any) {
  const [feedback, setFeedback] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [sending, setSending] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('feedback').select('*, profiles(full_name, email)').order('created_at', {ascending: false})
    setFeedback(data || [])
    setLoading(false)
  }

  const respond = async (id: string, studentId: string) => {
    if (!responses[id]) return
    setSending(id)
    await supabase.from('feedback').update({response: responses[id], responded_at: new Date().toISOString()}).eq('id', id)
    await supabase.from('notifications').insert({student_id: studentId, title: 'Your tutor responded to your message', message: responses[id].substring(0, 100), type: 'feedback', link: '/dashboard/feedback'})
    await load()
    setSending('')
  }

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading...</div>

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
      {feedback.length === 0 ? (
        <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '40px', textAlign: 'center'}}>
          <div style={{fontSize: 15, color: '#0d2340', fontWeight: 500}}>No feedback yet</div>
          <div style={{fontSize: 13, color: '#8a7d6a', marginTop: 8}}>Student messages will appear here</div>
        </div>
      ) : feedback.map(f => (
        <div key={f.id} style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
          <div style={{background: '#f7f4ee', padding: '14px 20px', borderBottom: '0.5px solid #e8dfc8', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{fontSize: 14, fontWeight: 500, color: '#0d2340'}}>{f.profiles?.full_name || f.profiles?.email?.split('@')[0]}</div>
            <div style={{fontSize: 11, color: '#a89870'}}>{new Date(f.created_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</div>
          </div>
          <div style={{padding: '16px 20px'}}>
            <div style={{fontSize: 14, color: '#3d3020', lineHeight: 1.6, marginBottom: 14}}>{f.message}</div>
            {f.response ? (
              <div style={{background: '#f0f7f2', borderRadius: 8, padding: '12px 14px', borderLeft: '3px solid #6b7c3a'}}>
                <div style={{fontSize: 11, color: '#6b7c3a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4}}>Your response</div>
                <div style={{fontSize: 13, color: '#2d6a4f', lineHeight: 1.5}}>{f.response}</div>
              </div>
            ) : (
              <div>
                <textarea value={responses[f.id] || ''} onChange={e => setResponses({...responses, [f.id]: e.target.value})}
                  placeholder="Type your response..." rows={3}
                  style={{width: '100%', borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '10px 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', resize: 'none', marginBottom: 10}}/>
                <button onClick={() => respond(f.id, f.student_id)} disabled={sending === f.id || !responses[f.id]}
                  style={{padding: '8px 20px', background: '#0d2340', border: 'none', borderRadius: 8, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer'}}>
                  {sending === f.id ? 'Sending...' : 'Send response ↗'}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export function SlidesManager({ supabase, onSuccess }: any) {
  const [slides, setSlides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('slides').select('*').order('sort_order', {ascending: true})
    setSlides(data || [])
    setLoading(false)
  }

  const updateSlide = async (id: string, updates: any) => {
    await supabase.from('slides').update(updates).eq('id', id)
    await load()
    onSuccess('Slide updated!')
  }

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading...</div>

  return (
    <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
      <div style={{background: '#0d2340', padding: '12px 20px'}}>
        <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>All sessions ({slides.length})</div>
      </div>
      {slides.map((slide, i) => (
        <div key={slide.id} style={{display: 'grid', gridTemplateColumns: '80px 1fr 1fr auto', gap: 12, alignItems: 'center', padding: '12px 20px', borderBottom: i < slides.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
          <div style={{fontSize: 12, color: '#c9a84c', background: '#f7f4ee', borderRadius: 4, padding: '3px 6px', textAlign: 'center'}}>Week {slide.week_number}</div>
          <div>
            <input type="text" defaultValue={slide.topic}
              onBlur={e => { if (e.target.value !== slide.topic) updateSlide(slide.id, {topic: e.target.value}) }}
              style={{height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#0d2340', fontWeight: 500, outline: 'none', boxSizing: 'border-box', width: '100%'}}/>
            <div style={{fontSize: 11, color: '#8a7d6a'}}>{slide.session_date && new Date(slide.session_date + 'T12:00:00').toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'})}</div>
          </div>
          <div style={{display: 'flex', gap: 6}}>
            <input type="text" defaultValue={slide.link || ''} placeholder="Paste Google Drive link..." id={`slide-link-${slide.id}`}
              style={{flex: 1, height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 12, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
            <button onClick={() => {
              const input = document.getElementById(`slide-link-${slide.id}`) as HTMLInputElement
              if (input) updateSlide(slide.id, {link: input.value, available: input.value ? true : slide.available})
            }} style={{height: 34, padding: '0 10px', background: '#0d2340', border: 'none', borderRadius: 6, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer'}}>Save</button>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'}} onClick={() => updateSlide(slide.id, {available: !slide.available})}>
            <div style={{width: 36, height: 20, borderRadius: 10, background: slide.available ? '#6b7c3a' : '#e8dfc8', position: 'relative'}}>
              <div style={{position: 'absolute', top: 2, left: slide.available ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white'}}/>
            </div>
            <span style={{fontSize: 11, color: slide.available ? '#6b7c3a' : '#a89870'}}>{slide.available ? 'Live' : 'Hidden'}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function RecordingsManager({ supabase, onSuccess }: any) {
  const [recordings, setRecordings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newRec, setNewRec] = useState({week_number: '1', session_date: '', topic: '', link: '', duration: '', available: false})
  const [adding, setAdding] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('recordings').select('*').order('sort_order', {ascending: true})
    setRecordings(data || [])
    setLoading(false)
  }

  const updateRecording = async (id: string, updates: any) => {
    await supabase.from('recordings').update(updates).eq('id', id)
    await load()
    onSuccess('Recording updated!')
  }

  const addRecording = async () => {
    if (!newRec.session_date || !newRec.topic) return
    setAdding(true)
    const maxOrder = Math.max(...recordings.map(r => r.sort_order || 0), 0)
    await supabase.from('recordings').insert({...newRec, week_number: parseInt(newRec.week_number), sort_order: maxOrder + 1})
    setNewRec({week_number: '1', session_date: '', topic: '', link: '', duration: '', available: false})
    await load()
    setAdding(false)
    onSuccess('Recording added!')
  }

  const deleteRecording = async (id: string) => {
    await supabase.from('recordings').delete().eq('id', id)
    await load()
    onSuccess('Recording removed!')
  }

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading...</div>

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
        <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 18}}>Add new recording</div>
        <div style={{display: 'grid', gridTemplateColumns: '80px 160px 1fr 1fr 100px auto', gap: 10, alignItems: 'end'}}>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Week</label>
            <select value={newRec.week_number} onChange={e => setNewRec({...newRec, week_number: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none'}}>
              {[1,2,3,4,5,6,7,8].map(w => <option key={w} value={w}>Week {w}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Date</label>
            <input type="date" value={newRec.session_date} onChange={e => setNewRec({...newRec, session_date: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Topic</label>
            <input type="text" value={newRec.topic} onChange={e => setNewRec({...newRec, topic: e.target.value})} placeholder="e.g. Cardiology HY Review"
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Link</label>
            <input type="text" value={newRec.link} onChange={e => setNewRec({...newRec, link: e.target.value})} placeholder="https://zoom.us/rec/..."
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Duration</label>
            <input type="text" value={newRec.duration} onChange={e => setNewRec({...newRec, duration: e.target.value})} placeholder="2h 15m"
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <button onClick={addRecording} disabled={adding}
            style={{height: 40, padding: '0 16px', background: '#0d2340', border: 'none', borderRadius: 7, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer'}}>
            {adding ? '...' : 'Add →'}
          </button>
        </div>
      </div>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
        <div style={{background: '#0d2340', padding: '12px 20px'}}>
          <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>All recordings ({recordings.length})</div>
        </div>
        {recordings.length === 0 ? (
          <div style={{padding: '24px', fontSize: 14, color: '#8a7d6a', fontStyle: 'italic'}}>No recordings yet.</div>
        ) : recordings.map((rec, i) => (
          <div key={rec.id} style={{display: 'grid', gridTemplateColumns: '80px 120px 1fr 1fr auto auto', gap: 10, alignItems: 'center', padding: '12px 20px', borderBottom: i < recordings.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
            <div style={{fontSize: 12, color: '#c9a84c', background: '#f7f4ee', borderRadius: 4, padding: '3px 6px', textAlign: 'center'}}>Week {rec.week_number}</div>
            <div style={{fontSize: 12, color: '#8a7d6a'}}>{new Date(rec.session_date + 'T12:00:00').toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</div>
            <input type="text" defaultValue={rec.topic}
              onBlur={e => { if (e.target.value !== rec.topic) updateRecording(rec.id, {topic: e.target.value}) }}
              style={{height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#0d2340', fontWeight: 500, outline: 'none', boxSizing: 'border-box', width: '100%'}}/>
            <div style={{display: 'flex', gap: 6}}>
              <input type="text" defaultValue={rec.link || ''} placeholder="Paste recording link..." id={`rec-link-${rec.id}`}
                style={{flex: 1, height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 12, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
              <button onClick={() => {
                const input = document.getElementById(`rec-link-${rec.id}`) as HTMLInputElement
                if (input) updateRecording(rec.id, {link: input.value, available: input.value ? true : rec.available})
              }} style={{height: 34, padding: '0 10px', background: '#0d2340', border: 'none', borderRadius: 6, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer'}}>Save</button>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'}} onClick={() => updateRecording(rec.id, {available: !rec.available})}>
              <div style={{width: 36, height: 20, borderRadius: 10, background: rec.available ? '#6b7c3a' : '#e8dfc8', position: 'relative'}}>
                <div style={{position: 'absolute', top: 2, left: rec.available ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white'}}/>
              </div>
              <span style={{fontSize: 11, color: rec.available ? '#6b7c3a' : '#a89870'}}>{rec.available ? 'Live' : 'Hidden'}</span>
            </div>
            <div onClick={() => deleteRecording(rec.id)} style={{fontSize: 11, color: '#c0574a', cursor: 'pointer', padding: '4px 8px'}}>Remove</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function NotesManager({ supabase, onSuccess }: any) {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState({topic: '', category: '', description: '', link: '', available: true})
  const [adding, setAdding] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('hy_notes').select('*').order('sort_order', {ascending: true})
    setNotes(data || [])
    setLoading(false)
  }

  const updateNote = async (id: string, updates: any) => {
    await supabase.from('hy_notes').update(updates).eq('id', id)
    await load()
    onSuccess('Notes updated!')
  }

  const addNote = async () => {
    if (!newNote.topic) return
    setAdding(true)
    const maxOrder = Math.max(...notes.map(n => n.sort_order || 0), 0)
    await supabase.from('hy_notes').insert({...newNote, sort_order: maxOrder + 1})
    setNewNote({topic: '', category: '', description: '', link: '', available: true})
    await load()
    setAdding(false)
    onSuccess('Notes added!')
  }

  const deleteNote = async (id: string) => {
    await supabase.from('hy_notes').delete().eq('id', id)
    await load()
    onSuccess('Notes removed!')
  }

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading...</div>

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
        <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 18}}>Add new HY notes</div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'end'}}>
          {[{label: 'Topic', key: 'topic', placeholder: 'e.g. Cardiology HY Review'}, {label: 'Category', key: 'category', placeholder: 'e.g. Cardiology'}, {label: 'Description', key: 'description', placeholder: 'Brief description'}, {label: 'Link', key: 'link', placeholder: 'https://...'}].map(f => (
            <div key={f.key}>
              <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>{f.label}</label>
              <input type="text" value={(newNote as any)[f.key]} onChange={e => setNewNote({...newNote, [f.key]: e.target.value})} placeholder={f.placeholder}
                style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
            </div>
          ))}
          <button onClick={addNote} disabled={adding || !newNote.topic}
            style={{height: 40, padding: '0 16px', background: '#0d2340', border: 'none', borderRadius: 7, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer'}}>
            {adding ? '...' : 'Add →'}
          </button>
        </div>
      </div>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
        <div style={{background: '#0d2340', padding: '12px 20px'}}>
          <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>All HY notes ({notes.length})</div>
        </div>
        {notes.map((note, i) => (
          <div key={note.id} style={{display: 'grid', gridTemplateColumns: '1fr 120px 1fr auto auto', gap: 10, alignItems: 'center', padding: '12px 20px', borderBottom: i < notes.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
            <div>
              <input type="text" defaultValue={note.topic}
                onBlur={e => { if (e.target.value !== note.topic) updateNote(note.id, {topic: e.target.value}) }}
                style={{height: 30, borderRadius: 5, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#0d2340', fontWeight: 500, outline: 'none', boxSizing: 'border-box', width: '100%', marginBottom: 4}}/>
              <input type="text" defaultValue={note.category}
                onBlur={e => { if (e.target.value !== note.category) updateNote(note.id, {category: e.target.value}) }}
                style={{height: 26, borderRadius: 5, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 11, padding: '0 8px', color: '#8a7d6a', outline: 'none', boxSizing: 'border-box', width: '100%'}}/>
            </div>
            <span style={{fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#f7f4ee', color: '#8a7d6a', textAlign: 'center'}}>{note.category}</span>
            <div style={{display: 'flex', gap: 6}}>
              <input type="text" defaultValue={note.link || ''} placeholder="Paste notes link..." id={`note-link-${note.id}`}
                style={{flex: 1, height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 12, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
              <button onClick={() => {
                const input = document.getElementById(`note-link-${note.id}`) as HTMLInputElement
                if (input) updateNote(note.id, {link: input.value})
              }} style={{height: 34, padding: '0 10px', background: '#0d2340', border: 'none', borderRadius: 6, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer'}}>Save</button>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'}} onClick={() => updateNote(note.id, {available: !note.available})}>
              <div style={{width: 36, height: 20, borderRadius: 10, background: note.available ? '#6b7c3a' : '#e8dfc8', position: 'relative'}}>
                <div style={{position: 'absolute', top: 2, left: note.available ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white'}}/>
              </div>
              <span style={{fontSize: 11, color: note.available ? '#6b7c3a' : '#a89870'}}>{note.available ? 'Live' : 'Hidden'}</span>
            </div>
            <div onClick={() => deleteNote(note.id)} style={{fontSize: 11, color: '#c0574a', cursor: 'pointer', padding: '4px 8px'}}>Remove</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ResourcesManager({ supabase, onSuccess }: any) {
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newRes, setNewRes] = useState({name: '', description: '', category: 'Course Materials', file_type: 'PDF', link: ''})
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
    if (!newRes.name) return
    setAdding(true)
    const maxOrder = Math.max(...resources.map(r => r.sort_order || 0), 0)
    await supabase.from('resources').insert({...newRes, sort_order: maxOrder + 1})
    setNewRes({name: '', description: '', category: 'Study Strategy', file_type: 'PDF', link: ''})
    await load()
    setAdding(false)
    onSuccess('Resource added!')
  }

  const deleteResource = async (id: string) => {
    await supabase.from('resources').delete().eq('id', id)
    await load()
    onSuccess('Resource removed!')
  }

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading...</div>

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
        <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 18}}>Add new resource</div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 160px 100px', gap: 10, marginBottom: 10}}>
          {[{label: 'Name', key: 'name', placeholder: 'Resource name'}, {label: 'Description', key: 'description', placeholder: 'Brief description'}].map(f => (
            <div key={f.key}>
              <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>{f.label}</label>
              <input type="text" value={(newRes as any)[f.key]} onChange={e => setNewRes({...newRes, [f.key]: e.target.value})} placeholder={f.placeholder}
                style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
            </div>
          ))}
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Category</label>
            <select value={newRes.category} onChange={e => setNewRes({...newRes, category: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none'}}>
              {['Course Materials','Study Resources','Study Tools','Practice Exams & Qbanks','Wellness'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Type</label>
            <select value={newRes.file_type} onChange={e => setNewRes({...newRes, file_type: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none'}}>
              {['PDF','Doc','Video','Link','Spreadsheet'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end'}}>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Link</label>
            <input type="text" value={newRes.link} onChange={e => setNewRes({...newRes, link: e.target.value})} placeholder="https://..."
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <button onClick={addResource} disabled={adding || !newRes.name}
            style={{height: 40, padding: '0 20px', background: '#0d2340', border: 'none', borderRadius: 8, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer'}}>
            {adding ? '...' : 'Add →'}
          </button>
        </div>
      </div>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
        <div style={{background: '#0d2340', padding: '12px 20px'}}>
          <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>All resources ({resources.length})</div>
        </div>
        {resources.map((res, i) => (
          <div key={res.id} style={{display: 'grid', gridTemplateColumns: '1fr 180px 100px 1fr auto', gap: 12, alignItems: 'center', padding: '12px 20px', borderBottom: i < resources.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
            <div>
              <input type="text" defaultValue={res.name}
                onBlur={e => { if (e.target.value !== res.name) updateResource(res.id, {name: e.target.value}) }}
                style={{width: '100%', height: 30, borderRadius: 5, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#0d2340', fontWeight: 500, outline: 'none', boxSizing: 'border-box', marginBottom: 4}}/>
              <input type="text" defaultValue={res.description || ''} placeholder="Description..."
                onBlur={e => { if (e.target.value !== (res.description || '')) updateResource(res.id, {description: e.target.value}) }}
                style={{width: '100%', height: 26, borderRadius: 5, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 11, padding: '0 8px', color: '#8a7d6a', outline: 'none', boxSizing: 'border-box'}}/>
            </div>
            <select defaultValue={res.category} onChange={e => updateResource(res.id, {category: e.target.value})}
              style={{height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 12, padding: '0 8px', color: '#1a1008', outline: 'none'}}>
              {['Course Materials','Study Resources','Study Tools','Practice Exams & Qbanks','Wellness'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select defaultValue={res.file_type} onChange={e => updateResource(res.id, {file_type: e.target.value})}
              style={{height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 12, padding: '0 8px', color: '#1a1008', outline: 'none'}}>
              {['PDF','Doc','Video','Link','Spreadsheet'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div style={{display: 'flex', gap: 6}}>
              <input type="text" defaultValue={res.link || ''} placeholder="Paste link..." id={`res-link-${res.id}`}
                style={{flex: 1, height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 12, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
              <button onClick={() => {
                const input = document.getElementById(`res-link-${res.id}`) as HTMLInputElement
                if (input) updateResource(res.id, {link: input.value})
              }} style={{height: 34, padding: '0 10px', background: '#0d2340', border: 'none', borderRadius: 6, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer'}}>Save</button>
            </div>
            <div onClick={() => deleteResource(res.id)} style={{fontSize: 11, color: '#c0574a', cursor: 'pointer', padding: '4px 8px'}}>Remove</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ExamsManager({ supabase, onSuccess }: any) {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newExam, setNewExam] = useState({name: '', questions: '200', time_limit: '4 hrs', difficulty: 'Moderate', recommended_week: '3', available: false, deadline: '', link: '', notes: ''})
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
    await supabase.from('exams').insert({...newExam, questions: parseInt(newExam.questions), recommended_week: parseInt(newExam.recommended_week), sort_order: maxOrder + 1, deadline: newExam.deadline || null})
    setNewExam({name: '', questions: '200', time_limit: '4 hrs', difficulty: 'Moderate', recommended_week: '3', available: false, deadline: '', link: '', notes: ''})
    await load()
    setAdding(false)
    onSuccess('Exam added!')
  }

  const deleteExam = async (id: string) => {
    await supabase.from('exams').delete().eq('id', id)
    await load()
    onSuccess('Exam removed!')
  }

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading...</div>

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
        <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 18}}>Add new exam</div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 80px 100px 120px 80px 160px', gap: 10, marginBottom: 10}}>
          {[{label: 'Name', key: 'name', placeholder: 'e.g. NBME 28'}, {label: 'Questions', key: 'questions', placeholder: '200'}, {label: 'Time limit', key: 'time_limit', placeholder: '4 hrs'}].map(f => (
            <div key={f.key}>
              <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>{f.label}</label>
              <input type="text" value={(newExam as any)[f.key]} onChange={e => setNewExam({...newExam, [f.key]: e.target.value})} placeholder={f.placeholder}
                style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
            </div>
          ))}
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Difficulty</label>
            <select value={newExam.difficulty} onChange={e => setNewExam({...newExam, difficulty: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none'}}>
              {['Baseline','Moderate','Hard','Hardest'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Week</label>
            <select value={newExam.recommended_week} onChange={e => setNewExam({...newExam, recommended_week: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none'}}>
              {[1,2,3,4,5,6,7,8].map(w => <option key={w} value={w}>Week {w}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Deadline</label>
            <input type="date" value={newExam.deadline} onChange={e => setNewExam({...newExam, deadline: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end'}}>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Exam link</label>
            <input type="text" value={newExam.link} onChange={e => setNewExam({...newExam, link: e.target.value})} placeholder="https://..."
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <button onClick={addExam} disabled={adding || !newExam.name}
            style={{height: 40, padding: '0 20px', background: '#0d2340', border: 'none', borderRadius: 8, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer'}}>
            {adding ? '...' : 'Add →'}
          </button>
        </div>
      </div>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
        <div style={{background: '#0d2340', padding: '12px 20px'}}>
          <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>All exams ({exams.length})</div>
        </div>
        {exams.map((exam, i) => (
          <div key={exam.id} style={{display: 'grid', gridTemplateColumns: '1fr 80px 100px 160px auto auto', gap: 10, alignItems: 'center', padding: '12px 20px', borderBottom: i < exams.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
            <input type="text" defaultValue={exam.name}
              onBlur={e => { if (e.target.value !== exam.name) updateExam(exam.id, {name: e.target.value}) }}
              style={{height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#0d2340', fontWeight: 500, outline: 'none', boxSizing: 'border-box', width: '100%'}}/>
            <div style={{fontSize: 12, color: '#8a7d6a'}}>{exam.questions}Q · {exam.time_limit}</div>
            <div style={{fontSize: 12, color: exam.deadline ? '#c0574a' : '#a89870'}}>{exam.deadline ? new Date(exam.deadline).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : 'No deadline'}</div>
            <div style={{display: 'flex', gap: 6}}>
              <input type="text" defaultValue={exam.link || ''} placeholder="Exam link..." id={`exam-link-${exam.id}`}
                style={{flex: 1, height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 12, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
              <button onClick={() => {
                const input = document.getElementById(`exam-link-${exam.id}`) as HTMLInputElement
                if (input) updateExam(exam.id, {link: input.value})
              }} style={{height: 34, padding: '0 10px', background: '#0d2340', border: 'none', borderRadius: 6, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer'}}>Save</button>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'}} onClick={() => updateExam(exam.id, {available: !exam.available})}>
              <div style={{width: 36, height: 20, borderRadius: 10, background: exam.available ? '#6b7c3a' : '#e8dfc8', position: 'relative'}}>
                <div style={{position: 'absolute', top: 2, left: exam.available ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white'}}/>
              </div>
              <span style={{fontSize: 11, color: exam.available ? '#6b7c3a' : '#a89870'}}>{exam.available ? 'Live' : 'Hidden'}</span>
            </div>
            <div onClick={() => deleteExam(exam.id)} style={{fontSize: 11, color: '#c0574a', cursor: 'pointer', padding: '4px 8px'}}>Remove</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ScheduleManager({ supabase, onSuccess }: any) {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newSession, setNewSession] = useState({week_number: '1', day_of_week: 'Monday', session_date: '', start_time: '7:00 PM', end_time: '9:00 PM', topic: '', description: '', zoom_link: '', session_type: 'Live Session', instructor: '', syllabus: '', syllabus_link: ''})
  const [adding, setAdding] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('schedule').select('*').order('sort_order', {ascending: true})
    setSessions(data || [])
    setLoading(false)
  }

  const updateSession = async (id: string, updates: any) => {
    await supabase.from('schedule').update(updates).eq('id', id)
    await load()
    onSuccess('Session updated!')
  }

  const addSession = async () => {
    if (!newSession.topic) return
    setAdding(true)
    const maxOrder = Math.max(...sessions.map(s => s.sort_order || 0), 0)
    await supabase.from('schedule').insert({...newSession, week_number: parseInt(newSession.week_number), sort_order: maxOrder + 1, session_date: newSession.session_date || null})
    setNewSession({week_number: '1', day_of_week: 'Monday', session_date: '', start_time: '7:00 PM', end_time: '9:00 PM', topic: '', description: '', zoom_link: '', session_type: 'Live Session', instructor: '', syllabus: '', syllabus_link: ''})
    await load()
    setAdding(false)
    onSuccess('Session added!')
  }

  const deleteSession = async (id: string) => {
    await supabase.from('schedule').delete().eq('id', id)
    await load()
    onSuccess('Session removed!')
  }

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading...</div>

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
        <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 18}}>Add new session</div>
        <div style={{display: 'grid', gridTemplateColumns: '80px 120px 160px 1fr 1fr 1fr', gap: 10, marginBottom: 10}}>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Week</label>
            <select value={newSession.week_number} onChange={e => setNewSession({...newSession, week_number: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none'}}>
              {[1,2,3,4,5,6,7,8].map(w => <option key={w} value={w}>Week {w}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Day</label>
            <select value={newSession.day_of_week} onChange={e => setNewSession({...newSession, day_of_week: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none'}}>
              {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Date</label>
            <input type="date" value={newSession.session_date} onChange={e => setNewSession({...newSession, session_date: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Topic</label>
            <input type="text" value={newSession.topic} onChange={e => setNewSession({...newSession, topic: e.target.value})} placeholder="e.g. Cardiology HY Review"
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Instructor</label>
            <input type="text" value={newSession.instructor} onChange={e => setNewSession({...newSession, instructor: e.target.value})} placeholder="e.g. Dr. Rivera"
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Type</label>
            <select value={newSession.session_type} onChange={e => setNewSession({...newSession, session_type: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none'}}>
              {['Live Session','Mentor Meeting','Exam','Study Day','Rest Day'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '120px 120px 1fr 1fr 1fr', gap: 10, marginBottom: 10}}>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Start</label>
            <input type="text" value={newSession.start_time} onChange={e => setNewSession({...newSession, start_time: e.target.value})} placeholder="7:00 PM"
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>End</label>
            <input type="text" value={newSession.end_time} onChange={e => setNewSession({...newSession, end_time: e.target.value})} placeholder="9:00 PM"
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Zoom link</label>
            <input type="text" value={newSession.zoom_link} onChange={e => setNewSession({...newSession, zoom_link: e.target.value})} placeholder="https://zoom.us/j/..."
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Syllabus notes</label>
            <input type="text" value={newSession.syllabus} onChange={e => setNewSession({...newSession, syllabus: e.target.value})} placeholder="Topics, readings..."
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Syllabus link</label>
            <input type="text" value={newSession.syllabus_link || ''} onChange={e => setNewSession({...newSession, syllabus_link: e.target.value})} placeholder="https://docs.google.com/..."
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
        </div>
        <button onClick={addSession} disabled={adding || !newSession.topic}
          style={{width: '100%', height: 42, background: '#0d2340', border: 'none', borderRadius: 8, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer'}}>
          {adding ? 'Adding...' : 'Add session ↗'}
        </button>
      </div>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
        <div style={{background: '#0d2340', padding: '12px 20px'}}>
          <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>All sessions ({sessions.length})</div>
        </div>
        {sessions.map((session, i) => (
          <div key={session.id} style={{padding: '12px 20px', borderBottom: i < sessions.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
            <div style={{display: 'grid', gridTemplateColumns: '80px 140px 1fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'center'}}>
              <select defaultValue={session.week_number} onChange={e => updateSession(session.id, {week_number: parseInt(e.target.value)})}
                style={{height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 12, padding: '0 6px', color: '#c9a84c', background: '#f7f4ee', outline: 'none', width: 70}}>
                {[1,2,3,4,5,6,7,8].map(w => <option key={w} value={w}>Wk {w}</option>)}
              </select>
              <input type="date" defaultValue={session.session_date || ''}
                onBlur={e => { if (e.target.value !== (session.session_date || '')) updateSession(session.id, {session_date: e.target.value}) }}
                style={{height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 12, padding: '0 6px', color: '#8a7d6a', outline: 'none', width: 130, boxSizing: 'border-box'}}/>
              <input type="text" defaultValue={session.topic}
                onBlur={e => { if (e.target.value !== session.topic) updateSession(session.id, {topic: e.target.value}) }}
                style={{height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#0d2340', fontWeight: 500, outline: 'none', boxSizing: 'border-box'}}/>
              <input type="text" defaultValue={session.instructor || ''} placeholder="Instructor..."
                onBlur={e => { if (e.target.value !== (session.instructor || '')) updateSession(session.id, {instructor: e.target.value}) }}
                style={{height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 12, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
              <div style={{display: 'flex', gap: 6}}>
                <input type="text" defaultValue={session.zoom_link || ''} placeholder="Zoom link..." id={`zoom-${session.id}`}
                  style={{flex: 1, height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 12, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
                <button onClick={() => {
                  const input = document.getElementById(`zoom-${session.id}`) as HTMLInputElement
                  if (input) updateSession(session.id, {zoom_link: input.value})
                }} style={{height: 34, padding: '0 10px', background: '#0d2340', border: 'none', borderRadius: 6, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer'}}>Save</button>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                <input type="text" defaultValue={session.syllabus || ''} placeholder="Syllabus notes..."
                  onBlur={e => { if (e.target.value !== (session.syllabus || '')) updateSession(session.id, {syllabus: e.target.value}) }}
                  style={{height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 12, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
                <input type="text" defaultValue={session.syllabus_link || ''} placeholder="Syllabus link..."
                  onBlur={e => { if (e.target.value !== (session.syllabus_link || '')) updateSession(session.id, {syllabus_link: e.target.value}) }}
                  style={{height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 12, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
              </div>
              <div onClick={() => deleteSession(session.id)} style={{fontSize: 11, color: '#c0574a', cursor: 'pointer', padding: '4px 8px'}}>Remove</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AssignmentsManager({ supabase, students, onSuccess }: any) {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newAssignment, setNewAssignment] = useState({student_id: 'all', title: '', description: '', due_date: '', due_time: '11:59 PM', tag: 'Qbank'})
  const [adding, setAdding] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('assignments').select('*, profiles(full_name, email)').order('created_at', {ascending: false}).limit(50)
    setAssignments(data || [])
    setLoading(false)
  }

  const addAssignment = async () => {
    if (!newAssignment.title) return
    setAdding(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (newAssignment.student_id === 'all') {
      for (const student of students) {
        await supabase.from('assignments').insert({student_id: student.id, assigned_by: user.id, title: newAssignment.title, description: newAssignment.description, due_date: newAssignment.due_date || null, due_time: newAssignment.due_time, tag: newAssignment.tag})
        await supabase.from('notifications').insert({student_id: student.id, title: `New assignment: ${newAssignment.title}`, message: newAssignment.description || `Due ${newAssignment.due_date || 'soon'}`, type: 'assignment', link: '/dashboard/assignments'})
      }
    } else {
      await supabase.from('assignments').insert({student_id: newAssignment.student_id, assigned_by: user.id, title: newAssignment.title, description: newAssignment.description, due_date: newAssignment.due_date || null, due_time: newAssignment.due_time, tag: newAssignment.tag})
      await supabase.from('notifications').insert({student_id: newAssignment.student_id, title: `New assignment: ${newAssignment.title}`, message: newAssignment.description || `Due ${newAssignment.due_date || 'soon'}`, type: 'assignment', link: '/dashboard/assignments'})
    }
    setNewAssignment({student_id: 'all', title: '', description: '', due_date: '', due_time: '11:59 PM', tag: 'Qbank'})
    await load()
    setAdding(false)
    onSuccess('Assignment assigned!')
  }

  const deleteAssignment = async (id: string) => {
    await supabase.from('assignments').delete().eq('id', id)
    await load()
    onSuccess('Assignment removed!')
  }

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading...</div>

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
        <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 18}}>New assignment</div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 200px 140px', gap: 12, marginBottom: 12}}>
          <div>
            <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase'}}>Assign to</label>
            <select value={newAssignment.student_id} onChange={e => setNewAssignment({...newAssignment, student_id: e.target.value})}
              style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
              <option value="all">All students ({students.length})</option>
              {students.map((s: any) => <option key={s.id} value={s.id}>{s.full_name || s.email.split('@')[0]}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase'}}>Due date</label>
            <input type="date" value={newAssignment.due_date} onChange={e => setNewAssignment({...newAssignment, due_date: e.target.value})}
              style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase'}}>Tag</label>
            <select value={newAssignment.tag} onChange={e => setNewAssignment({...newAssignment, tag: e.target.value})}
              style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
              {['Qbank','NBME','Reading','Review','General'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{marginBottom: 12}}>
          <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase'}}>Title</label>
          <input type="text" value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} placeholder="e.g. Complete 40 UWorld Cardiology questions"
            style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
        </div>
        <div style={{marginBottom: 16}}>
          <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase'}}>Description</label>
          <textarea value={newAssignment.description} onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} placeholder="Additional instructions..." rows={2}
            style={{width: '100%', borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '10px 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box', resize: 'none'}}/>
        </div>
        <button onClick={addAssignment} disabled={adding || !newAssignment.title}
          style={{width: '100%', height: 46, background: '#0d2340', border: 'none', borderRadius: 9, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 600, cursor: 'pointer'}}>
          {adding ? 'Assigning...' : 'Assign & notify ↗'}
        </button>
      </div>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
        <div style={{background: '#0d2340', padding: '12px 20px'}}>
          <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>Recent assignments ({assignments.length})</div>
        </div>
        {assignments.length === 0 ? (
          <div style={{padding: '24px', fontSize: 14, color: '#8a7d6a', fontStyle: 'italic'}}>No assignments yet.</div>
        ) : assignments.map((a, i) => (
          <div key={a.id} style={{display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < assignments.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
            <div style={{flex: 1}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3}}>
                <div style={{fontSize: 14, fontWeight: 500, color: '#0d2340'}}>{a.title}</div>
                <span style={{fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#f7f4ee', color: '#8a7d6a'}}>{a.tag}</span>
                {a.completed && <span style={{fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#f0f7f2', color: '#2d6a4f'}}>Done ✓</span>}
              </div>
              <div style={{fontSize: 12, color: '#8a7d6a'}}>
                {a.profiles?.full_name || a.profiles?.email?.split('@')[0] || 'Student'}
                {a.due_date && ` · Due ${new Date(a.due_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}`}
              </div>
            </div>
            <div onClick={() => deleteAssignment(a.id)} style={{fontSize: 11, color: '#c0574a', cursor: 'pointer', padding: '4px 8px'}}>Remove</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function StudyScheduleManager({ supabase, students, onSuccess }: any) {
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [existingEntry, setExistingEntry] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [newTask, setNewTask] = useState({title: '', description: '', tag: 'Qbank', duration: '', resource_link: ''})

  const loadEntry = async (studentId: string, date: string) => {
    if (!studentId || !date) return
    const { data } = await supabase.from('study_schedule').select('*').eq('student_id', studentId).eq('schedule_date', date).single()
    if (data) { setExistingEntry(data); setTasks(data.tasks || []); setNotes(data.notes || '') }
    else { setExistingEntry(null); setTasks([]); setNotes('') }
  }

  useEffect(() => {
    if (selectedStudent && selectedDate) loadEntry(selectedStudent, selectedDate)
  }, [selectedStudent, selectedDate])

  const addTask = () => {
    if (!newTask.title) return
    setTasks([...tasks, {...newTask, completed: false}])
    setNewTask({title: '', description: '', tag: 'Qbank', duration: '', resource_link: ''})
  }

  const removeTask = (idx: number) => setTasks(tasks.filter((_, i) => i !== idx))

  const saveSchedule = async () => {
    if (!selectedStudent || !selectedDate) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (existingEntry) {
      await supabase.from('study_schedule').update({tasks, notes, updated_at: new Date().toISOString()}).eq('id', existingEntry.id)
    } else {
      await supabase.from('study_schedule').insert({student_id: selectedStudent, assigned_by: null, schedule_date: selectedDate, tasks, notes})
    }
    await supabase.from('notifications').insert({student_id: selectedStudent, title: 'Your study schedule has been updated', message: `Your study plan for ${new Date(selectedDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} is ready`, type: 'assignment', link: '/dashboard/studyschedule'})
    setSaving(false)
    onSuccess('Study schedule saved!')
    await loadEntry(selectedStudent, selectedDate)
  }

  const tagColors: Record<string, string> = {
    'Qbank': '#4a8c84', 'Reading': '#6b7c3a', 'Review': '#c9a84c',
    'NBME': '#c0574a', 'Anki': '#c07040', 'Sketchy': '#9e2a2a', 'Pathoma': '#4a8c84', 'General': '#8a7d6a',
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
        <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 16}}>Select student and date</div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14}}>
          <div>
            <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase'}}>Student</label>
            <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
              style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
              <option value="">Select student...</option>
              {students.map((s: any) => <option key={s.id} value={s.id}>{s.full_name || s.email.split('@')[0]}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize: 12, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 6, textTransform: 'uppercase'}}>Date</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
        </div>
      </div>
      {selectedStudent && (
        <div style={{display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
            <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '18px 22px'}}>
              <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 14}}>Add task</div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 120px 100px', gap: 10, marginBottom: 10}}>
                <div>
                  <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Task title</label>
                  <input type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="e.g. 40 UWorld Cardiology questions"
                    style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
                </div>
                <div>
                  <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Tag</label>
                  <select value={newTask.tag} onChange={e => setNewTask({...newTask, tag: e.target.value})}
                    style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none'}}>
                    {Object.keys(tagColors).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Duration</label>
                  <input type="text" value={newTask.duration} onChange={e => setNewTask({...newTask, duration: e.target.value})} placeholder="2 hrs"
                    style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
                </div>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12}}>
                <div>
                  <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Instructions</label>
                  <input type="text" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} placeholder="e.g. Focus on heart failure"
                    style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
                </div>
                <div>
                  <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Resource link</label>
                  <input type="text" value={newTask.resource_link} onChange={e => setNewTask({...newTask, resource_link: e.target.value})} placeholder="https://..."
                    style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
                </div>
              </div>
              <button onClick={addTask} disabled={!newTask.title}
                style={{width: '100%', height: 40, background: '#0d2340', border: 'none', borderRadius: 8, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer'}}>
                Add task ↗
              </button>
            </div>
            {tasks.length > 0 && (
              <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
                <div style={{background: '#0d2340', padding: '12px 20px'}}>
                  <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>{tasks.length} task{tasks.length !== 1 ? 's' : ''} for {new Date(selectedDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</div>
                </div>
                {tasks.map((task, idx) => (
                  <div key={idx} style={{display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 20px', borderBottom: idx < tasks.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
                    <div style={{flex: 1}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3}}>
                        <div style={{fontSize: 14, fontWeight: 500, color: '#0d2340'}}>{task.title}</div>
                        <span style={{fontSize: 11, padding: '2px 8px', borderRadius: 10, background: `${tagColors[task.tag] || '#8a7d6a'}18`, color: tagColors[task.tag] || '#8a7d6a'}}>{task.tag}</span>
                        {task.duration && <span style={{fontSize: 11, color: '#a89870'}}>{task.duration}</span>}
                      </div>
                      {task.description && <div style={{fontSize: 12, color: '#8a7d6a'}}>{task.description}</div>}
                    </div>
                    <div onClick={() => removeTask(idx)} style={{fontSize: 11, color: '#c0574a', cursor: 'pointer', padding: '4px 8px'}}>Remove</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
            <div style={{background: '#0d2340', borderRadius: 12, padding: '20px'}}>
              <div style={{fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#c9a84c', marginBottom: 14}}>Save schedule</div>
              {existingEntry && <div style={{fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12, background: 'rgba(201,168,76,0.1)', borderRadius: 6, padding: '8px 10px'}}>⚠️ Existing plan found — saving will update it</div>}
              <div style={{marginBottom: 14}}>
                <label style={{fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6}}>Day notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Focus on weak areas..." rows={3}
                  style={{width: '100%', borderRadius: 7, border: '0.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '8px 10px', color: 'white', outline: 'none', boxSizing: 'border-box', resize: 'none'}}/>
              </div>
              <button onClick={saveSchedule} disabled={saving || tasks.length === 0}
                style={{width: '100%', height: 44, background: saving || tasks.length === 0 ? '#4a5568' : '#c9a84c', border: 'none', borderRadius: 8, color: '#0d2340', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700, cursor: saving || tasks.length === 0 ? 'not-allowed' : 'pointer'}}>
                {saving ? 'Saving...' : 'Save & notify student ↗'}
              </button>
            </div>
            <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '16px 18px'}}>
              <div style={{fontSize: 13, fontWeight: 600, color: '#0d2340', marginBottom: 10}}>Quick templates</div>
              {[
                {title: '40 UWorld questions — Timed', tag: 'Qbank', duration: '1.5 hrs'},
                {title: 'Review Pathoma Chapter', tag: 'Reading', duration: '1 hr'},
                {title: 'Anki flashcard review', tag: 'Anki', duration: '45 min'},
                {title: 'Wrong answer review', tag: 'Review', duration: '1 hr'},
              ].map((t, i) => (
                <div key={i} onClick={() => setNewTask({...newTask, title: t.title, tag: t.tag, duration: t.duration})}
                  style={{padding: '8px 10px', background: '#f7f4ee', borderRadius: 7, cursor: 'pointer', marginBottom: 6}}>
                  <div style={{fontSize: 12, color: '#0d2340', fontWeight: 500}}>{t.title}</div>
                  <div style={{fontSize: 11, color: '#8a7d6a'}}>{t.tag} · {t.duration}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function CourseDocsManager({ supabase, onSuccess }: any) {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newDoc, setNewDoc] = useState({name: '', description: '', category: 'Program Documents', file_type: 'PDF', link: ''})
  const [adding, setAdding] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('course_documents').select('*').order('sort_order', {ascending: true})
    setDocs(data || [])
    setLoading(false)
  }

  const updateDoc = async (id: string, updates: any) => {
    await supabase.from('course_documents').update(updates).eq('id', id)
    await load()
    onSuccess('Document updated!')
  }

  const addDoc = async () => {
    if (!newDoc.name) return
    setAdding(true)
    const maxOrder = Math.max(...docs.map(d => d.sort_order || 0), 0)
    await supabase.from('course_documents').insert({...newDoc, sort_order: maxOrder + 1})
    setNewDoc({name: '', description: '', category: 'Program Documents', file_type: 'PDF', link: ''})
    await load()
    setAdding(false)
    onSuccess('Document added!')
  }

  const deleteDoc = async (id: string) => {
    await supabase.from('course_documents').delete().eq('id', id)
    await load()
    onSuccess('Document removed!')
  }

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading...</div>

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
        <div style={{fontSize: 16, fontWeight: 600, color: '#0d2340', marginBottom: 18}}>Add new document</div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 120px 100px', gap: 12, marginBottom: 12}}>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Name</label>
            <input type="text" value={newDoc.name} onChange={e => setNewDoc({...newDoc, name: e.target.value})} placeholder="e.g. Course Manual"
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Description</label>
            <input type="text" value={newDoc.description} onChange={e => setNewDoc({...newDoc, description: e.target.value})} placeholder="Brief description"
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Category</label>
            <select value={newDoc.category} onChange={e => setNewDoc({...newDoc, category: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none'}}>
              {['Program Documents','Surveys','Forms','General'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Type</label>
            <select value={newDoc.file_type} onChange={e => setNewDoc({...newDoc, file_type: e.target.value})}
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#1a1008', outline: 'none'}}>
              {['PDF','Form','Doc','Video','Link'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end'}}>
          <div>
            <label style={{fontSize: 11, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 5, textTransform: 'uppercase'}}>Link</label>
            <input type="text" value={newDoc.link} onChange={e => setNewDoc({...newDoc, link: e.target.value})} placeholder="https://..."
              style={{width: '100%', height: 40, borderRadius: 7, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 10px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
          </div>
          <button onClick={addDoc} disabled={adding || !newDoc.name}
            style={{height: 40, padding: '0 20px', background: '#0d2340', border: 'none', borderRadius: 8, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer'}}>
            {adding ? '...' : 'Add →'}
          </button>
        </div>
      </div>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
        <div style={{background: '#0d2340', padding: '12px 20px'}}>
          <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>All documents ({docs.length})</div>
        </div>
        {docs.map((doc, i) => (
          <div key={doc.id} style={{display: 'grid', gridTemplateColumns: '1fr 180px 100px 1fr auto', gap: 12, alignItems: 'center', padding: '12px 20px', borderBottom: i < docs.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
            <div>
              <input type="text" defaultValue={doc.name}
                onBlur={e => { if (e.target.value !== doc.name) updateDoc(doc.id, {name: e.target.value}) }}
                style={{height: 30, borderRadius: 5, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 13, padding: '0 8px', color: '#0d2340', fontWeight: 500, outline: 'none', boxSizing: 'border-box', width: '100%', marginBottom: 4}}/>
              <div style={{fontSize: 11, color: '#8a7d6a'}}>{doc.category} · {doc.file_type}</div>
            </div>
            <div style={{fontSize: 12, color: '#8a7d6a'}}>{doc.description?.substring(0, 30)}</div>
            <div style={{display: 'flex', gap: 6}}>
              <input type="text" defaultValue={doc.link || ''} placeholder="Paste link..." id={`doc-link-${doc.id}`}
                style={{flex: 1, height: 34, borderRadius: 6, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 12, padding: '0 8px', color: '#1a1008', outline: 'none', boxSizing: 'border-box'}}/>
              <button onClick={() => {
                const input = document.getElementById(`doc-link-${doc.id}`) as HTMLInputElement
                if (input) updateDoc(doc.id, {link: input.value})
              }} style={{height: 34, padding: '0 10px', background: '#0d2340', border: 'none', borderRadius: 6, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer'}}>Save</button>
            </div>
            <div onClick={() => deleteDoc(doc.id)} style={{fontSize: 11, color: '#c0574a', cursor: 'pointer', padding: '4px 8px'}}>Remove</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ExamReports({ supabase, students }: any) {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState('all')
  const [selectedSession, setSelectedSession] = useState<any>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase.from('exam_sessions').select('*, answer_sheets(*), profiles(full_name, email)').order('created_at', {ascending: false})
    setSessions(data || [])
    setLoading(false)
  }

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  const filtered = selectedStudent === 'all' ? sessions : sessions.filter(s => s.student_id === selectedStudent)

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading...</div>

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
      <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
        <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
          style={{height: 42, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none', background: 'white'}}>
          <option value="all">All students</option>
          {students.map((s: any) => <option key={s.id} value={s.id}>{s.full_name || s.email.split('@')[0]}</option>)}
        </select>
        <div style={{fontSize: 13, color: '#8a7d6a'}}>{filtered.length} exam session{filtered.length !== 1 ? 's' : ''}</div>
      </div>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
        <div style={{background: '#0d2340', padding: '12px 20px'}}>
          <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>Exam sessions</div>
        </div>
        {filtered.length === 0 ? (
          <div style={{padding: '24px', fontSize: 14, color: '#8a7d6a', fontStyle: 'italic'}}>No exam sessions yet.</div>
        ) : (
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr>
                {['Student', 'Exam', 'Started', 'Time spent', 'Answered', 'Within limit', 'Status', 'Sheet'].map(h => (
                  <th key={h} style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a89870', padding: '10px 14px', textAlign: 'left', borderBottom: '0.5px solid #f0ece0'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((session, i) => {
                const sheet = session.answer_sheets?.[0]
                const answered = sheet ? Object.keys(sheet.answers || {}).length : 0
                return (
                  <tr key={session.id} style={{borderBottom: i < filtered.length-1 ? '0.5px solid #f5f0e8' : 'none'}}>
                    <td style={{padding: '12px 14px', fontSize: 13, color: '#0d2340', fontWeight: 500}}>{session.profiles?.full_name || session.profiles?.email?.split('@')[0] || 'Student'}</td>
                    <td style={{padding: '12px 14px', fontSize: 13, color: '#0d2340'}}>{session.exam_name}</td>
                    <td style={{padding: '12px 14px', fontSize: 12, color: '#8a7d6a'}}>{new Date(session.started_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</td>
                    <td style={{padding: '12px 14px', fontSize: 13, color: '#3d3020'}}>{session.actual_minutes ? formatDuration(session.actual_minutes) : '—'}</td>
                    <td style={{padding: '12px 14px', fontSize: 13, color: '#3d3020'}}>{answered}Q</td>
                    <td style={{padding: '12px 14px'}}>
                      {session.within_limit === null ? <span style={{fontSize: 12, color: '#a89870'}}>—</span>
                        : session.within_limit ? <span style={{fontSize: 12, color: '#6b7c3a', fontWeight: 500}}>✅ Yes</span>
                        : <span style={{fontSize: 12, color: '#c0574a', fontWeight: 500}}>⚠️ Over</span>}
                    </td>
                    <td style={{padding: '12px 14px'}}>
                      <span style={{fontSize: 11, padding: '2px 8px', borderRadius: 8, background: session.status === 'submitted' ? '#f0f7f2' : '#fff8e8', color: session.status === 'submitted' ? '#2d6a4f' : '#c07040', fontWeight: 500}}>
                        {session.status === 'submitted' ? 'Submitted' : 'In progress'}
                      </span>
                    </td>
                    <td style={{padding: '12px 14px'}}>
                      {sheet && answered > 0 && (
                        <button onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                          style={{padding: '4px 10px', background: '#0d2340', border: 'none', borderRadius: 6, fontSize: 11, color: '#c9a84c', cursor: 'pointer', fontFamily: 'Sora, sans-serif'}}>
                          {selectedSession?.id === session.id ? 'Hide' : 'View'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      {selectedSession && (
        <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
          <div style={{background: '#0d2340', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div>
              <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>Answer Sheet — {selectedSession.profiles?.full_name || selectedSession.profiles?.email?.split('@')[0]} · {selectedSession.exam_name}</div>
              <div style={{fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2}}>{new Date(selectedSession.started_at).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}{selectedSession.actual_minutes && ` · ${formatDuration(selectedSession.actual_minutes)}`}</div>
            </div>
            <button onClick={() => setSelectedSession(null)}
              style={{padding: '6px 12px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, color: 'white', fontSize: 12, cursor: 'pointer', fontFamily: 'Sora, sans-serif'}}>Close</button>
          </div>
          <div style={{padding: '20px'}}>
            {(() => {
              const sheet = selectedSession.answer_sheets?.[0]
              const answers = sheet?.answers || {}
              const totalQ = selectedSession.time_limit_minutes ? Math.round(selectedSession.time_limit_minutes / 1.2) : 200
              return (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px 16px'}}>
                  {Array.from({length: totalQ}).map((_, idx) => {
                    const qNum = idx + 1
                    const ans = answers[qNum]
                    return (
                      <div key={qNum} style={{display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '0.5px solid #f5f0e8'}}>
                        <span style={{fontSize: 11, color: '#a89870', width: 24, textAlign: 'right', flexShrink: 0}}>{qNum}.</span>
                        <span style={{fontSize: 13, fontWeight: 700, color: ans ? '#0d2340' : '#e8dfc8', width: 20, textAlign: 'center'}}>{ans || '—'}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}

export function AttendanceLogger({ supabase, students, tutorId }: any) {
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState('')
  const [attendance, setAttendance] = useState<Record<string, {status: string, notes: string}>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadSessions() }, [])

  async function loadSessions() {
    const { data } = await supabase.from('schedule').select('*').not('session_date', 'is', null).order('session_date', {ascending: false}).limit(30)
    setSessions(data || [])
    setLoading(false)
  }

  async function loadAttendance(sessionId: string) {
    const blank: Record<string, {status: string, notes: string}> = {}
    students.forEach((s: {id: string}) => { blank[s.id] = {status: 'present', notes: ''} })
    const { data } = await supabase.from('attendance').select('*').eq('session_id', sessionId)
    ;(data || []).forEach((r: {student_id: string, status: string, notes: string}) => {
      blank[r.student_id] = {status: r.status, notes: r.notes || ''}
    })
    setAttendance(blank)
  }

  const selectSession = (id: string) => {
    setSelectedSession(id)
    setSaved(false)
    loadAttendance(id)
  }

  const mark = (studentId: string, status: string) =>
    setAttendance(prev => ({...prev, [studentId]: {...prev[studentId], status}}))

  const save = async () => {
    if (!selectedSession) return
    setSaving(true)
    for (const [student_id, d] of Object.entries(attendance)) {
      await supabase.from('attendance').upsert(
        {session_id: selectedSession, student_id, tutor_id: tutorId, status: d.status, notes: d.notes, log_date: new Date().toISOString().split('T')[0]},
        {onConflict: 'session_id,student_id'}
      )
    }
    setSaving(false)
    setSaved(true)
  }

  const statusStyle = (status: string, active: boolean) => {
    const styles: Record<string, {bg: string, color: string}> = {
      present:   {bg: '#f0f7f2', color: '#2d6a4f'},
      late:      {bg: '#fff8e8', color: '#c07040'},
      excused:   {bg: '#f0f4ff', color: '#3d5a99'},
      unexcused: {bg: '#fdf0f0', color: '#c0574a'},
    }
    const s = styles[status] || {bg: '#f7f4ee', color: '#8a7d6a'}
    return active ? {background: s.bg, color: s.color, border: 'none', fontWeight: 600}
                  : {background: 'white', color: '#a89870', border: '1px solid #e8dfc8', fontWeight: 400}
  }

  const session = sessions.find(s => s.id === selectedSession)

  if (loading) return <div style={{fontSize: 14, color: '#8a7d6a'}}>Loading...</div>

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
      <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '20px 24px'}}>
        <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 14}}>Select session to log</div>
        <select value={selectedSession} onChange={e => selectSession(e.target.value)}
          style={{width: '100%', height: 42, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 12px', color: '#1a1008', outline: 'none'}}>
          <option value="">Choose a session...</option>
          {sessions.map(s => (
            <option key={s.id} value={s.id}>
              {s.session_date ? new Date(s.session_date).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'}) : s.day_of_week} — {s.topic} (Wk {s.week_number})
            </option>
          ))}
        </select>
      </div>

      {selectedSession && students.length > 0 && (
        <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden'}}>
          <div style={{background: '#0d2340', padding: '14px 20px'}}>
            <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>{session?.topic} · {session?.session_date ? new Date(session.session_date + 'T12:00:00').toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : ''}</div>
            <div style={{fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2}}>Click a status button to mark each student</div>
          </div>
          <div style={{padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10}}>
            {(students as Array<{id: string, full_name?: string, email: string}>).map(s => {
              const rec = attendance[s.id] || {status: 'present', notes: ''}
              return (
                <div key={s.id} style={{display: 'flex', alignItems: 'center', gap: 12}}>
                  <div style={{width: 32, height: 32, borderRadius: '50%', background: '#c9a84c', color: '#0d2340', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                    {(s.full_name || s.email).charAt(0).toUpperCase()}
                  </div>
                  <div style={{fontSize: 14, color: '#0d2340', fontWeight: 500, width: 160, flexShrink: 0}}>{s.full_name || s.email.split('@')[0]}</div>
                  <div style={{display: 'flex', gap: 6}}>
                    {(['present','late','excused','unexcused'] as const).map(status => (
                      <button key={status} onClick={() => mark(s.id, status)}
                        style={{padding: '5px 12px', borderRadius: 8, fontFamily: 'Sora, sans-serif', fontSize: 12, cursor: 'pointer', textTransform: 'capitalize', ...statusStyle(status, rec.status === status)}}>
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{padding: '0 20px 20px'}}>
            <button onClick={save} disabled={saving}
              style={{width: '100%', height: 44, background: saved ? '#2d6a4f' : '#0d2340', border: 'none', borderRadius: 9, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer'}}>
              {saving ? 'Saving...' : saved ? '✓ Attendance saved' : 'Save attendance ↗'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Student Performance (Weakness Map for tutors/admin) ─────────────────────

const PERF_TOPICS = ['Cardiology','Psychiatry','Renal','Biochemistry','Pharmacology','Microbiology','Anatomy','Pathology','Physiology','Reproductive','Neurology','Endocrinology','Immunology','Mixed']
const PERF_REASONS = ['Knowledge','Knowledge Gap','Silly Mistake','Luck']

export function StudentPerformance({ supabase, students }: any) {
  const [selectedStudent, setSelectedStudent] = useState('')
  const [sessions, setSessions] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function loadData(studentId: string) {
    if (!studentId) return
    setLoading(true)
    const [{ data: sessionsData }, { data: nbmeData }] = await Promise.all([
      supabase.from('qbank_sessions').select('id, topic, questions_total, questions_correct').eq('student_id', studentId),
      supabase.from('nbme_scores').select('id').eq('student_id', studentId),
    ])
    setSessions(sessionsData || [])
    const sessionIds = (sessionsData || []).map((s: any) => s.id)
    const examIds = (nbmeData || []).map((s: any) => s.id)
    const [qRes, nRes] = await Promise.all([
      sessionIds.length > 0
        ? supabase.from('qbank_question_logs').select('topic, answer, reason').in('session_id', sessionIds)
        : Promise.resolve({ data: [] }),
      examIds.length > 0
        ? supabase.from('nbme_question_logs').select('topic, answer, reason').in('exam_id', examIds)
        : Promise.resolve({ data: [] }),
    ])
    setLogs([
      ...((qRes.data || []).map((l: any) => ({ ...l, source: 'qbank' }))),
      ...((nRes.data || []).map((l: any) => ({ ...l, source: 'nbme' }))),
    ])
    setLoading(false)
  }

  function handleSelect(id: string) {
    setSelectedStudent(id)
    setSessions([])
    setLogs([])
    loadData(id)
  }

  const getAccColor = (acc: number) => {
    if (acc >= 75) return '#6b7c3a'
    if (acc >= 65) return '#c9a84c'
    if (acc >= 55) return '#c07040'
    return '#9e2a2a'
  }

  const sessionStats = (topic: string) => {
    const ts = sessions.filter((s: any) => s.topic === topic)
    if (ts.length === 0) return null
    const total = ts.reduce((a: number, s: any) => a + s.questions_total, 0)
    const correct = ts.reduce((a: number, s: any) => a + s.questions_correct, 0)
    return { total, correct, acc: Math.round((correct / total) * 100), sessions: ts.length }
  }

  const logStats = (topic: string) => {
    const tl = logs.filter((l: any) => l.topic === topic)
    if (tl.length === 0) return null
    const wrong = tl.filter((l: any) => l.answer === 'Wrong').length
    const correct = tl.filter((l: any) => l.answer === 'Correct').length
    const total = tl.length
    const qbankCount = tl.filter((l: any) => l.source === 'qbank').length
    const nbmeCount = tl.filter((l: any) => l.source === 'nbme').length
    const reasons: Record<string, number> = {}
    tl.filter((l: any) => l.answer === 'Wrong' && l.reason).forEach((l: any) => {
      reasons[l.reason] = (reasons[l.reason] || 0) + 1
    })
    return { total, correct, wrong, acc: total > 0 ? Math.round((correct / total) * 100) : 0, qbankCount, nbmeCount, reasons }
  }

  const topicsWithSessions = PERF_TOPICS.filter(t => sessionStats(t) !== null)
  const topicsWithLogs = PERF_TOPICS.filter(t => logStats(t) !== null)
  const sortedBySessions = [...topicsWithSessions].sort((a, b) => (sessionStats(a)?.acc || 0) - (sessionStats(b)?.acc || 0))
  const sortedByLogs = [...topicsWithLogs].sort((a, b) => (logStats(b)?.wrong || 0) - (logStats(a)?.wrong || 0))
  const totalLogged = logs.length
  const totalWrong = logs.filter((l: any) => l.answer === 'Wrong').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <select value={selectedStudent} onChange={e => handleSelect(e.target.value)}
          style={{ height: 42, borderRadius: 8, border: '1px solid #e8dfc8', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '0 14px', color: '#1a1008', outline: 'none', minWidth: 240 }}>
          <option value="">Select a student...</option>
          {(students as any[]).map((s: any) => (
            <option key={s.id} value={s.id}>{s.full_name || s.email.split('@')[0]}</option>
          ))}
        </select>
        {loading && <div style={{ fontSize: 13, color: '#8a7d6a' }}>Loading...</div>}
      </div>

      {selectedStudent && !loading && sessions.length === 0 && logs.length === 0 && (
        <div style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '32px', textAlign: 'center', fontSize: 14, color: '#8a7d6a', fontStyle: 'italic' }}>
          No Qbank sessions or question logs recorded yet for this student.
        </div>
      )}

      {!loading && (topicsWithSessions.length > 0 || topicsWithLogs.length > 0) && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Qbank sessions', value: sessions.length.toString(), delta: `${sessions.reduce((a: number, s: any) => a + s.questions_total, 0)} total questions` },
              { label: 'Questions logged', value: totalLogged.toString(), delta: `${logs.filter((l:any)=>l.source==='qbank').length} Qbank · ${logs.filter((l:any)=>l.source==='nbme').length} NBME` },
              { label: 'Wrong answers logged', value: totalWrong.toString(), delta: totalLogged > 0 ? `${Math.round((totalWrong/totalLogged)*100)}% error rate` : 'No logs yet' },
            ].map((m, i) => (
              <div key={i} style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a89870', marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: '#0d2340' }}>{m.value}</div>
                <div style={{ fontSize: 12, color: '#a89870', marginTop: 3 }}>{m.delta}</div>
              </div>
            ))}
          </div>

          {topicsWithSessions.length > 0 && (
            <div style={{ background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, padding: '18px 22px' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 4 }}>Session accuracy by subject</div>
              <div style={{ fontSize: 12, color: '#8a7d6a', marginBottom: 14 }}>Based on Qbank session blocks</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {sortedBySessions.map(topic => {
                  const s = sessionStats(topic)!
                  return (
                    <div key={topic} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 110, fontSize: 13, color: '#3d3020', flexShrink: 0 }}>{topic}</div>
                      <div style={{ flex: 1, height: 7, background: '#f0ece0', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: getAccColor(s.acc), width: `${s.acc}%`, borderRadius: 4 }}/>
                      </div>
                      <div style={{ width: 36, fontSize: 13, fontWeight: 700, color: getAccColor(s.acc), textAlign: 'right', flexShrink: 0 }}>{s.acc}%</div>
                      <div style={{ fontSize: 11, color: '#a89870', width: 90, flexShrink: 0 }}>{s.total}Q · {s.sessions} sessions</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {topicsWithLogs.length > 0 && (
            <div style={{ background: '#0d2340', borderRadius: 12, padding: '18px 22px' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 4 }}>Question Log Analysis</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16 }}>Per-question data from Qbank + NBME logs · sorted by most wrong answers</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sortedByLogs.map(topic => {
                  const ls = logStats(topic)!
                  const maxWrong = Math.max(...sortedByLogs.map(t => logStats(t)?.wrong || 0))
                  return (
                    <div key={topic} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '13px 15px', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: Object.keys(ls.reasons).length > 0 ? 10 : 0 }}>
                        <div style={{ width: 110, flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{topic}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                            {ls.qbankCount > 0 && `${ls.qbankCount}Q`}{ls.qbankCount > 0 && ls.nbmeCount > 0 && ' · '}{ls.nbmeCount > 0 && `${ls.nbmeCount} NBME`}
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: 2, height: 7, borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                            <div style={{ background: '#4a7a2a', width: `${(ls.correct / ls.total) * 100}%` }}/>
                            <div style={{ background: '#9e2a2a', width: `${(ls.wrong / ls.total) * 100}%` }}/>
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{ls.correct} correct · {ls.wrong} wrong</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: getAccColor(ls.acc) }}>{ls.acc}%</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{ls.total} logged</div>
                        </div>
                        {maxWrong > 0 && ls.wrong > 0 && (
                          <div style={{ width: 70, flexShrink: 0 }}>
                            <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: '#c0574a', width: `${(ls.wrong / maxWrong) * 100}%` }}/>
                            </div>
                            <div style={{ fontSize: 10, color: '#f5a0a0', marginTop: 2 }}>{ls.wrong} wrong</div>
                          </div>
                        )}
                      </div>
                      {Object.keys(ls.reasons).length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 8, borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
                          {PERF_REASONS.filter(r => ls.reasons[r]).map(r => (
                            <span key={r} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '0.5px solid rgba(201,168,76,0.3)' }}>
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
        </>
      )}
    </div>
  )
}
