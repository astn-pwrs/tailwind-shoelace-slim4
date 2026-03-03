import { createMarkdown } from "./createMarkdown.js";
import { SectionManager } from "./SectionManager.js";
import { renderPreview } from "./renderPreview.js";
import { exportEpub } from "./exportEpub.js";
import { enableResize } from "./enableResize.js";

import {
  createInitialDocument,
  createSectionTemplate,
  createFigureTemplate,
} from "./EditorTemplates.js";

export class EditorApp {
  constructor() {
    this.editor = document.getElementById("editor");
    this.preview = document.getElementById("preview");

    this.isProgrammaticChange = false;

    this.setupHighlightLayer();

    this.md = createMarkdown();

    this.sections = new SectionManager(
      this.editor,
      createInitialDocument(),
      createSectionTemplate,
    );

    this.bindUI();
    this.enableLockedLines();

    this.safeProgrammaticUpdate(() => {
      this.sections.loadInitial();
    });
  }

  /* =============================
     Safe update wrapper
  ============================= */

  safeProgrammaticUpdate(callback) {
    this.isProgrammaticChange = true;

    callback();

    this.updateHighlight();
    this.updatePreviewIfVisible();

    this.isProgrammaticChange = false;
  }

  updatePreviewIfVisible() {
    if (!this.preview.classList.contains("hidden")) {
      renderPreview(
        this.preview,
        this.md,
        this.sections,
        this.editor,
        enableResize,
      );
    }
  }

  /* =============================
     Highlight Layer (NO BLUR VERSION)
  ============================= */

  setupHighlightLayer() {
    const wrapper = document.createElement("div");

    Object.assign(wrapper.style, {
      position: "relative",
      width: "100%",
      height: "100%",
    });

    const highlight = document.createElement("pre");
    highlight.id = "editorHighlight";

    const style = getComputedStyle(this.editor);

    Object.assign(highlight.style, {
      position: "absolute",
      inset: "0",

      margin: "0",
      padding: style.padding,

      font: style.font,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,

      whiteSpace: "pre-wrap",
      wordBreak: "break-word",

      overflow: "hidden",

      boxSizing: "border-box",

      pointerEvents: "none",

      tabSize: style.tabSize,

      zIndex: "1",
    });

    Object.assign(this.editor.style, {
      position: "absolute",
      inset: "0",

      background: "transparent",

      color: "transparent",

      caretColor: "light-dark(#000000,#ffffff)",

      resize: "none",

      zIndex: "2",

      font: style.font,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,

      padding: style.padding,
      boxSizing: "border-box",

      tabSize: style.tabSize,
    });

    this.editor.parentNode.insertBefore(wrapper, this.editor);
    wrapper.appendChild(highlight);
    wrapper.appendChild(this.editor);

    this.highlight = highlight;
    this.editorWrapper = wrapper;

    const syncScroll = () => {
      highlight.scrollTop = this.editor.scrollTop;
      highlight.scrollLeft = this.editor.scrollLeft;
    };

    this.editor.addEventListener("scroll", syncScroll);

    this.editor.addEventListener("input", () => {
      this.updateHighlight();
      this.updatePreviewIfVisible();
    });

    requestAnimationFrame(() => this.updateHighlight());
  }

  updateHighlight() {
    const html = this.editor.value
      .split("\n")
      .map((line) =>
        line.startsWith(":::")
          ? `<span class="md-directive">${this.escapeHTML(line)}</span>`
          : this.escapeHTML(line),
      )
      .join("\n");

    this.highlight.innerHTML = html + "\n";
  }

  escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* =============================
     Locked ::: lines (UI ONLY)
  ============================= */

  enableLockedLines() {
    const isLockedPosition = (pos) => {
      const lines = this.editor.value.split("\n");

      let index = 0;

      for (const line of lines) {
        const start = index;
        const end = index + line.length;

        if (pos >= start && pos <= end && line.startsWith(":::")) {
          return true;
        }

        index = end + 1;
      }

      return false;
    };

    this.editor.addEventListener("beforeinput", (e) => {
      if (this.isProgrammaticChange) return;

      const start = this.editor.selectionStart;
      const end = this.editor.selectionEnd;

      if (isLockedPosition(start) || isLockedPosition(end)) {
        e.preventDefault();
      }
    });

    this.editor.addEventListener("keydown", (e) => {
      if (this.isProgrammaticChange) return;

      const pos = this.editor.selectionStart;

      if (isLockedPosition(pos)) {
        e.preventDefault();
      }
    });
  }

  /* =============================
     UI Bindings
  ============================= */

  bindUI() {
    document
      .getElementById("togglePreview")
      .addEventListener("click", () => this.togglePreview());

    document
      .getElementById("addSection")
      .addEventListener("click", () =>
        this.safeProgrammaticUpdate(() => this.sections.add()),
      );

    document
      .getElementById("prevPage")
      .addEventListener("click", () =>
        this.safeProgrammaticUpdate(() => this.sections.prev()),
      );

    document
      .getElementById("nextPage")
      .addEventListener("click", () =>
        this.safeProgrammaticUpdate(() => this.sections.next()),
      );

    document
      .getElementById("addRight")
      .addEventListener("click", () =>
        this.safeProgrammaticUpdate(() => this.insertFigure("fig-right")),
      );

    document
      .getElementById("addLeft")
      .addEventListener("click", () =>
        this.safeProgrammaticUpdate(() => this.insertFigure("fig-left")),
      );

    document
      .getElementById("exportEpub")
      .addEventListener("click", () => exportEpub(this.md, this.sections));
  }

  /* =============================
     Preview
  ============================= */

  togglePreview() {
    const editorBox = this.editor.parentNode;

    const showing = !this.preview.classList.contains("hidden");

    if (showing) {
      this.preview.classList.add("hidden");
      editorBox.classList.remove("hidden");

      requestAnimationFrame(() => {
        this.updateHighlight();
      });
    } else {
      renderPreview(
        this.preview,
        this.md,
        this.sections,
        this.editor,
        enableResize,
      );

      editorBox.classList.add("hidden");
      this.preview.classList.remove("hidden");
    }
  }

  /* =============================
     Insert Figure
  ============================= */

  insertFigure(type) {
    const side = type === "fig-left" ? "left" : "right";

    const template =
      "\n" + createFigureTemplate(side, "md", "キャプション") + "\n";

    let text = this.sections.sections[this.sections.currentIndex];

    const marker = "::: section end";
    const pos = text.lastIndexOf(marker);

    text =
      pos === -1
        ? text + template
        : text.slice(0, pos) + template + "\n" + text.slice(pos);

    this.sections.sections[this.sections.currentIndex] = text;
    this.sections.load();
  }

  getMeta() {
    return this.md.metaData;
  }
}
