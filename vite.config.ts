process.env.BROWSERSLIST_IGNORE_OLD_DATA = "1";

import fs from "fs";
import path from "path";
import { defineConfig, type Plugin } from "vite";

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

// GitHub Pages SPA fallback — duplicate index.html → 404.html so that
// sub-routes (e.g. /seal, /couple) fall back to the SPA shell.
function spa404(): Plugin {
  return {
    name: 'spa-404-fallback',
    closeBundle() {
      try {
        const outDir = path.resolve('dist');
        const indexPath = path.join(outDir, 'index.html');
        const notFoundPath = path.join(outDir, '404.html');
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, notFoundPath);
        }
      } catch { /* noop */ }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [esbuildReact(), spa404()],
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
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
