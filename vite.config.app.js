import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import tailwindcss from "@tailwindcss/vite";

import path from "path";

export default defineConfig({
  root: "resources",
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
        main: path.resolve(__dirname, "resources/js/main.js"),
      },
      output: {
        entryFileNames: "js/[name].js",
        chunkFileNames: "js/[name].js",
        assetFileNames: (asset) => {
          if (asset.name.endsWith(".css")) {
            return "css/[name].[ext]";
          }
          // フォントは Vite 側では出力させない
          if (/\.(woff2?|ttf|otf|eot)$/.test(asset.name)) {
            return "fonts/[name].[ext]";
          }
          return "assets/[name].[ext]";
        },
      },
    },
  },
  plugins: [
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: "pages",
          dest: "",
        },
        {
          src: "fonts",
          dest: "",
        },
      ],
    }),
  ],
});
