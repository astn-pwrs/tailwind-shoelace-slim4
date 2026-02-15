export function enableResize(preview, sections, textarea, renderPreview) {
  preview.querySelectorAll("figure").forEach((fig, index) => {
    fig.onclick = () => {
      const current = getSizeFromClass(fig);

      const next = current === "sm" ? "md" : current === "md" ? "lg" : "sm";

      const markdown = sections.getCurrentMarkdown();
      const updated = updateFigureSizeInMarkdown(markdown, index + 1, next);

      textarea.value = updated;
      sections.setCurrentMarkdown(updated);

      renderPreview();
    };
  });
}

function getSizeFromClass(fig) {
  const cls = fig.className;

  if (cls.includes("w-[25%]")) return "sm";
  if (cls.includes("w-[50%]")) return "lg";
  return "md"; // default
}

function updateFigureSizeInMarkdown(markdown, figIndex, newSize) {
  const lines = markdown.split("\n");

  let count = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("::: container start fig-")) {
      count++;

      if (count === figIndex) {
        // sizeを書き換え
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
