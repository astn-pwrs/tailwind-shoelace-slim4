export function renderPreview(preview, md, sections, textarea, enableResize) {
  const markdown = sections.getCurrentMarkdown();
  let html = md.render(markdown);

  // 図に連番IDを付与（毎回同じ順番になる）
  let figIndex = 1;

  html = html.replace(/<figure/g, () => {
    return `<figure data-fig-id="fig-${figIndex++}"`;
  });
  console.log(html);
  preview.innerHTML = html;

  // ✅ 再描画用の安全なラッパー関数
  const refreshPreview = () => {
    renderPreview(preview, md, sections, textarea, enableResize);
  };

  // ✅ enableResize に全部渡す
  enableResize(preview, sections, textarea, refreshPreview);
}

export function showPage(preview) {
  const pages = JSON.parse(preview.dataset.pages || "[]");
  const index = Number(preview.dataset.index || 0);

  preview.innerHTML = pages[index] || "";
}

export function nextPage(preview) {
  const pages = JSON.parse(preview.dataset.pages || "[]");
  let index = Number(preview.dataset.index || 0);

  if (index < pages.length - 1) {
    preview.dataset.index = index + 1;
    showPage(preview);
  }
}

export function prevPage(preview) {
  let index = Number(preview.dataset.index || 0);

  if (index > 0) {
    preview.dataset.index = index - 1;
    showPage(preview);
  }
}
