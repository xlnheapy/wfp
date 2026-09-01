# WFP 销售人员诊断中心

一个用于展示销售人员业务指标、活动跟踪、客户运营和保单跟进的 Web 应用。

## 技术栈

- **框架**: React 18.3 + TypeScript
- **构建工具**: Umi 4
- **UI 组件**: Ant Design 5
- **图表**: ECharts
- **样式**: CSS
- **数据源**: 
  - 开发环境：Mock 数据
  - 生产环境：Qlik Sense

## 功能模块

1. **业务指标中心** - RR指标、收入指标、续保率指标及趋势图表
2. **活动跟踪** - 活动记录和统计
3. **客户运营** - 新客运营、老客运营汇总和列表
4. **保单跟进与基金跟踪** - 保单和基金的跟踪汇总及列表

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

启动后，在浏览器中打开 [http://localhost:8000](http://localhost:8000) 查看应用。

开发环境使用 Mock 数据，无需配置 Qlik 连接。

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 环境配置

### 开发环境

开发环境使用 Umi 内置的 Mock 功能，数据定义在 `mock/api.ts` 文件中。

### 生产环境

生产环境对接 Qlik Sense，需要配置环境变量：

1. 复制 `.env.example` 为 `.env`：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，配置 Qlik 连接信息：
```env
UMI_APP_QLIK_URL=wss://your-qlik-server.com
UMI_APP_QLIK_APP_ID=your-app-id
```

3. 构建生产版本：
```bash
npm run build
```

## 项目结构

```
wfp/
├── .umirc.ts              # Umi 配置
├── package.json           # 依赖配置
├── tsconfig.json          # TypeScript 配置
├── .env.example           # 环境变量示例
├── README.md              # 项目说明
├── mock/
│   └── api.ts             # Mock API 数据
└── src/
    ├── app.tsx            # Umi 运行时配置
    ├── pages/
    │   └── index.tsx      # 主页面
    ├── global/
    │   └── global.css     # 全局样式
    └── services/
        ├── api.ts         # API 服务层（自动切换数据源）
        ├── mock-data.ts   # Mock 数据定义
        └── qlik-service.ts # Qlik 服务（生产环境）
```

## API 接口

项目包含 14 个 API 接口：

1. `/api/fm-wfp-list` - FM和WFP列表
2. `/api/rr-metrics` - RR指标
3. `/api/income-metrics` - 收入指标
4. `/api/retention-metrics` - 续保率指标
5. `/api/rr-trend` - RR指标趋势
6. `/api/income-trend` - 收入指标趋势
7. `/api/activity` - 活动跟踪
8. `/api/new-customer` - 新客运营
9. `/api/old-customer-summary` - 老客运营汇总
10. `/api/old-customer-list` - 老客运营列表
11. `/api/policy-summary` - 保单跟踪汇总
12. `/api/policy-list` - 保单跟踪列表
13. `/api/fund-summary` - 基金跟踪汇总
14. `/api/fund-list` - 基金跟踪列表

所有接口（除第1个外）支持以下查询参数：
- `fm_id` - FM ID
- `wfp_id` - WFP ID
- `time_filter` - 时间筛选

## 数据源切换

API 服务层 (`src/services/api.ts`) 会根据 `NODE_ENV` 自动切换数据源：

- `NODE_ENV === 'development'`：使用 Mock 数据（通过 Umi mock）
- `NODE_ENV === 'production'`：使用 Qlik Sense 数据

## License

MIT
