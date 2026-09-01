import { useState, useEffect, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import '@/global/global.css'
import {
  fetchFmWfpList,
  fetchRrMetrics,
  fetchIncomeMetrics,
  fetchRetentionMetrics,
  fetchRrTrend,
  fetchIncomeTrend,
  fetchActivity,
  fetchNewCustomer,
  fetchOldCustomerSummary,
  fetchOldCustomerList,
  fetchPolicySummary,
  fetchPolicyList,
  fetchFundSummary,
  fetchFundList
} from '@/services/api'

// FM/WFP 列表类型
interface FmItem {
  id: string
  name: string
  wfps: Array<{ id: string; name: string }>
}

// 数据类型
interface RrMetrics {
  total: number; target: number; rate: number
  insuranceNew: number; insuranceRenew: number; fund: number; people70: number
}
interface IncomeMetrics {
  total: number; fyc: number; fycShare: string
  renewal: number; renewalShare: string
  fundInc: number; fundShare: string
}
interface RetentionMetrics {
  anp13: number; count13: number; anp25: number; count25: number
}
interface RrTrendData {
  months: string[]
  rrValues: number[]
  target: number
}
interface IncomeTrendData {
  months: string[]
  incomeValues: number[]
  target: number
}
interface ActivityData {
  calls: number; callsLong: number; meetings: number; newList: number
  fundContacts: number; fundMeetings: number; wechatAdd: number; wechatInt: number
  newClients: number; newAUM: number; simplePolicies: number; complexPolicies: number
}
interface NewCustomerData {
  events: { count: number; target: number; rate: string; mtdContact: string; mtdMeet: string }
  self: { count: number; target: number; rate: string; mtdContact: string; mtdMeet: string }
}
interface OldCustomerSummary {
  total: number; callList: number; callListContactRate: string; callListMeetRate: string
}
interface OldCustomerRow {
  type: string; count: number; target: number; mtdContact: string; mtdMeet: string
  callList: number; callListContact: string; callListMeet: string
}
interface PolicySummary {
  active: { count: number; aum: number }
  pendingRenew: { count: number; aum: number }
  orphan: { count: number; aum: number }
}
interface PolicyRow {
  type: string; count: number; policyCount: number; aum: number; priority: string; suggestion: string
}
interface FundSummary {
  holding: { count: number; aum: number }
  huikunbao: { count: number; aum: number }
  fundNoIns: { count: number; aum: number }
}
interface FundRow {
  type: string; count: number; orderCount: number; orderAmount: number; priority: string; suggestion: string
}

// 优先级标签
function getPriorityLabel(p: string) {
  if(p === 'urgent') return '紧急';
  if(p === 'important') return '重要';
  return '常规';
}

// 活动表格行
function generateActivityRows(activity: ActivityData) {
  const items = [
    {name:"联系人数 (>0s)", target:150, val: activity.calls},
    {name:"有效联系 (>90s)", target:80, val: activity.callsLong},
    {name:"会面人数", target:20, val: activity.meetings},
    {name:"Call List 人数", target:100, val: activity.newList},
    {name:"持有基金客户联系", target:40, val: activity.fundContacts},
    {name:"基金持有会面", target:8, val: activity.fundMeetings},
    {name:"企微添加人数", target:30, val: activity.wechatAdd},
    {name:"企微互动人数", target:60, val: activity.wechatInt},
    {name:"新增保险新客", target:8, val: activity.newClients},
    {name:"基金新增 AUM", target:80000, val: activity.newAUM, isNum:true},
    {name:"保险件数（简单）", target:12, val: activity.simplePolicies},
    {name:"保险件数（复杂）", target:4, val: activity.complexPolicies},
  ]
  return items.map(item=>{
    const status = item.val >= item.target ? 'status-done' : 'status-pending';
    const statusText = item.val >= item.target ? '达成' : '未达成';
    const displayVal = item.isNum ? item.val.toLocaleString() : item.val;
    const displayTarget = item.isNum ? item.target.toLocaleString() : item.target;
    return {
      name: item.name,
      target: displayTarget,
      val: displayVal,
      status,
      statusText
    }
  })
}

export default function App() {
  const [fmList, setFmList] = useState<FmItem[]>([])
  const [currentSelection, setCurrentSelection] = useState({fmId:'fm001', wfpId:null as string | null});
  const [currentTimeFilter, setCurrentTimeFilter] = useState('current_month');
  const [currentChartType, setCurrentChartType] = useState('rr');

  // 各模块数据状态
  const [rrMetrics, setRrMetrics] = useState<RrMetrics | null>(null)
  const [incomeMetrics, setIncomeMetrics] = useState<IncomeMetrics | null>(null)
  const [retentionMetrics, setRetentionMetrics] = useState<RetentionMetrics | null>(null)
  const [rrTrend, setRrTrend] = useState<RrTrendData | null>(null)
  const [incomeTrend, setIncomeTrend] = useState<IncomeTrendData | null>(null)
  const [activity, setActivity] = useState<ActivityData | null>(null)
  const [newCustomer, setNewCustomer] = useState<NewCustomerData | null>(null)
  const [oldCustomerSummary, setOldCustomerSummary] = useState<OldCustomerSummary | null>(null)
  const [oldCustomerList, setOldCustomerList] = useState<OldCustomerRow[]>([])
  const [policySummary, setPolicySummary] = useState<PolicySummary | null>(null)
  const [policyList, setPolicyList] = useState<PolicyRow[]>([])
  const [fundSummary, setFundSummary] = useState<FundSummary | null>(null)
  const [fundList, setFundList] = useState<FundRow[]>([])

  // 构建查询参数
  const getQueryParams = useCallback(() => ({
    fm_id: currentSelection.fmId,
    wfp_id: currentSelection.wfpId || undefined,
    time_filter: currentTimeFilter
  }), [currentSelection.fmId, currentSelection.wfpId, currentTimeFilter])

  // 加载所有数据
  const loadAllData = useCallback(async () => {
    const params = getQueryParams()
    try {
      const [rr, income, retention, rrTr, incomeTr, act, newCust, oldSum, oldLst, polSum, polLst, fndSum, fndLst] = await Promise.all([
        fetchRrMetrics(params),
        fetchIncomeMetrics(params),
        fetchRetentionMetrics(params),
        fetchRrTrend(params),
        fetchIncomeTrend(params),
        fetchActivity(params),
        fetchNewCustomer(params),
        fetchOldCustomerSummary(params),
        fetchOldCustomerList(params),
        fetchPolicySummary(params),
        fetchPolicyList(params),
        fetchFundSummary(params),
        fetchFundList(params)
      ])
      setRrMetrics(rr)
      setIncomeMetrics(income)
      setRetentionMetrics(retention)
      setRrTrend({ months: rrTr.months, rrValues: rrTr.rrValues, target: rrTr.target })
      setIncomeTrend({ months: incomeTr.months, incomeValues: incomeTr.incomeValues, target: incomeTr.target })
      setActivity(act)
      setNewCustomer(newCust)
      setOldCustomerSummary(oldSum)
      setOldCustomerList(oldLst.table)
      setPolicySummary(polSum)
      setPolicyList(polLst.table)
      setFundSummary(fndSum)
      setFundList(fndLst.table)
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  }, [getQueryParams])

  // 初始化加载 FM/WFP 列表
  useEffect(() => {
    fetchFmWfpList().then(data => {
      setFmList(data.fms)
      if (data.fms.length > 0) {
        const firstWfp = data.fms[0].wfps?.[0]?.id || null
        setCurrentSelection({ fmId: data.fms[0].id, wfpId: firstWfp })
      }
    })
  }, [])

  // 当选择条件变化时重新加载数据
  useEffect(() => {
    if (fmList.length > 0) {
      loadAllData()
    }
  }, [fmList.length, loadAllData])

  // FM切换
  const handleFmChange = (fmId: string)=>{
    const fm = fmList.find(f=>f.id === fmId);
    const firstWfp = fm?.wfps?.[0]?.id || null;
    setCurrentSelection({fmId, wfpId:firstWfp});
  }

  // WFP切换
  const handleWfpChange = (wfpId: string)=>{
    setCurrentSelection(prev=> ({...prev, wfpId}));
  }

  // 时间筛选变更
  const handleTimeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>)=>{
    setCurrentTimeFilter(e.target.value);
  }

  if(!rrMetrics || !incomeMetrics || !retentionMetrics || !activity || !newCustomer || !oldCustomerSummary || !policySummary || !fundSummary) return <div>Loading...</div>

  const currentFm = fmList.find(f=>f.id === currentSelection.fmId);
  const currentWfp = currentFm?.wfps?.find(w=>w.id === currentSelection.wfpId);
  const title = currentWfp ? `${currentFm?.name} 团队业绩诊断：${currentWfp.name} 业绩诊断` : `${currentFm?.name} 团队业绩诊断`;

  // RR指标趋势图表数据（堆叠柱状图 + 完成率折线）
  const rrChartData = (rrTrend?.months || []).map((m, i) => {
    const rrVal = rrTrend?.rrValues?.[i] || 0;
    const rrTarget = rrTrend?.target || 50000;
    return {
      name: m,
      rr: rrVal,
      target: rrTarget,
      // 堆叠柱状图数据（首年FYC + 续保 + 基金）
      fyc: Math.round(rrVal * 0.45),
      renewal: Math.round(rrVal * 0.35),
      fund: Math.round(rrVal * 0.20),
      // 完成率（RR / 目标 * 100）
      completionRate: Math.round((rrVal / rrTarget) * 100)
    };
  });

  // 收入指标趋势图表数据（堆叠柱状图 + 完成率折线）
  const incomeChartData = (incomeTrend?.months || []).map((m, i) => {
    const incVal = incomeTrend?.incomeValues?.[i] || 0;
    const incTarget = incomeTrend?.target || 50000;
    return {
      name: m,
      income: incVal,
      target: incTarget,
      // 堆叠柱状图数据（首年FYC + 续保 + 基金）
      fyc: Math.round(incVal * 0.45),
      renewal: Math.round(incVal * 0.35),
      fund: Math.round(incVal * 0.20),
      // 完成率（收入 / 目标 * 100）
      completionRate: Math.round((incVal / incTarget) * 100)
    };
  });

  return (
    <>
      <header>
        <div className="header-left">
          <h1>WFP销售人员诊断中心</h1>
        </div>
        <div className="header-controls">
          <select id="timeFilter" value={currentTimeFilter} onChange={handleTimeFilterChange}>
            <option value="current_month">本月</option>
            <option value="last_month">上月</option>
            <option value="current_quarter">本季度</option>
            <option value="last_quarter">上季度</option>
          </select>
        </div>
      </header>

      <div className="top-nav" id="topNav">
        <select className="nav-fm-select" value={currentSelection.fmId} onChange={(e)=>handleFmChange(e.target.value)}>
          {fmList.map((fm: FmItem)=>(
            <option key={fm.id} value={fm.id}>{fm.name}</option>
          ))}
        </select>
        {currentFm?.wfps?.map(wfp=>(
          <div
            key={wfp.id}
            className={`nav-item ${currentSelection.wfpId === wfp.id ? 'active' : ''}`}
            onClick={()=>handleWfpChange(wfp.id)}
          >
            <span>{wfp.name}</span>
          </div>
        ))}
      </div>

      <div className="content-area" id="contentArea">
        <h2 style={{marginBottom:'25px', color:'var(--hsbc-red)', fontSize:'22px'}}>{title}</h2>

        {/* 1.Performance Metrics */}
        <div className="section-title">业绩指标中心</div>
        <div className="metrics-grid">
          {/* RR指标卡片 */}
          <div className="metric-card">
            <div className="card-header">
              <span>RR指标</span>
              <span style={{fontSize:'12px', fontWeight:'normal', color:'#666'}}>目标：{rrMetrics.target.toLocaleString()}</span>
            </div>
            <div className="rr-total-block">
              <div className="rr-total-main">
                <span className="rr-total-label">RR汇总</span>
                <span className="rr-total-val">{rrMetrics.total.toLocaleString()}</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span className="rr-meta">完成人数：<strong>{rrMetrics.people70}</strong></span>
                <span className="rr-rate-badge" style={{backgroundColor: rrMetrics.rate >=100 ? '#e6ffed' : '#fffff0', color: rrMetrics.rate >=100 ? 'var(--success-green)' : 'var(--alert-red)'}}>
                  {rrMetrics.rate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="metric-list">
              <div className="metric-item insurance-new">
                <span className="item-label">首年RR</span>
                <span className="item-val">{rrMetrics.insuranceNew.toLocaleString()}</span>
              </div>
              <div className="metric-item insurance-renew">
                <span className="item-label">续保RR</span>
                <span className="item-val">{rrMetrics.insuranceRenew.toLocaleString()}</span>
              </div>
              <div className="metric-item fund">
                <span className="item-label">基金RR</span>
                <span className="item-val">{rrMetrics.fund.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Income指标卡片 */}
          <div className="metric-card">
            <div className="card-header">
              <span>收入指标</span>
              <span style={{fontSize:'12px', background:'#fff1f0', padding:'2px 6px', borderRadius:'4px', color:'var(--alert-red)'}}>
                环比 {incomeMetrics.total > 0 ? '↑' : '↓'}
              </span>
            </div>
            <div className="rr-total-block">
              <div className="rr-total-main">
                <span className="rr-total-label">总收入</span>
                <span className="rr-total-val">{incomeMetrics.total.toLocaleString()}</span>
              </div>
              <div style={{fontSize:'12px', color:'#666', marginTop:'10px'}}>
                构成：FYC {incomeMetrics.fycShare}%｜续期 {incomeMetrics.renewalShare}%｜基金 {incomeMetrics.fundShare}%
              </div>
            </div>
            <div className="metric-list">
              <div className="metric-item fyc">
                <span className="item-label">FYC</span>
                <span className="item-val">{incomeMetrics.fyc.toLocaleString()}</span>
                <span className="item-detail">{incomeMetrics.fycShare}%</span>
              </div>
              <div className="metric-item renewal">
                <span className="item-label">续期佣金</span>
                <span className="item-val">{incomeMetrics.renewal.toLocaleString()}</span>
                <span className="item-detail">{incomeMetrics.renewalShare}%</span>
              </div>
              <div className="metric-item fund-inc">
                <span className="item-label">基金收入</span>
                <span className="item-val">{incomeMetrics.fundInc.toLocaleString()}</span>
                <span className="item-detail">{incomeMetrics.fundShare}%</span>
              </div>
            </div>
          </div>

          {/* Retention指标卡片 */}
          <div className="metric-card">
            <div className="card-header">续保率指标</div>
            <div className="retention-grid">
              <div className="retention-card">
                <div className="retention-val">{retentionMetrics.anp13}%</div>
                <div className="retention-label">13月续保率<br/>(ANP)</div>
              </div>
              <div className="retention-card">
                <div className="retention-val">{retentionMetrics.count13}</div>
                <div className="retention-label">13月续保<br/>(件数)</div>
              </div>
              <div className="retention-card">
                <div className="retention-val">{retentionMetrics.anp25}%</div>
                <div className="retention-label">25月续保率<br/>(ANP)</div>
              </div>
              <div className="retention-card">
                <div className="retention-val">{retentionMetrics.count25}</div>
                <div className="retention-label">25月续保<br/>(件数)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="chart-container">
          <div className="chart-tabs">
            <div className={`chart-tab ${currentChartType === 'rr' ? 'active' : ''}`} onClick={()=>setCurrentChartType('rr')}>RR指标趋势</div>
            <div className={`chart-tab ${currentChartType === 'income' ? 'active' : ''}`} onClick={()=>setCurrentChartType('income')}>收入指标趋势</div>
          </div>
          <div className="chart-wrapper">
            {currentChartType === 'rr' ? (
              <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    formatter: (params: any[]) => {
                      let result = `<div style="font-weight:600;margin-bottom:4px">${params[0].name}</div>`;
                      let total = 0;
                      params.forEach((p: any) => {
                        if (p.seriesName === '完成率') {
                          result += `<div>${p.marker} ${p.seriesName}: <b>${p.value}%</b></div>`;
                        } else {
                          result += `<div>${p.marker} ${p.seriesName}: <b>${p.value}</b></div>`;
                          total += p.value;
                        }
                      });
                      result += `<div style="border-top:1px solid #eee;margin-top:4px;padding-top:4px">合计: <b>${total}</b></div>`;
                      return result;
                    }
                  },
                  legend: {
                    data: ['首年FYC', '续保', '基金', '完成率'],
                    bottom: 0
                  },
                  grid: {
                    left: '3%',
                    right: '8%',
                    bottom: '18%',
                    top: '10%',
                    containLabel: true
                  },
                  xAxis: {
                    type: 'category',
                    data: incomeChartData.map(d => d.name),
                    axisLine: { lineStyle: { color: '#ccc' } },
                    axisLabel: { color: '#666' }
                  },
                  yAxis: [
                    {
                      type: 'value',
                      name: '件数',
                      axisLine: { show: false },
                      splitLine: { lineStyle: { color: '#eee', type: 'dashed' } },
                      axisLabel: { color: '#666' }
                    },
                    {
                      type: 'value',
                      name: '完成率',
                      axisLine: { show: false },
                      splitLine: { show: false },
                      axisLabel: { color: '#666', formatter: '{value}%' }
                    }
                  ],
                  series: [
                    {
                      name: '首年FYC',
                      type: 'bar',
                      stack: 'rr',
                      data: incomeChartData.map(d => d.fyc),
                      itemStyle: { color: '#d51e27' },
                      barWidth: '40%'
                    },
                    {
                      name: '续保',
                      type: 'bar',
                      stack: 'rr',
                      data: incomeChartData.map(d => d.renewal),
                      itemStyle: { color: '#c5a055' }
                    },
                    {
                      name: '基金',
                      type: 'bar',
                      stack: 'rr',
                      data: incomeChartData.map(d => d.fund),
                      itemStyle: { color: '#e8dcc8', borderRadius: [4, 4, 0, 0] }
                    },
                    {
                      name: '完成率',
                      type: 'line',
                      yAxisIndex: 1,
                      data: incomeChartData.map(d => d.completionRate),
                      smooth: true,
                      lineStyle: { color: '#d51e27', width: 2 },
                      itemStyle: { color: '#d51e27' },
                      symbol: 'circle',
                      symbolSize: 6
                    }
                  ]
                }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'shadow' },
                    formatter: (params: any[]) => {
                      let result = `<div style="font-weight:600;margin-bottom:4px">${params[0].name}</div>`;
                      let total = 0;
                      params.forEach((p: any) => {
                        if (p.seriesName === '完成率') {
                          result += `<div>${p.marker} ${p.seriesName}: <b>${p.value}%</b></div>`;
                        } else {
                          result += `<div>${p.marker} ${p.seriesName}: <b>¥${p.value.toLocaleString()}</b></div>`;
                          total += p.value;
                        }
                      });
                      result += `<div style="border-top:1px solid #eee;margin-top:4px;padding-top:4px">合计: <b>¥${total.toLocaleString()}</b></div>`;
                      return result;
                    }
                  },
                  legend: {
                    data: ['首年FYC', '续保', '基金', '完成率'],
                    bottom: 0
                  },
                  grid: {
                    left: '3%',
                    right: '8%',
                    bottom: '18%',
                    top: '10%',
                    containLabel: true
                  },
                  xAxis: {
                    type: 'category',
                    data: incomeChartData.map(d => d.name),
                    axisLine: { lineStyle: { color: '#ccc' } },
                    axisLabel: { color: '#666' }
                  },
                  yAxis: [
                    {
                      type: 'value',
                      name: '金额',
                      axisLine: { show: false },
                      splitLine: { lineStyle: { color: '#eee', type: 'dashed' } },
                      axisLabel: { color: '#666' }
                    },
                    {
                      type: 'value',
                      name: '完成率',
                      axisLine: { show: false },
                      splitLine: { show: false },
                      axisLabel: { color: '#666', formatter: '{value}%' }
                    }
                  ],
                  series: [
                    {
                      name: '首年FYC',
                      type: 'bar',
                      stack: 'income',
                      data: incomeChartData.map(d => d.fyc),
                      itemStyle: { color: '#d51e27' },
                      barWidth: '40%'
                    },
                    {
                      name: '续保',
                      type: 'bar',
                      stack: 'income',
                      data: incomeChartData.map(d => d.renewal),
                      itemStyle: { color: '#c5a055' }
                    },
                    {
                      name: '基金',
                      type: 'bar',
                      stack: 'income',
                      data: incomeChartData.map(d => d.fund),
                      itemStyle: { color: '#e8dcc8', borderRadius: [4, 4, 0, 0] }
                    },
                    {
                      name: '完成率',
                      type: 'line',
                      yAxisIndex: 1,
                      data: incomeChartData.map(d => d.completionRate),
                      smooth: true,
                      lineStyle: { color: '#d51e27', width: 2 },
                      itemStyle: { color: '#d51e27' },
                      symbol: 'circle',
                      symbolSize: 6
                    }
                  ]
                }}
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </div>
          <div style={{marginTop:'15px', textAlign:'center'}}>
            <div className="legend-item" style={{display:'inline-flex', alignItems:'center', marginRight:'15px'}}>
              <div className="legend-color" style={{backgroundColor:'var(--hsbc-red)', width:'10px', height:'10px', marginRight:'5px', borderRadius:'2px'}}></div>
              <span>首年/FYC</span>
            </div>
            <div className="legend-item" style={{display:'inline-flex', alignItems:'center', marginRight:'15px'}}>
              <div className="legend-color" style={{backgroundColor:'var(--hsbc-gold)', width:'10px', height:'10px', marginRight:'5px', borderRadius:'2px'}}></div>
              <span>续保/续期</span>
            </div>
            <div className="legend-item" style={{display:'inline-flex', alignItems:'center', marginRight:'15px'}}>
              <div className="legend-color" style={{backgroundColor:'var(--hsbc-sand)', width:'10px', height:'10px', marginRight:'5px', borderRadius:'2px'}}></div>
              <span>基金</span>
            </div>
            <div className="legend-item" style={{display:'inline-flex', alignItems:'center'}}>
              <div className="legend-color" style={{backgroundColor:'var(--hsbc-red)', borderRadius:'50%', width:'10px', height:'10px', marginRight:'5px'}}></div>
              <span>完成率曲线</span>
            </div>
          </div>
        </div>

        {/* Activity Tracking */}
        <div className="section-title">活动跟踪</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>指标名称</th>
              <th>目标</th>
              <th>实际达成</th>
              <th>是否达成</th>
              <th>详情</th>
            </tr>
          </thead>
          <tbody>
            {generateActivityRows(activity).map((row,i)=>(
              <tr key={i}>
                <td>{row.name}</td>
                <td>{row.target}</td>
                <td>{row.val}</td>
                <td><span className={`status-badge ${row.status}`}>{row.statusText}</span></td>
                <td>详情</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Customer Ops */}
        <div className="section-title">客户运营</div>
        <div className="stacked-section">
          <div className="ops-card">
            <div className="card-header">新客运营</div>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px', fontWeight:'bold', color:'var(--hsbc-red)', fontSize:'14px'}}>
              <span>新增客户人数：{newCustomer.events.count + newCustomer.self.count}</span>
              <span>目标：{newCustomer.events.target + newCustomer.self.target}</span>
              <span>完成率：{((newCustomer.events.count + newCustomer.self.count) / (newCustomer.events.target + newCustomer.self.target) *100).toFixed(1)}%</span>
            </div>
            <div className="ops-grid-2">
              <div className="ops-sub-card">
                <h4>新客事件</h4>
                <div className="ops-stat-row">
                  <span>人数</span>
                  <span className="ops-stat-val">{newCustomer.events.count}</span>
                </div>
                <div className="ops-stat-row">
                  <span>MTD联系率</span>
                  <span className="ops-stat-val">{newCustomer.events.mtdContact}%</span>
                </div>
                <div className="ops-stat-row">
                  <span>MTD会面率</span>
                  <span className="ops-stat-val">{newCustomer.events.mtdMeet}%</span>
                </div>
              </div>
              <div className="ops-sub-card">
                <h4>自主新客</h4>
                <div className="ops-stat-row">
                  <span>人数</span>
                  <span className="ops-stat-val">{newCustomer.self.count}</span>
                </div>
                <div className="ops-stat-row">
                  <span>MTD联系率</span>
                  <span className="ops-stat-val">{newCustomer.self.mtdContact}%</span>
                </div>
                <div className="ops-stat-row">
                  <span>MTD会面率</span>
                  <span className="ops-stat-val">{newCustomer.self.mtdMeet}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ops-card">
            <div className="card-header">老客运营</div>
            <div className="kpi-row-horizontal">
              <div className="kpi-box-h">
                <div className="val">{oldCustomerSummary.total}</div>
                <div className="sub-val">客户人数</div>
                <div className="lbl">Call List 人数</div>
              </div>
              <div className="kpi-box-h">
                <div className="val">{oldCustomerSummary.callList}</div>
                <div className="sub-val">Call List</div>
                <div className="lbl">Call List 人数</div>
              </div>
              <div className="kpi-box-h">
                <div className="val">{oldCustomerSummary.callListContactRate}%</div>
                <div className="sub-val">Call List 联系率</div>
                <div className="lbl">Call List 联系率</div>
              </div>
              <div className="kpi-box-h">
                <div className="val">{oldCustomerSummary.callListMeetRate}%</div>
                <div className="sub-val">Call List 会面率</div>
                <div className="lbl">Call List 会面率</div>
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>客户类型</th>
                  <th>count</th>
                  <th>target</th>
                  <th>MTD联系率</th>
                  <th>MTD会面率</th>
                  <th>callList</th>
                  <th>callList联系率</th>
                  <th>callList会面率</th>
                </tr>
              </thead>
              <tbody>
                {oldCustomerList.map((row,idx)=>(
                  <tr key={idx}>
                    <td>{row.type}</td>
                    <td>{row.count}</td>
                    <td>{row.target}</td>
                    <td>{row.mtdContact}</td>
                    <td>{row.mtdMeet}</td>
                    <td>{row.callList}</td>
                    <td>{row.callListContact}</td>
                    <td>{row.callListMeet}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Fund Follow-up Card */}
          <div className="follow-up-card">
            <div className="card-header">基金跟踪</div>
            <div className="kpi-row-horizontal">
              <div className="kpi-box-h">
                <div className="val">{fundSummary.holding.count}</div>
                <div className="sub-val">AUM：{(fundSummary.holding.aum / 10000).toFixed(1)}万</div>
                <div className="lbl">持仓客户数/AUM</div>
              </div>
              <div className="kpi-box-h">
                <div className="val">{fundSummary.huikunbao.count}</div>
                <div className="sub-val">AUM：{(fundSummary.huikunbao.aum / 10000).toFixed(1)}万</div>
                <div className="lbl">汇钱宝客户/AUM</div>
              </div>
              <div className="kpi-box-h">
                <div className="val">{fundSummary.fundNoIns.count}</div>
                <div className="sub-val">AUM：{(fundSummary.fundNoIns.aum / 10000).toFixed(1)}万</div>
                <div className="lbl">持有基金无保险客户/AUM</div>
              </div>
            </div>
            <table className="data-table" style={{marginBottom:0}}>
              <thead>
                <tr>
                  <th>事项</th>
                  <th>客户数</th>
                  <th>订单数</th>
                  <th>订单金额</th>
                  <th>建议</th>
                  <th>详情</th>
                </tr>
              </thead>
              <tbody>
                {fundList.map((row,i)=>(
                  <tr key={i}>
                    <td>
                      <span className={`priority-label priority-${row.priority}`}>{getPriorityLabel(row.priority)}</span>
                      {row.type}
                    </td>
                    <td>{row.count}</td>
                    <td>{row.orderCount}</td>
                    <td>{row.orderAmount.toLocaleString()}</td>
                    <td>{row.suggestion}</td>
                    <td>详情</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
