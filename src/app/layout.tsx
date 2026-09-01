import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '基金产品列表',
  description: '基金产品列表 - 数据来源于 Qlik Sense',
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
