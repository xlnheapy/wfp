/**
 * dataset.ts
 * 14 个接口各自返回带 fm/wfp/时间区间 维度的全量行；本模块负责：
 *   1) 缓存各接口返回的行（由 api.ts 在首次加载时并行拉取并 setXxx 注入）
 *   2) 按页面选择的 FM / WFP / 时间区间 在内存里过滤
 *   3) 聚合成页面 index.tsx 所需的结构
 *
 * 切换 FM / WFP / 时间区间时不再次请求接口，全部走这里的内存过滤。
 */
import type { MetricRow, FmWfpRow, TrendRow, TimeFilterKey } from './mock-data'

type Params = { fm_id?: string; staff_id?: string; time_filter?: string }

// ---------- 各模块行缓存 ----------
let fmWfpRows: FmWfpRow[] = []
let metricRows: Record<string, Record<string, any>[]> = {} // 各指标/汇总模块共用结构（各接口仅含自身字段）
let rrTrendRows: TrendRow[] = []
let incomeTrendRows: TrendRow[] = []

export function setFmWfpRows(rows: FmWfpRow[]): void { fmWfpRows = rows }
export function setModuleRows(key: string, rows: Record<string, any>[]): void { metricRows[key] = rows }
export function setRrTrendRows(rows: TrendRow[]): void { rrTrendRows = rows }
export function setIncomeTrendRows(rows: TrendRow[]): void { incomeTrendRows = rows }

export function resetDataset(): void {
  fmWfpRows = []
  metricRows = {}
  rrTrendRows = []
  incomeTrendRows = []
}

// ---------- 过滤 ----------
function normTime(tf?: string): TimeFilterKey {
  return (tf as TimeFilterKey) || 'current_month'
}

/** 指标行：按 FM / WFP / 时间区间 三个枚举字段等值匹配 */
function filterRows(key: string, params: Params): Record<string, any>[] {
  const rows = metricRows[key] || []
  const tf = normTime(params.time_filter)
  return rows.filter((r) => {
    if (params.fm_id && params.fm_id !== 'ALL' && r.fm_id !== params.fm_id) return false
    if (params.staff_id && params.staff_id !== 'ALL' && r.staff_id !== params.staff_id) return false
    if (r.time_filter !== tf) return false
    return true
  })
}

/** 趋势行：只按 FM/WFP 过滤（趋势按月份展开，与时间区间枚举无关） */
function filterTrend(rows: TrendRow[], params: Params): TrendRow[] {
  return rows.filter((r) => {
    if (params.fm_id && params.fm_id !== 'ALL' && r.fm_id !== params.fm_id) return false
    if (params.staff_id && params.staff_id !== 'ALL' && r.staff_id !== params.staff_id) return false
    return true
  })
}

// ---------- 工具 ----------
function sum(rows: Record<string, any>[], key: string): number {
  return rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0)
}
function rateNum(num: number, den: number): number {
  return den ? Math.round((num / den) * 100) : 0
}
function pct(a: number, b: number): string {
  return b ? `${Math.round((a / b) * 100)}%` : '0%'
}

// ========== 1. FM/WFP 列表（按时间区间过滤）==========
export function getFmWfpList(params?: Params): { rows: FmWfpRow[] } {
  const tf = normTime(params?.time_filter)
  const rows = fmWfpRows.filter((r) => r.time_filter === tf)
  return { rows }
}

/** 将第一接口返回的行数组聚合成前端下拉所需的树形结构 */
export function buildFmWfpTree(rows: FmWfpRow[]): { id: string; name: string; wfps: { id: string; name: string }[] }[] {
  const map = new Map<string, { name: string; wfps: Map<string, string> }>()
  for (const r of rows) {
    if (!map.has(r.fm_id)) map.set(r.fm_id, { name: r.fmName, wfps: new Map() })
    map.get(r.fm_id)!.wfps.set(r.staff_id, r.wfpName)
  }
  return Array.from(map.entries()).map(([id, v]) => ({
    id, name: v.name,
    wfps: Array.from(v.wfps.entries()).map(([wid, wname]) => ({ id: wid, name: wname })),
  }))
}

// ========== 2. RR 指标 ==========
export function getRrMetrics(params: Params) {
  const rows = filterRows('rr', params)
  const total = sum(rows, 'rrTotal')
  const target = sum(rows, 'rrTarget')
  return {
    total, target,
    rate: target ? Math.round((total / target) * 1000) / 10 : 0,
    insuranceNew: sum(rows, 'rrFyc'),
    insuranceRenew: sum(rows, 'rrRenewal'),
    fund: sum(rows, 'rrFund'),
    people70: sum(rows, 'people70'),
  }
}

