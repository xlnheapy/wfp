// Mock 数据服务
// 14 个接口各自独立，均返回【带 fm / wfp / 时间区间 维度】的全量数据；
// 不做任何筛选，由页面根据选择的 FM / WFP / 时间区间在前端过滤。

// ---------- 维度枚举 ----------
export const TIME_FILTERS = [
  'current_month',
  'last_month',
  'current_quarter',
  'last_quarter',
] as const
export type TimeFilterKey = (typeof TIME_FILTERS)[number]

export interface QueryParams {
  fm_id?: string
  wfp_id?: string
  time_filter?: string
}

// ---------- 确定性伪随机 ----------
function seededRand(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

// ---------- 维度 ----------
const FMS: { id: string; name: string; wfps: { id: string; name: string }[] }[] = [
  { id: 'fm001', name: '黄惠玲', wfps: [{ id: '13639', name: '陈家明' }, { id: '10796', name: '张美玲' }, { id: '12055', name: '李文杰' }] },
  { id: 'fm002', name: '陈志强', wfps: [{ id: '11234', name: '王淑芬' }, { id: '14502', name: '刘志明' }] },
  { id: 'fm003', name: '林淑华', wfps: [{ id: '10877', name: '赵雅芝' }, { id: '13320', name: '孙建国' }, { id: '15109', name: '周丽华' }] },
  { id: 'fm004', name: '王国强', wfps: [{ id: '12988', name: '吴俊宏' }] },
]
const MONTHS = ['2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05']
const MONTH_LABELS = ['25年06月','25年07月','25年08月','25年09月','25年10月','25年11月','25年12月','26年01月','26年02月','26年03月','26年04月','26年05月']

// ---------- 趋势月份点 ----------
export interface TrendMonth {
  month: string
  monthLabel: string
  rrFyc: number; rrRenewal: number; rrFund: number; rrTotal: number; rrTarget: number
  incFyc: number; incRenewal: number; incFund: number; incTotal: number; incTarget: number
}

// ---------- 全量指标行（FM × WFP × 时间区间）----------
export interface MetricRow {
  fmId: string; fmName: string
  wfpId: string; wfpName: string
  timeFilter: TimeFilterKey

  // RR 指标
  rrTotal: number; rrTarget: number; rrFyc: number; rrRenewal: number; rrFund: number; people70: number
  // 收入
  incFyc: number; incRenewal: number; incFund: number
  // 续保率
  ret13Renewed: number; ret13Total: number; ret13Count: number
  ret25Renewed: number; ret25Total: number; ret25Count: number
  // 活动跟踪（12 字段）
  calls: number; callsLong: number; meetings: number; newList: number
  fundContacts: number; fundMeetings: number; wechatAdd: number; wechatInt: number
  newClients: number; newAUM: number; simplePolicies: number; complexPolicies: number
  // 新客
  newEvents: number; newSelf: number; newContacted: number; newMeet: number; newTotal: number
  // 老客
  oldTotal: number; oldCallList: number; oldContacted: number; oldMeet: number
  // 保单
  policyActive: number; policyActiveAum: number
  policyPending: number; policyPendingAum: number
  policyOrphan: number; policyOrphanAum: number
  // 基金
  fundHolding: number; fundHoldingAum: number
  fundHuikunbao: number; fundHuikunbaoAum: number
  fundNoIns: number; fundNoInsAum: number

  // 趋势（12 个月，仅趋势接口使用）
  months: TrendMonth[]
}

const WINDOW_FACTOR: Record<TimeFilterKey, number> = {
  current_month: 1, last_month: 0.95, current_quarter: 3, last_quarter: 2.9,
}

function buildAllRows(): MetricRow[] {
  const rows: MetricRow[] = []
  for (const fm of FMS) {
    for (const wfp of fm.wfps) {
      for (const tf of TIME_FILTERS) {
        const seed = parseInt(fm.id.slice(2)) * 1000 + parseInt(wfp.id)
        const rnd = seededRand(seed)
        const rate = (min: number, max: number) => min + rnd() * (max - min)
        const f = WINDOW_FACTOR[tf]

        const fyc = Math.round(rate(120, 260))
        const renewal = Math.round(rate(150, 320))
        const fund = Math.round(rate(60, 160))
        const total = fyc + renewal + fund

        const r13 = rate(0.78, 0.95)
        const r25 = rate(0.7, 0.92)
        const t13 = Math.round(120 * f)
        const t25 = Math.round(210 * f)

        // 趋势序列（每个 FM/WFP 相同，与时间区间无关）
        const tr = seededRand(seed + 7)
        const baseTgt = Math.round(total * 620)
        const months: TrendMonth[] = MONTHS.map((m, i) => {
          const wave = 0.8 + tr() * 0.5
          const mFyc = Math.round(fyc * wave)
          const mRenewal = Math.round(renewal * (0.85 + tr() * 0.4))
          const mFund = Math.round(fund * (0.7 + tr() * 0.6))
          const mRrTotal = mFyc + mRenewal + mFund
          const mRrTgt = Math.round(baseTgt * (0.9 + tr() * 0.3))
          const incF = Math.round(mFyc * 38), incR = Math.round(mRenewal * 32), incFundV = Math.round(mFund * 15)
          return {
            month: m, monthLabel: MONTH_LABELS[i],
            rrFyc: mFyc, rrRenewal: mRenewal, rrFund: mFund, rrTotal: mRrTotal, rrTarget: mRrTgt,
            incFyc: incF, incRenewal: incR, incFund: incFundV,
            incTotal: incF + incR + incFundV, incTarget: Math.round(mRrTgt * 33),
          }
        })

        const polActive = Math.round(rate(40, 90) * f)
        const polPending = Math.round(rate(10, 28) * f)
        const polOrphan = Math.round(rate(4, 14) * f)
        const fHolding = Math.round(rate(30, 70) * f)
        const fHuikun = Math.round(rate(15, 40) * f)
        const fNoIns = Math.round(rate(8, 25) * f)

        rows.push({
          fmId: fm.id, fmName: fm.name, wfpId: wfp.id, wfpName: wfp.name, timeFilter: tf,
          rrTotal: Math.round(total * f),
          rrTarget: Math.round(total * 620 * f),
          rrFyc: Math.round(fyc * f), rrRenewal: Math.round(renewal * f), rrFund: Math.round(fund * f),
          people70: Math.round(rate(1, 6) * (f > 1.5 ? 3 : 1)),
          incFyc: Math.round(fyc * 38 * f), incRenewal: Math.round(renewal * 32 * f), incFund: Math.round(fund * 15 * f),
          ret13Renewed: Math.round(t13 * r13), ret13Total: t13, ret13Count: t13,
          ret25Renewed: Math.round(t25 * r25), ret25Total: t25, ret25Count: t25,
          calls: Math.round(rate(90, 160) * f), callsLong: Math.round(rate(45, 90) * f),
          meetings: Math.round(rate(12, 24) * f), newList: Math.round(rate(60, 110) * f),
          fundContacts: Math.round(rate(25, 50) * f), fundMeetings: Math.round(rate(5, 12) * f),
          wechatAdd: Math.round(rate(18, 40) * f), wechatInt: Math.round(rate(35, 70) * f),
          newClients: Math.round(rate(4, 12) * (f > 1.5 ? 2.2 : 1)), newAUM: Math.round(rate(40000, 120000) * f),
          simplePolicies: Math.round(rate(6, 16) * f), complexPolicies: Math.round(rate(2, 8) * f),
          newEvents: Math.round(rate(8, 20) * f), newSelf: Math.round(rate(3, 10) * f),
          newContacted: Math.round(rate(5, 15) * f), newMeet: Math.round(rate(2, 8) * f),
          newTotal: Math.round(rate(10, 24) * f),
          oldTotal: Math.round(rate(20, 60) * f), oldCallList: Math.round(rate(30, 80) * f),
          oldContacted: Math.round(rate(12, 30) * f), oldMeet: Math.round(rate(6, 16) * f),
          policyActive: polActive, policyActiveAum: polActive * Math.round(rate(80000, 200000)),
          policyPending: polPending, policyPendingAum: polPending * Math.round(rate(60000, 150000)),
          policyOrphan: polOrphan, policyOrphanAum: polOrphan * Math.round(rate(50000, 120000)),
          fundHolding: fHolding, fundHoldingAum: fHolding * Math.round(rate(30000, 90000)),
          fundHuikunbao: fHuikun, fundHuikunbaoAum: fHuikun * Math.round(rate(20000, 70000)),
          fundNoIns: fNoIns, fundNoInsAum: fNoIns * Math.round(rate(15000, 50000)),
          months,
        })
      }
    }
  }
  return rows
}

let _allRows: MetricRow[] | null = null
function allRows(): MetricRow[] {
  if (!_allRows) _allRows = buildAllRows()
  return _allRows
}

// FM/WFP 列表行（带时间区间维度）
export interface FmWfpRow {
  fmId: string; fmName: string
  wfpId: string; wfpName: string
  timeFilter: TimeFilterKey
}

// 趋势行（按 fm/wfp，含 12 个月）
export interface TrendRow {
  fmId: string; wfpId: string; wfpName: string
  months: TrendMonth[]
}

// 二维：过滤字段（所有指标接口均含） + 各模块自有字段
const D = ['fmId', 'wfpId', 'timeFilter'] as const
function proj(r: MetricRow, fields: (keyof MetricRow)[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const k of D) out[k] = r[k]
  for (const f of fields) out[f] = r[f]
  return out
}
const RR_F = ['rrTotal', 'rrTarget', 'rrFyc', 'rrRenewal', 'rrFund', 'people70']
const INC_F = ['incFyc', 'incRenewal', 'incFund']
const RET_F = ['ret13Renewed', 'ret13Total', 'ret13Count', 'ret25Renewed', 'ret25Total', 'ret25Count']
const ACT_F = ['calls', 'callsLong', 'meetings', 'newList', 'fundContacts', 'fundMeetings',
  'wechatAdd', 'wechatInt', 'newClients', 'newAUM', 'simplePolicies', 'complexPolicies']
const NEW_F = ['newEvents', 'newSelf', 'newContacted', 'newMeet', 'newTotal']
const OLD_F = ['oldTotal', 'oldCallList', 'oldContacted', 'oldMeet']
const POL_F = ['policyActive', 'policyActiveAum', 'policyPending', 'policyPendingAum',
  'policyOrphan', 'policyOrphanAum']
const FND_F = ['fundHolding', 'fundHoldingAum', 'fundHuikunbao', 'fundHuikunbaoAum',
  'fundNoIns', 'fundNoInsAum']

// ============================================================
// 14 个独立接口：每个返回带 fm/wfp/时间区间 维度的全量数据（不筛选）
// ============================================================

// 1. FM 和 WFP 列表
export function getFmWfpList(): { rows: FmWfpRow[] } {
  const rows: FmWfpRow[] = []
  for (const fm of FMS) {
    for (const wfp of fm.wfps) {
      for (const tf of TIME_FILTERS) {
        rows.push({ fmId: fm.id, fmName: fm.name, wfpId: wfp.id, wfpName: wfp.name, timeFilter: tf })
      }
    }
  }
  return { rows }
}

// 2. RR 指标
export function getRrMetrics(): { rows: Record<string, unknown>[] } {
  return { rows: allRows().map((r) => proj(r, RR_F)) }
}

// 3. 收入指标
export function getIncomeMetrics(): { rows: Record<string, unknown>[] } {
  return { rows: allRows().map((r) => proj(r, INC_F)) }
}

// 4. 续保率指标
export function getRetentionMetrics(): { rows: Record<string, unknown>[] } {
  return { rows: allRows().map((r) => proj(r, RET_F)) }
}

// 5. RR 指标趋势（按 fm/wfp，含月份序列）
export function getRrTrend(): { rows: TrendRow[] } {
  const seen = new Set<string>()
  const rows: TrendRow[] = []
  for (const r of allRows()) {
    const k = `${r.fmId}|${r.wfpId}`
    if (seen.has(k)) continue
    seen.add(k)
    rows.push({ fmId: r.fmId, wfpId: r.wfpId, wfpName: r.wfpName, months: r.months })
  }
  return { rows }
}

// 6. 收入指标趋势
export function getIncomeTrend(): { rows: TrendRow[] } {
  return getRrTrend()
}

// 7. 活动跟踪
export function getActivity(): { rows: Record<string, unknown>[] } {
  return { rows: allRows().map((r) => proj(r, ACT_F)) }
}

// 8. 新客运营
export function getNewCustomer(): { rows: Record<string, unknown>[] } {
  return { rows: allRows().map((r) => proj(r, NEW_F)) }
}

// 9. 老客运营汇总
export function getOldCustomerSummary(): { rows: Record<string, unknown>[] } {
  return { rows: allRows().map((r) => proj(r, OLD_F)) }
}

// 10. 老客运营列表（汇总行即可，前端按过滤聚合后分组；这里返回带维度汇总行）
export function getOldCustomerList(): { rows: Record<string, unknown>[] } {
  return { rows: allRows().map((r) => proj(r, OLD_F)) }
}

// 11. 保单跟踪汇总
export function getPolicySummary(): { rows: Record<string, unknown>[] } {
  return { rows: allRows().map((r) => proj(r, POL_F)) }
}

// 12. 保单跟踪列表
export function getPolicyList(): { rows: Record<string, unknown>[] } {
  return { rows: allRows().map((r) => proj(r, POL_F)) }
}

// 13. 基金跟踪汇总
export function getFundSummary(): { rows: Record<string, unknown>[] } {
  return { rows: allRows().map((r) => proj(r, FND_F)) }
}

// 14. 基金跟踪列表
export function getFundList(): { rows: Record<string, unknown>[] } {
  return { rows: allRows().map((r) => proj(r, FND_F)) }
}
