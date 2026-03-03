import { EpubViewer } from "./EpubViewer.js";

document.addEventListener("DOMContentLoaded", async () => {
  const viewer = new EpubViewer();

  viewer.init({
    viewer: "#viewer",
    zoomWrapper: "#zoom-wrapper",
  });

  // ボタン
  document
    .getElementById("next")
    .addEventListener("click", () => viewer.next());
  document
    .getElementById("prev")
    .addEventListener("click", () => viewer.prev());
  document
    .getElementById("modeToggle")
    .addEventListener("click", () => viewer.toggleMode());

  // ページ番号 UI
  viewer.on("pageChanged", ({ current, total }) => {
    document.getElementById("pageInfo").textContent = `${current} / ${total}`;
  });

  // TOC
  viewer.on("tocLoaded", (toc) => {
    const tocList = document.getElementById("toc");
    tocList.innerHTML = "";

    toc.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item.label;
      li.onclick = () => viewer.rendition.display(item.href);
      tocList.appendChild(li);
    });
  });

  // メタデータ
  const title = await viewer.get("title");
  const author = await viewer.get("author");

  document.getElementById("bookTitle").textContent = title;
  document.getElementById("bookAuthor").textContent = author;
});
