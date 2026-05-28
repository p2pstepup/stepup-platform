import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { student_id, mentor_id, meeting_date, duration_minutes, notes, action_items, next_meeting } = body

  if (!student_id || !mentor_id || !meeting_date) {
    return NextResponse.json({ error: 'student_id, mentor_id, and meeting_date required' }, { status: 400 })
  }

  const { error } = await serviceClient.from('mentor_meetings').insert({
    student_id, mentor_id, meeting_date,
    duration_minutes: parseInt(duration_minutes) || 30,
    notes, action_items,
    next_meeting: next_meeting || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the student
  await serviceClient.from('notifications').insert({
    student_id,
    title: 'Mentor meeting notes posted',
    message: action_items ? `Action items: ${action_items.substring(0, 80)}` : 'Your mentor has logged notes from your recent 1-on-1.',
    type: 'meeting',
    link: '/dashboard/mentor',
  })

  return NextResponse.json({ success: true })
}
