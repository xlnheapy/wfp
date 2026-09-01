import { NextRequest, NextResponse } from 'next/server'
import { getRrMetrics } from '@/services/mock-data'
import { parseQueryParams } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  const params = parseQueryParams(request)
  const data = getRrMetrics(params)
  return NextResponse.json({ success: true, data })
}
