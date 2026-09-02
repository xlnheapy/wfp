// API 服务层 - 根据环境自动切换数据源
// 开发环境：使用 Mock 数据（通过 Umi mock）
// 生产环境/Qlik Extension：对接 Qlik Sense（静态导入）

import * as qlikService from './qlik-service';

// 判断是否为开发环境（Umi dev server）
const isDevelopment = process.env.NODE_ENV === 'development';

interface QueryParams {
  fm_id?: string;
  wfp_id?: string;
  time_filter?: string;
}

function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams();
  if (params.fm_id) searchParams.set('fm_id', params.fm_id);
  if (params.wfp_id) searchParams.set('wfp_id', params.wfp_id);
  if (params.time_filter) searchParams.set('time_filter', params.time_filter);
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

async function fetchApi<T>(endpoint: string, params: QueryParams = {}): Promise<T> {
  // 1. 非开发环境使用 Qlik 服务（静态导入，直接调用）
  if (!isDevelopment) {
    const methodName = endpoint.replace('/', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    const capitalized = methodName.charAt(0).toUpperCase() + methodName.slice(1);
    const method = (qlikService as any)[`fetch${capitalized}`];
    if (method) {
      return method(params);
    }
  }

  // 2. 开发环境使用 Umi Mock 服务器
  const url = `/api${endpoint}${buildQueryString(params)}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'API request failed');
  }
  return json.data;
}

// ==================== API 方法 ====================

export async function fetchFmWfpList() {
  return fetchApi<{ fms: any[] }>('/fm-wfp-list');
}

export async function fetchRrMetrics(params: QueryParams) {
  return fetchApi<any>('/rr-metrics', params);
}

export async function fetchIncomeMetrics(params: QueryParams) {
  return fetchApi<any>('/income-metrics', params);
}

export async function fetchRetentionMetrics(params: QueryParams) {
  return fetchApi<any>('/retention-metrics', params);
}

export async function fetchRrTrend(params: QueryParams) {
  return fetchApi<any>('/rr-trend', params);
}

export async function fetchIncomeTrend(params: QueryParams) {
  return fetchApi<any>('/income-trend', params);
}

export async function fetchActivity(params: QueryParams) {
  return fetchApi<any>('/activity', params);
}

export async function fetchNewCustomer(params: QueryParams) {
  return fetchApi<any>('/new-customer', params);
}

export async function fetchOldCustomerSummary(params: QueryParams) {
  return fetchApi<any>('/old-customer-summary', params);
}

export async function fetchOldCustomerList(params: QueryParams) {
  return fetchApi<any>('/old-customer-list', params);
}

export async function fetchPolicySummary(params: QueryParams) {
  return fetchApi<any>('/policy-summary', params);
}

export async function fetchPolicyList(params: QueryParams) {
  return fetchApi<any>('/policy-list', params);
}

export async function fetchFundSummary(params: QueryParams) {
  return fetchApi<any>('/fund-summary', params);
}

export async function fetchFundList(params: QueryParams) {
  return fetchApi<any>('/fund-list', params);
}
