import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await sql`
      UPDATE tracks 
      SET play_count = play_count + 1
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update play count error:', error)
    return NextResponse.json({ error: 'Failed to update play count' }, { status: 500 })
  }
}
