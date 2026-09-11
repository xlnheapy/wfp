/**
 * api.ts
 *
 * 数据访问策略（按环境区分，无 /api 封装）：
 *   - 生产环境（Qlik 部署，Extensions 纯静态环境）：直接从 Qlik 引擎加载
 *   - 开发/测试环境：直接使用 Mock 数据
 *
 * 调用机制（前端过滤，不再逐次请求接口）：
 *   页面首次打开时调用 initData()，一次性把【所有 FM/WFP/月份】的全量数据加载并缓存；
 *   之后切换 FM / WFP / 时间区间，都在前端内存里过滤聚合，不再发起请求。
 */
import * as dataset from './dataset'
import type { AllDataset } from './dataset'

export interface QueryParams {
  fm_id?: string
  wfp_id?: string
  time_filter?: string  // 'M' | 'Q' | 'Y'
}

// ---------- 数据源：按环境选择 ----------
type DataSource = { getAllData: () => Promise<AllDataset> | AllDataset }

let dataSource: DataSource
if (process.env.NODE_ENV === 'production') {
  // 生产：Qlik 引擎（全量数据一次查询）
  dataSource = require('./qlik-service') as DataSource
} else {
  // 开发/测试：Mock 全量数据
  dataSource = require('./mock-data') as DataSource
}

/**
 * 首次打开页面调用一次：加载全量数据并缓存
 * 返回按时间区间过滤后的 FM/WFP 列表，供顶部下拉框使用
 * @param timeFilter 时间区间（默认本月），决定列表展示哪些 FM/WFP
 */
export async function initData(timeFilter?: string): Promise<{ fms: AllDataset['fms'] }> {
  // 注入当前环境的数据源
  dataset.setDataSource(dataSource)
  await dataset.initDataset()
  return dataset.getFmWfpListFromDataset({ time_filter: timeFilter || 'current_month' })
}

// ---------- 以下函数都从缓存的全量数据里过滤聚合，不再请求接口 ----------

// 1. FF 和 WFP 列表（按时间区间过滤）
export function fetchFmWfpList(params?: { time_filter?: string }): Promise<any> {
  return Promise.resolve(dataset.getFmWfpListFromDataset(params))
}

// 2. RR 指标
export function fetchRrMetrics(params: QueryParams): Promise<any> {
  return Promise.resolve(dataset.getRrMetricsFromDataset(params))
}

// 3. 收入指标
export function fetchIncomeMetrics(params: QueryParams): Promise<any> {
  return Promise.resolve(dataset.getIncomeMetricsFromDataset(params))
}

// 4. 续保率指标
export function fetchRetentionMetrics(params: QueryParams): Promise<any> {
  return Promise.resolve(dataset.getRetentionMetricsFromDataset(params))
}

// 5. RR 指标趋势
export function fetchRrTrend(params: QueryParams): Promise<any> {
  return Promise.resolve(dataset.getRrTrendFromDataset(params))
}

// 6. 收入指标趋势
export function fetchIncomeTrend(params: QueryParams): Promise<any> {
  return Promise.resolve(dataset.getIncomeTrendFromDataset(params))
}

// 7. 活动跟踪
export function fetchActivity(params: QueryParams): Promise<any> {
  return Promise.resolve(dataset.getActivityFromDataset(params))
}

// 8. 新客运营
export function fetchNewCustomer(params: QueryParams): Promise<any> {
  return Promise.resolve(dataset.getNewCustomerFromDataset(params))
}

// 9. 老客运营汇总
export function fetchOldCustomerSummary(params: QueryParams): Promise<any> {
  return Promise.resolve(dataset.getOldCustomerSummaryFromDataset(params))
}

// 10. 老客运营列表
export function fetchOldCustomerList(params: QueryParams): Promise<any> {
  return Promise.resolve(dataset.getOldCustomerListFromDataset(params))
}

// 11. 保单跟踪汇总
export function fetchPolicySummary(params: QueryParams): Promise<any> {
  return Promise.resolve(dataset.getPolicySummaryFromDataset(params))
}

// 12. 保单跟踪列表
export function fetchPolicyList(params: QueryParams): Promise<any> {
  return Promise.resolve(dataset.getPolicyListFromDataset(params))
}

// 13. 基金跟踪汇总
export function fetchFundSummary(params: QueryParams): Promise<any> {
  return Promise.resolve(dataset.getFundSummaryFromDataset(params))
}

// 14. 基金跟踪列表
export function fetchFundList(params: QueryParams): Promise<any> {
  return Promise.resolve(dataset.getFundListFromDataset(params))
}
