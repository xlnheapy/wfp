'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Tag, Spin, Tabs, List, Avatar } from 'antd';
import { PhoneOutlined, TeamOutlined, SolutionOutlined, BookOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { LayoutContext } from '@/components/MainLayout';
import { getActivities } from '@/services/mock-data';
import type { Activity } from '@/types';

const ACTIVITY_TYPE_MAP = {
  visit: { label: '客户拜访', icon: <TeamOutlined />, color: 'blue' },
  call: { label: '电话跟进', icon: <PhoneOutlined />, color: 'green' },
  meeting: { label: '会议', icon: <SolutionOutlined />, color: 'purple' },
  training: { label: '培训', icon: <BookOutlined />, color: 'orange' },
  other: { label: '其他', icon: <QuestionCircleOutlined />, color: 'default' },
};

const STATUS_MAP = {
  completed: { label: '已完成', color: 'success' },
  pending: { label: '待进行', color: 'processing' },
  cancelled: { label: '已取消', color: 'error' },
};

export default function ActivityTracking() {
  const { teamId, memberId } = useContext(LayoutContext);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [teamId, memberId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getActivities(teamId, memberId);
      setActivities(data);
    } catch (error) {
      console.error('加载活动数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Activity> = [
    {
      title: '活动类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: keyof typeof ACTIVITY_TYPE_MAP) => {
        const config = ACTIVITY_TYPE_MAP[type];
        return <Tag icon={config.icon} color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '活动标题',
      dataIndex: 'title',
      key: 'title',
      width: 150,
    },
    {
      title: '详细描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '执行人',
      dataIndex: 'memberName',
      key: 'memberName',
      width: 100,
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: keyof typeof STATUS_MAP) => {
        const config = STATUS_MAP[status];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
  ];

  // 按类型统计
  const typeStats = Object.entries(ACTIVITY_TYPE_MAP).map(([key, config]) => ({
    key,
    ...config,
    count: activities.filter(a => a.type === key).length,
  }));

  // 按人员统计
  const memberStats = Array.from(new Set(activities.map(a => a.memberName))).map(name => ({
    name,
    count: activities.filter(a => a.memberName === name).length,
  }));

  if (loading) {
    return (
      <div className="crm-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <h2>活动跟踪</h2>
      </div>

      {/* 统计概览 */}
      <div className="crm-stats-row">
        <Card className="crm-stats-card" title="活动类型分布">
          <List
            dataSource={typeStats}
            renderItem={item => (
              <List.Item>
                <Tag icon={item.icon} color={item.color}>{item.label}</Tag>
                <span className="crm-stats-count">{item.count} 次</span>
              </List.Item>
            )}
          />
        </Card>
        <Card className="crm-stats-card" title="人员活动排行">
          <List
            dataSource={memberStats.sort((a, b) => b.count - a.count)}
            renderItem={item => (
              <List.Item>
                <Avatar size="small">{item.name[0]}</Avatar>
                <span className="crm-stats-name">{item.name}</span>
                <span className="crm-stats-count">{item.count} 次活动</span>
              </List.Item>
            )}
          />
        </Card>
      </div>

      {/* 活动列表 */}
      <Card title="活动记录" style={{ marginTop: 16 }}>
        <Tabs
          items={[
            { key: 'all', label: '全部', children: null },
            { key: 'completed', label: '已完成', children: null },
            { key: 'pending', label: '待进行', children: null },
          ]}
        />
        <Table
          columns={columns}
          dataSource={activities}
          rowKey="id"
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          size="middle"
        />
      </Card>
    </div>
  );
}
