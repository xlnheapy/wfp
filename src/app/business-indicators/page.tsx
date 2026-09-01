'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, FundOutlined, TeamOutlined, FileTextOutlined, UserOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import { LayoutContext } from '@/components/MainLayout';
import { getBusinessMetrics, getTrendData } from '@/services/mock-data';
import type { BusinessMetrics, TrendData } from '@/types';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

export default function BusinessIndicators() {
  const { teamId, memberId, dateRange } = useContext(LayoutContext);
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [teamId, memberId, dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsData, trend] = await Promise.all([
        getBusinessMetrics(teamId, memberId),
        getTrendData(teamId, memberId, dateRange),
      ]);
      setMetrics(metricsData);
      setTrendData(trend);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPremiumTrendOption = () => ({
    title: { text: '保费收入趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: trendData.map(d => d.date) },
    yAxis: { type: 'value', name: '保费(元)' },
    series: [{
      name: '保费',
      type: 'line',
      smooth: true,
      data: trendData.map(d => d.premium),
      areaStyle: { opacity: 0.3 },
      lineStyle: { width: 2 },
      itemStyle: { color: '#1890ff' },
    }],
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  });

  const getPoliciesTrendOption = () => ({
    title: { text: '新单数量趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: trendData.map(d => d.date) },
    yAxis: { type: 'value', name: '单数' },
    series: [{
      name: '新单',
      type: 'bar',
      data: trendData.map(d => d.policies),
      itemStyle: { color: '#52c41a', borderRadius: [4, 4, 0, 0] },
    }],
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  });

  const getCustomerTrendOption = () => ({
    title: { text: '客户增长趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['新增客户'], bottom: 0 },
    xAxis: { type: 'category', data: trendData.map(d => d.date) },
    yAxis: { type: 'value', name: '人数' },
    series: [{
      name: '新增客户',
      type: 'line',
      smooth: true,
      data: trendData.map(d => d.customers),
      lineStyle: { width: 2 },
      itemStyle: { color: '#faad14' },
    }],
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
  });

  const getProductMixOption = () => ({
    title: { text: '险种结构分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c}元 ({d}%)' },
    legend: { orient: 'vertical', left: 'left', top: 'middle' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '55%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: [
        { value: 450000, name: '终身寿险' },
        { value: 320000, name: '重疾险' },
        { value: 280000, name: '年金险' },
        { value: 120000, name: '医疗险' },
        { value: 80000, name: '意外险' },
      ],
    }],
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
        <h2>业务指标中心</h2>
      </div>

      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]} className="crm-metrics-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="crm-metric-card">
            <Statistic
              title="总保费"
              value={metrics?.totalPremium || 0}
              precision={0}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
              suffix={<FundOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="crm-metric-card">
            <Statistic
              title="新单数"
              value={metrics?.newPolicies || 0}
              valueStyle={{ color: '#52c41a' }}
              suffix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="crm-metric-card">
            <Statistic
              title="续保率"
              value={metrics?.renewalRate || 0}
              precision={1}
              valueStyle={{ color: '#faad14' }}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="crm-metric-card">
            <Statistic
              title="客户数"
              value={metrics?.customerCount || 0}
              valueStyle={{ color: '#722ed1' }}
              suffix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 次级指标 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12}>
          <Card className="crm-metric-card">
            <Statistic
              title="活跃代理人"
              value={metrics?.activeAgents || 0}
              prefix={<TeamOutlined />}
              suffix="人"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card className="crm-metric-card">
            <Statistic
              title="件均保费"
              value={metrics?.avgPremiumPerPolicy || 0}
              precision={0}
              prefix="¥"
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card className="crm-chart-card">
            <ReactECharts option={getPremiumTrendOption()} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="crm-chart-card">
            <ReactECharts option={getPoliciesTrendOption()} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card className="crm-chart-card">
            <ReactECharts option={getCustomerTrendOption()} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="crm-chart-card">
            <ReactECharts option={getProductMixOption()} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
