import { defineConfig } from 'umi';

export default defineConfig({
  routes: [
    { path: '/', component: '@/pages/index' },
  ],
  npmClient: 'npm',
  mock: {},
  define: {
    'process.env.UMI_APP_QLIK_URL': process.env.UMI_APP_QLIK_URL || '',
    'process.env.UMI_APP_QLIK_APP_ID': process.env.UMI_APP_QLIK_APP_ID || '',
  },
  // 生产构建配置
  devtool: false,  // 禁用 source map
  hash: true,      // 文件名加 hash
  // 启用 HMR（开发热更新）
  fastRefresh: true,
  headScripts: [
    { content: `window.routerBase = '/';` },
  ],
  title: 'WFP销售人员诊断中心',
  favicons: ['/favicon.ico'],
  metas: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    { charset: 'UTF-8' },
  ],
});
