/**
 * Qlik Sense 数据服务
 * 开发环境：使用 mock 数据
 * 生产环境：通过 enigma.js 连接 Qlik Engine API
 */

import enigma from 'enigma.js';
import schema from 'enigma.js/schemas/12.612.0.json';

// 基金数据类型
export interface Fund {
  fund_name: string;
  fund_code: string;
  fund_type: string;
  product_type: string;
  risk_level: string;
  nav_date: string;
  nav: string;
  shouyi: string;
  three_year_inc: string;
  ytd_return: string;
  recommend_flag: string;
  purchase_flag: string;
  fund_url: string;
}

// Mock 数据（开发环境使用）
const MOCK_DATA: Fund[] = [
  { fund_name: '汇丰晋信大盘股票A', fund_code: '540006', fund_type: '股票型', product_type: '公募', risk_level: 'R3', nav_date: '2024-01-15', nav: '3.2450', shouyi: '12.56', three_year_inc: '28.45', ytd_return: '5.23', recommend_flag: 'Y', purchase_flag: 'Y', fund_url: 'https://www.hsbcjt.cn/fund/540006' },
  { fund_name: '汇丰晋信动态策略混合A', fund_code: '540003', fund_type: '混合型', product_type: '公募', risk_level: 'R3', nav_date: '2024-01-15', nav: '2.8760', shouyi: '8.32', three_year_inc: '15.67', ytd_return: '3.15', recommend_flag: 'N', purchase_flag: 'Y', fund_url: 'https://www.hsbcjt.cn/fund/540003' },
  { fund_name: '汇丰晋信2026周期混合', fund_code: '540007', fund_type: '混合型', product_type: '公募', risk_level: 'R3', nav_date: '2024-01-15', nav: '1.9540', shouyi: '-3.21', three_year_inc: '5.43', ytd_return: '-1.08', recommend_flag: 'N', purchase_flag: 'Y', fund_url: 'https://www.hsbcjt.cn/fund/540007' },
  { fund_name: '汇丰晋信货币基金A', fund_code: '540001', fund_type: '货币型', product_type: '公募', risk_level: 'R1', nav_date: '2024-01-15', nav: '1.0000', shouyi: '1.85', three_year_inc: '5.62', ytd_return: '0.62', recommend_flag: 'N', purchase_flag: 'Y', fund_url: 'https://www.hsbcjt.cn/fund/540001' },
  { fund_name: '汇丰晋信低碳先锋股票A', fund_code: '540008', fund_type: '股票型', product_type: '公募', risk_level: 'R4', nav_date: '2024-01-15', nav: '2.1340', shouyi: '15.67', three_year_inc: '35.21', ytd_return: '7.89', recommend_flag: 'Y', purchase_flag: 'Y', fund_url: 'https://www.hsbcjt.cn/fund/540008' },
  { fund_name: '汇丰晋信消费红利股票A', fund_code: '540009', fund_type: '股票型', product_type: '公募', risk_level: 'R4', nav_date: '2024-01-15', nav: '1.8760', shouyi: '-5.43', three_year_inc: '-8.92', ytd_return: '-2.34', recommend_flag: 'N', purchase_flag: 'N', fund_url: 'https://www.hsbcjt.cn/fund/540009' },
  { fund_name: '汇丰晋信科技先锋股票A', fund_code: '540010', fund_type: '股票型', product_type: '公募', risk_level: 'R4', nav_date: '2024-01-15', nav: '2.5430', shouyi: '22.18', three_year_inc: '42.56', ytd_return: '9.12', recommend_flag: 'Y', purchase_flag: 'Y', fund_url: 'https://www.hsbcjt.cn/fund/540010' },
  { fund_name: '汇丰晋信中小盘股票A', fund_code: '540011', fund_type: '股票型', product_type: '公募', risk_level: 'R4', nav_date: '2024-01-15', nav: '2.0870', shouyi: '6.75', three_year_inc: '12.34', ytd_return: '2.56', recommend_flag: 'N', purchase_flag: 'Y', fund_url: 'https://www.hsbcjt.cn/fund/540011' },
  { fund_name: '汇丰晋信龙腾混合型', fund_code: '540002', fund_type: '混合型', product_type: '公募', risk_level: 'R3', nav_date: '2024-01-15', nav: '3.1230', shouyi: '9.87', three_year_inc: '18.90', ytd_return: '4.01', recommend_flag: 'N', purchase_flag: 'Y', fund_url: 'https://www.hsbcjt.cn/fund/540002' },
  { fund_name: '汇丰晋信平稳增利债券A', fund_code: '540004', fund_type: '债券型', product_type: '公募', risk_level: 'R2', nav_date: '2024-01-15', nav: '1.2340', shouyi: '3.45', three_year_inc: '8.76', ytd_return: '1.23', recommend_flag: 'N', purchase_flag: 'Y', fund_url: 'https://www.hsbcjt.cn/fund/540004' },
  { fund_name: '汇丰晋信恒生A股行业龙头指数A', fund_code: '540012', fund_type: '指数型', product_type: '公募', risk_level: 'R3', nav_date: '2024-01-15', nav: '1.4560', shouyi: '-2.34', three_year_inc: '-4.56', ytd_return: '-0.89', recommend_flag: 'N', purchase_flag: 'N', fund_url: 'https://www.hsbcjt.cn/fund/540012' },
  { fund_name: '汇丰晋信大盘波动股票A', fund_code: '540013', fund_type: '股票型', product_type: '公募', risk_level: 'R4', nav_date: '2024-01-15', nav: '1.7650', shouyi: '11.23', three_year_inc: '22.15', ytd_return: '4.67', recommend_flag: 'Y', purchase_flag: 'Y', fund_url: 'https://www.hsbcjt.cn/fund/540013' },
  { fund_name: '汇丰晋信双核策略混合A', fund_code: '540015', fund_type: '混合型', product_type: '公募', risk_level: 'R3', nav_date: '2024-01-15', nav: '1.5430', shouyi: '-1.56', three_year_inc: '3.21', ytd_return: '-0.45', recommend_flag: 'N', purchase_flag: 'N', fund_url: 'https://www.hsbcjt.cn/fund/540015' },
  { fund_name: '汇丰晋信珠三角债券A', fund_code: '540014', fund_type: '债券型', product_type: '公募', risk_level: 'R2', nav_date: '2024-01-15', nav: '1.1230', shouyi: '4.12', three_year_inc: '9.87', ytd_return: '1.56', recommend_flag: 'N', purchase_flag: 'Y', fund_url: 'https://www.hsbcjt.cn/fund/540014' },
  { fund_name: '汇丰晋信慧生活货币A', fund_code: '540016', fund_type: '货币型', product_type: '公募', risk_level: 'R1', nav_date: '2024-01-15', nav: '1.0000', shouyi: '2.15', three_year_inc: '6.54', ytd_return: '0.78', recommend_flag: 'N', purchase_flag: 'Y', fund_url: 'https://www.hsbcjt.cn/fund/540016' },
];

