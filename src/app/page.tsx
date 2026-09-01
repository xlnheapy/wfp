'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu } from 'antd';
import { DashboardOutlined, ScheduleOutlined, UsergroupAddOutlined, FileProtectOutlined } from '@ant-design/icons';
import MainLayout from '@/components/MainLayout';

const MENU_ITEMS = [
  { key: '/business-indicators', icon: <DashboardOutlined />, label: '业务指标中心' },
  { key: '/activity-tracking', icon: <ScheduleOutlined />, label: '活动跟踪' },
  { key: '/customer-operations', icon: <UsergroupAddOutlined />, label: '客户运营' },
  { key: '/policy-follow-up', icon: <FileProtectOutlined />, label: '保单跟进与关系维护' },
];

export default function RootPage({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // 默认跳转到业务指标中心
  React.useEffect(() => {
    if (pathname === '/') {
      router.replace('/business-indicators');
    }
  }, [pathname, router]);

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
  };

  const currentKey = MENU_ITEMS.find(item => pathname.startsWith(item.key))?.key || '/business-indicators';

  return (
    <MainLayout>
      <div className="crm-nav-container">
        <Menu
          mode="horizontal"
          selectedKeys={[currentKey]}
          items={MENU_ITEMS}
          onClick={handleMenuClick}
          className="crm-nav-menu"
        />
      </div>
      {children}
    </MainLayout>
  );
}
