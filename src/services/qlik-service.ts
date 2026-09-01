// Qlik Sense 服务层 - 生产环境对接 Qlik
// @ts-ignore
import enigma from 'enigma.js';
// @ts-ignore
import schema from 'enigma.js/schemas/12.612.0.json';

// Qlik 连接配置（从环境变量读取）
const QLIK_CONFIG = {
  url: process.env.UMI_APP_QLIK_URL || 'wss://qlik.example.com',
  appId: process.env.UMI_APP_QLIK_APP_ID || '',
};

let qlikSession: any = null;

// 创建 Qlik 会话
async function createSession() {
  if (qlikSession) return qlikSession;

  const session = enigma.create({
    schema,
    url: QLIK_CONFIG.url,
  });

  qlikSession = await session.open();
  return qlikSession;
}

// 执行 Qlik 查询
async function executeQlikQuery(appId: string, query: string) {
  const session = await createSession();
  const app = await session.openDoc(appId);

  const result = await app.createSessionObject({
    qInfo: { qType: 'visualization' },
    qHyperCubeDef: {
      qDimensions: [],
      qMeasures: [],
      qInitialDataFetch: [{ qTop: 0, qLeft: 0, qHeight: 1000, qWidth: 10 }],
    },
  });

  const layout = await result.getLayout();
  return layout;
}

interface QueryParams {
  fm_id?: string;
  wfp_id?: string;
  time_filter?: string;
}

// 1. FM和WFP列表
export async function fetchFmWfpList() {
  const session = await createSession();
  const app = await session.openDoc(QLIK_CONFIG.appId);

  // 创建超立方体查询 FM 和 WFP 列表
  const object = await app.createSessionObject({
    qInfo: { qType: 'fm-wfp-list' },
    qHyperCubeDef: {
      qDimensions: [
        { qDef: { qFieldDefs: ['FM_ID'], qSortCriterias: [{ qSortByAscii: 1 }] } },
        { qDef: { qFieldDefs: ['FM_NAME'], qSortCriterias: [{ qSortByAscii: 1 }] } },
        { qDef: { qFieldDefs: ['WFP_ID'], qSortCriterias: [{ qSortByAscii: 1 }] } },
        { qDef: { qFieldDefs: ['WFP_NAME'], qSortCriterias: [{ qSortByAscii: 1 }] } },
      ],
      qMeasures: [],
      qInitialDataFetch: [{ qTop: 0, qLeft: 0, qHeight: 1000, qWidth: 4 }],
    },
  });

  const layout = await object.getLayout();
  const data = layout.qHyperCube.qDataPages[0]?.qMatrix || [];

  // 解析数据，按 FM 分组
  const fmMap = new Map<string, { id: string; name: string; wfps: any[] }>();

  for (const row of data) {
    const fmId = row[0]?.qText || '';
    const fmName = row[1]?.qText || '';
    const wfpId = row[2]?.qText || '';
    const wfpName = row[3]?.qText || '';

    if (!fmMap.has(fmId)) {
      fmMap.set(fmId, { id: fmId, name: fmName, wfps: [] });
    }

    if (wfpId) {
      fmMap.get(fmId)!.wfps.push({ id: wfpId, name: wfpName });
    }
  }

  // 关闭对象释放资源
  await object.destroySessionObject();

  return { fms: Array.from(fmMap.values()) };
}

// 2. RR指标
export async function fetchRrMetrics(params: QueryParams) {
  // TODO: 实现 Qlik 查询
  return {
    total: 100,
    target: 120,
    rate: 83.3,
    insuranceNew: 45,
    insuranceRenew: 35,
    fund: 20,
    people70: 15,
  };
}

// 3. 收入指标
export async function fetchIncomeMetrics(params: QueryParams) {
  // TODO: 实现 Qlik 查询
  return {
    total: 500000,
    fycShare: 60,
    renewalShare: 25,
    fundShare: 15,
    fyc: 300000,
    renewal: 125000,
    fundInc: 75000,
  };
}

