import "../css/app.css";
import "../css/fonts.css";
import {
  setBasePath,
  registerIconLibrary,
} from "@shoelace-style/shoelace/dist/shoelace.js";
//
import { toggleTheme } from "./common/toggle-theme.js";

setBasePath("/shoelace/");

registerIconLibrary("custom", {
  resolver: (name) => `/custom/${name}.svg`, // アイコンのパス
  mutator: (svg) => {
    // 必要に応じてSVGを加工
    //svg.setAttribute("fill", "currentColor");
  },
});
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded!");
  toggleTheme();
});
