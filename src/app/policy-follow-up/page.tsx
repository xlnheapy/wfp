'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Card, Table, Tag, Spin, Tabs, Row, Col, Statistic, Timeline, Avatar } from 'antd';
import { FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { LayoutContext } from '@/components/MainLayout';
import { getPolicies } from '@/services/mock-data';
import type { Policy } from '@/types';

const STATUS_MAP = {
  active: { label: '有效', color: 'success', icon: <CheckCircleOutlined /> },
  expired: { label: '已过期', color: 'default', icon: <ClockCircleOutlined /> },
  pending: { label: '待生效', color: 'processing', icon: <ExclamationCircleOutlined /> },
  cancelled: { label: '已取消', color: 'error', icon: <CloseCircleOutlined /> },
};

export default function PolicyFollowUp() {
  const { teamId, memberId } = useContext(LayoutContext);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [teamId, memberId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getPolicies(teamId, memberId);
      setPolicies(data);
    } catch (error) {
      console.error('加载保单数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<Policy> = [
    {
      title: '保单号',
      dataIndex: 'policyNo',
      key: 'policyNo',
      width: 140,
    },
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 100,
    },
    {
      title: '险种类型',
      dataIndex: 'productType',
      key: 'productType',
      width: 100,
    },
    {
      title: '保费',
      dataIndex: 'premium',
      key: 'premium',
      width: 100,
      sorter: (a, b) => a.premium - b.premium,
      render: (value: number) => `¥${value.toLocaleString()}`,
    },
    {
      title: '起保日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 110,
    },
    {
      title: '到期日期',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 110,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: keyof typeof STATUS_MAP) => {
        const config = STATUS_MAP[status];
        return <Tag icon={config.icon} color={config.color}>{config.label}</Tag>;
      },
      filters: [
        { text: '有效', value: 'active' },
        { text: '已过期', value: 'expired' },
        { text: '待生效', value: 'pending' },
        { text: '已取消', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
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
      width: 120,
      render: () => (
        <>
          <a style={{ marginRight: 8 }}>跟进</a>
          <a>详情</a>
        </>
      ),
    },
  ];

  // 统计数据
  const activeCount = policies.filter(p => p.status === 'active').length;
  const pendingCount = policies.filter(p => p.status === 'pending').length;
  const totalPremium = policies.reduce((sum, p) => sum + p.premium, 0);

  // 即将到期的保单（30天内）
  const expiringSoon = policies.filter(p => {
    if (p.status !== 'active') return false;
    const endDate = new Date(p.endDate);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  });

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
        <h2>保单跟进与关系维护</h2>
      </div>

      {/* 保单概览 */}
      <Row gutter={[16, 16]} className="crm-metrics-row">
        <Col xs={24} sm={8}>
          <Card className="crm-metric-card">
            <Statistic
              title="有效保单"
              value={activeCount}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix="份"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="crm-metric-card">
            <Statistic
              title="待生效"
              value={pendingCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix="份"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="crm-metric-card">
            <Statistic
              title="保费总额"
              value={totalPremium}
              prefix="¥"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 即将到期提醒 */}
      {expiringSoon.length > 0 && (
        <Card title="即将到期保单" style={{ marginTop: 16 }} className="crm-alert-card">
          <Timeline
            items={expiringSoon.map(p => ({
              color: 'orange',
              children: (
                <div>
                  <strong>{p.policyNo}</strong> - {p.customerName}
                  <span style={{ marginLeft: 8, color: '#faad14' }}>
                    到期日: {p.endDate}
                  </span>
                  <span style={{ marginLeft: 8 }}>服务人员: {p.memberName}</span>
                </div>
              ),
            }))}
          />
        </Card>
      )}

      {/* 保单列表 */}
      <Card title="保单列表" style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={policies}
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
