import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { secret, content } = await req.json().catch(() => ({}))
  if (secret !== 'upload-ak-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const filePath = 'dc665dbb-604b-4329-b76b-07c5d88572cb/answer_key_1779022102840.json'
  const blob = new Blob([JSON.stringify(content)], { type: 'application/json' })

  const { error } = await supabase.storage
    .from('exam-keys')
    .upload(filePath, blob, { upsert: true, contentType: 'application/json' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
