// Qlik Sense 服务层 - 生产环境对接 Qlik
// @ts-ignore
import enigma from 'enigma.js';
// @ts-ignore
import schema from 'enigma.js/schemas/12.612.0.json';

// Qlik 连接配置（从环境变量读取）
const QLIK_CONFIG = {
  url: process.env.UMI_APP_QLIK_URL || 'wss://qlik.example.com',
  appId: process.env.UMI_APP_QLIK_APP_ID || '',
  // 字段映射（根据实际 Qlik 数据模型调整）
  fields: {
    fmId: 'FM_ID',
    fmName: 'FM_NAME',
    wfpId: 'WFP_ID',
    wfpName: 'WFP_NAME',
    timeFilter: 'MONTH',
  },
};

let qlikSession: any = null;

interface QueryParams {
  fm_id?: string;
  wfp_id?: string;
  time_filter?: string;
}

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

// 构建筛选条件数组
function buildSelections(params: QueryParams): any[] {
  const selections: any[] = [];
  if (params.fm_id) {
    selections.push({ qFieldName: QLIK_CONFIG.fields.fmId, qValues: [params.fm_id] });
  }
  if (params.wfp_id) {
    selections.push({ qFieldName: QLIK_CONFIG.fields.wfpId, qValues: [params.wfp_id] });
  }
  if (params.time_filter) {
    selections.push({ qFieldName: QLIK_CONFIG.fields.timeFilter, qValues: [params.time_filter] });
  }
  return selections;
}

// 创建应用并应用筛选条件
async function openAppWithSelections(params: QueryParams) {
  const session = await createSession();
  const app = await session.openDoc(QLIK_CONFIG.appId);

  const selections = buildSelections(params);
  for (const sel of selections) {
    try {
      await app.field(sel.qFieldName).selectValues([{ qText: sel.qValues[0] }], false, true);
    } catch (e) {
      // 字段不存在时忽略
      console.warn(`Qlik selection failed for ${sel.qFieldName}:`, e);
    }
  }
  return app;
}

// 通用执行超立方体查询
async function executeHyperCube(
  app: any,
  dimensions: any[],
  measures: any[],
  height = 100,
  width = 10,
) {
  const object = await app.createSessionObject({
    qInfo: { qType: 'visualization' },
    qHyperCubeDef: {
      qDimensions: dimensions,
      qMeasures: measures,
      qInitialDataFetch: [{ qTop: 0, qLeft: 0, qHeight: height, qWidth: width }],
    },
  });

  const layout = await object.getLayout();
  const data = layout.qHyperCube?.qDataPages?.[0]?.qMatrix || [];
  await object.destroySessionObject();
  return data;
}

// 通用标量查询（返回单个值）
async function querySingleValue(app: any, measure: any): Promise<number> {
  const data = await executeHyperCube(app, [], [measure], 1, 1);
  if (data.length > 0 && data[0][0]?.qNum !== undefined) {
    return data[0][0].qNum || 0;
  }
  return 0;
}

// 通用求和查询
async function queryCount(app: any, dimensionField: string, measure?: any): Promise<number> {
  const data = await executeHyperCube(
    app,
    [{ qDef: { qFieldDefs: [dimensionField] } }],
    measure ? [measure] : [],
    100,
    1,
  );
  return data.length;
}

// 通用百分比查询
async function queryPercentage(app: any, numerator: any, denominator: any): Promise<number> {
  const num = await querySingleValue(app, numerator);
  const den = await querySingleValue(app, denominator);
  if (den === 0) return 0;
  return Number(((num / den) * 100).toFixed(1));
}

// 1. FM和WFP列表
export async function fetchFmWfpList() {
  const session = await createSession();
  const app = await session.openDoc(QLIK_CONFIG.appId);

  const object = await app.createSessionObject({
    qInfo: { qType: 'fm-wfp-list' },
    qHyperCubeDef: {
      qDimensions: [
        { qDef: { qFieldDefs: [QLIK_CONFIG.fields.fmId], qSortCriterias: [{ qSortByAscii: 1 }] } },
        { qDef: { qFieldDefs: [QLIK_CONFIG.fields.fmName], qSortCriterias: [{ qSortByAscii: 1 }] } },
        { qDef: { qFieldDefs: [QLIK_CONFIG.fields.wfpId], qSortCriterias: [{ qSortByAscii: 1 }] } },
        { qDef: { qFieldDefs: [QLIK_CONFIG.fields.wfpName], qSortCriterias: [{ qSortByAscii: 1 }] } },
      ],
      qMeasures: [],
      qInitialDataFetch: [{ qTop: 0, qLeft: 0, qHeight: 1000, qWidth: 4 }],
    },
  });

  const layout = await object.getLayout();
  const data = layout.qHyperCube.qDataPages[0]?.qMatrix || [];

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

  await object.destroySessionObject();

  return { fms: Array.from(fmMap.values()) };
}

