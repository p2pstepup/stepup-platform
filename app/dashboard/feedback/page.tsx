'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'

export default function LiveFeedback() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)
      const { data } = await supabase
        .from('feedback')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
      setMessages(data || [])
      setLoading(false)
    }
    init()
  }, [])

  const sendMessage = async () => {
    if (!message.trim()) return
    setSending(true)
    await supabase.from('feedback').insert({
      student_id: user.id,
      message: message.trim()
    })
    setMessage('')
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
    setMessages(data || [])
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    setSending(false)
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
      {name: 'Exam Center', path: '/dashboard/exams'},
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
      {name: 'Live Feedback', path: '/dashboard/feedback', active: true},
    ]},
  ]

  if (loading) return (
    <main style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee'}}>
      <div style={{fontFamily: 'Georgia, serif', fontSize: 24, color: '#0d2340'}}>Loading...</div>
    </main>
  )

  return (
    <main style={{minHeight: '100vh', display: 'flex', background: '#f7f4ee', fontFamily: 'Sora, sans-serif', fontSize: '17.6px'}}>

      {/* SIDEBAR */}
      <nav style={{width: 220, flexShrink: 0, background: '#0d2340', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0}}>
        <div style={{padding: '20px 18px 16px', borderBottom: '0.5px solid rgba(201,168,76,0.2)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <div style={{width: 36, height: 36, background: '#c9a84c', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <div style={{width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '11px solid #0d2340'}}/>
            </div>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 20, color: 'white', fontWeight: 600}}>StepUp</div>
          </div>
          <div style={{fontSize: 10, color: '#c9a84c', letterSpacing: '0.09em', textTransform: 'uppercase', paddingLeft: 46, marginTop: 3}}>P2P Mentoring Program</div>
        </div>
        <div style={{padding: '12px 10px', flex: 1, overflowY: 'auto'}}>
          {navGroups.map((group) => (
            <div key={group.section}>
              <div style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.28)', padding: '0 8px', margin: '12px 0 4px'}}>{group.section}</div>
              {group.items.map((item: any) => (
                <div key={item.name} onClick={() => router.push(item.path)}
                  style={{display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, color: item.active ? '#c9a84c' : 'rgba(255,255,255,0.55)', fontSize: 13.5, marginBottom: 2, background: item.active ? 'rgba(255,255,255,0.09)' : 'transparent', cursor: 'pointer'}}>
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
              <div style={{fontSize: 13, color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{profile?.full_name || user?.email?.split('@')[0]}</div>
              <div style={{fontSize: 10, color: 'rgba(255,255,255,0.35)'}}>Windsor SOM</div>
            </div>
            <div onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              style={{fontSize: 11, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, border: '0.5px solid rgba(255,255,255,0.15)'}}>Sign out</div>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <div style={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh'}}>

        {/* Header */}
        <div style={{padding: '28px 36px 20px', borderBottom: '0.5px solid #e8dfc8', background: 'white'}}>
          <div style={{fontFamily: 'Georgia, serif', fontSize: 28, color: '#0d2340', letterSpacing: -0.5}}>Live Feedback</div>
          <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 4}}>Send questions or feedback to your tutor · Responses appear here</div>
        </div>

        {/* Messages */}
        <div style={{flex: 1, overflowY: 'auto', padding: '24px 36px', display: 'flex', flexDirection: 'column', gap: 14}}>

          {messages.length === 0 && (
            <div style={{textAlign: 'center', padding: '60px 0'}}>
              <div style={{width: 64, height: 64, background: '#f7f4ee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'}}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M4 4h20v16H16l-4 4V20H4V4z" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div style={{fontSize: 16, fontWeight: 500, color: '#0d2340', marginBottom: 8}}>No messages yet</div>
              <div style={{fontSize: 14, color: '#8a7d6a', maxWidth: 360, margin: '0 auto', lineHeight: 1.6}}>
                Use this space to ask your tutor questions, share how you're feeling about the material, or flag anything you're struggling with. Your tutor responds directly here.
              </div>
            </div>
          )}

          {[...messages].reverse().map((msg) => (
            <div key={msg.id}>
              {/* Student message */}
              <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: msg.response ? 10 : 0}}>
                <div style={{maxWidth: '70%'}}>
                  <div style={{background: '#0d2340', borderRadius: '12px 12px 2px 12px', padding: '12px 16px'}}>
                    <div style={{fontSize: 14, color: 'white', lineHeight: 1.6}}>{msg.message}</div>
                  </div>
                  <div style={{fontSize: 11, color: '#a89870', marginTop: 4, textAlign: 'right'}}>
                    {new Date(msg.created_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                  </div>
                </div>
                <div style={{width: 32, height: 32, borderRadius: '50%', background: '#c9a84c', color: '#0d2340', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 10, alignSelf: 'flex-end'}}>
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Tutor response */}
              {msg.response && (
                <div style={{display: 'flex', justifyContent: 'flex-start', marginTop: 8}}>
                  <div style={{width: 32, height: 32, borderRadius: '50%', background: '#162032', border: '2px solid #c9a84c', color: '#c9a84c', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 10, alignSelf: 'flex-end'}}>T</div>
                  <div style={{maxWidth: '70%'}}>
                    <div style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: '12px 12px 12px 2px', padding: '12px 16px'}}>
                      <div style={{fontSize: 13, color: '#c9a84c', fontWeight: 500, marginBottom: 4}}>Dr. Rivera</div>
                      <div style={{fontSize: 14, color: '#3d3020', lineHeight: 1.6}}>{msg.response}</div>
                    </div>
                    <div style={{fontSize: 11, color: '#a89870', marginTop: 4}}>
                      {msg.responded_at && new Date(msg.responded_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                    </div>
                  </div>
                </div>
              )}

              {/* Awaiting response */}
              {!msg.response && (
                <div style={{display: 'flex', alignItems: 'center', gap: 8, marginTop: 6}}>
                  <div style={{width: 6, height: 6, borderRadius: '50%', background: '#c9a84c', animation: 'pulse 2s infinite'}}/>
                  <div style={{fontSize: 12, color: '#a89870', fontStyle: 'italic'}}>Awaiting response from your tutor...</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input area */}
        <div style={{padding: '16px 36px 24px', background: 'white', borderTop: '0.5px solid #e8dfc8'}}>
          {success && (
            <div style={{background: '#f0f7f2', border: '0.5px solid #6b7c3a', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#2d6a4f'}}>
              ✓ Message sent! Your tutor will respond soon.
            </div>
          )}
          <div style={{display: 'flex', gap: 12, alignItems: 'flex-end'}}>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Ask your tutor a question, share how you're feeling, or flag something you're struggling with... (Press Enter to send)"
              rows={3}
              style={{flex: 1, borderRadius: 10, border: '1px solid #e8dfc8', background: '#f7f4ee', fontFamily: 'Sora, sans-serif', fontSize: 14, padding: '12px 14px', color: '#1a1008', outline: 'none', resize: 'none', lineHeight: 1.6}}
            />
            <button onClick={sendMessage} disabled={sending || !message.trim()}
              style={{height: 50, padding: '0 20px', background: sending || !message.trim() ? '#e8dfc8' : '#0d2340', border: 'none', borderRadius: 10, color: sending || !message.trim() ? '#a89870' : '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 600, cursor: sending || !message.trim() ? 'not-allowed' : 'pointer', flexShrink: 0, alignSelf: 'flex-end'}}>
              {sending ? 'Sending...' : 'Send →'}
            </button>
          </div>
          <div style={{fontSize: 11, color: '#a89870', marginTop: 8}}>Press Enter to send · Shift+Enter for new line · Your tutor responds directly in this thread</div>
        </div>
      </div>
    </main>
  )
}