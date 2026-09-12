// API 服务层
// 14 个接口各自独立，每个接口可独立指定数据源：
//   - qlik ：对接 Qlik Sense（生产）
//   - mock ：本地 Mock 数据（开发/测试）
//
// 联调配置：放开第 1、2 个接口（FM/WFP 列表、RR 指标）走生产 Qlik，其余 12 个走 Mock。
// 每个接口都返回【带 fm / wfp / 时间区间 维度】的全量数据，不在数据源侧筛选；
// 切换 FM/WFP/时间区间时全部走前端内存过滤，不再重复请求接口（实时接口除外）。

import type { QueryParams } from './mock-data'
import * as dataset from './dataset'

// 两个数据源暴露同名方法，返回同构数据。
const qlik: any = require('./qlik-service')
const mock: any = require('./mock-data')

// 每个接口独立配置数据源：'qlik' | 'mock'
// 当前放开前两个接口走生产 Qlik。
const SOURCE = {
  fmWfpList: 'qlik',
  rr: 'qlik',
  income: 'mock',
  retention: 'mock',
  rrTrend: 'mock',
  incomeTrend: 'mock',
  activity: 'mock',
  newCustomer: 'mock',
  oldSummary: 'mock',
  oldList: 'mock',
  policySummary: 'mock',
  policyList: 'mock',
  fundSummary: 'mock',
  fundList: 'mock',
} as const

// 取数据源
const getDS = (src: 'qlik' | 'mock'): any => (src === 'qlik' ? qlik : mock)

// ---------- 其余 mock 接口：首次并行加载并注入 dataset 缓存 ----------
let loadedPromise: Promise<void> | null = null

// 只加载走 mock 的模块行（qlik 的两个接口由各自 fetch 实时拉取）
const MOCK_KEYS: { key: string; method: string }[] = [
  { key: 'income', method: 'getIncomeMetrics' },
  { key: 'retention', method: 'getRetentionMetrics' },
  { key: 'activity', method: 'getActivity' },
  { key: 'newCustomer', method: 'getNewCustomer' },
  { key: 'oldSummary', method: 'getOldCustomerSummary' },
  { key: 'oldList', method: 'getOldCustomerList' },
  { key: 'policySummary', method: 'getPolicySummary' },
  { key: 'policyList', method: 'getPolicyList' },
  { key: 'fundSummary', method: 'getFundSummary' },
  { key: 'fundList', method: 'getFundList' },
]

async function loadMockAll(): Promise<void> {
  if (loadedPromise) return loadedPromise
  loadedPromise = (async () => {
    const entries = await Promise.all(
      MOCK_KEYS.map(async (it) => ({ key: it.key, rows: (await getDS('mock')[it.method]()).rows }))
    )
    dataset.resetDataset()
    entries.forEach((e) => dataset.setModuleRows(e.key, e.rows))
    // RR 趋势 / 收入趋势 走专属缓存
    const rrTr = (await getDS('mock').getRrTrend()).rows
    const incTr = (await getDS('mock').getIncomeTrend()).rows
    dataset.setRrTrendRows(rrTr)
    dataset.setIncomeTrendRows(incTr)
  })()
  return loadedPromise
}

async function ensureMockLoaded(): Promise<void> {
  await loadMockAll()
}

// ============================================================
// 对外 14 个接口
// ============================================================

// 1. FM/WFP 列表：走生产 Qlik，行注入 dataset 供过滤/聚合。
export async function fetchFmWfpList(params?: QueryParams) {
  const src = getDS(SOURCE.fmWfpList)
  try {
    const { rows } = await src.getFmWfpList()
    dataset.setFmWfpRows(rows)
  } catch (err) {
    // 生产不可达时回退 Mock，避免页面因下拉为空永久 Loading
    // eslint-disable-next-line no-console
    console.warn('[api] fetchFmWfpList 生产失败，回退 Mock：', err)
    const { rows } = getDS('mock').getFmWfpList()
    dataset.setFmWfpRows(rows)
  }
  return dataset.getFmWfpList(params)
}

// 2. RR 指标：走生产 Qlik，行注入 dataset 供聚合。
export async function fetchRrMetrics(params: QueryParams) {
  const src = getDS(SOURCE.rr)
  try {
    const { rows } = await src.getRrMetrics()
    dataset.setModuleRows('rr', rows)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[api] fetchRrMetrics 生产失败，回退 Mock：', err)
    const { rows } = getDS('mock').getRrMetrics()
    dataset.setModuleRows('rr', rows)
  }
  ensureMockLoaded()
  return dataset.getRrMetrics(params)
}

// 3. 收入指标
export async function fetchIncomeMetrics(params: QueryParams) {
  await ensureMockLoaded()
  return dataset.getIncomeMetrics(params)
}

// 4. 续保率指标
export async function fetchRetentionMetrics(params: QueryParams) {
  await ensureMockLoaded()
  return dataset.getRetentionMetrics(params)
}

// 5. RR 指标趋势
export async function fetchRrTrend(params: QueryParams) {
  await ensureMockLoaded()
  return dataset.getRrTrend(params)
}

// 6. 收入指标趋势
export async function fetchIncomeTrend(params: QueryParams) {
  await ensureMockLoaded()
  return dataset.getIncomeTrend(params)
}

// 7. 活动跟踪
export async function fetchActivity(params: QueryParams) {
  await ensureMockLoaded()
  return dataset.getActivity(params)
}

// 8. 新客运营
export async function fetchNewCustomer(params: QueryParams) {
  await ensureMockLoaded()
  return dataset.getNewCustomer(params)
}

// 9. 老客运营汇总
export async function fetchOldCustomerSummary(params: QueryParams) {
  await ensureMockLoaded()
  return dataset.getOldCustomerSummary(params)
}

// 10. 老客运营列表
export async function fetchOldCustomerList(params: QueryParams) {
  await ensureMockLoaded()
  return dataset.getOldCustomerList(params)
}

// 11. 保单跟踪汇总
export async function fetchPolicySummary(params: QueryParams) {
  await ensureMockLoaded()
  return dataset.getPolicySummary(params)
}

// 12. 保单跟踪列表
export async function fetchPolicyList(params: QueryParams) {
  await ensureMockLoaded()
  return dataset.getPolicyList(params)
}

// 13. 基金跟踪汇总
export async function fetchFundSummary(params: QueryParams) {
  await ensureMockLoaded()
  return dataset.getFundSummary(params)
}

// 14. 基金跟踪列表
export async function fetchFundList(params: QueryParams) {
  await ensureMockLoaded()
  return dataset.getFundList(params)
}