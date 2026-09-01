'use client';

import React from 'react';
import { Select, DatePicker } from 'antd';
import { TeamOutlined, CalendarOutlined } from '@ant-design/icons';
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
        <h1 className="crm-logo">CRM 管理系统</h1>
      </div>
      <div className="crm-header-center">
        <div className="crm-selector-group">
          <TeamOutlined className="crm-selector-icon" />
          <Select
            value={selectedTeamId || ''}
            onChange={onTeamChange}
            options={teamOptions}
            style={{ width: 160 }}
            placeholder="选择团队"
          />
        </div>
      </div>
      <div className="crm-header-right">
        <div className="crm-selector-group">
          <CalendarOutlined className="crm-selector-icon" />
          <Select
            value={dateRange.label}
            onChange={handleDateRangeSelect}
            style={{ width: 120 }}
            options={DATE_RANGE_OPTIONS.map(r => ({ value: r.label, label: r.label }))}
          />
          <RangePicker
            onChange={handleCustomDateChange}
            style={{ marginLeft: 8 }}
            value={[dayjs(dateRange.start), dayjs(dateRange.end)]}
            size="middle"
          />
        </div>
      </div>
    </header>
  );
}
