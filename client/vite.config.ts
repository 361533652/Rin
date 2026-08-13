import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { visualizer } from "rollup-plugin-visualizer";
import copy from 'rollup-plugin-copy';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // SEO 兜底：把 NAME/DESCRIPTION 注入到 index.html 的 <head>。
  // SPA 渲染前/未预渲染页面被爬虫抓到时会拿到这些默认 title/description，
  // 避免出现空 <title>；页面加载后 react-helmet 会正常覆盖。
  const htmlEnv = {
    name: 'rin-html-env',
    transformIndexHtml() {
      const name = env.NAME || 'Rin';
      const description = env.DESCRIPTION || 'Personal blog powered by Rin';
      return [
        { tag: 'title', children: `${name} - ${description}`, injectTo: 'head-prepend' },
        { tag: 'meta', attrs: { name: 'description', content: description }, injectTo: 'head-prepend' },
      ];
    },
  };
  return {
    define: {
      'process.env': JSON.stringify(env)
    },
    plugins: [
      htmlEnv,
      react(),
      visualizer({ open: false }),
      copy({
        targets: [
          { src: 'particles.js', dest: 'dist' },
          { src: 'js', dest: 'dist' }
        ]
      })
    ]
  }
})