// ========== 3. 收入指标 ==========
export function getIncomeMetrics(params: Params) {
  const rows = filterRows('income', params)
  const fyc = sum(rows, 'incFyc')
  const renewal = sum(rows, 'incRenewal')
  const fundInc = sum(rows, 'incFund')
  const total = fyc + renewal + fundInc
  return {
    total, fyc, fycShare: pct(fyc, total),
    renewal, renewalShare: pct(renewal, total),
    fundInc, fundShare: pct(fundInc, total),
  }
}

// ========== 4. 续保率指标 ==========
export function getRetentionMetrics(params: Params) {
  const rows = filterRows('retention', params)
  const c13Renewed = sum(rows, 'ret13Renewed'), c13Total = sum(rows, 'ret13Total')
  const c25Renewed = sum(rows, 'ret25Renewed'), c25Total = sum(rows, 'ret25Total')
  return {
    anp13: rateNum(c13Renewed, c13Total),
    count13: sum(rows, 'ret13Count'),
    anp25: rateNum(c25Renewed, c25Total),
    count25: sum(rows, 'ret25Count'),
  }
}

// ========== 5. RR 指标趋势 ==========
export function getRrTrend(params: Params) {
  const rows = filterTrend(rrTrendRows, params)
  const months = MONTH_LABELS()
  const rrValues = months.map((_, i) => rows.reduce((acc, r) => acc + (r.months[i]?.rrTotal || 0), 0))
  const target = rows.reduce((acc, r) => acc + (r.months[r.months.length - 1]?.rrTarget || 0), 0) || 50000
  return { months: months.map((_, i) => MONTH_KEYS()[i]), rrValues, target }
}

// ========== 6. 收入指标趋势 ==========
export function getIncomeTrend(params: Params) {
  const rows = filterTrend(incomeTrendRows, params)
  const months = MONTH_LABELS()
  const incomeValues = months.map((_, i) => rows.reduce((acc, r) => acc + (r.months[i]?.incTotal || 0), 0))
  const target = rows.reduce((acc, r) => acc + (r.months[r.months.length - 1]?.incTarget || 0), 0) || 50000
  return { months: months.map((_, i) => MONTH_KEYS()[i]), incomeValues, target }
}

// 趋势月份（取首个趋势行的月份序列）
function MONTH_KEYS(): string[] {
  const r = rrTrendRows[0] || incomeTrendRows[0]
  return r ? r.months.map((m) => m.month) : []
}
function MONTH_LABELS(): string[] {
  const r = rrTrendRows[0] || incomeTrendRows[0]
  return r ? r.months.map((m) => m.monthLabel) : []
}

// ========== 7. 活动跟踪 ==========
export function getActivity(params: Params) {
  const rows = filterRows('activity', params)
  return {
    calls: sum(rows, 'calls'), callsLong: sum(rows, 'callsLong'),
    meetings: sum(rows, 'meetings'), newList: sum(rows, 'newList'),
    fundContacts: sum(rows, 'fundContacts'), fundMeetings: sum(rows, 'fundMeetings'),
    wechatAdd: sum(rows, 'wechatAdd'), wechatInt: sum(rows, 'wechatInt'),
    newClients: sum(rows, 'newClients'), newAUM: sum(rows, 'newAUM'),
    simplePolicies: sum(rows, 'simplePolicies'), complexPolicies: sum(rows, 'complexPolicies'),
  }
}

// ========== 8. 新客运营 ==========
export function getNewCustomer(params: Params) {
  const rows = filterRows('newCustomer', params)
  const events = sum(rows, 'newEvents')
  const self = sum(rows, 'newSelf')
  const contacted = sum(rows, 'newContacted')
  const meet = sum(rows, 'newMeet')
  const total = sum(rows, 'newTotal')
  return {
    events: { count: events, target: events * 2, rate: '100%', mtdContact: `${contacted}`, mtdMeet: `${meet}` },
    self: { count: self, target: total, rate: pct(self, events), mtdContact: `${contacted}`, mtdMeet: `${meet}` },
  }
}

