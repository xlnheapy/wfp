// Qlik Sense 数据服务（生产环境使用）
// ============================================================
// 14 个接口各自独立查询。每个接口都返回【带 fm / wfp / 时间区间 维度】的全量数据，
// 不在 Qlik 引擎端做筛选；筛选由页面根据所选 FM/WFP/时间区间在前端完成。
//
// 字段名说明：下方 FIELD_* 常量为占位字段名，请按 Qlik 应用中的实际字段/度量名修改。
// ============================================================
import enigma from 'enigma.js'
import schema from 'enigma.js/schemas/12.170.2.json'

const QLIK_URL = (process.env.UMI_APP_QLIK_URL as string) || 'wss://your-qlik-server/app'
const APP_ID = (process.env.UMI_APP_QLIK_APP_ID as string) || 'your-app-id'

// 维度字段名（按实际 Qlik 应用调整）
const FIELD_FM_ID = 'FM_ID'
const FIELD_FM_NAME = 'FM_NAME'
const FIELD_WFP_ID = 'WFP_ID'
const FIELD_WFP_NAME = 'WFP_NAME'
const FIELD_TIME_FILTER = 'TIME_FILTER' // 时间区间枚举字段，取值 current_month / last_month / current_quarter / last_quarter
const FIELD_MONTH = 'MONTH'             // 趋势月份字段（yyyy-MM）

// 度量表达式（按实际 Qlik 应用调整）。均为"带维度行"的聚合，前端二次过滤求和。
const M = {
  rrTotal: 'Sum(RR_TOTAL)', rrTarget: 'Sum(RR_TARGET)', rrFyc: 'Sum(RR_FYC)',
  rrRenewal: 'Sum(RR_RENEWAL)', rrFund: 'Sum(RR_FUND)', people70: 'Sum(PEOPLE_70)',
  incFyc: 'Sum(INC_FYC)', incRenewal: 'Sum(INC_RENEWAL)', incFund: 'Sum(INC_FUND)',
  ret13Renewed: 'Sum(RET13_RENEWED)', ret13Total: 'Sum(RET13_TOTAL)', ret13Count: 'Sum(RET13_COUNT)',
  ret25Renewed: 'Sum(RET25_RENEWED)', ret25Total: 'Sum(RET25_TOTAL)', ret25Count: 'Sum(RET25_COUNT)',
  calls: 'Sum(CALLS)', callsLong: 'Sum(CALLS_LONG)', meetings: 'Sum(MEETINGS)', newList: 'Sum(NEW_LIST)',
  fundContacts: 'Sum(FUND_CONTACTS)', fundMeetings: 'Sum(FUND_MEETINGS)',
  wechatAdd: 'Sum(WECHAT_ADD)', wechatInt: 'Sum(WECHAT_INT)',
  newClients: 'Sum(NEW_CLIENTS)', newAUM: 'Sum(NEW_AUM)',
  simplePolicies: 'Sum(SIMPLE_POLICIES)', complexPolicies: 'Sum(COMPLEX_POLICIES)',
  newEvents: 'Sum(NEW_EVENTS)', newSelf: 'Sum(NEW_SELF)', newContacted: 'Sum(NEW_CONTACTED)',
  newMeet: 'Sum(NEW_MEET)', newTotal: 'Sum(NEW_TOTAL)',
  oldTotal: 'Sum(OLD_TOTAL)', oldCallList: 'Sum(OLD_CALL_LIST)', oldContacted: 'Sum(OLD_CONTACTED)', oldMeet: 'Sum(OLD_MEET)',
  policyActive: 'Sum(POLICY_ACTIVE)', policyActiveAum: 'Sum(POLICY_ACTIVE_AUM)',
  policyPending: 'Sum(POLICY_PENDING)', policyPendingAum: 'Sum(POLICY_PENDING_AUM)',
  policyOrphan: 'Sum(POLICY_ORPHAN)', policyOrphanAum: 'Sum(POLICY_ORPHAN_AUM)',
  fundHolding: 'Sum(FUND_HOLDING)', fundHoldingAum: 'Sum(FUND_HOLDING_AUM)',
  fundHuikunbao: 'Sum(FUND_HUIKUNBAO)', fundHuikunbaoAum: 'Sum(FUND_HUIKUNBAO_AUM)',
  fundNoIns: 'Sum(FUND_NO_INS)', fundNoInsAum: 'Sum(FUND_NO_INS_AUM)',
  // 趋势月份点
  rrMonthFyc: 'Sum(RR_FYC)', rrMonthRenewal: 'Sum(RR_RENEWAL)', rrMonthFund: 'Sum(RR_FUND)',
  rrMonthTotal: 'Sum(RR_TOTAL)', rrMonthTarget: 'Sum(RR_TARGET)',
  incMonthFyc: 'Sum(INC_FYC)', incMonthRenewal: 'Sum(INC_RENEWAL)', incMonthFund: 'Sum(INC_FUND)',
  incMonthTotal: 'Sum(INC_TOTAL)', incMonthTarget: 'Sum(INC_TARGET)',
}

