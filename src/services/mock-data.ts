// 共享 Mock 数据服务

export interface QueryParams {
  fm_id?: string
  wfp_id?: string
  time_filter?: string
}

// FM/WFP 列表
export function getFmWfpList() {
  return {
    fms: [
      {
        id: "fm001",
        name: "张经理 (FM)",
        wfps: [
          { id: "wfp001", name: "李销售 (WFP)" },
          { id: "wfp002", name: "王销售 (WFP)" }
        ]
      },
      {
        id: "fm002",
        name: "陈总监 (FM)",
        wfps: [
          { id: "wfp003", name: "赵销售 (WFP)" },
          { id: "wfp004", name: "孙销售 (WFP)" }
        ]
      }
    ]
  }
}

// 生成基础数据
function generateBaseData(timeFilter: string) {
  const isQuarter = timeFilter.includes('quarter')
  const months = isQuarter ? ['Q1','Q2','Q3','Q4'] : ['1月','2月','3月','4月','5月','6月']

  const rrTotal = Math.floor(Math.random() * 50000) + 40000
  const rrTarget = 50000
  const rrRate = (rrTotal / rrTarget) * 100

  const incomeTotal = rrTotal * 0.8
  const fyc = incomeTotal * 0.6
  const renewalComm = incomeTotal * 0.25
  const fundIncome = incomeTotal * 0.15

  const trendRR = months.map(() => Math.floor(Math.random() * 50000) + 30000)
  const trendInc = months.map(() => Math.floor(Math.random() * 40000) + 25000)
  const trendTarget = 50000

  return {
    months,
    rrTotal,
    rrTarget,
    rrRate,
    incomeTotal,
    fyc,
    renewalComm,
    fundIncome,
    trendRR,
    trendInc,
    trendTarget
  }
}

// 2. RR指标
export function getRrMetrics(params: QueryParams) {
  const { time_filter = 'current_month' } = params
  const base = generateBaseData(time_filter)
  return {
    total: base.rrTotal,
    target: base.rrTarget,
    rate: base.rrRate,
    insuranceNew: Math.floor(base.rrTotal * 0.4),
    insuranceRenew: Math.floor(base.rrTotal * 0.3),
    fund: Math.floor(base.rrTotal * 0.3),
    people70: Math.floor(Math.random() * 10) + 5
  }
}

// 3. 收入指标
export function getIncomeMetrics(params: QueryParams) {
  const { time_filter = 'current_month' } = params
  const base = generateBaseData(time_filter)
  return {
    total: base.incomeTotal,
    fyc: base.fyc,
    fycShare: (base.fyc / base.incomeTotal * 100).toFixed(1),
    renewal: base.renewalComm,
    renewalShare: (base.renewalComm / base.incomeTotal * 100).toFixed(1),
    fundInc: base.fundIncome,
    fundShare: (base.fundIncome / base.incomeTotal * 100).toFixed(1)
  }
}

// 4. 续保率指标
export function getRetentionMetrics(params: QueryParams) {
  return {
    anp13: Math.floor(Math.random() * 30 + 60),
    count13: Math.floor(Math.random() * 80),
    anp25: Math.floor(Math.random() * 30 + 40),
    count25: Math.floor(Math.random() * 40)
  }
}

// 5. RR指标趋势
export function getRrTrend(params: QueryParams) {
  const { time_filter = 'current_month' } = params
  const base = generateBaseData(time_filter)
  return {
    months: base.months,
    rrValues: base.trendRR,
    target: base.trendTarget
  }
}

// 6. 收入指标趋势
export function getIncomeTrend(params: QueryParams) {
  const { time_filter = 'current_month' } = params
  const base = generateBaseData(time_filter)
  return {
    months: base.months,
    incomeValues: base.trendInc,
    target: base.trendTarget
  }
}

// 7. 活动跟踪
export function getActivity(params: QueryParams) {
  return {
    calls: Math.floor(Math.random() * 200),
    callsLong: Math.floor(Math.random() * 100),
    meetings: Math.floor(Math.random() * 30),
    newList: Math.floor(Math.random() * 20),
    fundContacts: Math.floor(Math.random() * 50),
    fundMeetings: Math.floor(Math.random() * 10),
    wechatAdd: Math.floor(Math.random() * 40),
    wechatInt: Math.floor(Math.random() * 60),
    newClients: Math.floor(Math.random() * 8),
    newAUM: Math.floor(Math.random() * 100000),
    simplePolicies: Math.floor(Math.random() * 12),
    complexPolicies: Math.floor(Math.random() * 5)
  }
}

