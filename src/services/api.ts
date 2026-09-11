// API 服务层
// 14 个接口各自独立。数据源按环境切换：
//   - 开发/测试环境(development/test)：使用本地 Mock
//   - 生产环境(production，如 Qlik Extension)：对接 Qlik Sense（静态服务，无后端）
//
// 每个接口都返回【带 fm / wfp / 时间区间 维度】的全量数据，不在数据源侧筛选。
// 首次打开页面时并行请求 14 个接口并缓存，之后切换 FM/WFP/时间区间全部走前端内存过滤，
// 不再重复请求接口。

import type { QueryParams } from './mock-data'
import * as dataset from './dataset'

// 按环境选择数据源。两个数据源暴露同名的 14 个方法，返回同构数据。
let dataSource: any
if (process.env.NODE_ENV === 'production') {
  dataSource = require('./qlik-service')
} else {
  dataSource = require('./mock-data')
}

// ---------- 首次加载：并行拉取 14 个接口并注入 dataset 缓存 ----------
let loadedPromise: Promise<void> | null = null

async function loadAll(): Promise<void> {
  if (loadedPromise) return loadedPromise
  loadedPromise = (async () => {
    const ds = dataSource
    const [
      fmWfp, rr, income, retention, rrTrend, incomeTrend,
      activity, newCustomer, oldSummary, oldList,
      policySummary, policyList, fundSummary, fundList,
    ] = await Promise.all([
      ds.getFmWfpList(),
      ds.getRrMetrics(),
      ds.getIncomeMetrics(),
      ds.getRetentionMetrics(),
      ds.getRrTrend(),
      ds.getIncomeTrend(),
      ds.getActivity(),
      ds.getNewCustomer(),
      ds.getOldCustomerSummary(),
      ds.getOldCustomerList(),
      ds.getPolicySummary(),
      ds.getPolicyList(),
      ds.getFundSummary(),
      ds.getFundList(),
    ])

    dataset.resetDataset()
    dataset.setFmWfpRows(fmWfp.rows)
    dataset.setModuleRows('rr', rr.rows)
    dataset.setModuleRows('income', income.rows)
    dataset.setModuleRows('retention', retention.rows)
    dataset.setRrTrendRows(rrTrend.rows)
    dataset.setIncomeTrendRows(incomeTrend.rows)
    dataset.setModuleRows('activity', activity.rows)
    dataset.setModuleRows('newCustomer', newCustomer.rows)
    dataset.setModuleRows('oldSummary', oldSummary.rows)
    dataset.setModuleRows('oldList', oldList.rows)
    dataset.setModuleRows('policySummary', policySummary.rows)
    dataset.setModuleRows('policyList', policyList.rows)
    dataset.setModuleRows('fundSummary', fundSummary.rows)
    dataset.setModuleRows('fundList', fundList.rows)
  })()
  return loadedPromise
}

// 确保已加载（页面首次调用）；之后筛选切换不再请求
async function ensureLoaded(): Promise<void> {
  await loadAll()
}

// ============================================================
// 对外 14 个接口：首次触发加载，随后从内存聚合返回（不再请求）
// ============================================================

// 1. FF 和 WFP 列表（按时间区间枚举过滤）
export async function fetchFmWfpList(params?: QueryParams) {
  await ensureLoaded()
  return dataset.getFmWfpList(params)
}

// 2. RR 指标
export async function fetchRrMetrics(params: QueryParams) {
  await ensureLoaded()
  return dataset.getRrMetrics(params)
}

// 3. 收入指标
export async function fetchIncomeMetrics(params: QueryParams) {
  await ensureLoaded()
  return dataset.getIncomeMetrics(params)
}

// 4. 续保率指标
export async function fetchRetentionMetrics(params: QueryParams) {
  await ensureLoaded()
  return dataset.getRetentionMetrics(params)
}

// 5. RR 指标趋势
export async function fetchRrTrend(params: QueryParams) {
  await ensureLoaded()
  return dataset.getRrTrend(params)
}

// 6. 收入指标趋势
export async function fetchIncomeTrend(params: QueryParams) {
  await ensureLoaded()
  return dataset.getIncomeTrend(params)
}

// 7. 活动跟踪
export async function fetchActivity(params: QueryParams) {
  await ensureLoaded()
  return dataset.getActivity(params)
}

// 8. 新客运营
export async function fetchNewCustomer(params: QueryParams) {
  await ensureLoaded()
  return dataset.getNewCustomer(params)
}

// 9. 老客运营汇总
export async function fetchOldCustomerSummary(params: QueryParams) {
  await ensureLoaded()
  return dataset.getOldCustomerSummary(params)
}

// 10. 老客运营列表
export async function fetchOldCustomerList(params: QueryParams) {
  await ensureLoaded()
  return dataset.getOldCustomerList(params)
}

// 11. 保单跟踪汇总
export async function fetchPolicySummary(params: QueryParams) {
  await ensureLoaded()
  return dataset.getPolicySummary(params)
}

// 12. 保单跟踪列表
export async function fetchPolicyList(params: QueryParams) {
  await ensureLoaded()
  return dataset.getPolicyList(params)
}

// 13. 基金跟踪汇总
export async function fetchFundSummary(params: QueryParams) {
  await ensureLoaded()
  return dataset.getFundSummary(params)
}

// 14. 基金跟踪列表
export async function fetchFundList(params: QueryParams) {
  await ensureLoaded()
  return dataset.getFundList(params)
}
