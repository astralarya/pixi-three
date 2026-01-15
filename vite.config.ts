import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import dts from "vite-plugin-dts";
import tsConfigPaths from "vite-tsconfig-paths";

const __dirname = dirname(fileURLToPath(import.meta.url));

const env = loadEnv("development", __dirname, "");

const readFile = (path: string | undefined) =>
  path ? readFileSync(path, "utf-8") : undefined;

const sslKey = readFile(env.SSL_KEY);
const sslCert = readFile(env.SSL_CERT);
const localDomain = env.LOCAL_DOMAIN;

// Pages config - for dev server and building the examples/docs site
export const pagesConfig = defineConfig({
  base: "/pixi-three",
  publicDir: "dist-typedoc",
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.pages.json"] }),
    tanstackStart({
      srcDirectory: "examples",
      spa: { enabled: true },
      prerender: {
        enabled: true,
        autoStaticPathsDiscovery: true,
        filter: ({ path }) => !["/docs", "/pixi-three/docs/"].includes(path),
      },
    }),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
  ],
  server: {
    https:
      sslKey && sslCert
        ? {
            key: sslKey,
            cert: sslCert,
          }
        : undefined,
    allowedHosts: localDomain ? [localDomain] : [],
    fs: {
      allow: [".", "dist-typedoc/docs"],
    },
  },
  build: {
    outDir: "dist-pages",
  },
  resolve: {
    alias: {
      "@astralarium/pixi-three": resolve(__dirname, "src/index.ts"),
    },
  },
});

// Pages preview config - for previewing the built examples/docs site
export const pagesPreviewConfig = defineConfig({
  base: "/pixi-three",
  server: {
    https:
      sslKey && sslCert
        ? {
            key: sslKey,
            cert: sslCert,
          }
        : undefined,
    allowedHosts: localDomain ? [localDomain] : [],
  },
  preview: {
    allowedHosts: localDomain ? [localDomain] : [],
  },
  build: {
    outDir: "dist-pages/client",
  },
});

// Library config (default) - for building the npm package
export default defineConfig({
  plugins: [
    tsConfigPaths(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
    dts({ tsconfigPath: "./tsconfig.app.json", exclude: ["examples"] }),
  ],
  build: {
    outDir: "dist",
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
    },
    rollupOptions: {
      external: (id) =>
        [
          "react",
          "react-dom",
          "react/jsx-runtime",
          "three",
          "pixi.js",
          "@pixi/react",
          "@react-three/fiber",
          "its-fine",
          "tunnel-rat",
        ].includes(id) || id.startsWith("three/"),
    },
  },
});
