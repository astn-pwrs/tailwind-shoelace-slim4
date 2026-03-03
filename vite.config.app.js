import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

//
const rootDir = path.resolve(__dirname, "resources");
const pagesDir = path.resolve(rootDir, "pages");

//  resources/pages/*/js/index.jsを自動検出
function getPageEntries() {
  const entries = {};

  const folders = fs.readdirSync(pagesDir, {
    withFileTypes: true,
  });

  folders.forEach((dir) => {
    if (!dir.isDirectory()) return;

    const entry = path.resolve(pagesDir, dir.name, "js/index.js");

    if (fs.existsSync(entry)) {
      entries[dir.name] = entry;
    }
  });

  return entries;
}

export default defineConfig({
  root: rootDir,
  base: "/",

  server: {
    watch: {
      usePolling: true,
    },
  },

  build: {
    outDir: path.resolve(__dirname, "public"),
    emptyOutDir: false,

    rollupOptions: {
      input: {
        main: path.resolve(rootDir, "js/main.js"),
        ...getPageEntries(),
      },

      output: {
        entryFileNames: "pages/js/[name].js",
        chunkFileNames: "pages/js/[name].js",

        assetFileNames: (asset) => {
          if (asset.name?.endsWith(".css")) {
            return "pages/css/[name].[ext]";
          }

          if (/\.(woff2?|ttf|otf|eot)$/.test(asset.name || "")) {
            return "fonts/[name].[ext]";
          }

          return "pages/assets/[name].[ext]";
        },

        /*
          共通chunkを作らない
          → ページ単体JSになる
        */
        manualChunks: undefined,
      },
    },
  },

  plugins: [
    tailwindcss({ debug: true }),

    viteStaticCopy({
      targets: [
        {
          src: "fonts",
          dest: "",
        },
      ],
    }),
  ],
});
