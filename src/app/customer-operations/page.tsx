'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Tag, Spin, Input, Select, Row, Col, Statistic } from 'antd';
import { UserOutlined, CrownOutlined, StarOutlined, PhoneOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { LayoutContext } from '@/components/MainLayout';
import { getCustomers } from '@/services/mock-data';
import type { Customer } from '@/types';

const LEVEL_MAP = {
  vip: { label: 'VIP', color: 'gold', icon: <CrownOutlined /> },
  normal: { label: '普通', color: 'blue', icon: <UserOutlined /> },
  potential: { label: '潜在', color: 'green', icon: <StarOutlined /> },
};

export default function CustomerOperations() {
  const { teamId, memberId } = useContext(LayoutContext);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [teamId, memberId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getCustomers(teamId, memberId);
      setCustomers(data);
    } catch (error) {
      console.error('加载客户数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Customer> = [
    {
      title: '客户姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '客户等级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: keyof typeof LEVEL_MAP) => {
        const config = LEVEL_MAP[level];
        return <Tag icon={config.icon} color={config.color}>{config.label}</Tag>;
      },
      filters: [
        { text: 'VIP', value: 'vip' },
        { text: '普通', value: 'normal' },
        { text: '潜在', value: 'potential' },
      ],
      onFilter: (value, record) => record.level === value,
    },
    {
      title: '保单数',
      dataIndex: 'totalPolicies',
      key: 'totalPolicies',
      width: 80,
      sorter: (a, b) => a.totalPolicies - b.totalPolicies,
    },
    {
      title: '累计保费',
      dataIndex: 'totalPremium',
      key: 'totalPremium',
      width: 120,
      sorter: (a, b) => a.totalPremium - b.totalPremium,
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '最近联系',
      dataIndex: 'lastContactDate',
      key: 'lastContactDate',
      width: 120,
      sorter: (a, b) => a.lastContactDate.localeCompare(b.lastContactDate),
    },
    {
      title: '服务人员',
      dataIndex: 'memberName',
      key: 'memberName',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: () => <a>查看详情</a>,
    },
  ];

  // 过滤数据
  const filteredCustomers = customers.filter(c => {
    const matchKeyword = !searchKeyword ||
      c.name.includes(searchKeyword) ||
      c.phone.includes(searchKeyword);
    const matchLevel = levelFilter === 'all' || c.level === levelFilter;
    return matchKeyword && matchLevel;
  });

  // 统计数据
  const vipCount = customers.filter(c => c.level === 'vip').length;
  const totalPremium = customers.reduce((sum, c) => sum + c.totalPremium, 0);
  const totalPolicies = customers.reduce((sum, c) => sum + c.totalPolicies, 0);

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
        <h2>客户运营</h2>
      </div>

      {/* 客户概览统计 */}
      <Row gutter={[16, 16]} className="crm-metrics-row">
        <Col xs={24} sm={8}>
          <Card className="crm-metric-card">
            <Statistic
              title="客户总数"
              value={customers.length}
              prefix={<UserOutlined />}
              suffix="人"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="crm-metric-card">
            <Statistic
              title="VIP 客户"
              value={vipCount}
              prefix={<CrownOutlined />}
              valueStyle={{ color: '#faad14' }}
              suffix="人"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="crm-metric-card">
            <Statistic
              title="累计保费"
              value={totalPremium}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card style={{ marginTop: 16 }}>
        <div className="crm-filter-row">
          <Input
            placeholder="搜索客户姓名或电话"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            value={levelFilter}
            onChange={setLevelFilter}
            style={{ width: 120 }}
            options={[
              { value: 'all', label: '全部等级' },
              { value: 'vip', label: 'VIP' },
              { value: 'normal', label: '普通' },
              { value: 'potential', label: '潜在' },
            ]}
          />
          <span className="crm-filter-count">共 {filteredCustomers.length} 位客户</span>
        </div>

        {/* 客户列表 */}
        <Table
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          size="middle"
        />
      </Card>
    </div>
  );
}
