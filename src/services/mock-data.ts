import type { Team, TeamMember, BusinessMetrics, TrendData, Activity, Customer, Policy, DateRange } from '@/types';

// Mock 团队数据
export const MOCK_TEAMS: Team[] = [
  {
    id: 'team-1',
    name: '销售一部',
    members: [
      { id: 'm1', name: '张三', role: '高级理财顾问', teamId: 'team-1' },
      { id: 'm2', name: '李四', role: '理财顾问', teamId: 'team-1' },
      { id: 'm3', name: '王五', role: '理财顾问', teamId: 'team-1' },
      { id: 'm4', name: '赵六', role: '实习顾问', teamId: 'team-1' },
    ],
  },
  {
    id: 'team-2',
    name: '销售二部',
    members: [
      { id: 'm5', name: '孙七', role: '高级理财顾问', teamId: 'team-2' },
      { id: 'm6', name: '周八', role: '理财顾问', teamId: 'team-2' },
      { id: 'm7', name: '吴九', role: '理财顾问', teamId: 'team-2' },
    ],
  },
  {
    id: 'team-3',
    name: '销售三部',
    members: [
      { id: 'm8', name: '郑十', role: '高级理财顾问', teamId: 'team-3' },
      { id: 'm9', name: '钱十一', role: '理财顾问', teamId: 'team-3' },
      { id: 'm10', name: '陈十二', role: '理财顾问', teamId: 'team-3' },
      { id: 'm11', name: '林十三', role: '实习顾问', teamId: 'team-3' },
      { id: 'm12', name: '黄十四', role: '实习顾问', teamId: 'team-3' },
    ],
  },
];

// Mock 业务指标数据
const generateMetrics = (teamId: string | null, memberId: string | null): BusinessMetrics => {
  const base = {
    totalPremium: 1250000,
    newPolicies: 45,
    renewalRate: 85.5,
    customerCount: 320,
    activeAgents: 12,
    avgPremiumPerPolicy: 27800,
  };

  if (memberId) {
    return {
      totalPremium: base.totalPremium * 0.15,
      newPolicies: Math.floor(base.newPolicies * 0.2),
      renewalRate: base.renewalRate + (Math.random() * 10 - 5),
      customerCount: Math.floor(base.customerCount * 0.12),
      activeAgents: 1,
      avgPremiumPerPolicy: base.avgPremiumPerPolicy * (0.8 + Math.random() * 0.4),
    };
  }

  if (teamId) {
    return {
      totalPremium: base.totalPremium * 0.4,
      newPolicies: Math.floor(base.newPolicies * 0.35),
      renewalRate: base.renewalRate + (Math.random() * 5 - 2.5),
      customerCount: Math.floor(base.customerCount * 0.3),
      activeAgents: 4,
      avgPremiumPerPolicy: base.avgPremiumPerPolicy * (0.9 + Math.random() * 0.2),
    };
  }

  return base;
};

// Mock 趋势数据
const generateTrendData = (days: number): TrendData[] => {
  const data: TrendData[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      premium: Math.floor(30000 + Math.random() * 50000),
      policies: Math.floor(2 + Math.random() * 8),
      customers: Math.floor(5 + Math.random() * 15),
    });
  }
  return data;
};

// Mock 活动数据
const MOCK_ACTIVITIES: Activity[] = [
  { id: 'a1', type: 'visit', title: '客户拜访', description: '拜访VIP客户王先生，讨论续保方案', date: '2024-01-15', memberId: 'm1', memberName: '张三', status: 'completed' },
  { id: 'a2', type: 'call', title: '电话跟进', description: '跟进潜在客户李女士的保单咨询', date: '2024-01-15', memberId: 'm2', memberName: '李四', status: 'completed' },
  { id: 'a3', type: 'meeting', title: '团队会议', description: '月度业绩回顾与目标分解', date: '2024-01-16', memberId: 'm1', memberName: '张三', status: 'pending' },
  { id: 'a4', type: 'training', title: '产品培训', description: '新产品知识培训', date: '2024-01-17', memberId: 'm5', memberName: '孙七', status: 'pending' },
  { id: 'a5', type: 'visit', title: '客户拜访', description: '新客户首次拜访，需求分析', date: '2024-01-14', memberId: 'm3', memberName: '王五', status: 'completed' },
  { id: 'a6', type: 'call', title: '续保提醒', description: '保单到期续保提醒电话', date: '2024-01-14', memberId: 'm6', memberName: '周八', status: 'completed' },
  { id: 'a7', type: 'meeting', title: '客户沙龙', description: '高端客户理财沙龙活动', date: '2024-01-18', memberId: 'm8', memberName: '郑十', status: 'pending' },
  { id: 'a8', type: 'other', title: '资料整理', description: '整理客户档案和保单资料', date: '2024-01-13', memberId: 'm4', memberName: '赵六', status: 'completed' },
];

