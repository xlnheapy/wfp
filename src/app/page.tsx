'use client';

import React, { useState, useEffect } from 'react';
import { Table, Input, ConfigProvider, Spin, Checkbox } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getFunds, type Fund } from '@/services/qlik-service';
import zhCN from 'antd/locale/zh_CN';

// 基金类型定义
const FUND_TYPES = [
  { key: 'all', label: '全部' },
  { key: '股票型', label: '股票型' },
  { key: '指数型', label: '指数型' },
  { key: '混合型', label: '混合型' },
  { key: '债券型', label: '债券型' },
  { key: '货币型', label: '货币型' },
];

// 格式化收益率
const formatReturn = (value: string): React.ReactNode => {
  const num = parseFloat(value);
  if (isNaN(num)) return <span>{value}</span>;
  const color = num > 0 ? '#e74c3c' : num < 0 ? '#27ae60' : '#333';
  const prefix = num > 0 ? '+' : '';
  return <span style={{ color, fontWeight: 500 }}>{prefix}{num.toFixed(2)}%</span>;
};

// NaN 排在最后的排序辅助函数
const sortWithNaNLast = (aVal: string, bVal: string): number => {
  const aNum = parseFloat(aVal);
  const bNum = parseFloat(bVal);
  if (isNaN(aNum) && isNaN(bNum)) return 0;
  if (isNaN(aNum)) return 1;
  if (isNaN(bNum)) return -1;
  return aNum - bNum;
};

const columns: ColumnsType<Fund> = [
  {
    title: '基金简称',
    dataIndex: 'fund_name',
    key: 'fund_name',
    width: 220,
    render: (text: string, record: Fund) => (
      <>
        {text}
        {record.recommend_flag === 'Y' && (
          <span style={{ color: '#faad14', fontSize: 11, marginLeft: 3, verticalAlign: 'super' }}>★</span>
        )}
      </>
    ),
  },
  {
    title: '基金代码',
    dataIndex: 'fund_code',
    key: 'fund_code',
    width: 100,
    sorter: (a, b) => a.fund_code.localeCompare(b.fund_code),
  },
  {
    title: '产品类型',
    dataIndex: 'product_type',
    key: 'product_type',
    width: 80,
  },
  {
    title: '风险等级',
    dataIndex: 'risk_level',
    key: 'risk_level',
    width: 80,
  },
  {
    title: '净值日期',
    dataIndex: 'nav_date',
    key: 'nav_date',
    width: 110,
  },
  {
    title: '单位净值',
    dataIndex: 'nav',
    key: 'nav',
    width: 100,
    sorter: (a, b) => sortWithNaNLast(a.nav, b.nav),
  },
  {
    title: '近一年收益',
    dataIndex: 'shouyi',
    key: 'shouyi',
    width: 110,
    sorter: (a, b) => sortWithNaNLast(a.shouyi, b.shouyi),
    render: (value: string) => formatReturn(value),
  },
  {
    title: '近三年收益',
    dataIndex: 'three_year_inc',
    key: 'three_year_inc',
    width: 110,
    sorter: (a, b) => sortWithNaNLast(a.three_year_inc, b.three_year_inc),
    render: (value: string) => formatReturn(value),
  },
  {
    title: '今年以来收益',
    dataIndex: 'ytd_return',
    key: 'ytd_return',
    width: 120,
    sorter: (a, b) => sortWithNaNLast(a.ytd_return, b.ytd_return),
    render: (value: string) => formatReturn(value),
  },
  {
    title: '基金详情',
    key: 'action',
    width: 80,
    render: (_: unknown, record: Fund) => (
      <a href={record.fund_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
        查看
      </a>
    ),
  },
];

export default function FundList() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [purchaseOnly, setPurchaseOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFunds();
  }, []);

  const fetchFunds = async () => {
    try {
      setLoading(true);
      const data = await getFunds();
      // 重点产品排在前面
      data.sort((a, b) => {
        if (a.recommend_flag === 'Y' && b.recommend_flag !== 'Y') return -1;
        if (a.recommend_flag !== 'Y' && b.recommend_flag === 'Y') return 1;
        return 0;
      });
      setFunds(data);
    } catch (error) {
      console.error('获取基金数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 过滤数据
  const getFilteredFunds = (): Fund[] => {
    let filtered = [...funds];
    if (activeTab !== 'all') {
      filtered = filtered.filter(fund => fund.fund_type === activeTab);
    }
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(
        fund =>
          fund.fund_name.toLowerCase().includes(keyword) ||
          fund.fund_code.includes(keyword)
      );
    }
    if (purchaseOnly) {
      filtered = filtered.filter(fund => fund.purchase_flag === 'Y');
    }
    return filtered;
  };

  const filteredFunds = getFilteredFunds();

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <div className="fund-container">
        {/* 页面标题 */}
        <div className="fund-header">
          <h1 className="fund-title">基金产品列表</h1>
        </div>

        {/* Tab 导航 */}
        <div className="fund-tabs">
          {FUND_TYPES.map(tab => (
            <button
              key={tab.key}
              className={`fund-tab ${activeTab === tab.key ? 'fund-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 搜索框 + 可购买筛选 */}
        <div className="fund-search-row">
          <Input
            placeholder="搜索基金名称或代码"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: 300 }}
            allowClear
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          />
          <Checkbox
            checked={purchaseOnly}
            onChange={(e) => setPurchaseOnly(e.target.checked)}
          >
            仅显示可购买
          </Checkbox>
          <span className="fund-count">
            共 {filteredFunds.length} 只基金
          </span>
        </div>

        {/* 数据表格 */}
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredFunds}
            rowKey="fund_code"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            scroll={{ x: 1200 }}
            size="middle"
            rowClassName={(record, index) => index % 2 === 0 ? 'fund-row-even' : 'fund-row-odd'}
          />
        </Spin>

        {/* 备注说明 */}
        <div className="fund-note">
          <p>* 收益率数据仅供参考，实际收益以基金公司公布为准。</p>
          <p>* 重点产品以 ★ 标记。</p>
        </div>
      </div>
    </ConfigProvider>
  );
}
