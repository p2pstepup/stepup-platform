'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async () => {
    if (!password) { setError('Please enter a new password.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(() => router.push('/'), 2500)
  }

  const inp = {
    width: '100%', height: 48, borderRadius: 9, border: '1px solid #e8dfc8',
    background: 'white', fontFamily: 'Sora, sans-serif', fontSize: 15,
    padding: '0 16px', color: '#1a1008', outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <main style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f4ee', fontFamily: 'Sora, sans-serif', padding: '40px 20px'}}>
      <div style={{width: '100%', maxWidth: 420}}>

        <div style={{textAlign: 'center', marginBottom: 32}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 6}}>
            <div style={{width: 40, height: 40, background: '#0d2340', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <div style={{width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '13px solid #c9a84c'}}/>
            </div>
            <div style={{fontFamily: 'Georgia, serif', fontSize: 24, color: '#0d2340', fontWeight: 600}}>StepUp</div>
          </div>
        </div>

        <div style={{background: 'white', borderRadius: 16, border: '0.5px solid #e8dfc8', padding: '32px 36px', boxShadow: '0 4px 24px rgba(13,35,64,0.07)'}}>
          {done ? (
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: 36, marginBottom: 14}}>✅</div>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 20, color: '#0d2340', marginBottom: 8}}>Password updated</div>
              <div style={{fontSize: 14, color: '#8a7d6a'}}>Redirecting you to sign in...</div>
            </div>
          ) : !ready ? (
            <div style={{textAlign: 'center'}}>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 20, color: '#0d2340', marginBottom: 8}}>Verifying reset link...</div>
              <div style={{fontSize: 14, color: '#8a7d6a'}}>If this page hangs, your link may have expired. <span onClick={() => router.push('/')} style={{color: '#c9a84c', cursor: 'pointer'}}>Request a new one.</span></div>
            </div>
          ) : (
            <div>
              <div style={{fontFamily: 'Georgia, serif', fontSize: 22, color: '#0d2340', marginBottom: 6}}>Set a new password</div>
              <div style={{fontSize: 14, color: '#8a7d6a', marginBottom: 24}}>Choose something secure — at least 6 characters.</div>

              <div style={{marginBottom: 16}}>
                <label style={{fontSize: 14, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 7}}>New password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••" style={inp}/>
              </div>

              <div style={{marginBottom: 20}}>
                <label style={{fontSize: 14, fontWeight: 500, color: '#5c4f35', display: 'block', marginBottom: 7}}>Confirm password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••••"
                  onKeyDown={e => e.key === 'Enter' && handleReset()}
                  style={inp}/>
              </div>

              {error && (
                <div style={{background: '#fdf2ed', border: '0.5px solid #e8c4a8', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: '#6b3010'}}>
                  {error}
                </div>
              )}

              <button onClick={handleReset} disabled={loading}
                style={{width: '100%', height: 50, background: '#0d2340', border: 'none', borderRadius: 10, color: '#c9a84c', fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer'}}>
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </div>
          )}
        </div>

        <div style={{textAlign: 'center', marginTop: 18}}>
          <span onClick={() => router.push('/')} style={{fontSize: 13, color: '#a89870', cursor: 'pointer'}}>← Back to sign in</span>
        </div>
      </div>
    </main>
  )
}