// Mock 客户数据
const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: '王建国', phone: '138****1234', level: 'vip', totalPolicies: 5, totalPremium: 580000, lastContactDate: '2024-01-15', memberId: 'm1', memberName: '张三' },
  { id: 'c2', name: '李美华', phone: '139****5678', level: 'vip', totalPolicies: 3, totalPremium: 420000, lastContactDate: '2024-01-14', memberId: 'm1', memberName: '张三' },
  { id: 'c3', name: '张志强', phone: '136****9012', level: 'normal', totalPolicies: 2, totalPremium: 150000, lastContactDate: '2024-01-10', memberId: 'm2', memberName: '李四' },
  { id: 'c4', name: '刘芳', phone: '137****3456', level: 'normal', totalPolicies: 1, totalPremium: 80000, lastContactDate: '2024-01-12', memberId: 'm2', memberName: '李四' },
  { id: 'c5', name: '陈大明', phone: '135****7890', level: 'potential', totalPolicies: 0, totalPremium: 0, lastContactDate: '2024-01-13', memberId: 'm3', memberName: '王五' },
  { id: 'c6', name: '赵丽娟', phone: '133****2345', level: 'vip', totalPolicies: 4, totalPremium: 650000, lastContactDate: '2024-01-11', memberId: 'm5', memberName: '孙七' },
  { id: 'c7', name: '孙伟', phone: '158****6789', level: 'normal', totalPolicies: 2, totalPremium: 180000, lastContactDate: '2024-01-09', memberId: 'm6', memberName: '周八' },
  { id: 'c8', name: '周晓燕', phone: '159****0123', level: 'potential', totalPolicies: 0, totalPremium: 0, lastContactDate: '2024-01-14', memberId: 'm8', memberName: '郑十' },
];

// Mock 保单数据
const MOCK_POLICIES: Policy[] = [
  { id: 'p1', policyNo: 'HSB20240001', customerName: '王建国', productType: '终身寿险', premium: 120000, startDate: '2024-01-01', endDate: '2044-01-01', status: 'active', memberId: 'm1', memberName: '张三' },
  { id: 'p2', policyNo: 'HSB20240002', customerName: '王建国', productType: '重疾险', premium: 80000, startDate: '2024-01-05', endDate: '2044-01-05', status: 'active', memberId: 'm1', memberName: '张三' },
  { id: 'p3', policyNo: 'HSB20240003', customerName: '李美华', productType: '年金险', premium: 200000, startDate: '2023-06-01', endDate: '2043-06-01', status: 'active', memberId: 'm1', memberName: '张三' },
  { id: 'p4', policyNo: 'HSB20240004', customerName: '张志强', productType: '医疗险', premium: 15000, startDate: '2024-01-10', endDate: '2025-01-10', status: 'active', memberId: 'm2', memberName: '李四' },
  { id: 'p5', policyNo: 'HSB20240005', customerName: '赵丽娟', productType: '终身寿险', premium: 150000, startDate: '2023-03-01', endDate: '2043-03-01', status: 'active', memberId: 'm5', memberName: '孙七' },
  { id: 'p6', policyNo: 'HSB20240006', customerName: '刘芳', productType: '意外险', premium: 3000, startDate: '2024-01-12', endDate: '2025-01-12', status: 'pending', memberId: 'm2', memberName: '李四' },
  { id: 'p7', policyNo: 'HSB20230010', customerName: '陈明', productType: '重疾险', premium: 45000, startDate: '2023-01-01', endDate: '2024-01-01', status: 'expired', memberId: 'm3', memberName: '王五' },
];

// 日期范围选项
export const DATE_RANGE_OPTIONS: DateRange[] = [
  { start: '2024-01-01', end: '2024-01-31', label: '本月' },
  { start: '2023-10-01', end: '2024-01-31', label: '近3个月' },
  { start: '2023-07-01', end: '2024-01-31', label: '近6个月' },
  { start: '2023-01-01', end: '2024-01-31', label: '本年度' },
  { start: '2022-01-01', end: '2024-01-31', label: '近3年' },
];

// API 服务函数
export async function getTeams(): Promise<Team[]> {
  return MOCK_TEAMS;
}

export async function getBusinessMetrics(
  teamId: string | null,
  memberId: string | null
): Promise<BusinessMetrics> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return generateMetrics(teamId, memberId);
}

export async function getTrendData(
  teamId: string | null,
  memberId: string | null,
  dateRange: DateRange
): Promise<TrendData[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return generateTrendData(Math.min(days, 90));
}

export async function getActivities(
  teamId: string | null,
  memberId: string | null
): Promise<Activity[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  let filtered = [...MOCK_ACTIVITIES];
  if (memberId) {
    filtered = filtered.filter(a => a.memberId === memberId);
  } else if (teamId) {
    const team = MOCK_TEAMS.find(t => t.id === teamId);
    if (team) {
      const memberIds = team.members.map(m => m.id);
      filtered = filtered.filter(a => memberIds.includes(a.memberId));
    }
  }
  return filtered;
}

export async function getCustomers(
  teamId: string | null,
  memberId: string | null
): Promise<Customer[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  let filtered = [...MOCK_CUSTOMERS];
  if (memberId) {
    filtered = filtered.filter(c => c.memberId === memberId);
  } else if (teamId) {
    const team = MOCK_TEAMS.find(t => t.id === teamId);
    if (team) {
      const memberIds = team.members.map(m => m.id);
      filtered = filtered.filter(c => memberIds.includes(c.memberId));
    }
  }
  return filtered;
}

export async function getPolicies(
  teamId: string | null,
  memberId: string | null
): Promise<Policy[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  let filtered = [...MOCK_POLICIES];
  if (memberId) {
    filtered = filtered.filter(p => p.memberId === memberId);
  } else if (teamId) {
    const team = MOCK_TEAMS.find(t => t.id === teamId);
    if (team) {
      const memberIds = team.members.map(m => m.id);
      filtered = filtered.filter(p => memberIds.includes(p.memberId));
    }
  }
  return filtered;
}
