# WFP 销售人员诊断中心

一个用于展示销售人员业务指标、活动跟踪、客户运营和保单跟进的 Web 应用。

## 技术栈

- **框架**: React 18.3 + TypeScript
- **构建工具**: Vite 5
- **UI 组件**: Ant Design 5
- **图表**: ECharts
- **样式**: CSS

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

启动后，在浏览器中打开 [http://localhost:5000](http://localhost:5000) 查看应用。

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 项目结构

```
src/
├── main.tsx              # React 入口
├── App.tsx               # 主应用组件
├── index.css             # 全局样式
├── services/
│   ├── api.ts            # API 服务层
│   └── mock-data.ts      # Mock 数据
└── lib/
    └── utils.ts          # 工具函数
```

## 脚本说明

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run preview` - 预览生产版本
- `npm run lint` - 运行 ESLint 检查
- `npm run ts-check` - TypeScript 类型检查