// 2. RR指标
export async function fetchRrMetrics(params: QueryParams) {
  const app = await openAppWithSelections(params);

  const total = await querySingleValue(app, { qDef: { qDef: 'Sum(RR_TOTAL)' } });
  const target = await querySingleValue(app, { qDef: { qDef: 'Sum(RR_TARGET)' } });
  const insuranceNew = await querySingleValue(app, { qDef: { qDef: 'Sum(RR_FYC)' } });
  const insuranceRenew = await querySingleValue(app, { qDef: { qDef: 'Sum(RR_RENEWAL)' } });
  const fund = await querySingleValue(app, { qDef: { qDef: 'Sum(RR_FUND)' } });
  const people70 = await querySingleValue(app, { qDef: { qDef: 'Count(Distinct CUSTOMER_ID)' } });

  const rate = target > 0 ? Number(((total / target) * 100).toFixed(1)) : 0;

  return { total, target, rate, insuranceNew, insuranceRenew, fund, people70 };
}

// 3. 收入指标
export async function fetchIncomeMetrics(params: QueryParams) {
  const app = await openAppWithSelections(params);

  const fyc = await querySingleValue(app, { qDef: { qDef: 'Sum(INCOME_FYC)' } });
  const renewal = await querySingleValue(app, { qDef: { qDef: 'Sum(INCOME_RENEWAL)' } });
  const fundInc = await querySingleValue(app, { qDef: { qDef: 'Sum(INCOME_FUND)' } });
  const total = fyc + renewal + fundInc;

  const fycShare = total > 0 ? Number(((fyc / total) * 100).toFixed(1)) : 0;
  const renewalShare = total > 0 ? Number(((renewal / total) * 100).toFixed(1)) : 0;
  const fundShare = total > 0 ? Number(((fundInc / total) * 100).toFixed(1)) : 0;

  return { total, fycShare, renewalShare, fundShare, fyc, renewal, fundInc };
}

// 4. 续保率指标
export async function fetchRetentionMetrics(params: QueryParams) {
  const app = await openAppWithSelections(params);

  const anp13 = await queryPercentage(
    app,
    { qDef: { qDef: 'Sum(RETENTION_13M_RENEWED)' } },
    { qDef: { qDef: 'Sum(RETENTION_13M_TOTAL)' } },
  );
  const count13 = await queryCount(app, 'RETENTION_13M_POLICY');
  const anp25 = await queryPercentage(
    app,
    { qDef: { qDef: 'Sum(RETENTION_25M_RENEWED)' } },
    { qDef: { qDef: 'Sum(RETENTION_25M_TOTAL)' } },
  );
  const count25 = await queryCount(app, 'RETENTION_25M_POLICY');

  return { anp13, count13, anp25, count25 };
}

// 5. RR指标趋势
export async function fetchRrTrend(params: QueryParams) {
  const app = await openAppWithSelections(params);

  const data = await executeHyperCube(
    app,
    [{ qDef: { qFieldDefs: [QLIK_CONFIG.fields.timeFilter] } }],
    [
      { qDef: { qDef: 'Sum(RR_TOTAL)' }, qSortBy: { qSortByNumeric: 1 } },
      { qDef: { qDef: 'Sum(RR_TARGET)' } },
      { qDef: { qDef: 'Sum(RR_COMPLETION_RATE)' } },
    ],
    100,
    3,
  );

  const months: string[] = [];
  const rrValues: number[] = [];
  const targetValues: number[] = [];
  const completionRates: number[] = [];

  for (const row of data) {
    months.push(row[0]?.qText || '');
    rrValues.push(row[1]?.qNum || 0);
    targetValues.push(row[2]?.qNum || 0);
    const rate = row[2]?.qNum && row[1]?.qNum ? Number(((row[1].qNum / row[2].qNum) * 100).toFixed(1)) : 0;
    completionRates.push(rate);
  }

  return { months, rrValues, targetValues, completionRates };
}

// 6. 收入指标趋势
export async function fetchIncomeTrend(params: QueryParams) {
  const app = await openAppWithSelections(params);

  const data = await executeHyperCube(
    app,
    [{ qDef: { qFieldDefs: [QLIK_CONFIG.fields.timeFilter] } }],
    [
      { qDef: { qDef: 'Sum(INCOME_TOTAL)' } },
      { qDef: { qDef: 'Sum(INCOME_TARGET)' } },
    ],
    100,
    2,
  );

  const months: string[] = [];
  const incomeValues: number[] = [];
  const targetValues: number[] = [];
  const completionRates: number[] = [];

  for (const row of data) {
    months.push(row[0]?.qText || '');
    const income = row[1]?.qNum || 0;
    const target = row[2]?.qNum || 0;
    incomeValues.push(income);
    targetValues.push(target);
    completionRates.push(target > 0 ? Number(((income / target) * 100).toFixed(1)) : 0);
  }

  return { months, incomeValues, targetValues, completionRates };
}

