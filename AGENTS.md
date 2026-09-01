# 项目上下文

## 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: Ant Design 6 (antd)
- **Styling**: Tailwind CSS 4 + 自定义 CSS
- **数据服务**: enigma.js (Qlik Sense Engine API)

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── layout.tsx      # 根布局
│   │   ├── page.tsx        # 基金产品列表主页
│   │   └── globals.css     # 全局样式
│   ├── services/           # 数据服务层
│   │   └── qlik-service.ts # Qlik Sense 数据查询服务
│   ├── components/ui/      # Shadcn UI 组件库
│   └── lib/                # 工具库
├── .env.local              # 环境变量（Qlik 连接配置）
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

## 构建和运行

- 开发：`pnpm dev`
- 构建：`pnpm build`
- 启动：`pnpm start`
- 类型检查：`pnpm ts-check`
- 代码检查：`pnpm lint`

## 核心模块说明

### 基金产品列表页 (`src/app/page.tsx`)
- 使用 Ant Design Table 组件展示基金数据
- 支持按基金类型筛选（全部/股票型/指数型/混合型/债券型/货币型）
- 支持搜索基金名称或代码
- 支持"仅显示可购买"筛选
- 收益率红涨绿跌显示
- 重点产品以 ★ 标记

### Qlik 数据服务 (`src/services/qlik-service.ts`)
- 开发环境：返回 mock 数据
- 生产环境：通过 enigma.js WebSocket 连接 Qlik Engine API
- 使用 HyperCube 查询数据，拆分为两个查询避免字段数限制
- 环境变量：`NEXT_PUBLIC_QLIK_WSS_URL`、`NEXT_PUBLIC_QLIK_APP_ID`

## Qlik Sense 配置

在 `.env.local` 或环境变量中配置：
```
NEXT_PUBLIC_QLIK_WSS_URL=wss://your-qlik-server:4747/app/engineData
NEXT_PUBLIC_QLIK_APP_ID=your-qlik-app-guid
```
