// API 服务层 - 根据环境自动切换数据源
// 开发环境：使用 Mock 数据（通过 Umi mock）
// Qlik Extension 环境：直接使用 Mock 数据（无后端服务器）
// 生产环境：对接 Qlik Sense

import * as mockData from './mock-data';

// 判断是否为开发环境（Umi dev server）
const isDevelopment = process.env.NODE_ENV === 'development';

// 判断是否在 Qlik Extension 环境（无后端服务器）
const isQlikExtension = typeof window !== 'undefined' && 
  (window.location.protocol === 'file:' || 
   window.location.hostname === 'localhost' && !process.env.UMI_APP_QLIK_URL);

// 非开发环境且配置了 Qlik 连接时使用 Qlik 服务
let qlikService: any = null;
if (!isDevelopment && process.env.UMI_APP_QLIK_URL) {
  import('./qlik-service').then(module => {
    qlikService = module;
  });
}

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
  // 1. 优先使用 Qlik 服务（生产环境且配置了 Qlik 连接）
  if (!isDevelopment && qlikService) {
    const methodName = endpoint.replace('/', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    const capitalized = methodName.charAt(0).toUpperCase() + methodName.slice(1);
    const method = qlikService[`fetch${capitalized}`];
    if (method) {
      return method(params);
    }
  }

  // 2. Qlik Extension 环境或无后端服务器时，直接使用 Mock 数据
  if (isQlikExtension || !isDevelopment) {
    const methodName = endpoint.replace('/', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    const capitalized = methodName.charAt(0).toUpperCase() + methodName.slice(1);
    const method = mockData[`get${capitalized}` as keyof typeof mockData];
    if (typeof method === 'function') {
      return (method as Function)(params);
    }
  }

  // 3. 开发环境使用 Umi Mock 服务器
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