// 8. 新客运营
export function getNewCustomer(params: QueryParams) {
  return {
    events: {
      count: Math.floor(Math.random() * 5),
      target: 5,
      rate: (Math.random() * 100).toFixed(1),
      mtdContact: (Math.random() * 100).toFixed(1),
      mtdMeet: (Math.random() * 100).toFixed(1)
    },
    self: {
      count: Math.floor(Math.random() * 10),
      target: 8,
      rate: (Math.random() * 100).toFixed(1),
      mtdContact: (Math.random() * 100).toFixed(1),
      mtdMeet: (Math.random() * 100).toFixed(1)
    }
  }
}

// 9. 老客运营汇总
export function getOldCustomerSummary(params: QueryParams) {
  return {
    total: Math.floor(Math.random() * 200),
    callList: Math.floor(Math.random() * 100),
    callListContactRate: (Math.random() * 100).toFixed(1),
    callListMeetRate: (Math.random() * 100).toFixed(1)
  }
}

// 10. 老客运营列表
export function getOldCustomerList(params: QueryParams) {
  return {
    table: [
      { type: "Non-NHC Customer Top-up", count: 18, target: 50, mtdContact: "45%", mtdMeet: "18%", callList: 10, callListContact: "50%", callListMeet: "20%" },
      { type: "Non-NHC existing leads", count: 50, target: 80, mtdContact: "36%", mtdMeet: "18%", callList: 30, callListContact: "40%", callListMeet: "16%" },
      { type: "NHC", count: 18, target: 50, mtdContact: "48%", mtdMeet: "36%", callList: 5, callListContact: "100%", callListMeet: "60%" }
    ]
  }
}

// 11. 保单跟踪汇总
export function getPolicySummary(params: QueryParams) {
  return {
    active: { count: 128, aum: 500000 },
    pendingRenew: { count: 30, aum: 150000 },
    orphan: { count: 15, aum: 90000 }
  }
}

// 12. 保单跟踪列表
export function getPolicyList(params: QueryParams) {
  return {
    table: [
      { type: "已签待扣保单", count: 5, policyCount: 5, aum: 50000, priority: "urgent", suggestion: "立即跟进扣款" },
      { type: "本月待续期（逾期-66天）", count: 10, policyCount: 10, aum: 120000, priority: "important", suggestion: "电话提醒续费" },
      { type: "本月待续期（未逾期）", count: 15, policyCount: 15, aum: 120000, priority: "normal", suggestion: "发送续费通知" },
      { type: "近30天失效", count: 5, policyCount: 5, aum: 30000, priority: "normal", suggestion: "尝试复效挽回" }
    ]
  }
}

// 13. 基金跟踪汇总
export function getFundSummary(params: QueryParams) {
  return {
    holding: { count: 80, aum: 2000000 },
    huikunbao: { count: 40, aum: 500000 },
    fundNoIns: { count: 28, aum: 300000 }
  }
}

// 14. 基金跟踪列表
export function getFundList(params: QueryParams) {
  return {
    table: [
      { type: "赎回（在途）", count: 3, orderCount: 3, orderAmount: 50000, priority: "urgent", suggestion: "确认到账" },
      { type: "赎回（已确认）", count: 5, orderCount: 5, orderAmount: 120000, priority: "important", suggestion: "资金再配置建议" },
      { type: "申购（在途）", count: 2, orderCount: 2, orderAmount: 30000, priority: "normal", suggestion: "确认份额" }
    ]
  }
}

// ============================================================
// 全量数据集：首次打开一次性加载，之后前端按 FM/WFP/时间 过滤聚合，
// 不再重新请求接口。
// ============================================================

// 月份维度（月视图 6 个月）
export const ALL_MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月']
// 季度维度
export const ALL_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

// 时间区间枚举字段（与 fm_id / wfp_id 一样，是数据行上的一个枚举维度，等值过滤）
export const TIME_FILTERS = ['current_month', 'last_month', 'current_quarter', 'last_quarter'] as const
export type TimeFilterKey = (typeof TIME_FILTERS)[number]

// 趋势用的月度点（RR指标趋势 / 收入指标趋势共用）
export interface TrendMonth {
  month: string
  rrTotal: number
  rrTarget: number
  incTotal: number
}

