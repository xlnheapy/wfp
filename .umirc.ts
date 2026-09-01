import { defineConfig } from 'umi';

export default defineConfig({
  routes: [
    { path: '/', component: '@/pages/index' },
  ],
  npmClient: 'npm',
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
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
