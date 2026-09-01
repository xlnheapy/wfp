// API 服务层 - 调用后端接口

const BASE_URL = '/api'

interface QueryParams {
  fm_id?: string
  wfp_id?: string
  time_filter?: string
}

function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams()
  if (params.fm_id) searchParams.set('fm_id', params.fm_id)
  if (params.wfp_id) searchParams.set('wfp_id', params.wfp_id)
  if (params.time_filter) searchParams.set('time_filter', params.time_filter)
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ''
}

async function fetchApi<T>(endpoint: string, params: QueryParams = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}${buildQueryString(params)}`
  const res = await fetch(url)
  const json = await res.json()
  if (!json.success) {
    throw new Error(json.error || 'API request failed')
  }
  return json.data
}

// 1. FF和WFP列表
export function fetchFmWfpList() {
  return fetchApi<{
    fms: Array<{
      id: string
      name: string
      wfps: Array<{ id: string; name: string }>
    }>
  }>('/fm-wfp-list')
}

// 2. RR指标
export function fetchRrMetrics(params: QueryParams) {
  return fetchApi<{
    total: number
    target: number
    rate: number
    insuranceNew: number
    insuranceRenew: number
    fund: number
    people70: number
  }>('/rr-metrics', params)
}

// 3. 收入指标
export function fetchIncomeMetrics(params: QueryParams) {
  return fetchApi<{
    total: number
    fyc: number
    fycShare: string
    renewal: number
    renewalShare: string
    fundInc: number
    fundShare: string
  }>('/income-metrics', params)
}

// 4. 续保率指标
export function fetchRetentionMetrics(params: QueryParams) {
  return fetchApi<{
    anp13: number
    count13: number
    anp25: number
    count25: number
  }>('/retention-metrics', params)
}

// 5. RR指标趋势
export function fetchRrTrend(params: QueryParams) {
  return fetchApi<{
    months: string[]
    rrValues: number[]
    target: number
  }>('/rr-trend', params)
}

// 6. 收入指标趋势
export function fetchIncomeTrend(params: QueryParams) {
  return fetchApi<{
    months: string[]
    incomeValues: number[]
    target: number
  }>('/income-trend', params)
}

// 7. 活动跟踪
export function fetchActivity(params: QueryParams) {
  return fetchApi<{
    calls: number
    callsLong: number
    meetings: number
    newList: number
    fundContacts: number
    fundMeetings: number
    wechatAdd: number
    wechatInt: number
    newClients: number
    newAUM: number
    simplePolicies: number
    complexPolicies: number
  }>('/activity', params)
}

// 8. 新客运营
export function fetchNewCustomer(params: QueryParams) {
  return fetchApi<{
    events: { count: number; target: number; rate: string; mtdContact: string; mtdMeet: string }
    self: { count: number; target: number; rate: string; mtdContact: string; mtdMeet: string }
  }>('/new-customer', params)
}

// 9. 老客运营汇总
export function fetchOldCustomerSummary(params: QueryParams) {
  return fetchApi<{
    total: number
    callList: number
    callListContactRate: string
    callListMeetRate: string
  }>('/old-customer-summary', params)
}

// 10. 老客运营列表
export function fetchOldCustomerList(params: QueryParams) {
  return fetchApi<{
    table: Array<{
      type: string
      count: number
      target: number
      mtdContact: string
      mtdMeet: string
      callList: number
      callListContact: string
      callListMeet: string
    }>
  }>('/old-customer-list', params)
}

// 11. 保单跟踪汇总
export function fetchPolicySummary(params: QueryParams) {
  return fetchApi<{
    active: { count: number; aum: number }
    pendingRenew: { count: number; aum: number }
    orphan: { count: number; aum: number }
  }>('/policy-summary', params)
}

// 12. 保单跟踪列表
export function fetchPolicyList(params: QueryParams) {
  return fetchApi<{
    table: Array<{
      type: string
      count: number
      policyCount: number
      aum: number
      priority: string
      suggestion: string
    }>
  }>('/policy-list', params)
}

// 13. 基金跟踪汇总
export function fetchFundSummary(params: QueryParams) {
  return fetchApi<{
    holding: { count: number; aum: number }
    huikunbao: { count: number; aum: number }
    fundNoIns: { count: number; aum: number }
  }>('/fund-summary', params)
}

// 14. 基金跟踪列表
export function fetchFundList(params: QueryParams) {
  return fetchApi<{
    table: Array<{
      type: string
      count: number
      orderCount: number
      orderAmount: number
      priority: string
      suggestion: string
    }>
  }>('/fund-list', params)
}