// 7. 活动跟踪
export async function fetchActivity(params: QueryParams) {
  const app = await openAppWithSelections(params);

  const mtdContact = await queryPercentage(
    app,
    { qDef: { qDef: 'Sum(ACTIVITY_CONTACTED)' } },
    { qDef: { qDef: 'Sum(ACTIVITY_TOTAL)' } },
  );
  const mtdMeet = await queryPercentage(
    app,
    { qDef: { qDef: 'Sum(ACTIVITY_MEET)' } },
    { qDef: { qDef: 'Sum(ACTIVITY_TOTAL)' } },
  );

  // 活动类型分布
  const activityData = await executeHyperCube(
    app,
    [{ qDef: { qFieldDefs: ['ACTIVITY_TYPE'] } }],
    [
      { qDef: { qDef: 'Count(ACTIVITY_ID)' } },
      { qDef: { qDef: 'Sum(ACTIVITY_RATE)' } },
    ],
    100,
    2,
  );

  const activities = activityData.map((row: any) => ({
    type: row[0]?.qText || '',
    count: row[1]?.qNum || 0,
    rate: row[1]?.qNum ? Number(((row[1].qNum / Math.max(...activityData.map((r: any) => r[1]?.qNum || 0))) * 100).toFixed(1)) : 0,
  }));

  // 人员排行
  const rankingData = await executeHyperCube(
    app,
    [{ qDef: { qFieldDefs: [QLIK_CONFIG.fields.wfpName] } }],
    [
      { qDef: { qDef: 'Count(ACTIVITY_ID)' } },
      { qDef: { qDef: 'Sum(ACTIVITY_RATE)' } },
    ],
    100,
    2,
  );

  const rankings = rankingData
    .map((row: any) => ({
      name: row[0]?.qText || '',
      count: row[1]?.qNum || 0,
      rate: row[2]?.qNum || 0,
    }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10);

  // 活动记录
  const recordData = await executeHyperCube(
    app,
    [{ qDef: { qFieldDefs: ['ACTIVITY_DATE'] } }],
    [
      { qDef: { qDef: 'MaxString(ACTIVITY_TYPE)' } },
      { qDef: { qDef: 'MaxString(WFP_NAME)' } },
      { qDef: { qDef: 'MaxString(ACTIVITY_RESULT)' } },
      { qDef: { qDef: 'MaxString(ACTIVITY_NOTES)' } },
    ],
    100,
    4,
  );

  const records = recordData.map((row: any) => ({
    date: row[0]?.qText || '',
    type: row[1]?.qText || '',
    person: row[2]?.qText || '',
    result: row[3]?.qText || '',
    notes: row[4]?.qText || '',
  }));

  return { mtdContact, mtdMeet, activities, rankings, records };
}

// 8. 新客运营
export async function fetchNewCustomer(params: QueryParams) {
  const app = await openAppWithSelections(params);

  const events = await queryCount(app, 'NEW_CUSTOMER_ID');
  const self = await queryCount(app, 'NEW_CUSTOMER_ID', { qDef: { qDef: "Sum({<NEW_CUSTOMER_SOURCE={'self'}>}1)" } });
  const contactRate = await queryPercentage(
    app,
    { qDef: { qDef: 'Sum(NEW_CUSTOMER_CONTACTED)' } },
    { qDef: { qDef: 'Count(DISTINCT NEW_CUSTOMER_ID)' } },
  );
  const meetRate = await queryPercentage(
    app,
    { qDef: { qDef: 'Sum(NEW_CUSTOMER_MEET)' } },
    { qDef: { qDef: 'Count(DISTINCT NEW_CUSTOMER_ID)' } },
  );

  const leadData = await executeHyperCube(
    app,
    [{ qDef: { qFieldDefs: ['NEW_CUSTOMER_NAME'] } }],
    [
      { qDef: { qDef: 'MaxString(NEW_CUSTOMER_SOURCE)' } },
      { qDef: { qDef: 'MaxString(NEW_CUSTOMER_STATUS)' } },
      { qDef: { qDef: 'MaxString(NEW_CUSTOMER_DATE)' } },
    ],
    100,
    3,
  );

  const leads = leadData.map((row: any) => ({
    name: row[0]?.qText || '',
    source: row[1]?.qText || '',
    status: row[2]?.qText || '',
    date: row[3]?.qText || '',
  }));

  return { events, self, contactRate, meetRate, leads };
}

// 9. 老客运营汇总
export async function fetchOldCustomerSummary(params: QueryParams) {
  const app = await openAppWithSelections(params);

  const total = await queryCount(app, 'OLD_CUSTOMER_ID');
  const callList = await queryCount(app, 'OLD_CUSTOMER_ID', { qDef: { qDef: "Sum({<OLD_CUSTOMER_TYPE={'call_list'}>}1)" } });
  const callListContactRate = await queryPercentage(
    app,
    { qDef: { qDef: 'Sum(OLD_CUSTOMER_CONTACTED)' } },
    { qDef: { qDef: 'Count(DISTINCT OLD_CUSTOMER_ID)' } },
  );
  const callListMeetRate = await queryPercentage(
    app,
    { qDef: { qDef: 'Sum(OLD_CUSTOMER_MEET)' } },
    { qDef: { qDef: 'Count(DISTINCT OLD_CUSTOMER_ID)' } },
  );

  return { total, callList, callListContactRate, callListMeetRate };
}

// 10. 老客运营列表
export async function fetchOldCustomerList(params: QueryParams) {
  const app = await openAppWithSelections(params);

  const data = await executeHyperCube(
    app,
    [{ qDef: { qFieldDefs: ['OLD_CUSTOMER_NAME'] } }],
    [
      { qDef: { qDef: 'MaxString(OLD_CUSTOMER_LEVEL)' } },
      { qDef: { qDef: 'Sum(OLD_CUSTOMER_PREMIUM)' } },
      { qDef: { qDef: 'MaxString(OLD_CUSTOMER_LAST_CONTACT)' } },
      { qDef: { qDef: 'MaxString(OLD_CUSTOMER_STATUS)' } },
    ],
    200,
    4,
  );

  return data.map((row: any) => ({
    name: row[0]?.qText || '',
    level: row[1]?.qText || '',
    premium: row[2]?.qNum || 0,
    lastContact: row[3]?.qText || '',
    status: row[4]?.qText || '',
  }));
}

// 11. 保单跟踪汇总
export async function fetchPolicySummary(params: QueryParams) {
  const app = await openAppWithSelections(params);

  const active = await queryCount(app, 'POLICY_ACTIVE_ID');
  const pendingRenew = await queryCount(app, 'POLICY_PENDING_RENEW_ID');
  const orphan = await queryCount(app, 'POLICY_ORPHAN_ID');

  return { active, pendingRenew, orphan };
}

// 12. 保单跟踪列表
export async function fetchPolicyList(params: QueryParams) {
  const app = await openAppWithSelections(params);

  const data = await executeHyperCube(
    app,
    [{ qDef: { qFieldDefs: ['POLICY_NO'] } }],
    [
      { qDef: { qDef: 'MaxString(CUSTOMER_NAME)' } },
      { qDef: { qDef: 'MaxString(POLICY_TYPE)' } },
      { qDef: { qDef: 'Sum(POLICY_PREMIUM)' } },
      { qDef: { qDef: 'MaxString(POLICY_EXPIRY_DATE)' } },
      { qDef: { qDef: 'MaxString(POLICY_STATUS)' } },
    ],
    200,
    5,
  );

  return data.map((row: any) => ({
    policyNo: row[0]?.qText || '',
    customer: row[1]?.qText || '',
    type: row[2]?.qText || '',
    premium: row[3]?.qNum || 0,
    expiryDate: row[4]?.qText || '',
    status: row[5]?.qText || '',
  }));
}

// 13. 基金跟踪汇总
export async function fetchFundSummary(params: QueryParams) {
  const app = await openAppWithSelections(params);

  const holding = await querySingleValue(app, { qDef: { qDef: 'Sum(FUND_HOLDING)' } });
  const huikunbao = await querySingleValue(app, { qDef: { qDef: 'Sum(FUND_HUIKUNBAO)' } });
  const fundNoIns = await querySingleValue(app, { qDef: { qDef: 'Sum(FUND_NO_INS)' } });

  return { holding, huikunbao, fundNoIns };
}

// 14. 基金跟踪列表
export async function fetchFundList(params: QueryParams) {
  const app = await openAppWithSelections(params);

  const data = await executeHyperCube(
    app,
    [{ qDef: { qFieldDefs: ['FUND_NAME'] } }],
    [
      { qDef: { qDef: 'MaxString(CUSTOMER_NAME)' } },
      { qDef: { qDef: 'Sum(FUND_AMOUNT)' } },
      { qDef: { qDef: 'MaxString(FUND_DATE)' } },
      { qDef: { qDef: 'MaxString(FUND_STATUS)' } },
    ],
    200,
    4,
  );

  return data.map((row: any) => ({
    fundName: row[0]?.qText || '',
    customer: row[1]?.qText || '',
    amount: row[2]?.qNum || 0,
    date: row[3]?.qText || '',
    status: row[4]?.qText || '',
  }));
}