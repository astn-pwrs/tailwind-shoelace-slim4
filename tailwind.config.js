import path from "path";
export default {
  content: [
    path.resolve(__dirname, "resources/**/*.{html,js,ts}"),
    path.resolve(__dirname, "templates/**/*.{latte}"),
  ],

  safelist: [
    { pattern: /text-(2xl|4xl|6xl)/ },
    { pattern: /mb-(4|6|8)/ },
    "font-bold",
  ],
};
