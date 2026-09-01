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
