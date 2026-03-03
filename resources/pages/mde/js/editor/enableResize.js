export function enableResize(preview, sections, textarea, renderPreview) {
  preview.addEventListener("click", (e) => {
    console.log("click");
    const fig = e.target.closest("figure");
    if (!fig) return;

    const figures = [...preview.querySelectorAll("figure")];
    const index = figures.indexOf(fig);
    if (index === -1) return;

    const markdown = sections.getCurrentMarkdown();

    const current = getSizeFromMarkdown(markdown, index + 1);
    //console.log("current", current);
    //console.log(markdown);
    const next = current === "sm" ? "md" : current === "md" ? "lg" : "sm";
    //console.log("size", current, next);
    const updated = updateFigureSizeInMarkdown(markdown, index + 1, next);
    //console.log("updated");
    textarea.value = updated;
    //console.log(textarea.value);

    sections.setCurrentMarkdown(updated);
    //console.log("read back");
    //console.log(sections.rebuildAll());
    renderPreview();
  });
}

/* =========================
   Markdownからsizeを読む
========================= */

function getSizeFromMarkdown(markdown, figIndex) {
  const lines = markdown.split("\n");

  let count = 0;

  for (const line of lines) {
    if (line.startsWith("::: container start fig-")) {
      count++;

      if (count === figIndex) {
        const match = line.match(/size="(sm|md|lg)"/);
        return match ? match[1] : "??";
      }
    }
  }

  //return "md";
}

/* =========================
   Markdownを書き換え
========================= */

function updateFigureSizeInMarkdown(markdown, figIndex, newSize) {
  const lines = markdown.split("\n");

  let count = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("::: container start fig-")) {
      count++;

      if (count === figIndex) {
        if (line.includes('size="')) {
          lines[i] = line.replace(/size="(sm|md|lg)"/, `size="${newSize}"`);
        } else {
          lines[i] += ` size="${newSize}"`;
        }

        break;
      }
    }
  }

  return lines.join("\n");
}
