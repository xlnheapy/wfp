'use client';

import React from 'react';
import { Avatar, List } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import type { TeamMember } from '@/types';

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
  return (
    <aside className="crm-sidebar">
      <div className="crm-sidebar-header">
        <TeamOutlined className="crm-sidebar-icon" />
        <span className="crm-sidebar-title">{teamName}</span>
      </div>
      <div className="crm-sidebar-content">
        <div
          className={`crm-member-item ${selectedMemberId === null ? 'crm-member-active' : ''}`}
          onClick={() => onMemberSelect(null)}
        >
          <Avatar size="small" icon={<TeamOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <span className="crm-member-name">全部成员</span>
          <span className="crm-member-count">{members.length}人</span>
        </div>
        <List
          dataSource={members}
          renderItem={(member) => (
            <div
              key={member.id}
              className={`crm-member-item ${selectedMemberId === member.id ? 'crm-member-active' : ''}`}
              onClick={() => onMemberSelect(member.id)}
            >
              <Avatar size="small" icon={<UserOutlined />} />
              <span className="crm-member-name">{member.name}</span>
              <span className="crm-member-role">{member.role}</span>
            </div>
          )}
        />
      </div>
    </aside>
  );
}
