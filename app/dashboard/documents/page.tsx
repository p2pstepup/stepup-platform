'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase'

export default function CourseDocuments() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)
      const { data } = await supabase.from('course_documents').select('*').order('sort_order', {ascending: true})
      setDocuments(data || [])
      setLoading(false)
    }
    init()
  }, [])

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
      {name: 'Course Documents', path: '/dashboard/documents', active: true},
      {name: 'Live Feedback', path: '/dashboard/feedback'},
    ]},
  ]

  const categories = [...new Set(documents.map(d => d.category))]
  const categoryColors: Record<string, string> = {
    'Surveys': '#c0574a', 'Program Documents': '#c9a84c', 'Forms': '#4a8c84', 'General': '#6b7c3a',
  }
  const fileIcons: Record<string, string> = {
    'PDF': '📄', 'Form': '📝', 'Doc': '📃', 'Video': '🎬', 'Link': '🔗',
  }

  if (loading) return (
    <main style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee'}}>
      <div style={{fontFamily: 'Georgia, serif', fontSize: 24, color: '#0d2340'}}>Loading...</div>
    </main>
  )

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

      <div style={{flex: 1, minWidth: 0, overflowY: 'auto', padding: '32px 36px'}}>
        <div style={{marginBottom: 28}}>
          <div style={{fontFamily: 'Georgia, serif', fontSize: 30, color: '#0d2340', letterSpacing: -0.5}}>Course Documents</div>
          <div style={{fontSize: 14, color: '#8a7d6a', marginTop: 5}}>Program manual · Surveys · Forms · Important documents</div>
        </div>

        <div style={{background: '#0d2340', borderRadius: 12, padding: '16px 22px', marginBottom: 24, borderLeft: '4px solid #c9a84c'}}>
          <div style={{fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6}}>
            All important program documents are here. Please complete the pre-program survey before your first session on May 4th.
          </div>
        </div>

        {categories.map(cat => {
          const color = categoryColors[cat] || '#c9a84c'
          const catDocs = documents.filter(d => d.category === cat)
          return (
            <div key={cat} style={{background: 'white', border: '0.5px solid #e8dfc8', borderRadius: 12, overflow: 'hidden', marginBottom: 16}}>
              <div style={{background: '#0d2340', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10}}>
                <div style={{width: 10, height: 10, borderRadius: '50%', background: color}}/>
                <div style={{fontSize: 14, fontWeight: 600, color: 'white'}}>{cat}</div>
              </div>
              {catDocs.map((doc, i) => (
                <div key={doc.id}
                  onClick={() => doc.link && window.open(doc.link, '_blank')}
                  style={{display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: i < catDocs.length-1 ? '0.5px solid #f5f0e8' : 'none', cursor: doc.link ? 'pointer' : 'default'}}
                  onMouseEnter={e => doc.link && (e.currentTarget.style.background = '#fafaf8')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                  <div style={{width: 44, height: 44, background: `${color}15`, border: `1px solid ${color}35`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20}}>
                    {fileIcons[doc.file_type] || '📄'}
                  </div>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: 15, fontWeight: 500, color: '#0d2340', marginBottom: 4}}>{doc.name}</div>
                    {doc.description && <div style={{fontSize: 13, color: '#8a7d6a'}}>{doc.description}</div>}
                  </div>
                  <div style={{display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center'}}>
                    <span style={{fontSize: 11, padding: '3px 10px', borderRadius: 6, background: '#f7f4ee', color: '#8a7d6a'}}>{doc.file_type}</span>
                    {doc.link ? (
                      <div style={{padding: '8px 16px', background: '#0d2340', borderRadius: 8, fontSize: 13, color: '#c9a84c', fontWeight: 500}}>Open ↗</div>
                    ) : (
                      <div style={{padding: '8px 16px', background: '#f7f4ee', borderRadius: 8, fontSize: 13, color: '#a89870', fontStyle: 'italic'}}>Coming soon</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </main>
  )
}