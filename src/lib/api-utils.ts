import { NextRequest } from 'next/server'
import { QueryParams } from '@/services/mock-data'

export function parseQueryParams(request: NextRequest): QueryParams {
  const { searchParams } = new URL(request.url)
  return {
    fm_id: searchParams.get('fm_id') || undefined,
    wfp_id: searchParams.get('wfp_id') || undefined,
    time_filter: searchParams.get('time_filter') || 'current_month'
  }
}