// 4. 续保率指标
export async function fetchRetentionMetrics(params: QueryParams) {
  // TODO: 实现 Qlik 查询
  return {
    anp13: 85.5,
    count13: 120,
    anp25: 78.2,
    count25: 95,
  };
}

// 5. RR指标趋势
export async function fetchRrTrend(params: QueryParams) {
  // TODO: 实现 Qlik 查询
  return {
    months: ['1月', '2月', '3月', '4月', '5月', '6月'],
    rrValues: [80, 85, 90, 88, 92, 95],
    targetValues: [85, 85, 85, 90, 90, 90],
    completionRates: [94.1, 100, 105.9, 97.8, 102.2, 105.6],
  };
}

// 6. 收入指标趋势
export async function fetchIncomeTrend(params: QueryParams) {
  // TODO: 实现 Qlik 查询
  return {
    months: ['1月', '2月', '3月', '4月', '5月', '6月'],
    incomeValues: [400000, 450000, 480000, 520000, 550000, 580000],
    targetValues: [420000, 440000, 460000, 500000, 530000, 560000],
    completionRates: [95.2, 102.3, 104.3, 104.0, 103.8, 103.6],
  };
}

// 7. 活动跟踪
export async function fetchActivity(params: QueryParams) {
  // TODO: 实现 Qlik 查询
  return {
    mtdContact: 56.6,
    mtdMeet: 98.2,
    activities: [
      { type: 'Customer-Top up', count: 45, rate: 85.5 },
      { type: 'Testing leads', count: 30, rate: 72.3 },
      { type: '转介绍', count: 25, rate: 68.9 },
    ],
    rankings: [
      { name: '李销售', count: 35, rate: 92.1 },
      { name: '王销售', count: 28, rate: 88.5 },
    ],
    records: [
      { date: '2024-01-15', type: 'Customer-Top up', person: '李销售', result: '成功', notes: '客户追加投资' },
    ],
  };
}

// 8. 新客运营
export async function fetchNewCustomer(params: QueryParams) {
  // TODO: 实现 Qlik 查询
  return {
    events: 15,
    self: 8,
    contactRate: 75.5,
    meetRate: 68.2,
    leads: [
      { name: '张先生', source: '转介绍', status: '已联系', date: '2024-01-10' },
    ],
  };
}

// 9. 老客运营汇总
export async function fetchOldCustomerSummary(params: QueryParams) {
  // TODO: 实现 Qlik 查询
  return {
    total: 320,
    callList: 45,
    callListContactRate: 82.5,
    callListMeetRate: 65.3,
  };
}

// 10. 老客运营列表
export async function fetchOldCustomerList(params: QueryParams) {
  // TODO: 实现 Qlik 查询
  return [
    { name: '王先生', level: 'VIP', premium: 50000, lastContact: '2024-01-10', status: '活跃' },
  ];
}

// 11. 保单跟踪汇总
export async function fetchPolicySummary(params: QueryParams) {
  // TODO: 实现 Qlik 查询
  return {
    active: 450,
    pendingRenew: 80,
    orphan: 25,
  };
}

// 12. 保单跟踪列表
export async function fetchPolicyList(params: QueryParams) {
  // TODO: 实现 Qlik 查询
  return [
    { policyNo: 'P001', customer: '张先生', type: '寿险', premium: 10000, expiryDate: '2024-06-30', status: '待续保' },
  ];
}

// 13. 基金跟踪汇总
export async function fetchFundSummary(params: QueryParams) {
  // TODO: 实现 Qlik 查询
  return {
    holding: 1250000,
    huikunbao: 350000,
    fundNoIns: 180000,
  };
}

// 14. 基金跟踪列表
export async function fetchFundList(params: QueryParams) {
  // TODO: 实现 Qlik 查询
  return [
    { fundName: '汇昆宝', customer: '李先生', amount: 50000, date: '2024-01-05', status: '持有中' },
  ];
}
