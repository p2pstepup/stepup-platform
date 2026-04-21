'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'

export default function ResourceDrive() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      setLoading(false)
    }
    init()
  }, [])

  const navGroups = [
    {section: 'Overview', items: [{name: 'Dashboard', path: '/dashboard'}]},
    {section: 'My Program', items: [
      {name: 'Daily Schedule', path: '/dashboard/schedule'},
      {name: 'Calendar', path: '/dashboard/calendar'},
      {name: 'Assignments', path: '/dashboard/assignments'},
      {name: 'Mentor Meetings', path: '/dashboard/mentor'},
    ]},
    {section: 'Study Tools', items: [
      {name: 'Exam Center', path: '/dashboard/exams'},
      {name: 'Qbank Tracker', path: '/dashboard/qbank'},
      {name: 'NBME Scores', path: '/dashboard/nbme'},
      {name: 'Weakness Map', path: '/dashboard/weakness'},
    ]},
    {section: 'Resources', items: [
      {name: 'HY Topic Notes', path: '/dashboard/notes'},
      {name: 'Session Recordings', path: '/dashboard/recordings'},
      {name: 'Session Slides', path: '/dashboard/slides'},
      {name: 'Resource Drive', path: '/dashboard/resources', active: true},
      {name: 'Live Feedback', path: '/dashboard/feedback'},
    ]},
  ]

  const resources = [
    {category: 'Study Strategy', color: '#c9a84c', items: [
      {name: 'StepUp Study Blueprint', type: 'PDF', desc: '8-week comprehensive study plan with daily targets'},
      {name: 'How to use UWorld effectively', type: 'PDF', desc: 'Timed vs tutor mode, review strategy, note-taking'},
      {name: 'NBME scoring guide', type: 'PDF', desc: 'How to interpret your scores and predict Step 1'},
      {name: 'Active recall techniques', type: 'PDF', desc: 'Spaced repetition, Anki tips, self-quizzing'},
    ]},
    {category: 'High Yield References', color: '#4a8c84', items: [
      {name: 'First Aid 2024 — key pages', type: 'PDF', desc: 'Most tested topics flagged by past Step 1 takers'},
      {name: 'Pathoma chapter summaries', type: 'PDF', desc: 'HY pathology concepts condensed'},
      {name: 'Sketchy mnemonics guide', type: 'PDF', desc: 'How to maximize Sketchy for micro and pharm'},
      {name: 'Rapid Review tables', type: 'PDF', desc: 'Classic presentations, buzzwords, must-know associations'},
    ]},
    {category: 'Wellness & Performance', color: '#6b7c3a', items: [
      {name: 'Managing test anxiety', type: 'PDF', desc: 'Evidence-based strategies for peak exam performance'},
      {name: 'Sleep and study optimization', type: 'PDF', desc: 'How to study smarter with better rest'},
      {name: 'Burnout prevention guide', type: 'PDF', desc: 'Recognizing and recovering from study burnout'},
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
              <div style={{fontSize: 13, color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{user?.email?.split('@')[0]}</div>
              <div style={{fontSize: 10, color: 'rgba(255,255,255,0.35)'}}>Windsor SOM</div>
            </div>
            <div onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              style={{fontSize: 11, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: '4px 8px', borderRadius: 4, border: '0.5px solid rgba(255,255,255,0.15)'}}>Sign out</div>
          </div>
        </div>
      </nav>

      {/* MAIN */}
      <div style={{flex: 1, minWidth: 0, overflowY: 'auto', padding: '32px 36px'}}>
        <div style={{marginBottom: 28}}>
          <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5}}>Resource Drive</div>
          <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Study guides · HY references · Strategy documents · Wellness resources</div>
        </div>

        <div style={{background: '#0d2340', borderRadius: 12, padding: '16px 22px', marginBottom: 24, borderLeft: '4px solid #c9a84c'}}>
          <div style={{fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6}}>
            All resources below will be linked to their actual files before May 4th. Click any resource to download or view it. New resources are added throughout the program.
          </div>
        </div>

        {resources.map((cat) => (
          <div key={cat.category} style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden', marginBottom: 16}}>
            <div style={{background: '#0d2340', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10}}>
              <div style={{width: 10, height: 10, borderRadius: '50%', background: cat.color}}/>
              <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>{cat.category}</div>
            </div>
            {cat.items.map((item, i) => (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: i < cat.items.length-1 ? '0.5px solid #f5f0e8' : 'none', cursor: 'pointer'}}
                onMouseEnter={e => (e.currentTarget.style.background = '#fafaf8')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                <div style={{width: 40, height: 40, background: `${cat.color}18`, border: `1px solid ${cat.color}40`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M10 2H4a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V6l-5-4z" stroke={cat.color} strokeWidth="1.2" strokeLinecap="round"/><path d="M10 2v4h4" stroke={cat.color} strokeWidth="1.2" strokeLinecap="round"/></svg>
                </div>
                <div style={{flex: 1}}>
                  <div style={{fontSize: 14, fontWeight: 500, color: '#0d2340', marginBottom: 3}}>{item.name}</div>
                  <div style={{fontSize: 12, color: '#8a7d6a'}}>{item.desc}</div>
                </div>
                <div style={{display: 'flex', gap: 8, flexShrink: 0}}>
                  <span style={{fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#f7f4ee', color: '#8a7d6a'}}>{item.type}</span>
                  <div style={{padding: '6px 14px', background: '#0d2340', borderRadius: 7, fontSize: 12, color: '#c9a84c', fontWeight: 500}}>Download</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  )
}