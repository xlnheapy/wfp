import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WFP销售人员诊断中心',
  description: 'WFP销售人员诊断中心 - 业绩指标、活动跟踪、客户运营、保单跟进',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
