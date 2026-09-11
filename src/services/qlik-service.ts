// ============================================================
// Qlik Sense 对接服务（生产环境使用）
// 说明：14 个接口全部「独立 + 原始写法」，不封装。
//       每个接口自包含完整的 Qlik 调用流程：
//       连接 → 打开应用 → 筛选 → 建查询对象 → 取数 → 销毁
//       新手可直接复制单个接口去理解 / 修改。
// ============================================================
// @ts-ignore
import enigma from 'enigma.js';
// @ts-ignore
import schema from 'enigma.js/schemas/12.612.0.json';

// ============ 配置（按实际环境修改） ============
const QLIK_URL = process.env.UMI_APP_QLIK_URL || 'wss://你的qlik服务器地址';
const APP_ID = process.env.UMI_APP_QLIK_APP_ID || '你的app-id';

// 字段名（按实际 Qlik 数据模型调整）
const FIELD = {
  fmId: 'FM_ID',
  fmName: 'FM_NAME',
  wfpId: 'WFP_ID',
  wfpName: 'WFP_NAME',
  month: 'MONTH',
};

// ============ 连接 Qlik（唯一公用的基础步骤，非业务封装） ============
let qlikSession: any = null;
async function connect(): Promise<any> {
  if (qlikSession) return qlikSession;
  const s = enigma.create({ schema, url: QLIK_URL });
  qlikSession = await s.open();
  return qlikSession;
}

// ============ 应用筛选条件（按 FM / WFP / 时间 过滤） ============
// opts 可关闭某个维度：趋势接口只需按 FM/WFP 过滤，不按时间
async function applySelections(
  app: any,
  params: { fm_id?: string; wfp_id?: string; time_filter?: string },
  opts: { fm?: boolean; wfp?: boolean; time?: boolean } = { fm: true, wfp: true, time: true },
) {
  const rules: [string, string | undefined][] = [];
  if (opts.fm) rules.push([FIELD.fmId, params.fm_id]);
  if (opts.wfp) rules.push([FIELD.wfpId, params.wfp_id]);
  if (opts.time) rules.push([FIELD.month, params.time_filter]);

  for (const [field, value] of rules) {
    if (value) {
      try {
        await app.field(field).selectValues([{ qText: value }], false, true);
      } catch (e) {
        // 字段不存在时忽略，不中断后续查询
        console.warn(`Qlik 筛选字段 ${field} 失败（可忽略）:`, e);
      }
    }
  }
}

// 把一次 HyperCube 查询完整跑一遍（含创建与销毁），并返回 qMatrix
async function runHyperCube(app: any, dimensions: any[], measures: any[], height = 200, width = 10): Promise<any[][]> {
  const object = await app.createSessionObject({
    qInfo: { qType: 'visualization' },
    qHyperCubeDef: {
      qDimensions: dimensions,
      qMeasures: measures,
      qInitialDataFetch: [{ qTop: 0, qLeft: 0, qHeight: height, qWidth: width }],
    },
  });
  try {
    const layout = await object.getLayout();
    return layout.qHyperCube?.qDataPages?.[0]?.qMatrix || [];
  } finally {
    try {
      await app.destroySessionObject(object.id);
    } catch (e) {
      /* 销毁失败不影响返回 */
    }
  }
}

// 一次 HyperCube 查询多个标量度量，返回数值数组（同一接口只查一次）
async function queryValues(app: any, measures: string[]): Promise<number[]> {
  if (measures.length === 0) return [];
  const rows = await runHyperCube(
    app,
    [],
    measures.map(e => ({ qDef: { qDef: e } })),
    1,
    measures.length,
  );
  if (!rows[0]) return measures.map(() => 0);
  return measures.map((_, i) => rows[0][i]?.qNum || 0);
}

