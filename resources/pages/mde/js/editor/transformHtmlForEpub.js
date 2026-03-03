export function transformHtmlForEpub(htmlText, layout = "fixed") {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");

  const removeClasses = [
    "ml-6",
    "ml-8",
    "mb-4",
    "size-md",
    "relative",
    "group",
    "cursor-pointer",
    "flow-root",
    "space-y-4",
    "text-6xl",
    "text-2xl",
    "font-bold",
    "text-center",
    "grid",
    "place-items-center",
    "max-w-3xl",
    "px-6",
    "mb-8",
  ];

  // section要素を展開して中身だけ残す
  doc.querySelectorAll("section").forEach((section) => {
    const parent = section.parentNode;
    while (section.firstChild) {
      parent.insertBefore(section.firstChild, section);
    }
    parent.removeChild(section);
  });

  // data-epub属性を epub-content に変換
  doc.querySelectorAll("[data-epub]").forEach((el) => {
    const type = el.getAttribute("data-epub");
    el.removeAttribute("data-epub");
    el.classList.add("epub-content");
    if (type) {
      el.classList.add(`epub-${type}`);
    }
  });

  // epub-content ブロックの処理（固定レイアウトのみ image-block を追加）
  if (layout === "fixed") {
    doc.querySelectorAll(".epub-content").forEach((block) => {
      if (block.querySelector("figure")) {
        block.classList.add("image-block");
      }
    });
  }

  // figure 要素の変換
  // doc.querySelectorAll("figure").forEach((fig) => {
  //   const classList = fig.className;

  //   if (layout === "fixed") {
  //     if (classList.includes("float-right")) {
  //       fig.className = "epub-figure image-right";
  //     } else if (classList.includes("float-left")) {
  //       fig.className = "epub-figure image-left";
  //     } else {
  //       fig.className = "epub-figure";
  //     }
  //   } else {
  //     const newClasses = ["epub-figure"];
  //     if (classList.includes("float-right"))
  //       newClasses.push("epub-float-right");
  //     if (classList.includes("float-left")) newClasses.push("epub-float-left");
  //     fig.className = newClasses.join(" ");
  //   }

  //   const handle = fig.querySelector(".resize-handle");
  //   if (handle) handle.remove();
  // });
  doc.querySelectorAll("figure").forEach((fig) => {
    const classList = (fig.getAttribute("class") || "").split(/\s+/);
    const newClasses = [];

    if (layout === "fixed") {
      newClasses.push("epub-figure");

      if (classList.includes("float-right")) {
        newClasses.push("image-right");
      } else if (classList.includes("float-left")) {
        newClasses.push("image-left");
      }

      // 他のクラスはそのまま残す（後で整理される）
      classList.forEach((cls) => {
        if (!["float-right", "float-left"].includes(cls)) {
          newClasses.push(cls);
        }
      });

      fig.setAttribute("class", newClasses.join(" "));
    } else {
      const flowClasses = ["epub-figure"];
      if (classList.includes("float-right"))
        flowClasses.push("epub-float-right");
      if (classList.includes("float-left")) flowClasses.push("epub-float-left");

      classList.forEach((cls) => {
        if (!["float-right", "float-left"].includes(cls)) {
          flowClasses.push(cls);
        }
      });

      fig.setAttribute("class", flowClasses.join(" "));
    }

    const handle = fig.querySelector(".resize-handle");
    if (handle) handle.remove();
  });

  // <p><img></p> のような構造を修正
  doc.querySelectorAll("p").forEach((p) => {
    const onlyImg =
      p.children.length === 1 && p.firstElementChild?.tagName === "IMG";
    if (onlyImg) {
      const img = p.firstElementChild;
      const clone = img.cloneNode(true);
      const newImg = doc.createElement("img");
      for (const attr of clone.attributes) {
        newImg.setAttribute(attr.name, attr.value);
      }
      p.replaceWith(newImg);
    }
  });

  // imgタグのclassをepub-imgに置き換え
  doc.querySelectorAll("img").forEach((img) => {
    const classList = Array.from(img.classList);
    const hasWFull = classList.includes("w-full");
    const hasHAuto = classList.includes("h-auto");
    const hasBlock = classList.includes("block");

    if (hasWFull && hasHAuto && hasBlock) {
      img.className = "epub-img";
    }

    // XHTML準拠のため img を self-closing に修正
    const clone = img.cloneNode(true);
    const newImg = doc.createElement("img");
    for (const attr of clone.attributes) {
      newImg.setAttribute(attr.name, attr.value);
    }
    img.replaceWith(newImg);
  });

  // クラスの整理
  doc.querySelectorAll("[class]").forEach((el) => {
    const kept = [];
    for (const cls of el.classList) {
      const match = cls.match(/^w-\[(\d+)%\]$/);
      if (match) {
        kept.push(`epub-width-${match[1]}`);
      } else if (!removeClasses.includes(cls) && !cls.startsWith("w-[")) {
        kept.push(cls);
      }
    }
    if (kept.length > 0) {
      el.className = kept.join(" ");
    } else {
      el.removeAttribute("class");
    }
  });

  // XHTML準拠のため <img> を self-closing に修正（文字列置換）
  let output = doc.body.innerHTML;
  output = output.replace(/<img([^>]*?)(?<!\/)>/g, "<img$1 />");

  return output;
}
