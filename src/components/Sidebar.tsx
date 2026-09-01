'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, List } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  DashboardOutlined,
  ScheduleOutlined,
  UsergroupAddOutlined,
  FileProtectOutlined,
} from '@ant-design/icons';
import type { TeamMember } from '@/types';

const MENU_ITEMS = [
  { key: '/business-indicators', icon: <DashboardOutlined />, label: '业务指标中心' },
  { key: '/activity-tracking', icon: <ScheduleOutlined />, label: '活动跟踪' },
  { key: '/customer-operations', icon: <UsergroupAddOutlined />, label: '客户运营' },
  { key: '/policy-follow-up', icon: <FileProtectOutlined />, label: '保单跟进与关系维护' },
];

interface SidebarProps {
  members: TeamMember[];
  selectedMemberId: string | null;
  onMemberSelect: (memberId: string | null) => void;
  teamName: string;
}

export default function Sidebar({
  members,
  selectedMemberId,
  onMemberSelect,
  teamName,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleMenuClick = (key: string) => {
    router.push(key);
  };

  const currentKey = MENU_ITEMS.find(item => pathname.startsWith(item.key))?.key || '/business-indicators';

  return (
    <aside className="crm-sidebar">
      {/* 导航菜单 */}
      <div className="crm-sidebar-section">
        <div className="crm-sidebar-section-title">功能导航</div>
        <nav className="crm-sidebar-nav">
          {MENU_ITEMS.map(item => (
            <div
              key={item.key}
              className={`crm-nav-item ${currentKey === item.key ? 'crm-nav-item-active' : ''}`}
              onClick={() => handleMenuClick(item.key)}
            >
              <span className="crm-nav-icon">{item.icon}</span>
              <span className="crm-nav-label">{item.label}</span>
            </div>
          ))}
        </nav>
      </div>

      {/* 团队成员 */}
      <div className="crm-sidebar-section">
        <div className="crm-sidebar-section-title">
          <TeamOutlined style={{ marginRight: 6 }} />
          {teamName}
        </div>
        <div className="crm-sidebar-members">
          <div
            className={`crm-member-item ${selectedMemberId === null ? 'crm-member-active' : ''}`}
            onClick={() => onMemberSelect(null)}
          >
            <Avatar size={28} icon={<TeamOutlined />} style={{ backgroundColor: '#1890ff', flexShrink: 0 }} />
            <span className="crm-member-name">全部成员</span>
            <span className="crm-member-badge">{members.length}</span>
          </div>
          <List
            dataSource={members}
            renderItem={(member) => (
              <div
                key={member.id}
                className={`crm-member-item ${selectedMemberId === member.id ? 'crm-member-active' : ''}`}
                onClick={() => onMemberSelect(member.id)}
              >
                <Avatar size={28} icon={<UserOutlined />} style={{ flexShrink: 0 }} />
                <div className="crm-member-info">
                  <span className="crm-member-name">{member.name}</span>
                  <span className="crm-member-role">{member.role}</span>
                </div>
              </div>
            )}
          />
        </div>
      </div>
    </aside>
  );
}