// 全量指标行：每个 FM / WFP / 时间区间枚举 一行
// timeFilter 是枚举字段，筛选时按等值匹配（和 fm_id、wfp_id 过滤方式一致）
export interface MetricRow {
  fmId: string
  wfpId: string
  timeFilter: TimeFilterKey
  // 趋势（与 timeFilter 无关；同一 FM/WFP 在每个时间区间行中都带相同的 12 个月序列）
  months: TrendMonth[]
  // RR 指标
  rrTotal: number
  rrTarget: number
  rrFyc: number
  rrRenewal: number
  rrFund: number
  people70: number
  // 收入指标
  incFyc: number
  incRenewal: number
  incFund: number
  // 续保率
  ret13Renewed: number
  ret13Total: number
  ret25Renewed: number
  ret25Total: number
  ret13Count: number
  ret25Count: number
  // 活动跟踪（12 项指标）
  calls: number; callsLong: number; meetings: number; newList: number
  fundContacts: number; fundMeetings: number; wechatAdd: number; wechatInt: number
  newClients: number; newAUM: number; simplePolicies: number; complexPolicies: number
  // 新客运营
  newEvents: number
  newSelf: number
  newContacted: number
  newMeet: number
  newTotal: number
  // 老客运营汇总
  oldTotal: number
  oldCallList: number
  oldContacted: number
  oldMeet: number
  // 保单跟踪汇总
  policyActive: number; policyActiveAum: number
  policyPending: number; policyPendingAum: number
  policyOrphan: number; policyOrphanAum: number
  // 基金跟踪汇总
  fundHolding: number; fundHoldingAum: number
  fundHuikunbao: number; fundHuikunbaoAum: number
  fundNoIns: number; fundNoInsAum: number
}

// 确定性伪随机：同一 key 每次生成相同数据（避免随机导致过滤前后不一致）
function seededRand(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x) // 0~1
}
function seedOf(...parts: (string | number)[]): number {
  let h = 0
  const str = parts.join('|')
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 2147483647
  return h + 1
}
function rnd(group: string, wfp: string, tf: string, field: string, min: number, max: number): number {
  const v = seededRand(seedOf(group, wfp, tf, field))
  return Math.floor(min + v * (max - min))
}

// 生成某个 FM/WFP 的 12 个月趋势（RR 与收入共用）
function buildTrendMonths(fmId: string, wfpId: string): TrendMonth[] {
  return ALL_MONTHS.map((month, i) => {
    // 随月份平滑波动
    const base = 55000 + Math.sin(i / 2) * 12000 + rnd(fmId, wfpId, 'trend', month, 0, 20000)
    const rrTotal = Math.floor(base)
    const rrTarget = 50000
    const incTotal = Math.floor(rrTotal * 0.8)
    return { month, rrTotal, rrTarget, incTotal }
  })
}