// ---------- 连接 ----------
async function connect() {
  const session = enigma.create({ schema, url: QLIK_URL })
  const global = await session.open()
  const app = await global.openDoc(APP_ID)
  return { session, app }
}

// ---------- HyperCube 查询（多维度 + 多度量，返回数据矩阵）----------
async function hyperCube(
  app: any,
  dims: { field: string; label: string }[],
  measures: { expr: string; label: string }[]
): Promise<any[][]> {
  const obj = await app.createSessionObject({
    qInfo: { qType: 'custom-hypercube' },
    qHyperCubeDef: {
      qDimensions: dims.map((d) => ({
        qDef: { qFieldDefs: [d.field] },
        qNullSuppression: true,
      })),
      qMeasures: measures.map((m) => ({
        qDef: { qDef: m.expr, qLabel: m.label },
      })),
      qInitialDataFetch: [{ qLeft: 0, qTop: 0, qWidth: dims.length + measures.length, qHeight: 10000 }],
    },
  })
  const layout = await obj.getLayout()
  try { await app.destroySessionObject(obj.id) } catch (e) { /* 忽略销毁异常 */ }
  return layout?.qHyperCube?.qDataPages?.[0]?.qMatrix || []
}

const dim = (field: string, label: string) => ({ field, label })
const mea = (expr: string, label: string) => ({ expr, label })
const num = (v: any) => { const n = Number(v?.qNum ?? v?.qText); return Number.isFinite(n) ? n : 0 }
const txt = (v: any) => (v?.qText != null ? String(v.qText) : '')

// 三个枚举维度
// FM/WFP 列表专用维度（含名称）
const LIST_DIMS = [
  dim(FIELD_FM_ID, 'fm_id'), dim(FIELD_FM_NAME, 'fmName'),
  dim(FIELD_WFP_ID, 'staff_id'), dim(FIELD_WFP_NAME, 'wfpName'),
  dim(FIELD_TIME_FILTER, 'time_filter'),
]
const ENUM_DIMS = [
  dim(FIELD_FM_ID, 'fm_id'),
  dim(FIELD_WFP_ID, 'staff_id'),
  dim(FIELD_TIME_FILTER, 'time_filter'),
]
// 从矩阵行解析维度公共字段：dims 决定列与返回键的对应
const ENUM_KEYS: Record<number, string> = { 0: 'fm_id', 1: 'staff_id', 2: 'time_filter' }
const LIST_KEYS: Record<number, string> = { 0: 'fm_id', 1: 'fmName', 2: 'staff_id', 3: 'wfpName', 4: 'time_filter' }
function parseEnumRow(c: any[], keys = ENUM_KEYS) {
  const out: Record<string, any> = {}
  Object.keys(keys).forEach((k) => {
    const idx = Number(k)
    out[keys[idx]] = txt(c[idx])
  })
  return out
}

// ============================================================
// 14 个独立接口
// ============================================================

// 1. FM 和 WFP 列表（带时间区间维度）
export async function getFmWfpList() {
  const { session, app } = await connect()
  try {
    const matrix = await hyperCube(app, LIST_DIMS, [mea('Count({1} 1)', 'cnt')])
    const rows = matrix.map((r) => {
      const c = r.map((cell: any) => cell)
      return {
        fmId: txt(c[0]), fmName: txt(c[1]),
        wfpId: txt(c[2]), wfpName: txt(c[3]),
        timeFilter: txt(c[4]) as any,
      }
    })
    return { rows }
  } finally {
    await (session as any).close?.()
  }
}

// 2. RR 指标
export async function getRrMetrics() {
  const { session, app } = await connect()
  try {
    const measures = [
      mea(M.rrTotal, 'rrTotal'), mea(M.rrTarget, 'rrTarget'), mea(M.rrFyc, 'rrFyc'),
      mea(M.rrRenewal, 'rrRenewal'), mea(M.rrFund, 'rrFund'), mea(M.people70, 'people70'),
    ]
    const matrix = await hyperCube(app, ENUM_DIMS, measures)
    const rows = matrix.map((r) => ({
      ...parseEnumRow(r),
      rrTotal: num(r[3]), rrTarget: num(r[4]), rrFyc: num(r[5]),
      rrRenewal: num(r[6]), rrFund: num(r[7]), people70: num(r[8]),
    }))
    return { rows }
  } finally { await (session as any).close?.() }
}

