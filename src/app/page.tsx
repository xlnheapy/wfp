'use client'

import { useState, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'

// 原始mock数据
const mockData = {
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

// 生成模拟业务数据，完全复刻原始JS逻辑
function generateData(timeFilter: string) {
  const isQuarter = timeFilter.includes('quarter');
  const months = isQuarter ? ['Q1','Q2','Q3','Q4'] : ['1月','2月','3月','4月','5月','6月'];

  const rrTotal = Math.floor(Math.random() * 50000) + 40000;
  const rrTarget = 50000;
  const rrRate = (rrTotal / rrTarget) * 100;

  const incomeTotal = rrTotal * 0.8;
  const fyc = incomeTotal * 0.6;
  const renewalComm = incomeTotal * 0.25;
  const fundIncome = incomeTotal * 0.15;

  const trendRR = months.map(() => Math.floor(Math.random() * 50000) + 30000);
  const trendInc = months.map(() => Math.floor(Math.random() * 40000) + 25000);
  const trendTarget = 50000;

  return {
    rr: {
      total: rrTotal,
      target: rrTarget,
      rate: rrRate,
      insuranceNew: Math.floor(rrTotal * 0.4),
      insuranceRenew: Math.floor(rrTotal * 0.3),
      fund: Math.floor(rrTotal * 0.3),
      people70: Math.floor(Math.random() * 10) + 5
    },
    income: {
      total: incomeTotal,
      fyc,
      fycShare: (fyc / incomeTotal * 100).toFixed(1),
      renewal: renewalComm,
      renewalShare: (renewalComm / incomeTotal * 100).toFixed(1),
      fundInc: fundIncome,
      fundShare: (fundIncome / incomeTotal * 100).toFixed(1)
    },
    retention: {
      anp13: Math.floor(Math.random() * 30 + 60),
      count13: Math.floor(Math.random() * 80),
      anp25: Math.floor(Math.random() * 30 + 40),
      count25: Math.floor(Math.random() * 40)
    },
    activity: {
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
    },
    customerOps: {
      new: {
        events: { count: Math.floor(Math.random()*5), target:5, rate:(Math.random()*100).toFixed(1), mtdContact:(Math.random()*100).toFixed(1), mtdMeet:(Math.random()*100).toFixed(1) },
        self: { count: Math.floor(Math.random()*10), target:8, rate:(Math.random()*100).toFixed(1), mtdContact:(Math.random()*100).toFixed(1), mtdMeet:(Math.random()*100).toFixed(1) }
      },
      old: {
        total: Math.floor(Math.random()*200),
        callList: Math.floor(Math.random()*100),
        callListContactRate: (Math.random()*100).toFixed(1),
        callListMeetRate: (Math.random()*100).toFixed(1),
        table: [
          {type:"Non-NHC Customer Top-up", count:18, target:50, mtdContact:"45%", mtdMeet:"18%", callList:10, callListContact:"50%", callListMeet:"20%"},
          {type:"Non-NHC existing leads", count:50, target:80, mtdContact:"36%", mtdMeet:"18%", callList:30, callListContact:"40%", callListMeet:"16%"},
          {type:"NHC", count:18, target:50, mtdContact:"48%", mtdMeet:"36%", callList:5, callListContact:"100%", callListMeet:"60%"}
        ]
      }
    },
    policyFund: {
      policy: {
        active: {count:128, aum:500000},
        pendingRenew: {count:30, aum:150000},
        orphan: {count:15, aum:90000},
        table: [
          {type:"已签待扣保单", count:5, policyCount:5, aum:50000, priority:"urgent", suggestion:"立即跟进扣款"},
          {type:"本月待续期（逾期-66天）", count:10, policyCount:10, aum:120000, priority:"important", suggestion:"电话提醒续费"},
          {type:"本月待续期（未逾期）", count:15, policyCount:15, aum:120000, priority:"normal", suggestion:"发送续费通知"},
          {type:"近30天失效", count:5, policyCount:5, aum:30000, priority:"normal", suggestion:"尝试复效挽回"}
        ]
      },
      fund: {
        holding: {count:80, aum:2000000},
        huikunbao: {count:40, aum:500000},
        fundNoIns: {count:28, aum:300000},
        table: [
          {type:"赎回（在途）", count:3, orderCount:3, orderAmount:50000, priority:"urgent", suggestion:"确认到账"},
          {type:"赎回（已确认）", count:5, orderCount:5, orderAmount:120000, priority:"important", suggestion:"资金再配置建议"},
          {type:"申购（在途）", count:2, orderCount:2, orderAmount:30000, priority:"normal", suggestion:"确认份额"}
        ]
      }
    },
    trends: {
      months,
      rrValues: trendRR,
      incomeValues: trendInc,
      target: trendTarget
    }
  }
}

// 优先级标签
function getPriorityLabel(p: string) {
  if(p === 'urgent') return '紧急';
  if(p === 'important') return '重要';
  return '常规';
}

// 活动表格行
function generateActivityRows(activity: ReturnType<typeof generateData>['activity']) {
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
  const [currentSelection, setCurrentSelection] = useState({fmId:'fm001', wfpId:null as string | null});
  const [currentTimeFilter, setCurrentTimeFilter] = useState('current_month');
  const [currentChartType, setCurrentChartType] = useState('rr');
  const [data, setData] = useState<ReturnType<typeof generateData> | null>(null);

  // 初始化加载数据
  useEffect(()=>{
    const d = generateData(currentTimeFilter);
    setData(d);
  }, [currentTimeFilter]);

  // FM切换
  const handleFmChange = (fmId: string)=>{
    const fm = mockData.fms.find(f=>f.id === fmId);
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

  if(!data) return <div>Loading...</div>

  const currentFm = mockData.fms.find(f=>f.id === currentSelection.fmId);
  const currentWfp = currentFm?.wfps?.find(w=>w.id === currentSelection.wfpId);
  const title = currentWfp ? `${currentFm?.name} 团队业绩诊断：${currentWfp.name} 业绩诊断` : `${currentFm?.name} 团队业绩诊断`;

  // 图表数据
  const chartData = data.trends.months.map((m,i)=>({
    name: m,
    rr: data.trends.rrValues[i],
    income: data.trends.incomeValues[i],
    target: data.trends.target
  }));

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
          {mockData.fms.map(fm=>(
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
              <span style={{fontSize:'12px', fontWeight:'normal', color:'#666'}}>目标：{data.rr.target.toLocaleString()}</span>
            </div>
            <div className="rr-total-block">
              <div className="rr-total-main">
                <span className="rr-total-label">RR汇总</span>
                <span className="rr-total-val">{data.rr.total.toLocaleString()}</span>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span className="rr-meta">完成人数：<strong>{data.rr.people70}</strong></span>
                <span className="rr-rate-badge" style={{backgroundColor: data.rr.rate >=100 ? '#e6ffed' : '#fffff0', color: data.rr.rate >=100 ? 'var(--success-green)' : 'var(--alert-red)'}}>
                  {data.rr.rate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="metric-list">
              <div className="metric-item insurance-new">
                <span className="item-label">首年RR</span>
                <span className="item-val">{data.rr.insuranceNew.toLocaleString()}</span>
              </div>
              <div className="metric-item insurance-renew">
                <span className="item-label">续保RR</span>
                <span className="item-val">{data.rr.insuranceRenew.toLocaleString()}</span>
              </div>
              <div className="metric-item fund">
                <span className="item-label">基金RR</span>
                <span className="item-val">{data.rr.fund.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Income指标卡片 */}
          <div className="metric-card">
            <div className="card-header">
              <span>收入指标</span>
              <span style={{fontSize:'12px', background:'#fff1f0', padding:'2px 6px', borderRadius:'4px', color:'var(--alert-red)'}}>
                环比 {data.income.total > 0 ? '↑' : '↓'}
              </span>
            </div>
            <div className="rr-total-block">
              <div className="rr-total-main">
                <span className="rr-total-label">总收入</span>
                <span className="rr-total-val">{data.income.total.toLocaleString()}</span>
              </div>
              <div style={{fontSize:'12px', color:'#666', marginTop:'10px'}}>
                构成：FYC {data.income.fycShare}%｜续期 {data.income.renewalShare}%｜基金 {data.income.fundShare}%
              </div>
            </div>
            <div className="metric-list">
              <div className="metric-item fyc">
                <span className="item-label">FYC</span>
                <span className="item-val">{data.income.fyc.toLocaleString()}</span>
                <span className="item-detail">{data.income.fycShare}%</span>
              </div>
              <div className="metric-item renewal">
                <span className="item-label">续期佣金</span>
                <span className="item-val">{data.income.renewal.toLocaleString()}</span>
                <span className="item-detail">{data.income.renewalShare}%</span>
              </div>
              <div className="metric-item fund-inc">
                <span className="item-label">基金收入</span>
                <span className="item-val">{data.income.fundInc.toLocaleString()}</span>
                <span className="item-detail">{data.income.fundShare}%</span>
              </div>
            </div>
          </div>

          {/* Retention指标卡片 */}
          <div className="metric-card">
            <div className="card-header">续保率指标</div>
            <div className="retention-grid">
              <div className="retention-card">
                <div className="retention-val">{data.retention.anp13}%</div>
                <div className="retention-label">13月续保率<br/>(ANP)</div>
              </div>
              <div className="retention-card">
                <div className="retention-val">{data.retention.count13}</div>
                <div className="retention-label">13月续保<br/>(件数)</div>
              </div>
              <div className="retention-card">
                <div className="retention-val">{data.retention.anp25}%</div>
                <div className="retention-label">25月续保率<br/>(ANP)</div>
              </div>
              <div className="retention-card">
                <div className="retention-val">{data.retention.count25}</div>
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
                    axisPointer: { type: 'shadow' }
                  },
                  legend: {
                    data: ['RR', '目标'],
                    bottom: 0
                  },
                  grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '15%',
                    top: '10%',
                    containLabel: true
                  },
                  xAxis: {
                    type: 'category',
                    data: chartData.map(d => d.name),
                    axisLine: { lineStyle: { color: '#ccc' } },
                    axisLabel: { color: '#666' }
                  },
                  yAxis: {
                    type: 'value',
                    axisLine: { show: false },
                    splitLine: { lineStyle: { color: '#eee', type: 'dashed' } },
                    axisLabel: { color: '#666' }
                  },
                  series: [
                    {
                      name: 'RR',
                      type: 'bar',
                      data: chartData.map(d => d.rr),
                      itemStyle: { color: '#d51e27', borderRadius: [4, 4, 0, 0] },
                      barWidth: '40%'
                    },
                    {
                      name: '目标',
                      type: 'bar',
                      data: chartData.map(d => d.target),
                      itemStyle: { color: '#c5a055', borderRadius: [4, 4, 0, 0] },
                      barWidth: '40%'
                    }
                  ]
                }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'axis'
                  },
                  legend: {
                    data: ['收入', '目标'],
                    bottom: 0
                  },
                  grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '15%',
                    top: '10%',
                    containLabel: true
                  },
                  xAxis: {
                    type: 'category',
                    data: chartData.map(d => d.name),
                    boundaryGap: false,
                    axisLine: { lineStyle: { color: '#ccc' } },
                    axisLabel: { color: '#666' }
                  },
                  yAxis: {
                    type: 'value',
                    axisLine: { show: false },
                    splitLine: { lineStyle: { color: '#eee', type: 'dashed' } },
                    axisLabel: { color: '#666' }
                  },
                  series: [
                    {
                      name: '收入',
                      type: 'line',
                      data: chartData.map(d => d.income),
                      smooth: true,
                      lineStyle: { color: '#d51e27', width: 2 },
                      itemStyle: { color: '#d51e27' },
                      areaStyle: {
                        color: {
                          type: 'linear',
                          x: 0, y: 0, x2: 0, y2: 1,
                          colorStops: [
                            { offset: 0, color: 'rgba(213, 30, 39, 0.3)' },
                            { offset: 1, color: 'rgba(213, 30, 39, 0.05)' }
                          ]
                        }
                      }
                    },
                    {
                      name: '目标',
                      type: 'line',
                      data: chartData.map(d => d.target),
                      smooth: true,
                      lineStyle: { color: '#c5a055', width: 2, type: 'dashed' },
                      itemStyle: { color: '#c5a055' }
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
            {generateActivityRows(data.activity).map((row,i)=>(
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
              <span>新增客户人数：{data.customerOps.new.events.count + data.customerOps.new.self.count}</span>
              <span>目标：{data.customerOps.new.events.target + data.customerOps.new.self.target}</span>
              <span>完成率：{((data.customerOps.new.events.count + data.customerOps.new.self.count) / (data.customerOps.new.events.target + data.customerOps.new.self.target) *100).toFixed(1)}%</span>
            </div>
            <div className="ops-grid-2">
              <div className="ops-sub-card">
                <h4>新客事件</h4>
                <div className="ops-stat-row">
                  <span>人数</span>
                  <span className="ops-stat-val">{data.customerOps.new.events.count}</span>
                </div>
                <div className="ops-stat-row">
                  <span>MTD联系率</span>
                  <span className="ops-stat-val">{data.customerOps.new.events.mtdContact}%</span>
                </div>
                <div className="ops-stat-row">
                  <span>MTD会面率</span>
                  <span className="ops-stat-val">{data.customerOps.new.events.mtdMeet}%</span>
                </div>
              </div>
              <div className="ops-sub-card">
                <h4>自主新客</h4>
                <div className="ops-stat-row">
                  <span>人数</span>
                  <span className="ops-stat-val">{data.customerOps.new.self.count}</span>
                </div>
                <div className="ops-stat-row">
                  <span>MTD联系率</span>
                  <span className="ops-stat-val">{data.customerOps.new.self.mtdContact}%</span>
                </div>
                <div className="ops-stat-row">
                  <span>MTD会面率</span>
                  <span className="ops-stat-val">{data.customerOps.new.self.mtdMeet}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ops-card">
            <div className="card-header">老客运营</div>
            <div className="kpi-row-horizontal">
              <div className="kpi-box-h">
                <div className="val">{data.customerOps.old.total}</div>
                <div className="sub-val">客户人数</div>
                <div className="lbl">Call List 人数</div>
              </div>
              <div className="kpi-box-h">
                <div className="val">{data.customerOps.old.callList}</div>
                <div className="sub-val">Call List</div>
                <div className="lbl">Call List 人数</div>
              </div>
              <div className="kpi-box-h">
                <div className="val">{data.customerOps.old.callListContactRate}%</div>
                <div className="sub-val">Call List 联系率</div>
                <div className="lbl">Call List 联系率</div>
              </div>
              <div className="kpi-box-h">
                <div className="val">{data.customerOps.old.callListMeetRate}%</div>
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
                {data.customerOps.old.table.map((row,idx)=>(
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
                <div className="val">{data.policyFund.fund.holding.count}</div>
                <div className="sub-val">AUM：{(data.policyFund.fund.holding.aum / 10000).toFixed(1)}万</div>
                <div className="lbl">持仓客户数/AUM</div>
              </div>
              <div className="kpi-box-h">
                <div className="val">{data.policyFund.fund.huikunbao.count}</div>
                <div className="sub-val">AUM：{(data.policyFund.fund.huikunbao.aum / 10000).toFixed(1)}万</div>
                <div className="lbl">汇钱宝客户/AUM</div>
              </div>
              <div className="kpi-box-h">
                <div className="val">{data.policyFund.fund.fundNoIns.count}</div>
                <div className="sub-val">AUM：{(data.policyFund.fund.fundNoIns.aum / 10000).toFixed(1)}万</div>
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
                {data.policyFund.fund.table.map((row,i)=>(
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
