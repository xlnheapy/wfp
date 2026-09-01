import { NextRequest, NextResponse } from 'next/server'
import { getFmWfpList } from '@/services/mock-data'

export async function GET() {
  const data = getFmWfpList()
  return NextResponse.json({ success: true, data })
}
