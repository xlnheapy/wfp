/**
 * dataset.ts
 * 全量数据缓存 + 前端过滤聚合层
 *
 * 工作机制：
 *   页面首次打开调用 initDataset() 一次性拉取全量数据（含所有 FM/WFP/月份），
 *   之后切换 FM / WFP / 时间区间，所有模块都在内存里过滤聚合，不再请求接口。
 *
 * 输出结构与页面 index.tsx 中各 interface 完全对齐（即原 mock 数据结构）。
 */
import type { MetricRow } from './mock-data'

// 全量数据集结构（mock-data.getAllData 与 qlik-service.getAllData 同构）
export interface AllDataset {
  fms: { id: string; name: string; wfps: { id: string; name: string }[] }[]
  metrics: MetricRow[]
  months: string[]
  quarters: string[]
}

type DataSource = {
  getAllData: () => Promise<AllDataset> | AllDataset
}

// 数据源由 api.ts 按环境注入（生产=Qlik，开发/测试=Mock）
let dataSource: DataSource | null = null
let cached: AllDataset | null = null
let loadingPromise: Promise<AllDataset> | null = null

/** 由 api.ts 调用：注入当前环境的数据源 */
export function setDataSource(ds: DataSource): void {
  dataSource = ds
  cached = null
  loadingPromise = null
}

/** 首次打开页面调用一次：加载并缓存全量数据 */
export async function initDataset(): Promise<AllDataset> {
  if (cached) return cached
  if (loadingPromise) return loadingPromise
  if (!dataSource) throw new Error('数据源未初始化，请先调用 initData()')
  loadingPromise = Promise.resolve(dataSource.getAllData())
    .then((data) => {
      cached = data
      return data
    })
    .catch((err) => {
      loadingPromise = null
      throw err
    })
  return loadingPromise
}

// ---- 时间过滤：根据页面时间筛选值返回应包含的月份 ----
// 页面可选：本月 / 上月 / 本季度 / 上季度
function monthsForTime(timeFilter: string | undefined, allMonths: string[]): string[] {
  const n = allMonths.length
  switch (timeFilter) {
    case 'last_month':
      return allMonths.slice(Math.max(0, n - 2), n - 1) // 上月（倒数第2个月）
    case 'current_quarter':
      return allMonths.slice(Math.max(0, n - 3))        // 最近 3 个月
    case 'last_quarter':
      return allMonths.slice(Math.max(0, n - 6), n - 3) // 再往前 3 个月
    case 'current_month':
    default:
      return allMonths.slice(Math.max(0, n - 1))        // 本月（最近1个月）
  }
}

interface Filtered {
  rows: MetricRow[]
  months: string[]
}

/** 按 FM / WFP / 时间区间 过滤指标行 */
function filterRows(params: { fm_id?: string; wfp_id?: string; time_filter?: string }): Filtered {
  const ds = cached
  if (!ds) throw new Error('数据尚未加载，请先调用 initData()')

  const months = monthsForTime(params.time_filter, ds.months)
  let rows = ds.metrics
  if (params.fm_id && params.fm_id !== 'ALL') {
    rows = rows.filter((r) => r.fmId === params.fm_id)
  }
  if (params.wfp_id && params.wfp_id !== 'ALL') {
    rows = rows.filter((r) => r.wfpId === params.wfp_id)
  }
  rows = rows.filter((r) => months.includes(r.month))
  return { rows, months }
}

// 数字求和（null 安全）
function sum(rows: MetricRow[], key: keyof MetricRow): number {
  return rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0)
}
function rate(num: number, den: number): number {
  return den ? Math.round((num / den) * 100) : 0
}
function share(part: number, total: number): string {
  return total ? `${Math.round((part / total) * 100)}%` : '0%'
}

