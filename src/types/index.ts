// 团队成员
export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  teamId: string;
}

// 团队
export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
}

// 业务指标
export interface BusinessMetrics {
  totalPremium: number;        // 总保费
  newPolicies: number;         // 新单数
  renewalRate: number;         // 续保率
  customerCount: number;       // 客户数
  activeAgents: number;        // 活跃代理人
  avgPremiumPerPolicy: number; // 件均保费
}

// 业绩趋势数据
export interface TrendData {
  date: string;
  premium: number;
  policies: number;
  customers: number;
}

// 活动记录
export interface Activity {
  id: string;
  type: 'visit' | 'call' | 'meeting' | 'training' | 'other';
  title: string;
  description: string;
  date: string;
  memberId: string;
  memberName: string;
  status: 'completed' | 'pending' | 'cancelled';
}

// 客户信息
export interface Customer {
  id: string;
  name: string;
  phone: string;
  level: 'vip' | 'normal' | 'potential';
  totalPolicies: number;
  totalPremium: number;
  lastContactDate: string;
  memberId: string;
  memberName: string;
}

// 保单信息
export interface Policy {
  id: string;
  policyNo: string;
  customerName: string;
  productType: string;
  premium: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'pending' | 'cancelled';
  memberId: string;
  memberName: string;
}

// 日期范围
export interface DateRange {
  start: string;
  end: string;
  label: string;
}

// 选择状态
export interface SelectionState {
  teamId: string | null;
  memberId: string | null;
  dateRange: DateRange;
}
