import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)!
)

export async function GET() {
  const { data, error } = await serviceClient
    .from('attendance')
    .select('*, schedule(topic, session_date, week_number)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
