import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "path";

export default defineConfig({
  publicDir: false, // ← これが重要！ publicDir を無効化

  build: {
    outDir: path.resolve(__dirname, "public/shoelace"),
    emptyOutDir: true,

    lib: {
      entry: path.resolve(
        __dirname,
        "node_modules/@shoelace-style/shoelace/dist/shoelace.js",
      ),
      name: "shoelace",
      fileName: () => "shoelace.es.js",
      formats: ["es"],
    },

    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]",
      },
    },
  },

  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/@shoelace-style/shoelace/dist/assets",
          dest: "",
        },
      ],
    }),
  ],
});
