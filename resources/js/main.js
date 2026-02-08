import "../css/app.css";
import "../css/fonts.css";
import { setBasePath } from "@shoelace-style/shoelace/dist/shoelace.js";
//
import { toggleTheme } from "./common/toggle-theme.js";
//import ePub from "epubjs";

setBasePath("/shoelace/");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded!");
  toggleTheme();
});
