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

  // 依次取各指标（每个都是独立的一次 HyperCube 查询）
  const structs = [
    ['total', 'Sum(RR_TOTAL)'],
    ['target', 'Sum(RR_TARGET)'],
    ['insuranceNew', 'Sum(RR_FYC)'],
    ['insuranceRenew', 'Sum(RR_RENEWAL)'],
    ['fund', 'Sum(RR_FUND)'],
    ['people70', 'Count(Distinct CUSTOMER_ID)'],
  ] as const;

  const out: any = {};
  for (const [key, expr] of structs) {
    const rows = await runHyperCube(app, [], [{ qDef: { qDef: expr } }], 1, 1);
    out[key] = rows[0]?.[0]?.qNum || 0;
  }

  out.rate = out.target > 0 ? Number(((out.total / out.target) * 100).toFixed(1)) : 0;
  return out;
}

// ============ 3. 收入指标 ============
export async function fetchIncomeMetrics(params: { fm_id?: string; wfp_id?: string; time_filter?: string }) {
  const session = await connect();
  const app = await session.openDoc(APP_ID);

  await applySelections(app, params);

  const s = ['fyc', 'Sum(INCOME_FYC)'].concat(['renewal', 'Sum(INCOME_RENEWAL)'], ['fundInc', 'Sum(INCOME_FUND)']);

  const vals: any = {};
  for (let i = 0; i < s.length; i += 2) {
    const rows = await runHyperCube(app, [], [{ qDef: { qDef: s[i + 1] } }], 1, 1);
    vals[s[i]] = rows[0]?.[0]?.qNum || 0;
  }

  const total = vals.fyc + vals.renewal + vals.fundInc;
  return {
    total,
    fyc: vals.fyc,
    renewal: vals.renewal,
    fundInc: vals.fundInc,
    fycShare: total > 0 ? Number(((vals.fyc / total) * 100).toFixed(1)) : 0,
    renewalShare: total > 0 ? Number(((vals.renewal / total) * 100).toFixed(1)) : 0,
    fundShare: total > 0 ? Number(((vals.fundInc / total) * 100).toFixed(1)) : 0,
  };
}

