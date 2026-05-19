import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import answerKeyData from '../../../../data/AMBOSS_200_Answer_Key.json'

export async function POST() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'tutor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Find the exam record
  const { data: exams, error: examErr } = await supabase
    .from('exams')
    .select('id, name, answer_key_url')
    .or('name.ilike.%200Q%,name.ilike.%200q%,name.ilike.%stepup 200%')

  if (examErr) return NextResponse.json({ error: examErr.message }, { status: 500 })
  if (!exams || exams.length === 0) {
    return NextResponse.json({ error: 'No 200Q exam found in database' }, { status: 404 })
  }

  const results: Array<{ examName: string; status: string; path?: string; error?: string }> = []

  for (const exam of exams) {
    if (!exam.answer_key_url) {
      results.push({ examName: exam.name, status: 'skipped', error: 'No answer_key_url on record' })
      continue
    }

    const jsonBytes = new TextEncoder().encode(JSON.stringify(answerKeyData))

    const { error: uploadErr } = await supabase.storage
      .from('exam-keys')
      .upload(exam.answer_key_url, jsonBytes, {
        contentType: 'application/json',
        upsert: true,
      })

    if (uploadErr) {
      results.push({ examName: exam.name, status: 'failed', path: exam.answer_key_url, error: uploadErr.message })
    } else {
      results.push({ examName: exam.name, status: 'updated', path: exam.answer_key_url })
    }
  }

  return NextResponse.json({ results })
}