// 3. 收入指标
export async function getIncomeMetrics() {
  const { session, app } = await connect()
  try {
    const measures = [mea(M.incFyc, 'incFyc'), mea(M.incRenewal, 'incRenewal'), mea(M.incFund, 'incFund')]
    const matrix = await hyperCube(app, ENUM_DIMS, measures)
    const rows = matrix.map((r) => ({
      ...parseEnumRow(r),
      incFyc: num(r[3]), incRenewal: num(r[4]), incFund: num(r[5]),
    }))
    return { rows }
  } finally { await (session as any).close?.() }
}

// 4. 续保率指标
export async function getRetentionMetrics() {
  const { session, app } = await connect()
  try {
    const measures = [
      mea(M.ret13Renewed, 'ret13Renewed'), mea(M.ret13Total, 'ret13Total'), mea(M.ret13Count, 'ret13Count'),
      mea(M.ret25Renewed, 'ret25Renewed'), mea(M.ret25Total, 'ret25Total'), mea(M.ret25Count, 'ret25Count'),
    ]
    const matrix = await hyperCube(app, ENUM_DIMS, measures)
    const rows = matrix.map((r) => ({
      ...parseEnumRow(r),
      ret13Renewed: num(r[3]), ret13Total: num(r[4]), ret13Count: num(r[5]),
      ret25Renewed: num(r[6]), ret25Total: num(r[7]), ret25Count: num(r[8]),
    }))
    return { rows }
  } finally { await (session as any).close?.() }
}

// 趋势查询：维度 FM/WFP + MONTH，按 FM/WFP 归组成 12 个月序列
async function queryTrend(app: any, measures: { expr: string; label: string }[], monthKeyPrefix: 'rr' | 'inc') {
  const dims = [
    dim(FIELD_FM_ID, 'fm_id'), dim(FIELD_WFP_ID, 'staff_id'), dim(FIELD_WFP_NAME, 'wfpName'),
    dim(FIELD_MONTH, 'month'),
  ]
  const matrix = await hyperCube(app, dims, measures)
  // 归组：key = fm|staff
  const group = new Map<string, { fm_id: string; staff_id: string; wfpName: string; months: any[] }>()
  for (const r of matrix) {
    const fm_id = txt(r[0]), staff_id = txt(r[1]), wfpName = txt(r[2]), month = txt(r[3])
    const key = `${fm_id}|${staff_id}`
    if (!group.has(key)) group.set(key, { fm_id, staff_id, wfpName, months: [] })
    const g = group.get(key)!
    const base: any = { month, monthLabel: month }
    if (monthKeyPrefix === 'rr') {
      base.rrFyc = num(r[4]); base.rrRenewal = num(r[5]); base.rrFund = num(r[6])
      base.rrTotal = num(r[7]); base.rrTarget = num(r[8])
    } else {
      base.incFyc = num(r[4]); base.incRenewal = num(r[5]); base.incFund = num(r[6])
      base.incTotal = num(r[7]); base.incTarget = num(r[8])
    }
    g.months.push(base)
  }
  return Array.from(group.values())
}

// 5. RR 指标趋势
export async function getRrTrend() {
  const { session, app } = await connect()
  try {
    const measures = [
      mea(M.rrMonthFyc, 'rrFyc'), mea(M.rrMonthRenewal, 'rrRenewal'), mea(M.rrMonthFund, 'rrFund'),
      mea(M.rrMonthTotal, 'rrTotal'), mea(M.rrMonthTarget, 'rrTarget'),
    ]
    const rows = await queryTrend(app, measures, 'rr')
    return { rows }
  } finally { await (session as any).close?.() }
}

// 6. 收入指标趋势
export async function getIncomeTrend() {
  const { session, app } = await connect()
  try {
    const measures = [
      mea(M.incMonthFyc, 'incFyc'), mea(M.incMonthRenewal, 'incRenewal'), mea(M.incMonthFund, 'incFund'),
      mea(M.incMonthTotal, 'incTotal'), mea(M.incMonthTarget, 'incTarget'),
    ]
    const rows = await queryTrend(app, measures, 'inc')
    return { rows }
  } finally { await (session as any).close?.() }
}

