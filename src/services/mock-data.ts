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

// 全量指标行：每个 FM/WFP/月份 一行
export interface MetricRow {
  fmId: string
  wfpId: string
  month: string
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
function rnd(group: string, wfp: string, month: string, field: string, min: number, max: number): number {
  const v = seededRand(seedOf(group, wfp, month, field))
  return Math.floor(min + v * (max - min))
}

// 生成全部指标行（FM × WFP × 月份）
function buildMetricRows(fms: { id: string; wfps: { id: string }[] }[]): MetricRow[] {
  const rows: MetricRow[] = []
  for (const fm of fms) {
    for (const wfp of fm.wfps) {
      for (const month of ALL_MONTHS) {
        const rrTotal = rnd(fm.id, wfp.id, month, 'rrTotal', 40000, 90000)
        const rrTarget = 50000
        const incTotal = Math.floor(rrTotal * 0.8)
        rows.push({
          fmId: fm.id,
          wfpId: wfp.id,
          month,
          rrTotal,
          rrTarget,
          rrFyc: Math.floor(rrTotal * 0.45),
          rrRenewal: Math.floor(rrTotal * 0.35),
          rrFund: Math.floor(rrTotal * 0.20),
          people70: rnd(fm.id, wfp.id, month, 'people70', 5, 15),
          incFyc: Math.floor(incTotal * 0.6),
          incRenewal: Math.floor(incTotal * 0.25),
          incFund: Math.floor(incTotal * 0.15),
          ret13Renewed: rnd(fm.id, wfp.id, month, 'ret13Renewed', 60, 90),
          ret13Total: 100,
          ret25Renewed: rnd(fm.id, wfp.id, month, 'ret25Renewed', 40, 80),
          ret25Total: 100,
          ret13Count: rnd(fm.id, wfp.id, month, 'ret13Count', 20, 80),
          ret25Count: rnd(fm.id, wfp.id, month, 'ret25Count', 10, 40),
          calls: rnd(fm.id, wfp.id, month, 'calls', 100, 300),
          callsLong: rnd(fm.id, wfp.id, month, 'callsLong', 40, 140),
          meetings: rnd(fm.id, wfp.id, month, 'meetings', 10, 40),
          newList: rnd(fm.id, wfp.id, month, 'newList', 10, 30),
          fundContacts: rnd(fm.id, wfp.id, month, 'fundContacts', 20, 70),
          fundMeetings: rnd(fm.id, wfp.id, month, 'fundMeetings', 5, 15),
          wechatAdd: rnd(fm.id, wfp.id, month, 'wechatAdd', 20, 60),
          wechatInt: rnd(fm.id, wfp.id, month, 'wechatInt', 30, 90),
          newClients: rnd(fm.id, wfp.id, month, 'newClients', 3, 12),
          newAUM: rnd(fm.id, wfp.id, month, 'newAUM', 30000, 150000),
          simplePolicies: rnd(fm.id, wfp.id, month, 'simplePolicies', 5, 18),
          complexPolicies: rnd(fm.id, wfp.id, month, 'complexPolicies', 2, 8),
          newEvents: rnd(fm.id, wfp.id, month, 'newEvents', 2, 8),
          newSelf: rnd(fm.id, wfp.id, month, 'newSelf', 3, 12),
          newContacted: rnd(fm.id, wfp.id, month, 'newContacted', 40, 90),
          newMeet: rnd(fm.id, wfp.id, month, 'newMeet', 20, 70),
          newTotal: rnd(fm.id, wfp.id, month, 'newTotal', 8, 20),
          oldTotal: rnd(fm.id, wfp.id, month, 'oldTotal', 100, 300),
          oldCallList: rnd(fm.id, wfp.id, month, 'oldCallList', 40, 140),
          oldContacted: rnd(fm.id, wfp.id, month, 'oldContacted', 40, 90),
          oldMeet: rnd(fm.id, wfp.id, month, 'oldMeet', 20, 70),
          policyActive: rnd(fm.id, wfp.id, month, 'policyActive', 80, 160),
          policyActiveAum: rnd(fm.id, wfp.id, month, 'policyActiveAum', 300000, 700000),
          policyPending: rnd(fm.id, wfp.id, month, 'policyPending', 15, 45),
          policyPendingAum: rnd(fm.id, wfp.id, month, 'policyPendingAum', 80000, 220000),
          policyOrphan: rnd(fm.id, wfp.id, month, 'policyOrphan', 5, 25),
          policyOrphanAum: rnd(fm.id, wfp.id, month, 'policyOrphanAum', 40000, 140000),
          fundHolding: rnd(fm.id, wfp.id, month, 'fundHolding', 50, 110),
          fundHoldingAum: rnd(fm.id, wfp.id, month, 'fundHoldingAum', 1000000, 3000000),
          fundHuikunbao: rnd(fm.id, wfp.id, month, 'fundHuikunbao', 20, 60),
          fundHuikunbaoAum: rnd(fm.id, wfp.id, month, 'fundHuikunbaoAum', 300000, 700000),
          fundNoIns: rnd(fm.id, wfp.id, month, 'fundNoIns', 15, 40),
          fundNoInsAum: rnd(fm.id, wfp.id, month, 'fundNoInsAum', 150000, 450000),
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
  return { fms, metrics, months: ALL_MONTHS, quarters: ALL_QUARTERS }
}