// ========== 1. FF/WFP 列表（按时间区间过滤）==========
// 只返回在所选时间区间内有数据的 FM/WFP（取缓存的名称信息，缺省返回全部）
export function getFmWfpListFromDataset(params?: { time_filter?: string }) {
  const ds = cached
  if (!ds) return { fms: [] }
  if (!params?.time_filter || params.time_filter === 'ALL') {
    return { fms: ds.fms }
  }
  const months = monthsForTime(params.time_filter, ds.months)
  // 收集该时段内出现过的 (fmId -> wfpId 集合)
  const fmWfpMap = new Map<string, Set<string>>()
  for (const r of ds.metrics) {
    if (!months.includes(r.month)) continue
    if (!fmWfpMap.has(r.fmId)) fmWfpMap.set(r.fmId, new Set())
    fmWfpMap.get(r.fmId)!.add(r.wfpId)
  }
  // 按 cached.fms 的结构与名称，只保留该时段有数据的 FM/WFP
  const fms = ds.fms
    .filter((fm) => fmWfpMap.has(fm.id))
    .map((fm) => ({
      id: fm.id,
      name: fm.name,
      wfps: fm.wfps.filter((w) => fmWfpMap.get(fm.id)!.has(w.id)),
    }))
    .filter((fm) => fm.wfps.length > 0)
  return { fms }
}

// ========== 2. RR 指标 ==========
export function getRrMetricsFromDataset(params: any) {
  const { rows } = filterRows(params)
  const total = sum(rows, 'rrTotal')
  const target = sum(rows, 'rrTarget')
  return {
    total,
    target,
    rate: target ? Math.round((total / target) * 1000) / 10 : 0,
    insuranceNew: sum(rows, 'rrFyc'),
    insuranceRenew: sum(rows, 'rrRenewal'),
    fund: sum(rows, 'rrFund'),
    people70: sum(rows, 'people70'),
  }
}

// ========== 3. 收入指标 ==========
export function getIncomeMetricsFromDataset(params: any) {
  const { rows } = filterRows(params)
  const fyc = sum(rows, 'incFyc')
  const renewal = sum(rows, 'incRenewal')
  const fundInc = sum(rows, 'incFund')
  const total = fyc + renewal + fundInc
  return {
    total,
    fyc,
    fycShare: share(fyc, total),
    renewal,
    renewalShare: share(renewal, total),
    fundInc,
    fundShare: share(fundInc, total),
  }
}

// ========== 4. 续保率指标 ==========
export function getRetentionMetricsFromDataset(params: any) {
  const { rows } = filterRows(params)
  const c13renewed = sum(rows, 'ret13Renewed')
  const c13total = sum(rows, 'ret13Total')
  const c25renewed = sum(rows, 'ret25Renewed')
  const c25total = sum(rows, 'ret25Total')
  return {
    anp13: rate(c13renewed, c13total),
    count13: sum(rows, 'ret13Count'),
    anp25: rate(c25renewed, c25total),
    count25: sum(rows, 'ret25Count'),
  }
}

// ========== 5. RR 指标趋势（按月份分组）==========
export function getRrTrendFromDataset(params: any) {
  const { rows, months } = filterRows(params)
  const rrValues: number[] = []
  let target = 0
  months.forEach((month) => {
    const mr = rows.filter((r) => r.month === month)
    rrValues.push(sum(mr, 'rrFyc') + sum(mr, 'rrRenewal') + sum(mr, 'rrFund'))
    target += sum(mr, 'rrTarget')
  })
  return { months, rrValues, target: target || 50000 }
}

// ========== 6. 收入指标趋势（按月份分组）==========
export function getIncomeTrendFromDataset(params: any) {
  const { rows, months } = filterRows(params)
  const incomeValues: number[] = []
  months.forEach((month) => {
    const mr = rows.filter((r) => r.month === month)
    incomeValues.push(sum(mr, 'incFyc') + sum(mr, 'incRenewal') + sum(mr, 'incFund'))
  })
  return { months, incomeValues, target: 50000 }
}

// ========== 7. 活动跟踪（扁平 12 字段）==========
export function getActivityFromDataset(params: any) {
  const { rows } = filterRows(params)
  return {
    calls: sum(rows, 'calls'),
    callsLong: sum(rows, 'callsLong'),
    meetings: sum(rows, 'meetings'),
    newList: sum(rows, 'newList'),
    fundContacts: sum(rows, 'fundContacts'),
    fundMeetings: sum(rows, 'fundMeetings'),
    wechatAdd: sum(rows, 'wechatAdd'),
    wechatInt: sum(rows, 'wechatInt'),
    newClients: sum(rows, 'newClients'),
    newAUM: sum(rows, 'newAUM'),
    simplePolicies: sum(rows, 'simplePolicies'),
    complexPolicies: sum(rows, 'complexPolicies'),
  }
}

