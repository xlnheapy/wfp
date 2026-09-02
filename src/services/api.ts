// API 服务层 - 根据环境自动切换数据源
// 开发/测试环境：直接使用 Mock 数据（不封装 /api）
// 生产环境/Qlik Extension：对接 Qlik Sense

import * as qlikService from './qlik-service';
import * as mockData from './mock-data';

// 判断环境
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

interface QueryParams {
  fm_id?: string;
  wfp_id?: string;
  time_filter?: string;
}

async function fetchApi<T>(endpoint: string, params: QueryParams = {}): Promise<T> {
  // 1. 生产环境/Qlik Extension：使用 Qlik 服务
  if (isProduction) {
    const methodName = endpoint.replace('/', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    const capitalized = methodName.charAt(0).toUpperCase() + methodName.slice(1);
    const method = (qlikService as any)[`fetch${capitalized}`];
    if (method) {
      return method(params);
    }
  }

  // 2. 开发/测试环境：直接使用 Mock 数据（不封装 /api）
  const methodName = endpoint.replace('/', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  const capitalized = methodName.charAt(0).toUpperCase() + methodName.slice(1);
  const method = (mockData as any)[`get${capitalized}`];
  if (method) {
    return method(params);
  }

  throw new Error(`Unknown endpoint: ${endpoint}`);
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