// ============ 1. FM和WFP列表 ============
export async function fetchFmWfpList() {
  const session = await connect();
  const app = await session.openDoc(APP_ID);

  const data = await runHyperCube(
    app,
    [
      { qDef: { qFieldDefs: [FIELD.fmId], qSortCriterias: [{ qSortByAscii: 1 }] } },
      { qDef: { qFieldDefs: [FIELD.fmName], qSortCriterias: [{ qSortByAscii: 1 }] } },
      { qDef: { qFieldDefs: [FIELD.wfpId], qSortCriterias: [{ qSortByAscii: 1 }] } },
      { qDef: { qFieldDefs: [FIELD.wfpName], qSortCriterias: [{ qSortByAscii: 1 }] } },
    ],
    [], // 纯维度列表，无度量
    1000,
    4,
  );

  const fmMap = new Map<string, { id: string; name: string; wfps: { id: string; name: string }[] }>();
  for (const row of data) {
    const fmId = row[0]?.qText || '';
    const fmName = row[1]?.qText || '';
    const wfpId = row[2]?.qText || '';
    const wfpName = row[3]?.qText || '';
    if (!fmMap.has(fmId)) {
      fmMap.set(fmId, { id: fmId, name: fmName, wfps: [] });
    }
    if (wfpId) fmMap.get(fmId)!.wfps.push({ id: wfpId, name: wfpName });
  }

  return { fms: Array.from(fmMap.values()) };
}

// ============ 2. RR指标 ============
export async function fetchRrMetrics(params: { fm_id?: string; wfp_id?: string; time_filter?: string }) {
  const session = await connect();
  const app = await session.openDoc(APP_ID);

  await applySelections(app, params);

  // 一次查询取全部指标
  const [total, target, insuranceNew, insuranceRenew, fund, people70] = await queryValues(app, [
    'Sum(RR_TOTAL)',
    'Sum(RR_TARGET)',
    'Sum(RR_FYC)',
    'Sum(RR_RENEWAL)',
    'Sum(RR_FUND)',
    'Count(Distinct CUSTOMER_ID)',
  ]);

  const rate = target > 0 ? Number(((total / target) * 100).toFixed(1)) : 0;
  return { total, target, rate, insuranceNew, insuranceRenew, fund, people70 };
}

// ============ 3. 收入指标 ============
export async function fetchIncomeMetrics(params: { fm_id?: string; wfp_id?: string; time_filter?: string }) {
  const session = await connect();
  const app = await session.openDoc(APP_ID);

  await applySelections(app, params);

  // 一次查询取全部指标
  const [fyc, renewal, fundInc] = await queryValues(app, [
    'Sum(INCOME_FYC)',
    'Sum(INCOME_RENEWAL)',
    'Sum(INCOME_FUND)',
  ]);

  const total = fyc + renewal + fundInc;
  return {
    total,
    fyc,
    renewal,
    fundInc,
    fycShare: total > 0 ? Number(((fyc / total) * 100).toFixed(1)) : 0,
    renewalShare: total > 0 ? Number(((renewal / total) * 100).toFixed(1)) : 0,
    fundShare: total > 0 ? Number(((fundInc / total) * 100).toFixed(1)) : 0,
  };
}

// ============ 4. 续保率指标 ============
export async function fetchRetentionMetrics(params: { fm_id?: string; wfp_id?: string; time_filter?: string }) {
  const session = await connect();
  const app = await session.openDoc(APP_ID);

  await applySelections(app, params);

  // 一次查询取 13/25 个月续保数与总数
  const [renewed13, total13, renewed25, total25] = await queryValues(app, [
    'Sum(RETENTION_13M_RENEWED)',
    'Sum(RETENTION_13M_TOTAL)',
    'Sum(RETENTION_25M_RENEWED)',
    'Sum(RETENTION_25M_TOTAL)',
  ]);

  // 续保保单数（按维度数行数，各一次）
  const c13 = await runHyperCube(app, [{ qDef: { qFieldDefs: ['RETENTION_13M_POLICY'] } }], [], 200, 1);
  const c25 = await runHyperCube(app, [{ qDef: { qFieldDefs: ['RETENTION_25M_POLICY'] } }], [], 200, 1);

  return {
    anp13: total13 > 0 ? Number(((renewed13 / total13) * 100).toFixed(1)) : 0,
    count13: c13.length,
    anp25: total25 > 0 ? Number(((renewed25 / total25) * 100).toFixed(1)) : 0,
    count25: c25.length,
  };
}

// ============ 5. RR指标趋势 ============
export async function fetchRrTrend(params: { fm_id?: string; wfp_id?: string; time_filter?: string }) {
  const session = await connect();
  const app = await session.openDoc(APP_ID);

  await applySelections(app, params, { time: false });

  const data = await runHyperCube(
    app,
    [{ qDef: { qFieldDefs: [FIELD.month] } }],
    [
      { qDef: { qDef: 'Sum(RR_TOTAL)' }, qSortBy: { qSortByNumeric: 1 } },
      { qDef: { qDef: 'Sum(RR_TARGET)' } },
    ],
    100,
    2,
  );

  const months: string[] = [];
  const rrValues: number[] = [];
  const targetValues: number[] = [];
  const completionRates: number[] = [];
  for (const row of data) {
    months.push(row[0]?.qText || '');
    rrValues.push(row[1]?.qNum || 0);
    targetValues.push(row[2]?.qNum || 0);
    completionRates.push(
      row[2]?.qNum && row[1]?.qNum ? Number(((row[1].qNum / row[2].qNum) * 100).toFixed(1)) : 0,
    );
  }

  return { months, rrValues, targetValues, completionRates };
}