// ============ 4. 续保率指标 ============
export async function fetchRetentionMetrics(params: { fm_id?: string; wfp_id?: string; time_filter?: string }) {
  const session = await connect();
  const app = await session.openDoc(APP_ID);

  await applySelections(app, params);

  // 13 个月续保率 = 续保数 / 总数
  const rr13 = await runHyperCube(app, [], [{ qDef: { qDef: 'Sum(RETENTION_13M_RENEWED)' } }], 1, 1);
  const total13 = await runHyperCube(app, [], [{ qDef: { qDef: 'Sum(RETENTION_13M_TOTAL)' } }], 1, 1);
  const anp13Val = rr13[0]?.[0]?.qNum || 0;
  const total13Val = total13[0]?.[0]?.qNum || 0;

  // 25 个月续保率
  const rr25 = await runHyperCube(app, [], [{ qDef: { qDef: 'Sum(RETENTION_25M_RENEWED)' } }], 1, 1);
  const total25 = await runHyperCube(app, [], [{ qDef: { qDef: 'Sum(RETENTION_25M_TOTAL)' } }], 1, 1);
  const anp25Val = rr25[0]?.[0]?.qNum || 0;
  const total25Val = total25[0]?.[0]?.qNum || 0;

  // 续保保单数（按维度维度数行数）
  const c13 = await runHyperCube(app, [{ qDef: { qFieldDefs: ['RETENTION_13M_POLICY'] } }], [], 200, 1);
  const c25 = await runHyperCube(app, [{ qDef: { qFieldDefs: ['RETENTION_25M_POLICY'] } }], [], 200, 1);

  return {
    anp13: total13Val > 0 ? Number(((anp13Val / total13Val) * 100).toFixed(1)) : 0,
    count13: c13.length,
    anp25: total25Val > 0 ? Number(((anp25Val / total25Val) * 100).toFixed(1)) : 0,
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

  // 联系率 / 拜访率
  const contacted = await runHyperCube(app, [], [{ qDef: { qDef: 'Sum(ACTIVITY_CONTACTED)' } }], 1, 1);
  const actTotal = await runHyperCube(app, [], [{ qDef: { qDef: 'Sum(ACTIVITY_TOTAL)' } }], 1, 1);
  const meet = await runHyperCube(app, [], [{ qDef: { qDef: 'Sum(ACTIVITY_MEET)' } }], 1, 1);
  const contactedV = contacted[0]?.[0]?.qNum || 0;
  const actTotalV = actTotal[0]?.[0]?.qNum || 0;
  const meetV = meet[0]?.[0]?.qNum || 0;
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

  // 活动获取 / 自拓
  const evRows = await runHyperCube(app, [{ qDef: { qFieldDefs: ['NEW_CUSTOMER_ID'] } }], [], 200, 1);
  const selfRows = await runHyperCube(
    app,
    [{ qDef: { qFieldDefs: ['NEW_CUSTOMER_ID'] } }],
    [{ qDef: { qDef: "Sum({<NEW_CUSTOMER_SOURCE={'self'}>}1)" } }],
    200,
    1,
  );
  const events = evRows.length;
  const self = selfRows.reduce((acc: number, r: any) => acc + (r[1]?.qNum || 0), 0);

  // 联系率 / 拜访率
  const cont = await runHyperCube(app, [], [{ qDef: { qDef: 'Sum(NEW_CUSTOMER_CONTACTED)' } }], 1, 1);
  const meetCount = await runHyperCube(app, [], [{ qDef: { qDef: 'Sum(NEW_CUSTOMER_MEET)' } }], 1, 1);
  const newTotal = await runHyperCube(app, [], [{ qDef: { qDef: 'Count(DISTINCT NEW_CUSTOMER_ID)' } }], 1, 1);
  const contV = cont[0]?.[0]?.qNum || 0;
  const meetV = meetCount[0]?.[0]?.qNum || 0;
  const newTotalV = newTotal[0]?.[0]?.qNum || 0;

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

  const totalRows = await runHyperCube(app, [{ qDef: { qFieldDefs: ['OLD_CUSTOMER_ID'] } }], [], 200, 1);
  const callListRows = await runHyperCube(
    app,
    [{ qDef: { qFieldDefs: ['OLD_CUSTOMER_ID'] } }],
    [{ qDef: { qDef: "Sum({<OLD_CUSTOMER_TYPE={'call_list'}>}1)" } }],
    200,
    1,
  );
  const total = totalRows.length;
  const callList = callListRows.reduce((acc: number, r: any) => acc + (r[1]?.qNum || 0), 0);

  const cont = await runHyperCube(app, [], [{ qDef: { qDef: 'Sum(OLD_CUSTOMER_CONTACTED)' } }], 1, 1);
  const meet = await runHyperCube(app, [], [{ qDef: { qDef: 'Sum(OLD_CUSTOMER_MEET)' } }], 1, 1);
  const oldTotal = await runHyperCube(app, [], [{ qDef: { qDef: 'Count(DISTINCT OLD_CUSTOMER_ID)' } }], 1, 1);
  const contV = cont[0]?.[0]?.qNum || 0;
  const meetV = meet[0]?.[0]?.qNum || 0;
  const oldTotalV = oldTotal[0]?.[0]?.qNum || 0;

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

  const h = await runHyperCube(app, [], [{ qDef: { qDef: 'Sum(FUND_HOLDING)' } }], 1, 1);
  const hk = await runHyperCube(app, [], [{ qDef: { qDef: 'Sum(FUND_HUIKUNBAO)' } }], 1, 1);
  const ni = await runHyperCube(app, [], [{ qDef: { qDef: 'Sum(FUND_NO_INS)' } }], 1, 1);

  return {
    holding: h[0]?.[0]?.qNum || 0,
    huikunbao: hk[0]?.[0]?.qNum || 0,
    fundNoIns: ni[0]?.[0]?.qNum || 0,
  };
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