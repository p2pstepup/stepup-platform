'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase'

const SURVEY_URL = 'https://forms.gle/RfG4rRwvqJrYyReu7'
const WHATSAPP_URL = 'https://chat.whatsapp.com/F7XhRjY0wV18uEms7mZrBi?mode=gi_t'

export default function Onboarding() {
  const [user, setUser] = useState<any>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [surveyDone, setSurveyDone] = useState(false)

  const [profileForm, setProfileForm] = useState({
    year_in_med_school: '',
    step1_attempts: '',
    in_rotations: false,
    target_exam_date: '',
    whatsapp_number: '',
    phone_number: '',
    school_email: '',
    preferred_email: '',
  })

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setUser(user)

      if (profile?.survey_completed && profile?.profile_completed && profile?.baseline_uploaded) {
        router.push('/dashboard')
        return
      }

      if (!profile?.survey_completed) {
        setStep(1)
      } else if (!profile?.profile_completed) {
        setStep(2)
        setProfileForm({
          year_in_med_school: profile.year_in_med_school || '',
          step1_attempts: profile.step1_attempts?.toString() || '',
          in_rotations: profile.in_rotations || false,
          target_exam_date: profile.target_exam_date || '',
          whatsapp_number: profile.whatsapp_number || '',
          phone_number: profile.phone_number || '',
          school_email: profile.school_email || '',
          preferred_email: profile.preferred_email || '',
        })
      } else {
        setStep(3)
      }
      setLoading(false)
    }
    init()
  }, [])

  const completeStep1 = async () => {
    if (!surveyDone) return
    setSaving(true)
    await supabase.from('profiles').update({ survey_completed: true }).eq('id', user.id)
    setSaving(false)
    setStep(2)
  }

  const completeStep2 = async () => {
    setSaving(true)
    await supabase.from('profiles').update({
      year_in_med_school: profileForm.year_in_med_school || null,
      step1_attempts: profileForm.step1_attempts ? parseInt(profileForm.step1_attempts) : null,
      in_rotations: profileForm.in_rotations,
      target_exam_date: profileForm.target_exam_date || null,
      whatsapp_number: profileForm.whatsapp_number || null,
      phone_number: profileForm.phone_number || null,
      school_email: profileForm.school_email || null,
      preferred_email: profileForm.preferred_email || null,
      profile_completed: true,
    }).eq('id', user.id)
    setSaving(false)
    setStep(3)
  }

  const completeStep3 = async () => {
    if (!file) return
    setUploading(true)
    setUploadError('')
    const ext = file.name.split('.').pop()
    const { error } = await supabase.storage
      .from('baseline-exams')
      .upload(`${user.id}/baseline.${ext}`, file, { upsert: true })
    if (error) {
      setUploadError('Upload failed — ' + error.message)
      setUploading(false)
      return
    }
    await supabase.from('profiles').update({ baseline_uploaded: true }).eq('id', user.id)
    setUploading(false)
    router.push('/dashboard')
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid #e0d8c4',
    borderRadius: 8, fontSize: 14, color: '#0d2340', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'Sora, sans-serif', background: 'white',
  }
  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: '#5a4e3a',
    textTransform: 'uppercase', letterSpacing: '0.07em',
    display: 'block', marginBottom: 6,
  }

  if (loading) return (
    <main style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee'}}>
      <div style={{fontFamily: 'Georgia, serif', fontSize: 26, color: '#0d2340'}}>StepUp</div>
    </main>
  )

  const stepLabels = ['Pre-Survey', 'Profile Setup', 'Baseline Exam']

  return (
    <main style={{minHeight: '100vh', background: '#f7f4ee', fontFamily: 'Sora, sans-serif', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 20px 64px'}}>
      <div style={{width: '100%', maxWidth: 560}}>

        {/* Logo */}
        <div style={{textAlign: 'center', marginBottom: 32}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 6}}>
            <div style={{width: 40, height: 40, background: '#0d2340', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <div style={{width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '13px solid #c9a84c'}}/>
            </div>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 26, color: '#0d2340', fontWeight: 600}}>StepUp</div>
          </div>
          <div style={{fontSize: 11, color: '#8a7d6a', letterSpacing: '0.09em', textTransform: 'uppercase'}}>P2P Mentoring Program</div>
        </div>

        {/* Step progress */}
        <div style={{display: 'flex', alignItems: 'center', marginBottom: 28, padding: '0 8px'}}>
          {[1, 2, 3].map((s, i) => (
            <React.Fragment key={s}>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: s < step ? '#c9a84c' : s === step ? '#0d2340' : 'white',
                  border: s < step ? 'none' : s === step ? 'none' : '1.5px solid #d8d0bc',
                  color: s < step ? '#0d2340' : s === step ? '#c9a84c' : '#b0a488',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: s < step ? 16 : 13, fontWeight: 700, flexShrink: 0,
                }}>
                  {s < step ? '✓' : s}
                </div>
                <div style={{fontSize: 11, color: s === step ? '#0d2340' : '#a89870', fontWeight: s === step ? 600 : 400, whiteSpace: 'nowrap'}}>
                  {stepLabels[i]}
                </div>
              </div>
              {s < 3 && (
                <div style={{flex: 1, height: 2, background: s < step ? '#c9a84c' : '#e0d8c4', margin: '0 8px', marginBottom: 22}}/>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div style={{background: 'white', borderRadius: 16, border: '0.5px solid #e8dfc8', padding: '32px 36px', boxShadow: '0 4px 24px rgba(13,35,64,0.07)'}}>

          {/* ── STEP 1: Pre-Survey ── */}
          {step === 1 && (
            <div>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 22, color: '#0d2340', marginBottom: 6}}>Welcome to StepUp</div>
              <div style={{fontSize: 14, color: '#6b5d47', lineHeight: 1.7, marginBottom: 22}}>
                Before accessing your dashboard, we need a few minutes of your time. Start by completing our pre-survey — it helps your mentor understand your current knowledge level and goals.
              </div>

              <a href={SURVEY_URL} target="_blank" rel="noopener noreferrer"
                style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#0d2340', color: '#c9a84c', borderRadius: 10, padding: '14px 20px', fontSize: 15, fontWeight: 600, textDecoration: 'none', marginBottom: 20}}>
                Open Pre-Survey
                <span style={{fontSize: 18}}>→</span>
              </a>

              <div style={{background: '#f7f4ee', borderRadius: 10, padding: '14px 18px', marginBottom: 20}}>
                <div style={{fontSize: 12, fontWeight: 600, color: '#5a4e3a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10}}>The survey covers</div>
                {[
                  'Your current Step 1 readiness and confidence',
                  'Which subjects feel strongest and weakest',
                  'Your study habits and schedule availability',
                  'Your exam goals and target timeline',
                ].map((item, i) => (
                  <div key={i} style={{display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#6b5d47', marginBottom: 7}}>
                    <div style={{width: 5, height: 5, borderRadius: '50%', background: '#c9a84c', marginTop: 6, flexShrink: 0}}/>
                    {item}
                  </div>
                ))}
              </div>

              <label style={{display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 22, padding: '14px 16px', border: surveyDone ? '1.5px solid #c9a84c' : '1.5px solid #e0d8c4', borderRadius: 10, background: surveyDone ? '#fffdf5' : 'white', transition: 'all 0.15s'}}>
                <input type="checkbox" checked={surveyDone} onChange={e => setSurveyDone(e.target.checked)}
                  style={{width: 18, height: 18, accentColor: '#c9a84c', cursor: 'pointer', flexShrink: 0}}/>
                <span style={{fontSize: 14, color: '#0d2340', fontWeight: 500}}>I've completed the pre-survey</span>
              </label>

              <button onClick={completeStep1} disabled={!surveyDone || saving}
                style={{width: '100%', background: surveyDone ? '#c9a84c' : '#ebe5d5', color: surveyDone ? '#0d2340' : '#a89870', border: 'none', borderRadius: 10, padding: '14px 20px', fontSize: 15, fontWeight: 700, cursor: surveyDone ? 'pointer' : 'not-allowed', letterSpacing: '0.01em'}}>
                {saving ? 'Saving...' : 'Continue to Profile Setup →'}
              </button>
            </div>
          )}

          {/* ── STEP 2: Profile ── */}
          {step === 2 && (
            <div>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 22, color: '#0d2340', marginBottom: 6}}>Complete Your Profile</div>
              <div style={{fontSize: 14, color: '#6b5d47', marginBottom: 24, lineHeight: 1.7}}>
                Help your mentor and program coordinators get to know you. All fields are optional except required ones.
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
                <div>
                  <label style={lbl}>Year in Medical School</label>
                  <select value={profileForm.year_in_med_school} onChange={e => setProfileForm({...profileForm, year_in_med_school: e.target.value})} style={inp}>
                    <option value="">Select year</option>
                    <option value="MS1">MS1</option>
                    <option value="MS2">MS2</option>
                    <option value="MS3">MS3</option>
                    <option value="MS4">MS4</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label style={lbl}>Prior Step 1 Attempts</label>
                  <input type="number" min="0" max="10" value={profileForm.step1_attempts}
                    onChange={e => setProfileForm({...profileForm, step1_attempts: e.target.value})}
                    placeholder="0" style={inp}/>
                </div>

                <div style={{gridColumn: '1 / -1'}}>
                  <label style={lbl}>Target Exam Date</label>
                  <input type="date" value={profileForm.target_exam_date}
                    onChange={e => setProfileForm({...profileForm, target_exam_date: e.target.value})}
                    style={inp}/>
                </div>

                <div style={{gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid #e0d8c4', borderRadius: 8, cursor: 'pointer', background: profileForm.in_rotations ? '#fffdf5' : 'white'}}
                  onClick={() => setProfileForm({...profileForm, in_rotations: !profileForm.in_rotations})}>
                  <div style={{width: 20, height: 20, borderRadius: 4, border: profileForm.in_rotations ? 'none' : '1.5px solid #c0b090', background: profileForm.in_rotations ? '#c9a84c' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                    {profileForm.in_rotations && <span style={{color: '#0d2340', fontSize: 12, fontWeight: 700, lineHeight: 1}}>✓</span>}
                  </div>
                  <div>
                    <div style={{fontSize: 14, color: '#0d2340', fontWeight: 500}}>Currently in clinical rotations</div>
                    <div style={{fontSize: 12, color: '#8a7d6a'}}>Check if you're actively in rotations right now</div>
                  </div>
                </div>

                <div>
                  <label style={lbl}>WhatsApp Number</label>
                  <input value={profileForm.whatsapp_number}
                    onChange={e => setProfileForm({...profileForm, whatsapp_number: e.target.value})}
                    placeholder="+1 (555) 000-0000" style={inp}/>
                </div>

                <div>
                  <label style={lbl}>Phone Number</label>
                  <input value={profileForm.phone_number}
                    onChange={e => setProfileForm({...profileForm, phone_number: e.target.value})}
                    placeholder="+1 (555) 000-0000" style={inp}/>
                </div>

                <div>
                  <label style={lbl}>School Email</label>
                  <input type="email" value={profileForm.school_email}
                    onChange={e => setProfileForm({...profileForm, school_email: e.target.value})}
                    placeholder="you@med.school.edu" style={inp}/>
                </div>

                <div>
                  <label style={lbl}>Preferred Email</label>
                  <input type="email" value={profileForm.preferred_email}
                    onChange={e => setProfileForm({...profileForm, preferred_email: e.target.value})}
                    placeholder="your@email.com" style={inp}/>
                </div>
              </div>

              <button onClick={completeStep2} disabled={saving}
                style={{width: '100%', background: '#c9a84c', color: '#0d2340', border: 'none', borderRadius: 10, padding: '14px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.01em', marginTop: 24}}>
                {saving ? 'Saving...' : 'Save Profile & Continue →'}
              </button>
            </div>
          )}

          {/* ── STEP 3: Baseline Upload ── */}
          {step === 3 && (
            <div>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 22, color: '#0d2340', marginBottom: 6}}>Upload Your Baseline Exam</div>
              <div style={{fontSize: 14, color: '#6b5d47', marginBottom: 24, lineHeight: 1.7}}>
                Upload your most recent practice exam results — NBME, UWorld self-assessment, or any baseline test. This gives your mentor a starting point to track your progress.
              </div>

              <div
                onClick={() => document.getElementById('baseline-file-input')?.click()}
                style={{border: `2px dashed ${file ? '#c9a84c' : '#d8d0bc'}`, borderRadius: 12, padding: '36px 20px', textAlign: 'center', marginBottom: 18, background: file ? '#fffdf5' : '#faf8f4', cursor: 'pointer', transition: 'all 0.15s'}}>
                <input type="file" id="baseline-file-input" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => { setFile(e.target.files?.[0] || null); setUploadError('') }}
                  style={{display: 'none'}}/>
                {file ? (
                  <div>
                    <div style={{fontSize: 36, marginBottom: 10}}>📄</div>
                    <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 4}}>{file.name}</div>
                    <div style={{fontSize: 12, color: '#8a7d6a'}}>{(file.size / 1024 / 1024).toFixed(2)} MB · Click to change file</div>
                  </div>
                ) : (
                  <div>
                    <div style={{fontSize: 36, marginBottom: 10}}>📤</div>
                    <div style={{fontSize: 15, fontWeight: 600, color: '#0d2340', marginBottom: 6}}>Click to select your baseline exam</div>
                    <div style={{fontSize: 13, color: '#8a7d6a'}}>PDF, JPG, or PNG · Max 10 MB</div>
                  </div>
                )}
              </div>

              {uploadError && (
                <div style={{fontSize: 13, color: '#c0574a', marginBottom: 16, padding: '10px 14px', background: '#fff5f5', borderRadius: 8, border: '0.5px solid #f0b0a8'}}>
                  {uploadError}
                </div>
              )}

              <button onClick={completeStep3} disabled={!file || uploading}
                style={{width: '100%', background: file ? '#c9a84c' : '#ebe5d5', color: file ? '#0d2340' : '#a89870', border: 'none', borderRadius: 10, padding: '14px 20px', fontSize: 15, fontWeight: 700, cursor: file ? 'pointer' : 'not-allowed', letterSpacing: '0.01em', marginBottom: 18}}>
                {uploading ? 'Uploading...' : 'Upload & Enter Dashboard →'}
              </button>

              <div style={{borderTop: '0.5px solid #ede8dc', paddingTop: 18, textAlign: 'center'}}>
                <div style={{fontSize: 13, color: '#6b5d47', marginBottom: 8}}>While you're here — join your cohort's WhatsApp group</div>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                  style={{display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25D366', color: 'white', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none'}}>
                  <span style={{fontSize: 17}}>💬</span>
                  Join Step 1 WhatsApp Group
                </a>
              </div>
            </div>
          )}
        </div>

        <div style={{textAlign: 'center', marginTop: 18, fontSize: 12, color: '#a89870'}}>
          Step {step} of 3 · {stepLabels[step - 1]}
        </div>
      </div>
    </main>
  )
}
