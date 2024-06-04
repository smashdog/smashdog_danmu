import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import * as path from "path"
// import { viteCommonjs } from "@originjs/vite-plugin-commonjs"
// import resolve from '@rollup/plugin-node-resolve'
// import commonjs from '@rollup/plugin-commonjs'

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    // commonjs({
    //   exclude: 'node_modules/**',
    //   include: ['src/**/*.js']
    // }),
    // nodeResolve({
    //   exportConditions: ['node']
    // }),
    vue(),
    Components({
      resolvers: [
        AntDesignVueResolver({
          importStyle: false
        })
      ]
    })
  ],
  // optimizeDeps: {
  //   exclude: ["@libs/bilibili"]
  // },
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 20000,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: [
        "**/src-tauri/**",
        "./vendor/**",
        "./composer.json",
        "./composer.lock",
        "./build.php",
        "./build.bat"
      ],
      
    },
    proxy: {
      '/v2': {
        target: 'https://live-open.biliapi.com/',
        changeOrigin: true,
        rewrite: (path) => path
      }
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    rollupOptions: {
      input: {
        msg: path.resolve(__dirname, 'msg.html'),
        gift: path.resolve(__dirname, 'gift.html'),
        index: path.resolve(__dirname, 'index.html'),
        in: path.resolve(__dirname, 'in.html'),
        desktop: path.resolve(__dirname, 'desktop.html')
      }
    },
    target: "esnext"
  }
}));
