import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const cookieStore = await cookies()

  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { studentId, examName, score, percentCorrect, examDate } = await req.json()
  if (!studentId || !examName || !score || !examDate) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Avoid duplicates — check if an entry already exists for this student/exam/date
  const { data: existing } = await admin
    .from('nbme_scores')
    .select('id')
    .eq('student_id', studentId)
    .eq('exam_name', examName)
    .eq('exam_date', examDate)
    .single()

  if (existing) {
    await admin.from('nbme_scores').update({ score, percent_correct: percentCorrect }).eq('id', existing.id)
  } else {
    await admin.from('nbme_scores').insert({ student_id: studentId, exam_name: examName, score, percent_correct: percentCorrect, exam_date: examDate })
  }

  return NextResponse.json({ ok: true })
}
