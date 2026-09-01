'use client';

import React from 'react';
import { Select, DatePicker } from 'antd';
import { CalendarOutlined, UserOutlined } from '@ant-design/icons';
import type { Team, DateRange } from '@/types';
import { DATE_RANGE_OPTIONS } from '@/services/mock-data';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface HeaderProps {
  teams: Team[];
  selectedTeamId: string | null;
  onTeamChange: (teamId: string | null) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export default function Header({
  teams,
  selectedTeamId,
  onTeamChange,
  dateRange,
  onDateRangeChange,
}: HeaderProps) {
  const teamOptions = [
    { value: '', label: '全部团队' },
    ...teams.map(team => ({ value: team.id, label: team.name })),
  ];

  const handleDateRangeSelect = (value: string) => {
    const range = DATE_RANGE_OPTIONS.find(r => r.label === value);
    if (range) {
      onDateRangeChange(range);
    }
  };

  const handleCustomDateChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      onDateRangeChange({
        start: dates[0].format('YYYY-MM-DD'),
        end: dates[1].format('YYYY-MM-DD'),
        label: `${dates[0].format('MM/DD')} - ${dates[1].format('MM/DD')}`,
      });
    }
  };

  return (
    <header className="crm-header">
      <div className="crm-header-left">
        <div className="crm-logo-area">
          <span className="crm-logo-icon">CRM</span>
          <span className="crm-logo-text">客户关系管理系统</span>
        </div>
      </div>
      <div className="crm-header-right">
        <div className="crm-header-selector">
          <span className="crm-header-label">团队：</span>
          <Select
            value={selectedTeamId || ''}
            onChange={onTeamChange}
            options={teamOptions}
            style={{ width: 140 }}
            placeholder="选择团队"
            size="small"
            variant="borderless"
            popupMatchSelectWidth={false}
            className="crm-header-select"
          />
        </div>
        <div className="crm-header-divider" />
        <div className="crm-header-selector">
          <CalendarOutlined style={{ color: 'rgba(255,255,255,0.85)', marginRight: 4 }} />
          <Select
            value={dateRange.label}
            onChange={handleDateRangeSelect}
            style={{ width: 100 }}
            options={DATE_RANGE_OPTIONS.map(r => ({ value: r.label, label: r.label }))}
            size="small"
            variant="borderless"
            popupMatchSelectWidth={false}
            className="crm-header-select"
          />
          <RangePicker
            onChange={handleCustomDateChange}
            style={{ marginLeft: 4 }}
            value={[dayjs(dateRange.start), dayjs(dateRange.end)]}
            size="small"
          />
        </div>
        <div className="crm-header-divider" />
        <div className="crm-header-user">
          <UserOutlined style={{ color: 'rgba(255,255,255,0.85)' }} />
          <span className="crm-header-username">管理员</span>
        </div>
      </div>
    </header>
  );
}
