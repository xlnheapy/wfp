import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CRM 管理系统',
  description: '保险行业客户关系管理系统',
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
