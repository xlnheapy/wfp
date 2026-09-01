// Mock API 数据 - 对应 14 个接口
import {
  getFmWfpList,
  getRrMetrics,
  getIncomeMetrics,
  getRetentionMetrics,
  getRrTrend,
  getIncomeTrend,
  getActivity,
  getNewCustomer,
  getOldCustomerSummary,
  getOldCustomerList,
  getPolicySummary,
  getPolicyList,
  getFundSummary,
  getFundList
} from '../src/services/mock-data'

interface QueryParams {
  fm_id?: string
  wfp_id?: string
  time_filter?: string
}

function getParams(query: any): QueryParams {
  return {
    fm_id: query.fm_id,
    wfp_id: query.wfp_id,
    time_filter: query.time_filter
  }
}

export default {
  // 1. FM和WFP列表
  'GET /api/fm-wfp-list': (req: any, res: any) => {
    res.json({ success: true, data: getFmWfpList() })
  },

  // 2. RR指标
  'GET /api/rr-metrics': (req: any, res: any) => {
    const params = getParams(req.query)
    res.json({ success: true, data: getRrMetrics(params) })
  },

  // 3. 收入指标
  'GET /api/income-metrics': (req: any, res: any) => {
    const params = getParams(req.query)
    res.json({ success: true, data: getIncomeMetrics(params) })
  },

  // 4. 续保率指标
  'GET /api/retention-metrics': (req: any, res: any) => {
    const params = getParams(req.query)
    res.json({ success: true, data: getRetentionMetrics(params) })
  },

  // 5. RR指标趋势
  'GET /api/rr-trend': (req: any, res: any) => {
    const params = getParams(req.query)
    res.json({ success: true, data: getRrTrend(params) })
  },

  // 6. 收入指标趋势
  'GET /api/income-trend': (req: any, res: any) => {
    const params = getParams(req.query)
    res.json({ success: true, data: getIncomeTrend(params) })
  },

  // 7. 活动跟踪
  'GET /api/activity': (req: any, res: any) => {
    const params = getParams(req.query)
    res.json({ success: true, data: getActivity(params) })
  },

  // 8. 新客运营
  'GET /api/new-customer': (req: any, res: any) => {
    const params = getParams(req.query)
    res.json({ success: true, data: getNewCustomer(params) })
  },

  // 9. 老客运营汇总
  'GET /api/old-customer-summary': (req: any, res: any) => {
    const params = getParams(req.query)
    res.json({ success: true, data: getOldCustomerSummary(params) })
  },

  // 10. 老客运营列表
  'GET /api/old-customer-list': (req: any, res: any) => {
    const params = getParams(req.query)
    res.json({ success: true, data: getOldCustomerList(params) })
  },

  // 11. 保单跟踪汇总
  'GET /api/policy-summary': (req: any, res: any) => {
    const params = getParams(req.query)
    res.json({ success: true, data: getPolicySummary(params) })
  },

  // 12. 保单跟踪列表
  'GET /api/policy-list': (req: any, res: any) => {
    const params = getParams(req.query)
    res.json({ success: true, data: getPolicyList(params) })
  },

  // 13. 基金跟踪汇总
  'GET /api/fund-summary': (req: any, res: any) => {
    const params = getParams(req.query)
    res.json({ success: true, data: getFundSummary(params) })
  },

  // 14. 基金跟踪列表
  'GET /api/fund-list': (req: any, res: any) => {
    const params = getParams(req.query)
    res.json({ success: true, data: getFundList(params) })
  }
}
