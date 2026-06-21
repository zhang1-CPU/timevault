process.env.BROWSERSLIST_IGNORE_OLD_DATA = "1";

import path from "path";
import { defineConfig, type Plugin } from "vite";

import { cloudflare } from "@cloudflare/vite-plugin";

const JSX_EXT = /\.(jsx|tsx)$/;

function esbuildReact(): Plugin {
  return {
    name: 'esbuild-react',
    enforce: 'pre',
    async transform(code, id) {
      const filePath = id.split('?')[0];
      if (!JSX_EXT.test(filePath)) return null;
      const isTsx = filePath.endsWith('.tsx');
      const esbuild = await import('esbuild');
      const result = await esbuild.transform(code, {
        loader: isTsx ? 'tsx' : 'jsx',
        jsx: 'automatic',
        jsxImportSource: 'react',
        sourcemap: true,
        format: 'esm',
        target: 'es2022',
        define: {
          'process.env.NODE_ENV': JSON.stringify(
            (process.env.NODE_ENV as string) || 'development',
          ),
        },
      });
      return { code: result.code, map: result.map };
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [esbuildReact(), cloudflare()],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          icons: ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 2500,
  },
  server: {
    port: 3000,
    strictPort: false,
    open: false,
  },
  preview: {
    port: 4173,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    devSourcemap: false,
  },
});