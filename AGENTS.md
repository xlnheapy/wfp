# 项目上下文

## 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: Ant Design 6 (antd)
- **Styling**: Tailwind CSS 4 + 自定义 CSS
- **图表**: ECharts (echarts-for-react)
- **日期处理**: dayjs

## 目录结构

```
├── public/                          # 静态资源
├── scripts/                         # 构建与启动脚本
├── src/
│   ├── app/                         # 页面路由
│   │   ├── layout.tsx               # 根布局
│   │   ├── page.tsx                 # 首页（重定向+导航）
│   │   ├── globals.css              # 全局样式
│   │   ├── business-indicators/     # 业务指标中心
│   │   │   └── page.tsx
│   │   ├── activity-tracking/       # 活动跟踪
│   │   │   └── page.tsx
│   │   ├── customer-operations/     # 客户运营
│   │   │   └── page.tsx
│   │   └── policy-follow-up/        # 保单跟进与关系维护
│   │       └── page.tsx
│   ├── components/                  # 共享组件
│   │   ├── Header.tsx               # 顶部栏（团队选择+日期选择）
│   │   ├── Sidebar.tsx              # 侧边栏（团队成员列表）
│   │   ├── MainLayout.tsx           # 主布局（Context Provider）
│   │   └── ui/                      # Shadcn UI 组件库
│   ├── services/                    # 数据服务层
│   │   └── mock-data.ts             # Mock 数据服务
│   ├── types/                       # TypeScript 类型定义
│   │   └── index.ts
│   └── lib/                         # 工具库
├── .env.local                       # 环境变量
├── next.config.ts                   # Next.js 配置
├── package.json                     # 项目依赖
└── tsconfig.json                    # TypeScript 配置
```

## 构建和运行

- 开发：`pnpm dev`
- 构建：`pnpm build`
- 启动：`pnpm start`
- 类型检查：`pnpm ts-check`
- 代码检查：`pnpm lint`

## 核心模块说明

### 布局组件
- **Header** (`src/components/Header.tsx`)：顶部导航栏，包含团队选择下拉框和日期范围选择器
- **Sidebar** (`src/components/Sidebar.tsx`)：左侧边栏，显示团队成员列表，支持选择个人查看业绩
- **MainLayout** (`src/components/MainLayout.tsx`)：主布局容器，提供 LayoutContext 全局状态

### 页面模块
- **业务指标中心** (`src/app/business-indicators/`)：核心 KPI 指标展示，含 ECharts 图表（保费趋势、新单趋势、客户增长、险种结构）
- **活动跟踪** (`src/app/activity-tracking/`)：活动记录列表，按类型/人员统计
- **客户运营** (`src/app/customer-operations/`)：客户列表管理，支持搜索/筛选/分级
- **保单跟进与关系维护** (`src/app/policy-follow-up/`)：保单列表，到期提醒，跟进操作

### 数据服务
- **Mock 数据** (`src/services/mock-data.ts`)：开发环境使用 mock 数据，支持按团队/人员/日期范围筛选
- **LayoutContext**：全局状态管理，传递团队选择、人员选择、日期范围

## 数据流

```
Header (团队选择/日期选择) → LayoutContext → 各页面
Sidebar (人员选择) → LayoutContext → 各页面
各页面 → services/mock-data.ts → 返回筛选后的数据
```

## 后续对接

将 `src/services/mock-data.ts` 中的 mock 函数替换为真实 API 调用即可对接后端。
