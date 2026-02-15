import MarkdownIt from "markdown-it";

/* =========================================================
   MARKDOWN PARSER
========================================================= */

export function createMarkdown() {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
  });

  /* ================= PLACEHOLDER IMAGE ================= */

  const placeholderSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="450" height="450">
  <rect width="100%" height="100%" fill="#f3f4f6"/>
  <rect x="10" y="10" width="430" height="430"
        fill="none" stroke="#9ca3af" stroke-dasharray="10 8"/>
  <text x="50%" y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        fill="#6b7280"
        font-size="28"
        font-family="sans-serif">
    Drop here!
  </text>
</svg>`;

  const placeholderBase64 =
    "data:image/svg+xml;base64," +
    btoa(unescape(encodeURIComponent(placeholderSVG)));

  /* ================= META BLOCK ================= */

  md.metaData = {};

  md.block.ruler.before(
    "fence",
    "meta_block",
    function (state, startLine, endLine, silent) {
      let pos = state.bMarks[startLine] + state.tShift[startLine];
      let max = state.eMarks[startLine];
      let line = state.src.slice(pos, max).trim();

      if (line !== "::: meta start") return false;
      if (silent) return true;

      let next = startLine + 1;
      let content = "";

      while (next < endLine) {
        let p = state.bMarks[next] + state.tShift[next];
        let m = state.eMarks[next];
        let txt = state.src.slice(p, m).trim();

        if (txt === "::: meta end") break;

        content += txt + "\n";
        next++;
      }

      md.metaData = {};

      content.split("\n").forEach((l) => {
        const m = l.match(/^(.+?):\s*(.+)$/);
        if (m) md.metaData[m[1].trim()] = m[2].trim();
      });

      state.line = next + 1;
      return true;
    },
  );

  /* ================= CUSTOM BLOCK ================= */

  let inCover = false;
  let figureStack = [];

  function findBlockEnd(state, startLine, endLine, name) {
    let depth = 1;
    let next = startLine + 1;

    while (next < endLine) {
      let p = state.bMarks[next] + state.tShift[next];
      let m = state.eMarks[next];
      let txt = state.src.slice(p, m).trim();

      if (txt.startsWith(`::: ${name} start`)) depth++;

      if (txt === `::: ${name} end`) {
        depth--;
        if (depth === 0) break;
      }

      next++;
    }

    return next;
  }

  function registerBlock(name) {
    md.block.ruler.before(
      "fence",
      "custom_" + name,
      function (state, startLine, endLine, silent) {
        let pos = state.bMarks[startLine] + state.tShift[startLine];
        let max = state.eMarks[startLine];
        let line = state.src.slice(pos, max).trim();

        if (!line.startsWith(`::: ${name} start`)) return false;
        if (silent) return true;

        let attr = line.replace(`::: ${name} start`, "").trim();
        let meta = {};

        if (name === "container") {
          let parts = attr.split(/\s+/).filter(Boolean);
          meta.type = parts.shift() || "block";

          let sizeMatch = attr.match(/size="(sm|md|lg)"/);
          meta.size = sizeMatch ? sizeMatch[1] : "md";
        }

        let next = findBlockEnd(state, startLine, endLine, name);

        let tokenOpen = state.push(name + "_open", "", 1);
        tokenOpen.meta = meta;

        state.md.block.tokenize(state, startLine + 1, next);

        state.push(name + "_close", "", -1);

        state.line = next + 1;
        return true;
      },
    );

    md.renderer.rules[name + "_open"] = (tokens, idx) => {
      const meta = tokens[idx].meta || {};

      if (name === "section") {
        return `<section class="my-1 clear-both">`;
      }

      if (name === "cover") {
        inCover = true;
        return `
<div class="grid place-items-center">
  <div class="text-center max-w-3xl px-6">
`;
      }

      if (name === "container") {
        const { type = "block", size = "md" } = meta;

        if (type === "fig-right" || type === "fig-left") {
          const width = {
            sm: "w-[25%]",
            md: "w-[35%]",
            lg: "w-[50%]",
          }[size];

          const float =
            type === "fig-right" ? "float-right ml-6" : "float-left mr-6";

          figureStack.push(true);

          return `
<div class="epub-content ml-8 space-y-4 flow-root">
<figure class="${float} ${width} mb-4 relative group cursor-pointer">
<div class="resize-handle"></div>
`;
        }

        return `<div class="epub-content ml-8 space-y-4">`;
      }

      return `<div>`;
    };

    md.renderer.rules[name + "_close"] = () => {
      if (name === "section") return `</section>`;

      if (name === "cover") {
        inCover = false;
        return `
  </div>
</div>
`;
      }

      if (name === "container") {
        if (figureStack.pop()) {
          return `</div></div>`;
        }

        return `</div>`;
      }

      return `</div>`;
    };
  }

  registerBlock("section");
  registerBlock("cover");
  registerBlock("container");

  /* ================= IMAGE + CAPTION ================= */

  md.inline.ruler.after("image", "image_caption", (state) => {
    const token = state.tokens[state.tokens.length - 1];
    if (!token || token.type !== "image") return false;

    const pos = state.pos;

    if (state.src[pos] !== "{") return false;

    const end = state.src.indexOf("}", pos);
    if (end === -1) return false;

    token.info = state.src.slice(pos, end + 1);
    state.pos = end + 1;

    return true;
  });

  md.renderer.rules.image = (tokens, idx, options, env) => {
    if (!env.figureCounter) env.figureCounter = 0;

    const token = tokens[idx];
    const src = token.attrGet("src");
    const alt = token.content || "";

    const captionMatch = token.info?.match(/\{caption="([^"]+)"\}/);
    const caption = captionMatch ? captionMatch[1] : null;

    let finalSrc = src === "path/to/image.jpg" ? placeholderBase64 : src;

    if (!caption) {
      return `<img src="${finalSrc}" alt="${alt}">`;
    }

    const id = ++env.figureCounter;

    return `
<img src="${finalSrc}" alt="${alt}">
<figcaption>図${id}：${caption}</figcaption>
</figure>
<div class="overflow-hidden">
`;
  };

  /* ================= HEADINGS ================= */

  md.renderer.rules.heading_open = (tokens, idx) => {
    const tag = tokens[idx].tag;

    if (inCover) {
      if (tag === "h1") {
        return `<h1 class="text-6xl font-bold mb-8">`;
      }

      if (tag === "h2") {
        return `<h2 class="text-2xl mb-4">`;
      }
    }

    if (tag === "h1") {
      return `<h1 class="chapter font-bold mb-2">`;
    }

    if (tag === "h2") {
      return `<h2 class="subchapter mb-2">`;
    }

    return `<${tag}>`;
  };

  return md;
}