// 7. 活动跟踪
export async function getActivity() {
  const { session, app } = await connect()
  try {
    const measures = [
      mea(M.calls, 'calls'), mea(M.callsLong, 'callsLong'), mea(M.meetings, 'meetings'), mea(M.newList, 'newList'),
      mea(M.fundContacts, 'fundContacts'), mea(M.fundMeetings, 'fundMeetings'),
      mea(M.wechatAdd, 'wechatAdd'), mea(M.wechatInt, 'wechatInt'),
      mea(M.newClients, 'newClients'), mea(M.newAUM, 'newAUM'),
      mea(M.simplePolicies, 'simplePolicies'), mea(M.complexPolicies, 'complexPolicies'),
    ]
    const matrix = await hyperCube(app, ENUM_DIMS, measures)
    const rows = matrix.map((r) => ({
      ...parseEnumRow(r),
      calls: num(r[3]), callsLong: num(r[4]), meetings: num(r[5]), newList: num(r[6]),
      fundContacts: num(r[7]), fundMeetings: num(r[8]), wechatAdd: num(r[9]), wechatInt: num(r[10]),
      newClients: num(r[11]), newAUM: num(r[12]), simplePolicies: num(r[13]), complexPolicies: num(r[14]),
    }))
    return { rows }
  } finally { await (session as any).close?.() }
}

// 8. 新客运营
export async function getNewCustomer() {
  const { session, app } = await connect()
  try {
    const measures = [
      mea(M.newEvents, 'newEvents'), mea(M.newSelf, 'newSelf'), mea(M.newContacted, 'newContacted'),
      mea(M.newMeet, 'newMeet'), mea(M.newTotal, 'newTotal'),
    ]
    const matrix = await hyperCube(app, ENUM_DIMS, measures)
    const rows = matrix.map((r) => ({
      ...parseEnumRow(r),
      newEvents: num(r[3]), newSelf: num(r[4]), newContacted: num(r[5]),
      newMeet: num(r[6]), newTotal: num(r[7]),
    }))
    return { rows }
  } finally { await (session as any).close?.() }
}

// 9. 老客运营汇总
export async function getOldCustomerSummary() {
  const { session, app } = await connect()
  try {
    const measures = [
      mea(M.oldTotal, 'oldTotal'), mea(M.oldCallList, 'oldCallList'),
      mea(M.oldContacted, 'oldContacted'), mea(M.oldMeet, 'oldMeet'),
    ]
    const matrix = await hyperCube(app, ENUM_DIMS, measures)
    const rows = matrix.map((r) => ({
      ...parseEnumRow(r),
      oldTotal: num(r[3]), oldCallList: num(r[4]), oldContacted: num(r[5]), oldMeet: num(r[6]),
    }))
    return { rows }
  } finally { await (session as any).close?.() }
}

// 10. 老客运营列表（前端按汇总行聚合分组，这里返回与汇总一致的带维度行）
export async function getOldCustomerList() {
  return getOldCustomerSummary()
}

// 11. 保单跟踪汇总
export async function getPolicySummary() {
  const { session, app } = await connect()
  try {
    const measures = [
      mea(M.policyActive, 'policyActive'), mea(M.policyActiveAum, 'policyActiveAum'),
      mea(M.policyPending, 'policyPending'), mea(M.policyPendingAum, 'policyPendingAum'),
      mea(M.policyOrphan, 'policyOrphan'), mea(M.policyOrphanAum, 'policyOrphanAum'),
    ]
    const matrix = await hyperCube(app, ENUM_DIMS, measures)
    const rows = matrix.map((r) => ({
      ...parseEnumRow(r),
      policyActive: num(r[3]), policyActiveAum: num(r[4]),
      policyPending: num(r[5]), policyPendingAum: num(r[6]),
      policyOrphan: num(r[7]), policyOrphanAum: num(r[8]),
    }))
    return { rows }
  } finally { await (session as any).close?.() }
}

// 12. 保单跟踪列表（前端按汇总行聚合分组）
export async function getPolicyList() {
  return getPolicySummary()
}

// 13. 基金跟踪汇总
export async function getFundSummary() {
  const { session, app } = await connect()
  try {
    const measures = [
      mea(M.fundHolding, 'fundHolding'), mea(M.fundHoldingAum, 'fundHoldingAum'),
      mea(M.fundHuikunbao, 'fundHuikunbao'), mea(M.fundHuikunbaoAum, 'fundHuikunbaoAum'),
      mea(M.fundNoIns, 'fundNoIns'), mea(M.fundNoInsAum, 'fundNoInsAum'),
    ]
    const matrix = await hyperCube(app, ENUM_DIMS, measures)
    const rows = matrix.map((r) => ({
      ...parseEnumRow(r),
      fundHolding: num(r[3]), fundHoldingAum: num(r[4]),
      fundHuikunbao: num(r[5]), fundHuikunbaoAum: num(r[6]),
      fundNoIns: num(r[7]), fundNoInsAum: num(r[8]),
    }))
    return { rows }
  } finally { await (session as any).close?.() }
}

// 14. 基金跟踪列表（前端按汇总行聚合分组）
export async function getFundList() {
  return getFundSummary()
}
