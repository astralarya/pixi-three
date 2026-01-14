import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type UserConfig } from "vite";
import dts from "vite-plugin-dts";

const __dirname = dirname(fileURLToPath(import.meta.url));

const sharedConfig = {
  resolve: {
    alias: {
      "@astralarium/pixi-three": resolve(__dirname, "src/index.ts"),
    },
  },
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
  ],
} satisfies UserConfig;

// Pages config - for dev server and building the examples/docs site
export const pagesConfig = defineConfig({
  ...sharedConfig,
  base: "/pixi-three/",
  publicDir: "dist-typedoc",
  server: {
    fs: {
      allow: [".", "dist-typedoc/docs"],
    },
  },
  build: {
    outDir: "dist-pages",
  },
});

// Library config (default) - for building the npm package
export default defineConfig({
  ...sharedConfig,
  plugins: [
    ...sharedConfig.plugins,
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
