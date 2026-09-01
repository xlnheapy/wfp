// API 服务层 - 根据环境自动切换数据源
// 开发环境：使用 Mock 数据（通过 Umi mock）
// 生产环境：对接 Qlik Sense

// 判断是否为开发环境
const isDevelopment = process.env.NODE_ENV === 'development';

// 非开发环境使用 Qlik 服务
let qlikService: any = null;
if (!isDevelopment) {
  import('./qlik-service').then(module => {
    qlikService = module;
  });
}

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
  // 生产环境使用 Qlik 服务
  if (isProduction && qlikService) {
    const methodName = endpoint.replace('/', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    const capitalized = methodName.charAt(0).toUpperCase() + methodName.slice(1);
    const method = qlikService[`fetch${capitalized}`];
    if (method) {
      return method(params);
    }
  }

  // 开发环境使用 Mock 数据
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
