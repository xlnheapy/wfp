'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Card, Row, Col, Statistic, Spin, Progress, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, FundOutlined, TeamOutlined, FileTextOutlined, UserOutlined, DashboardOutlined } from '@ant-design/icons';
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

  // 收入指标仪表盘
  const getIncomeGaugeOption = (value: number, target: number) => {
    const percent = Math.min((value / target) * 100, 200);
    return {
      series: [{
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 200,
        splitNumber: 10,
        radius: '90%',
        center: ['50%', '60%'],
        itemStyle: {
          color: percent >= 100 ? '#52c41a' : percent >= 60 ? '#faad14' : '#ff4d4f',
        },
        progress: {
          show: true,
          roundCap: true,
          width: 12,
        },
        pointer: { show: false },
        axisLine: {
          roundCap: true,
          lineStyle: { width: 12, color: [[1, '#e8e8e8']] },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: { show: false },
        detail: {
          fontSize: 24,
          fontWeight: 'bold',
          offsetCenter: [0, 0],
          formatter: '{value}%',
          valueAnimation: true,
          color: percent >= 100 ? '#52c41a' : percent >= 60 ? '#faad14' : '#ff4d4f',
        },
        data: [{ value: parseFloat(percent.toFixed(1)) }],
      }],
    };
  };

  // 构成饼图
  const getCompositionPieOption = () => ({
    tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
    legend: { bottom: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      data: [
        { value: 60, name: 'FYC', itemStyle: { color: '#1890ff' } },
        { value: 25, name: 'SEHA', itemStyle: { color: '#52c41a' } },
        { value: 15, name: '基金', itemStyle: { color: '#faad14' } },
      ],
    }],
  });

  // 趋势折线图
  const getTrendLineOption = () => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['总收入', 'FYC', '基金'], bottom: 0, textStyle: { fontSize: 11 } },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: trendData.map(d => d.date.slice(5)), boundaryGap: false },
    yAxis: { type: 'value', axisLabel: { formatter: (v: number) => `${(v / 1000).toFixed(0)}k` } },
    series: [
      {
        name: '总收入',
        type: 'line',
        smooth: true,
        data: trendData.map(d => d.premium),
        lineStyle: { width: 2 },
        itemStyle: { color: '#1890ff' },
        areaStyle: { opacity: 0.1 },
      },
      {
        name: 'FYC',
        type: 'line',
        smooth: true,
        data: trendData.map(d => d.premium * 0.6),
        lineStyle: { width: 2 },
        itemStyle: { color: '#52c41a' },
      },
      {
        name: '基金',
        type: 'line',
        smooth: true,
        data: trendData.map(d => d.premium * 0.15),
        lineStyle: { width: 2 },
        itemStyle: { color: '#faad14' },
      },
    ],
  });

  // 续保率仪表盘
  const getRenewalGaugeOption = (rate: number) => ({
    series: [{
      type: 'gauge',
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: 100,
      radius: '90%',
      center: ['50%', '60%'],
      itemStyle: {
        color: rate >= 80 ? '#52c41a' : rate >= 60 ? '#faad14' : '#ff4d4f',
      },
      progress: {
        show: true,
        roundCap: true,
        width: 12,
      },
      pointer: { show: false },
      axisLine: {
        roundCap: true,
        lineStyle: { width: 12, color: [[1, '#e8e8e8']] },
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      title: { show: false },
      detail: {
        fontSize: 22,
        fontWeight: 'bold',
        offsetCenter: [0, 0],
        formatter: '{value}%',
        valueAnimation: true,
        color: rate >= 80 ? '#52c41a' : rate >= 60 ? '#faad14' : '#ff4d4f',
      },
      data: [{ value: rate }],
    }],
  });

  if (loading) {
    return (
      <div className="crm-loading">
        <Spin size="large" />
      </div>
    );
  }

  // Mock data for display
  const incomeData = {
    total: 82088,
    target: 50000,
    achievement: 164.2,
    fyc: 32835,
    fycPercent: 60.0,
    seha: 20522,
    sehaPercent: 25.0,
    fund: 12313,
    fundPercent: 15.0,
  };

  const renewalData = {
    total: 65670.4,
    rate: 80.6,
    mom: -6.1,
    fyc: 39402.24,
    fycChange: 4.9,
    fund: 9850.56,
    fundChange: 13,
    other: 16417.6,
    otherChange: -1.2,
    target: 75.3,
  };

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <h2>业务指标中心</h2>
      </div>

      {/* 收入指标卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card className="crm-diagnosis-card" title="收入指标" extra={<Tag color="blue">目标 ¥50,000</Tag>}>
            <Row gutter={16}>
              <Col span={10}>
                <div className="crm-gauge-container">
                  <ReactECharts option={getIncomeGaugeOption(incomeData.total, incomeData.target)} style={{ height: 180 }} />
                  <div className="crm-gauge-label">达成率</div>
                </div>
              </Col>
              <Col span={14}>
                <div className="crm-metric-detail">
                  <div className="crm-metric-main">
                    <span className="crm-metric-label">总收入</span>
                    <span className="crm-metric-value">¥{incomeData.total.toLocaleString()}</span>
                  </div>
                  <div className="crm-metric-breakdown">
                    <div className="crm-breakdown-item">
                      <span className="crm-breakdown-dot" style={{ background: '#1890ff' }} />
                      <span>FYC</span>
                      <span className="crm-breakdown-value">¥{incomeData.fyc.toLocaleString()}</span>
                      <span className="crm-breakdown-percent">{incomeData.fycPercent}%</span>
                    </div>
                    <div className="crm-breakdown-item">
                      <span className="crm-breakdown-dot" style={{ background: '#52c41a' }} />
                      <span>SEHA</span>
                      <span className="crm-breakdown-value">¥{incomeData.seha.toLocaleString()}</span>
                      <span className="crm-breakdown-percent">{incomeData.sehaPercent}%</span>
                    </div>
                    <div className="crm-breakdown-item">
                      <span className="crm-breakdown-dot" style={{ background: '#faad14' }} />
                      <span>基金</span>
                      <span className="crm-breakdown-value">¥{incomeData.fund.toLocaleString()}</span>
                      <span className="crm-breakdown-percent">{incomeData.fundPercent}%</span>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card className="crm-diagnosis-card" title="收入构成">
            <ReactECharts option={getCompositionPieOption()} style={{ height: 200 }} />
          </Card>
        </Col>
      </Row>

      {/* 续保率指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card className="crm-diagnosis-card" title="续保率指标" extra={<Tag color={renewalData.mom > 0 ? 'green' : 'red'}>环比 {renewalData.mom > 0 ? '+' : ''}{renewalData.mom}%</Tag>}>
            <Row gutter={16}>
              <Col span={10}>
                <div className="crm-gauge-container">
                  <ReactECharts option={getRenewalGaugeOption(renewalData.rate)} style={{ height: 180 }} />
                  <div className="crm-gauge-label">续保率</div>
                </div>
              </Col>
              <Col span={14}>
                <div className="crm-metric-detail">
                  <div className="crm-metric-main">
                    <span className="crm-metric-label">总收入</span>
                    <span className="crm-metric-value">¥{renewalData.total.toLocaleString()}</span>
                  </div>
                  <div className="crm-metric-breakdown">
                    <div className="crm-breakdown-item">
                      <span>FYC (ANP)</span>
                      <span className="crm-breakdown-value">¥{renewalData.fyc.toLocaleString()}</span>
                      <Tag color={renewalData.fycChange > 0 ? 'green' : 'red'} style={{ marginLeft: 4 }}>
                        {renewalData.fycChange > 0 ? '+' : ''}{renewalData.fycChange}%
                      </Tag>
                    </div>
                    <div className="crm-breakdown-item">
                      <span>基金</span>
                      <span className="crm-breakdown-value">¥{renewalData.fund.toLocaleString()}</span>
                      <Tag color={renewalData.fundChange > 0 ? 'green' : 'red'} style={{ marginLeft: 4 }}>
                        {renewalData.fundChange > 0 ? '+' : ''}{renewalData.fundChange}%
                      </Tag>
                    </div>
                    <div className="crm-breakdown-item">
                      <span>其他</span>
                      <span className="crm-breakdown-value">¥{renewalData.other.toLocaleString()}</span>
                      <Tag color={renewalData.otherChange > 0 ? 'green' : 'red'} style={{ marginLeft: 4 }}>
                        {renewalData.otherChange > 0 ? '+' : ''}{renewalData.otherChange}%
                      </Tag>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card className="crm-diagnosis-card" title="收入趋势">
            <ReactECharts option={getTrendLineOption()} style={{ height: 200 }} />
          </Card>
        </Col>
      </Row>

      {/* 核心指标汇总 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={12} sm={6}>
          <Card className="crm-metric-card">
            <Statistic title="总保费" value={metrics?.totalPremium || 0} precision={0} prefix="¥" valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="crm-metric-card">
            <Statistic title="新单数" value={metrics?.newPolicies || 0} valueStyle={{ color: '#52c41a' }} suffix="单" />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="crm-metric-card">
            <Statistic title="续保率" value={metrics?.renewalRate || 0} precision={1} valueStyle={{ color: '#faad14' }} suffix="%" />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="crm-metric-card">
            <Statistic title="客户数" value={metrics?.customerCount || 0} valueStyle={{ color: '#722ed1' }} suffix="人" />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