// ============ 6. 收入指标趋势 ============
export async function fetchIncomeTrend(params: { fm_id?: string; wfp_id?: string; time_filter?: string }) {
  const session = await connect();
  const app = await session.openDoc(APP_ID);

  await applySelections(app, params, { time: false });

  const data = await runHyperCube(
    app,
    [{ qDef: { qFieldDefs: [FIELD.month] } }],
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

// ============ 7. 活动跟踪 ============
export async function fetchActivity(params: { fm_id?: string; wfp_id?: string; time_filter?: string }) {
  const session = await connect();
  const app = await session.openDoc(APP_ID);

  await applySelections(app, params);

  // 联系数 / 活动总数 / 拜访数（一次查询）
  const [contactedV, actTotalV, meetV] = await queryValues(app, [
    'Sum(ACTIVITY_CONTACTED)',
    'Sum(ACTIVITY_TOTAL)',
    'Sum(ACTIVITY_MEET)',
  ]);
  const mtdContact = actTotalV > 0 ? Number(((contactedV / actTotalV) * 100).toFixed(1)) : 0;
  const mtdMeet = actTotalV > 0 ? Number(((meetV / actTotalV) * 100).toFixed(1)) : 0;

  // 活动类型分布
  const activityData = await runHyperCube(
    app,
    [{ qDef: { qFieldDefs: ['ACTIVITY_TYPE'] } }],
    [{ qDef: { qDef: 'Count(ACTIVITY_ID)' } }],
    100,
    1,
  );
  const maxCount = Math.max(...activityData.map((r: any) => r[1]?.qNum || 0));
  const activities = activityData.map((row: any) => ({
    type: row[0]?.qText || '',
    count: row[1]?.qNum || 0,
    rate: (row[1]?.qNum || 0) && maxCount ? Number((((row[1]?.qNum || 0) / maxCount) * 100).toFixed(1)) : 0,
  }));

  // 人员排行
  const rankingData = await runHyperCube(
    app,
    [{ qDef: { qFieldDefs: [FIELD.wfpName] } }],
    [{ qDef: { qDef: 'Count(ACTIVITY_ID)' } }],
    100,
    1,
  );
  const rankings = (rankingData as any[])
    .map((row: any) => ({ name: row[0]?.qText || '', count: row[1]?.qNum || 0 }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10);

  // 活动记录
  const recordData = await runHyperCube(
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

// ============ 8. 新客运营 ============
export async function fetchNewCustomer(params: { fm_id?: string; wfp_id?: string; time_filter?: string }) {
  const session = await connect();
  const app = await session.openDoc(APP_ID);

  await applySelections(app, params);

  // 活动获取 / 自拓（一次查询：维度=新客ID，度量=自拓标记）
  const custRows = await runHyperCube(
    app,
    [{ qDef: { qFieldDefs: ['NEW_CUSTOMER_ID'] } }],
    [{ qDef: { qDef: "Sum({<NEW_CUSTOMER_SOURCE={'self'}>}1)" } }],
    200,
    1,
  );
  const events = custRows.length;
  const self = custRows.reduce((acc: number, r: any) => acc + (r[1]?.qNum || 0), 0);

  // 联系数 / 拜访数 / 新客总数（一次查询）
  const [contV, meetV, newTotalV] = await queryValues(app, [
    'Sum(NEW_CUSTOMER_CONTACTED)',
    'Sum(NEW_CUSTOMER_MEET)',
    'Count(DISTINCT NEW_CUSTOMER_ID)',
  ]);

  // 新客列表
  const leadData = await runHyperCube(
    app,
    [{ qDef: { qFieldDefs: ['NEW_CUSTOMER_NAME'] } }],
    [
      { qDef: { qDef: 'MaxString(NEW_CUSTOMER_SOURCE)' } },
      { qDef: { qDef: 'MaxString(NEW_CUSTOMER_STATUS)' } },
      { qDef: { qDef: 'MaxString(NEW_CUSTOMER_DATE)' } },
    ],
    200,
    3,
  );
  const leads = leadData.map((row: any) => ({
    name: row[0]?.qText || '',
    source: row[1]?.qText || '',
    status: row[2]?.qText || '',
    date: row[3]?.qText || '',
  }));

  return {
    events,
    self,
    contactRate: newTotalV > 0 ? Number(((contV / newTotalV) * 100).toFixed(1)) : 0,
    meetRate: newTotalV > 0 ? Number(((meetV / newTotalV) * 100).toFixed(1)) : 0,
    leads,
  };
}

// ============ 9. 老客运营汇总 ============
export async function fetchOldCustomerSummary(params: { fm_id?: string; wfp_id?: string; time_filter?: string }) {
  const session = await connect();
  const app = await session.openDoc(APP_ID);

  await applySelections(app, params);

  // 老客总数 / 邀约清单数（一次查询：维度=老客ID，度量=邀约标记）
  const custRows = await runHyperCube(
    app,
    [{ qDef: { qFieldDefs: ['OLD_CUSTOMER_ID'] } }],
    [{ qDef: { qDef: "Sum({<OLD_CUSTOMER_TYPE={'call_list'}>}1)" } }],
    200,
    1,
  );
  const total = custRows.length;
  const callList = custRows.reduce((acc: number, r: any) => acc + (r[1]?.qNum || 0), 0);

  // 联系数 / 拜访数 / 老客总数（一次查询）
  const [contV, meetV, oldTotalV] = await queryValues(app, [
    'Sum(OLD_CUSTOMER_CONTACTED)',
    'Sum(OLD_CUSTOMER_MEET)',
    'Count(DISTINCT OLD_CUSTOMER_ID)',
  ]);

  return {
    total,
    callList,
    callListContactRate: oldTotalV > 0 ? Number(((contV / oldTotalV) * 100).toFixed(1)) : 0,
    callListMeetRate: oldTotalV > 0 ? Number(((meetV / oldTotalV) * 100).toFixed(1)) : 0,
  };
}

// ============ 10. 老客运营列表 ============
export async function fetchOldCustomerList(params: { fm_id?: string; wfp_id?: string; time_filter?: string }) {
  const session = await connect();
  const app = await session.openDoc(APP_ID);

  await applySelections(app, params);

  const data = await runHyperCube(
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

// ============ 11. 保单跟踪汇总 ============
export async function fetchPolicySummary(params: { fm_id?: string; wfp_id?: string; time_filter?: string }) {
  const session = await connect();
  const app = await session.openDoc(APP_ID);

  await applySelections(app, params);

  const a = await runHyperCube(app, [{ qDef: { qFieldDefs: ['POLICY_ACTIVE_ID'] } }], [], 200, 1);
  const p = await runHyperCube(app, [{ qDef: { qFieldDefs: ['POLICY_PENDING_RENEW_ID'] } }], [], 200, 1);
  const o = await runHyperCube(app, [{ qDef: { qFieldDefs: ['POLICY_ORPHAN_ID'] } }], [], 200, 1);

  return { active: a.length, pendingRenew: p.length, orphan: o.length };
}

// ============ 12. 保单跟踪列表 ============
export async function fetchPolicyList(params: { fm_id?: string; wfp_id?: string; time_filter?: string }) {
  const session = await connect();
  const app = await session.openDoc(APP_ID);

  await applySelections(app, params);

  const data = await runHyperCube(
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

// ============ 13. 基金跟踪汇总 ============
export async function fetchFundSummary(params: { fm_id?: string; wfp_id?: string; time_filter?: string }) {
  const session = await connect();
  const app = await session.openDoc(APP_ID);

  await applySelections(app, params);

  const [holding, huikunbao, fundNoIns] = await queryValues(app, [
    'Sum(FUND_HOLDING)',
    'Sum(FUND_HUIKUNBAO)',
    'Sum(FUND_NO_INS)',
  ]);

  return { holding, huikunbao, fundNoIns };
}

// ============ 14. 基金跟踪列表 ============
export async function fetchFundList(params: { fm_id?: string; wfp_id?: string; time_filter?: string }) {
  const session = await connect();
  const app = await session.openDoc(APP_ID);

  await applySelections(app, params);

  const data = await runHyperCube(
    app,
    [{ qDef: { qFieldDefs: ['FUND_NAME'] } }],
    [
      { qDef: { qDef: 'MaxString(CUSTOMER_NAME)' } },
      { qDef: { qDef: 'Sum(FUND_AMOUNT)' } },
      { qDef: { qDef: 'MaxString(FUND_STATUS)' } },
    ],
    200,
    3,
  );

  return data.map((row: any) => ({
    fundName: row[0]?.qText || '',
    customer: row[1]?.qText || '',
    amount: row[2]?.qNum || 0,
    status: row[3]?.qText || '',
  }));
}

// ============================================================
// 全量数据：页面首次打开时一次性查询，之后前端切换筛选不再请求接口。
// 返回结构与 mock-data.getAllData 同构。不在此处做筛选，全量返回，过滤交给前端。
// 时间区间 TIME_FILTER 与 FM_ID / WFP_ID 一样是枚举维度（等值匹配）。
// ============================================================
export async function getAllData() {
  const session = await connect();
  const app = await session.openDoc(APP_ID);

  // 1. FM/WFP 列表
  const fmData = await runHyperCube(
    app,
    [{ qDef: { qFieldDefs: ['FM_ID'] } }],
    [{ qDef: { qDef: 'MaxString(FM_NAME)' } }],
    100,
    2,
  );
  const fms = [];
  for (const row of fmData) {
    const fmId = row[0]?.qText || '';
    const fmName = row[1]?.qText || fmId;
    const wfpData = await runHyperCube(
      app,
      [{ qDef: { qFieldDefs: ['WFP_ID'] } }],
      [{ qDef: { qDef: 'MaxString(WFP_NAME)' } }],
      500,
      2,
    );
    fms.push({
      id: fmId,
      name: fmName,
      wfps: wfpData.map((r: any) => ({ id: r[0]?.qText || '', name: r[1]?.qText || r[0]?.qText || '' })),
    });
  }

  // 2. 指标全量：维度 FM_ID / WFP_ID / TIME_FILTER（时间区间是枚举字段，与 FM/WFP 一样等值过滤）
  //    【字段名按实际 Qlik 应用调整】
  const measureDefs = [
    'Sum(RR_TOTAL)', 'Sum(RR_TARGET)', 'Sum(RR_FYC)', 'Sum(RR_RENEWAL)', 'Sum(RR_FUND)', 'Sum(PEOPLE_70)',
    'Sum(INC_FYC)', 'Sum(INC_RENEWAL)', 'Sum(INC_FUND)',
    'Sum(RET13_RENEWED)', 'Sum(RET13_TOTAL)', 'Sum(RET25_RENEWED)', 'Sum(RET25_TOTAL)', 'Count(RET13)', 'Count(RET25)',
    'Sum(ACT_CALLS)', 'Sum(ACT_CALLS_LONG)', 'Sum(ACT_MEETINGS)', 'Sum(ACT_NEW_LIST)',
    'Sum(ACT_FUND_CONTACTS)', 'Sum(ACT_FUND_MEETINGS)', 'Sum(ACT_WECHAT_ADD)', 'Sum(ACT_WECHAT_INT)',
    'Sum(ACT_NEW_CLIENTS)', 'Sum(ACT_NEW_AUM)', 'Sum(ACT_SIMPLE_POLICIES)', 'Sum(ACT_COMPLEX_POLICIES)',
    'Sum(NEW_EVENTS)', 'Sum(NEW_SELF)', 'Sum(NEW_CONTACTED)', 'Sum(NEW_MEET)', 'Sum(NEW_TOTAL)',
    'Sum(OLD_TOTAL)', 'Sum(OLD_CALL_LIST)', 'Sum(OLD_CONTACTED)', 'Sum(OLD_MEET)',
    'Sum(POL_ACTIVE)', 'Sum(POL_ACTIVE_AUM)', 'Sum(POL_PENDING)', 'Sum(POL_PENDING_AUM)',
    'Sum(POL_ORPHAN)', 'Sum(POL_ORPHAN_AUM)',
    'Sum(FUND_HOLDING)', 'Sum(FUND_HOLDING_AUM)', 'Sum(FUND_HUIKUNBAO)', 'Sum(FUND_HUIKUNBAO_AUM)',
    'Sum(FUND_NO_INS)', 'Sum(FUND_NO_INS_AUM)',
  ];
  const cube = await runHyperCube(
    app,
    [
      { qDef: { qFieldDefs: ['FM_ID'] } },
      { qDef: { qFieldDefs: ['WFP_ID'] } },
      { qDef: { qFieldDefs: ['TIME_FILTER'] } }, // 时间区间枚举：current_month/last_month/current_quarter/last_quarter
    ],
    measureDefs.map((d) => ({ qDef: { qDef: d } })),
    5000,
    measureDefs.length,
  );

  const num = (c: any) => (typeof c?.qNum === 'number' ? c.qNum : Number(c?.qText) || 0);
  // 趋势单独按 MONTH 维度查询，下面按 (fmId,wfpId) 归到 trendMap
  const trendMap = await fetchTrendMap(app);

  const metrics = cube.map((row: any) => {
    const fmId = row[0]?.qText || '';
    const wfpId = row[1]?.qText || '';
    const base = {
      fmId, wfpId,
      timeFilter: (row[2]?.qText || 'current_month') as string,
      rrTotal: num(row[3]), rrTarget: num(row[4]), rrFyc: num(row[5]), rrRenewal: num(row[6]),
      rrFund: num(row[7]), people70: num(row[8]),
      incFyc: num(row[9]), incRenewal: num(row[10]), incFund: num(row[11]),
      ret13Renewed: num(row[12]), ret13Total: num(row[13]), ret25Renewed: num(row[14]), ret25Total: num(row[15]),
      ret13Count: num(row[16]), ret25Count: num(row[17]),
      calls: num(row[18]), callsLong: num(row[19]), meetings: num(row[20]), newList: num(row[21]),
      fundContacts: num(row[22]), fundMeetings: num(row[23]), wechatAdd: num(row[24]), wechatInt: num(row[25]),
      newClients: num(row[26]), newAUM: num(row[27]), simplePolicies: num(row[28]), complexPolicies: num(row[29]),
      newEvents: num(row[30]), newSelf: num(row[31]), newContacted: num(row[32]), newMeet: num(row[33]), newTotal: num(row[34]),
      oldTotal: num(row[35]), oldCallList: num(row[36]), oldContacted: num(row[37]), oldMeet: num(row[38]),
      policyActive: num(row[39]), policyActiveAum: num(row[40]), policyPending: num(row[41]), policyPendingAum: num(row[42]),
      policyOrphan: num(row[43]), policyOrphanAum: num(row[44]),
      fundHolding: num(row[45]), fundHoldingAum: num(row[46]),
      fundHuikunbao: num(row[47]), fundHuikunbaoAum: num(row[48]),
      fundNoIns: num(row[49]), fundNoInsAum: num(row[50]),
    };
    return { ...base, months: trendMap.get(`${fmId}__${wfpId}`) || [] };
  });

  const months: string[] = [];
  trendMap.forEach((pts) => pts.forEach((p) => { if (p.month && !months.includes(p.month)) months.push(p.month); }));
  months.sort();

  await session.close();
  return {
    fms, metrics, months,
    quarters: ['Q1', 'Q2', 'Q3', 'Q4'],
    timeFilters: ['current_month', 'last_month', 'current_quarter', 'last_quarter'],
  };
}

// 趋势：按 MONTH 维度查 RR 总量/目标、收入总量，归为 fmId__wfpId -> 月度点数组
// 【字段名按实际 Qlik 应用调整】
async function fetchTrendMap(app: any): Promise<Map<string, { month: string; rrTotal: number; rrTarget: number; incTotal: number }[]>> {
  const defs = ['Sum(RR_TOTAL)', 'Sum(RR_TARGET)', 'Sum(INC_TOTAL)'];
  const data = await runHyperCube(
    app,
    [
      { qDef: { qFieldDefs: ['FM_ID'] } },
      { qDef: { qFieldDefs: ['WFP_ID'] } },
      { qDef: { qFieldDefs: ['MONTH'] } },
    ],
    defs.map((d) => ({ qDef: { qDef: d } })),
    5000,
    defs.length,
  );
  const num = (c: any) => (typeof c?.qNum === 'number' ? c.qNum : Number(c?.qText) || 0);
  const map = new Map<string, { month: string; rrTotal: number; rrTarget: number; incTotal: number }[]>();
  for (const row of data) {
    const key = `${row[0]?.qText || ''}__${row[1]?.qText || ''}`;
    const pt = {
      month: row[2]?.qText || '',
      rrTotal: num(row[3]),
      rrTarget: num(row[4]),
      incTotal: num(row[5]),
    };
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(pt);
  }
  return map;
}