// 生成全部指标行（FM × WFP × 时间区间枚举）
function buildMetricRows(fms: { id: string; wfps: { id: string }[] }[]): MetricRow[] {
  const rows: MetricRow[] = []
  for (const fm of fms) {
    for (const wfp of fm.wfps) {
      // 趋势序列：同一 FM/WFP 只生成一次，挂到每个时间区间行上
      const months = buildTrendMonths(fm.id, wfp.id)
      for (const tf of TIME_FILTERS) {
        const isQuarter = tf.endsWith('quarter')
        const scale = isQuarter ? 3 : 1 // 季度窗口量级约为单月的 3 倍
        const key = tf
        const rrTotal = rnd(fm.id, wfp.id, key, 'rrTotal', 40000 * scale, 90000 * scale)
        const rrTarget = 50000 * scale
        const incTotal = Math.floor(rrTotal * 0.8)
        // 续保率：窗口越大分子分母同比例放大，率保持稳定
        const ret13Total = 100 * scale
        const ret25Total = 100 * scale
        const ret13Rate = 0.6 + seededRand(seedOf(fm.id, wfp.id, key, 'ret13Rate')) * 0.3
        const ret25Rate = 0.4 + seededRand(seedOf(fm.id, wfp.id, key, 'ret25Rate')) * 0.4
        rows.push({
          fmId: fm.id,
          wfpId: wfp.id,
          timeFilter: tf,
          months,
          rrTotal,
          rrTarget,
          rrFyc: Math.floor(rrTotal * 0.45),
          rrRenewal: Math.floor(rrTotal * 0.35),
          rrFund: Math.floor(rrTotal * 0.20),
          people70: rnd(fm.id, wfp.id, key, 'people70', 5 * scale, 15 * scale),
          incFyc: Math.floor(incTotal * 0.6),
          incRenewal: Math.floor(incTotal * 0.25),
          incFund: Math.floor(incTotal * 0.15),
          ret13Renewed: Math.floor(ret13Total * ret13Rate),
          ret13Total,
          ret25Renewed: Math.floor(ret25Total * ret25Rate),
          ret25Total,
          ret13Count: rnd(fm.id, wfp.id, key, 'ret13Count', 20 * scale, 80 * scale),
          ret25Count: rnd(fm.id, wfp.id, key, 'ret25Count', 10 * scale, 40 * scale),
          calls: rnd(fm.id, wfp.id, key, 'calls', 100 * scale, 300 * scale),
          callsLong: rnd(fm.id, wfp.id, key, 'callsLong', 40 * scale, 140 * scale),
          meetings: rnd(fm.id, wfp.id, key, 'meetings', 10 * scale, 40 * scale),
          newList: rnd(fm.id, wfp.id, key, 'newList', 10 * scale, 30 * scale),
          fundContacts: rnd(fm.id, wfp.id, key, 'fundContacts', 20 * scale, 70 * scale),
          fundMeetings: rnd(fm.id, wfp.id, key, 'fundMeetings', 5 * scale, 15 * scale),
          wechatAdd: rnd(fm.id, wfp.id, key, 'wechatAdd', 20 * scale, 60 * scale),
          wechatInt: rnd(fm.id, wfp.id, key, 'wechatInt', 30 * scale, 90 * scale),
          newClients: rnd(fm.id, wfp.id, key, 'newClients', 3 * scale, 12 * scale),
          newAUM: rnd(fm.id, wfp.id, key, 'newAUM', 30000 * scale, 150000 * scale),
          simplePolicies: rnd(fm.id, wfp.id, key, 'simplePolicies', 5 * scale, 18 * scale),
          complexPolicies: rnd(fm.id, wfp.id, key, 'complexPolicies', 2 * scale, 8 * scale),
          newEvents: rnd(fm.id, wfp.id, key, 'newEvents', 2 * scale, 8 * scale),
          newSelf: rnd(fm.id, wfp.id, key, 'newSelf', 3 * scale, 12 * scale),
          newContacted: rnd(fm.id, wfp.id, key, 'newContacted', 40 * scale, 90 * scale),
          newMeet: rnd(fm.id, wfp.id, key, 'newMeet', 20 * scale, 70 * scale),
          newTotal: rnd(fm.id, wfp.id, key, 'newTotal', 8 * scale, 20 * scale),
          oldTotal: rnd(fm.id, wfp.id, key, 'oldTotal', 100 * scale, 300 * scale),
          oldCallList: rnd(fm.id, wfp.id, key, 'oldCallList', 40 * scale, 140 * scale),
          oldContacted: rnd(fm.id, wfp.id, key, 'oldContacted', 40 * scale, 90 * scale),
          oldMeet: rnd(fm.id, wfp.id, key, 'oldMeet', 20 * scale, 70 * scale),
          policyActive: rnd(fm.id, wfp.id, key, 'policyActive', 80 * scale, 160 * scale),
          policyActiveAum: rnd(fm.id, wfp.id, key, 'policyActiveAum', 300000 * scale, 700000 * scale),
          policyPending: rnd(fm.id, wfp.id, key, 'policyPending', 15 * scale, 45 * scale),
          policyPendingAum: rnd(fm.id, wfp.id, key, 'policyPendingAum', 80000 * scale, 220000 * scale),
          policyOrphan: rnd(fm.id, wfp.id, key, 'policyOrphan', 5 * scale, 25 * scale),
          policyOrphanAum: rnd(fm.id, wfp.id, key, 'policyOrphanAum', 40000 * scale, 140000 * scale),
          fundHolding: rnd(fm.id, wfp.id, key, 'fundHolding', 50 * scale, 110 * scale),
          fundHoldingAum: rnd(fm.id, wfp.id, key, 'fundHoldingAum', 1000000 * scale, 3000000 * scale),
          fundHuikunbao: rnd(fm.id, wfp.id, key, 'fundHuikunbao', 20 * scale, 60 * scale),
          fundHuikunbaoAum: rnd(fm.id, wfp.id, key, 'fundHuikunbaoAum', 300000 * scale, 700000 * scale),
          fundNoIns: rnd(fm.id, wfp.id, key, 'fundNoIns', 15 * scale, 40 * scale),
          fundNoInsAum: rnd(fm.id, wfp.id, key, 'fundNoInsAum', 150000 * scale, 450000 * scale),
        })
      }
    }
  }
  return rows
}

// 全量数据入口：一次返回所有模块所需数据
export function getAllData() {
  const { fms } = getFmWfpList()
  const metrics = buildMetricRows(fms)
  return { fms, metrics, months: ALL_MONTHS, quarters: ALL_QUARTERS, timeFilters: TIME_FILTERS }
}