// 判断是否为开发环境
const isDev = process.env.NODE_ENV === 'development';

/**
 * 从 Qlik Sense 获取基金数据
 * 生产环境使用 enigma.js 通过 WebSocket 连接 Qlik Engine
 */
async function fetchFromQlik(): Promise<Fund[]> {
  const wssUrl = process.env.NEXT_PUBLIC_QLIK_WSS_URL || '';
  const appId = process.env.NEXT_PUBLIC_QLIK_APP_ID || '';

  if (!wssUrl || !appId) {
    console.warn('Qlik 配置缺失，使用 mock 数据');
    return MOCK_DATA;
  }

  try {
    console.log('连接 Qlik Engine...', { wssUrl, appId });

    const session = enigma.create({
      schema,
      url: wssUrl,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const global = (await session.open()) as any;
    console.log('Qlik 连接成功');

    const app = await global.openDoc(appId);
    console.log('打开 App 成功:', appId);

    // 查询 A：基础信息 + nav/shouyi
    const cubeA = await app.createSessionObject({
      qInfo: { qType: 'fund-list-a' },
      qHyperCubeDef: {
        qDimensions: [
          { qDef: { qFieldDefs: ['fund_name'], qFieldLabels: ['基金简称'] } },
          { qDef: { qFieldDefs: ['fund_code'], qFieldLabels: ['基金代码'] } },
          { qDef: { qFieldDefs: ['fund_type'], qFieldLabels: ['基金类型'] } },
          { qDef: { qFieldDefs: ['product_type'], qFieldLabels: ['产品类型'] } },
          { qDef: { qFieldDefs: ['risk_level'], qFieldLabels: ['产品风险等级'] } },
          { qDef: { qFieldDefs: ['nav_date'], qFieldLabels: ['净值日期'] } },
          { qDef: { qFieldDefs: ['recommend_flag'], qFieldLabels: ['重点产品标志'] } },
          { qDef: { qFieldDefs: ['purchase_flag'], qFieldLabels: ['是否可购买'] } },
          { qDef: { qFieldDefs: ['fund_url'], qFieldLabels: ['基金详情链接'] } },
        ],
        qMeasures: [
          { qDef: { qDef: 'nav', qLabel: '单位净值' } },
          { qDef: { qDef: 'shouyi', qLabel: '近一年收益率' } },
        ],
        qInitialDataFetch: [{ qTop: 0, qLeft: 0, qWidth: 11, qHeight: 1000 }],
      },
    });

    // 查询 B：fund_code + three_year_inc/ytd_return
    const cubeB = await app.createSessionObject({
      qInfo: { qType: 'fund-list-b' },
      qHyperCubeDef: {
        qDimensions: [
          { qDef: { qFieldDefs: ['fund_code'], qFieldLabels: ['基金代码'] } },
        ],
        qMeasures: [
          { qDef: { qDef: 'three_year_inc', qLabel: '近三年收益率' } },
          { qDef: { qDef: 'ytd_return', qLabel: '今年以来收益' } },
        ],
        qInitialDataFetch: [{ qTop: 0, qLeft: 0, qWidth: 3, qHeight: 1000 }],
      },
    });

    // 获取查询 A 数据
    const layoutA = await cubeA.getLayout();
    const matrixA = layoutA.qHyperCube?.qDataPages?.[0]?.qMatrix || [];
    console.log('查询 A 行数:', matrixA.length);

    // 获取查询 B 数据
    const layoutB = await cubeB.getLayout();
    const matrixB = layoutB.qHyperCube?.qDataPages?.[0]?.qMatrix || [];
    console.log('查询 B 行数:', matrixB.length);

    // 构建 code -> { three_year_inc, ytd_return } 映射
    const mapB = new Map<string, { three_year_inc: string; ytd_return: string }>();
    for (const row of matrixB as Array<Array<{qText?: string; qNum?: number}>>) {
      const code = String(row[0]?.qText || '');
      mapB.set(code, {
        three_year_inc: String(row[1]?.qNum !== undefined ? row[1]?.qNum : (row[1]?.qText || '')),
        ytd_return: String(row[2]?.qNum !== undefined ? row[2]?.qNum : (row[2]?.qText || '')),
      });
    }

    // 合并结果
    const funds: Fund[] = matrixA.map((row: Array<{qText?: string; qNum?: number}>) => {
      const code = String(row[1]?.qText || '');
      const extra = mapB.get(code) || { three_year_inc: '', ytd_return: '' };
      return {
        fund_name: String(row[0]?.qText || ''),
        fund_code: code,
        fund_type: String(row[2]?.qText || ''),
        product_type: String(row[3]?.qText || ''),
        risk_level: String(row[4]?.qText || ''),
        nav_date: String(row[5]?.qText || ''),
        recommend_flag: String(row[6]?.qText || 'N'),
        purchase_flag: String(row[7]?.qText || 'N'),
        fund_url: String(row[8]?.qText || ''),
        nav: String(row[9]?.qNum !== undefined ? row[9]?.qNum : (row[9]?.qText || '')),
        shouyi: String(row[10]?.qNum !== undefined ? row[10]?.qNum : (row[10]?.qText || '')),
        three_year_inc: extra.three_year_inc,
        ytd_return: extra.ytd_return,
      };
    });

    await session.close();
    return funds;
  } catch (error) {
    console.error('Qlik 查询失败:', error);
    console.error('错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      wssUrl,
      appId,
    });
    return MOCK_DATA;
  }
}

/**
 * 获取基金数据
 * 开发环境返回 mock 数据，生产环境从 Qlik Sense 获取
 */
export async function getFunds(): Promise<Fund[]> {
  if (isDev) {
    console.log('开发环境，使用 mock 数据');
    return MOCK_DATA;
  }
  return fetchFromQlik();
}