// ========== 8. 新客运营 ==========
export function getNewCustomerFromDataset(params: any) {
  const { rows } = filterRows(params)
  const events = sum(rows, 'newEvents')
  const self = sum(rows, 'newSelf')
  const contacted = sum(rows, 'newContacted')
  const meet = sum(rows, 'newMeet')
  const total = sum(rows, 'newTotal')
  const rateStr = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '0%')
  return {
    events: {
      count: events, target: events * 2, rate: '100%',
      mtdContact: `${contacted}`, mtdMeet: `${meet}`,
    },
    self: {
      count: self, target: total, rate: rateStr(self, events),
      mtdContact: `${contacted}`, mtdMeet: `${meet}`,
    },
  }
}

// ========== 9. 老客运营汇总 ==========
export function getOldCustomerSummaryFromDataset(params: any) {
  const { rows } = filterRows(params)
  const total = sum(rows, 'oldTotal')
  const callList = sum(rows, 'oldCallList')
  const contacted = sum(rows, 'oldContacted')
  const meet = sum(rows, 'oldMeet')
  return {
    total,
    callList,
    callListContactRate: rateStr(contacted, callList),
    callListMeetRate: rateStr(meet, callList),
  }
}

// ========== 10. 老客运营列表 ==========
export function getOldCustomerListFromDataset(params: any) {
  const { rows } = filterRows(params)
  const total = sum(rows, 'oldTotal')
  const callList = sum(rows, 'oldCallList')
  const contacted = sum(rows, 'oldContacted')
  const meet = sum(rows, 'oldMeet')
  return {
    table: [
      {
        type: '已见面', count: meet, target: total,
        mtdContact: `${contacted}`, mtdMeet: `${meet}`,
        callList, callListContact: rateStr(contacted, callList), callListMeet: rateStr(meet, callList),
      },
      {
        type: '已联系未见', count: Math.max(0, contacted - meet), target: total,
        mtdContact: `${contacted}`, mtdMeet: `${meet}`,
        callList, callListContact: rateStr(contacted, callList), callListMeet: rateStr(meet, callList),
      },
      {
        type: '未联系', count: Math.max(0, callList - contacted), target: total,
        mtdContact: `${contacted}`, mtdMeet: `${meet}`,
        callList, callListContact: rateStr(contacted, callList), callListMeet: rateStr(meet, callList),
      },
    ],
  }
}

// ========== 11. 保单跟踪汇总 ==========
export function getPolicySummaryFromDataset(params: any) {
  const { rows } = filterRows(params)
  return {
    active: { count: sum(rows, 'policyActive'), aum: sum(rows, 'policyActiveAum') },
    pendingRenew: { count: sum(rows, 'policyPending'), aum: sum(rows, 'policyPendingAum') },
    orphan: { count: sum(rows, 'policyOrphan'), aum: sum(rows, 'policyOrphanAum') },
  }
}

// ========== 12. 保单跟踪列表 ==========
export function getPolicyListFromDataset(params: any) {
  const { rows } = filterRows(params)
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
export function getFundSummaryFromDataset(params: any) {
  const { rows } = filterRows(params)
  return {
    holding: { count: sum(rows, 'fundHolding'), aum: sum(rows, 'fundHoldingAum') },
    huikunbao: { count: sum(rows, 'fundHuikunbao'), aum: sum(rows, 'fundHuikunbaoAum') },
    fundNoIns: { count: sum(rows, 'fundNoIns'), aum: sum(rows, 'fundNoInsAum') },
  }
}

// ========== 14. 基金跟踪列表 ==========
export function getFundListFromDataset(params: any) {
  const { rows } = filterRows(params)
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

// 内部百分比字符串工具
function rateStr(a: number, b: number): string {
  return b ? `${Math.round((a / b) * 100)}%` : '0%'
}