// ========== 9. 老客运营汇总 ==========
export function getOldCustomerSummary(params: Params) {
  const rows = filterRows('oldSummary', params)
  const total = sum(rows, 'oldTotal')
  const callList = sum(rows, 'oldCallList')
  const contacted = sum(rows, 'oldContacted')
  const meet = sum(rows, 'oldMeet')
  return {
    total, callList,
    callListContactRate: pct(contacted, callList),
    callListMeetRate: pct(meet, callList),
  }
}

// ========== 10. 老客运营列表 ==========
export function getOldCustomerList(params: Params) {
  const rows = filterRows('oldList', params)
  const total = sum(rows, 'oldTotal')
  const callList = sum(rows, 'oldCallList')
  const contacted = sum(rows, 'oldContacted')
  const meet = sum(rows, 'oldMeet')
  return {
    table: [
      { type: '已见面', count: meet, target: total, mtdContact: `${contacted}`, mtdMeet: `${meet}`, callList, callListContact: pct(contacted, callList), callListMeet: pct(meet, callList) },
      { type: '已联系未见', count: Math.max(0, contacted - meet), target: total, mtdContact: `${contacted}`, mtdMeet: `${meet}`, callList, callListContact: pct(contacted, callList), callListMeet: pct(meet, callList) },
      { type: '未联系', count: Math.max(0, callList - contacted), target: total, mtdContact: `${contacted}`, mtdMeet: `${meet}`, callList, callListContact: pct(contacted, callList), callListMeet: pct(meet, callList) },
    ],
  }
}

// ========== 11. 保单跟踪汇总 ==========
export function getPolicySummary(params: Params) {
  const rows = filterRows('policySummary', params)
  return {
    active: { count: sum(rows, 'policyActive'), aum: sum(rows, 'policyActiveAum') },
    pendingRenew: { count: sum(rows, 'policyPending'), aum: sum(rows, 'policyPendingAum') },
    orphan: { count: sum(rows, 'policyOrphan'), aum: sum(rows, 'policyOrphanAum') },
  }
}

// ========== 12. 保单跟踪列表 ==========
export function getPolicyList(params: Params) {
  const rows = filterRows('policyList', params)
  const pending = sum(rows, 'policyPending')
  const pendingAum = sum(rows, 'policyPendingAum')
  const orphan = sum(rows, 'policyOrphan')
  const orphanAum = sum(rows, 'policyOrphanAum')
  const active = sum(rows, 'policyActive')
  const activeAum = sum(rows, 'policyActiveAum')
  return {
    table: [
      { type: '续期（60天内）', count: Math.floor(pending * 0.4), policyCount: Math.floor(pending * 0.4), aum: Math.floor(pendingAum * 0.4), priority: 'urgent', suggestion: '立即联系催缴' },
      { type: '孤儿保单待分配', count: orphan, policyCount: orphan, aum: orphanAum, priority: 'important', suggestion: '分配跟进人' },
      { type: '在保待回访', count: Math.floor(active * 0.1), policyCount: Math.floor(active * 0.1), aum: Math.floor(activeAum * 0.05), priority: 'normal', suggestion: '常规回访' },
    ],
  }
}

// ========== 13. 基金跟踪汇总 ==========
export function getFundSummary(params: Params) {
  const rows = filterRows('fundSummary', params)
  return {
    holding: { count: sum(rows, 'fundHolding'), aum: sum(rows, 'fundHoldingAum') },
    huikunbao: { count: sum(rows, 'fundHuikunbao'), aum: sum(rows, 'fundHuikunbaoAum') },
    fundNoIns: { count: sum(rows, 'fundNoIns'), aum: sum(rows, 'fundNoInsAum') },
  }
}

// ========== 14. 基金跟踪列表 ==========
export function getFundList(params: Params) {
  const rows = filterRows('fundList', params)
  const holding = sum(rows, 'fundHolding')
  const huikunAum = sum(rows, 'fundHuikunbaoAum')
  const noInsAum = sum(rows, 'fundNoInsAum')
  return {
    table: [
      { type: '赎回（在途）', count: Math.floor(holding * 0.05), orderCount: 3, orderAmount: Math.floor(huikunAum * 0.05), priority: 'urgent', suggestion: '确认到账' },
      { type: '赎回（已确认）', count: Math.floor(holding * 0.08), orderCount: 5, orderAmount: Math.floor(noInsAum * 0.1), priority: 'important', suggestion: '资金再配置建议' },
      { type: '申购（在途）', count: Math.floor(holding * 0.04), orderCount: 2, orderAmount: Math.floor(huikunAum * 0.03), priority: 'normal', suggestion: '确认份额' },
    ],
  }
}
