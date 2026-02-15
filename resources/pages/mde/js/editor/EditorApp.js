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

    this.md = createMarkdown();

    // ✅ 初期ドキュメントをSectionManagerへ渡す
    this.sections = new SectionManager(
      this.editor,
      createInitialDocument(),
      createSectionTemplate,
    );

    this.bindUI();

    // ✅ textareaに初期テンプレを表示
    this.sections.loadInitial();
  }

  bindUI() {
    document
      .getElementById("togglePreview")
      .addEventListener("click", () => this.togglePreview());

    document
      .getElementById("addSection")
      .addEventListener("click", () => this.sections.add());

    document.getElementById("prevPage").addEventListener("click", () => {
      this.sections.prev();
      this.updatePreviewIfVisible();
    });

    document.getElementById("nextPage").addEventListener("click", () => {
      this.sections.next();
      this.updatePreviewIfVisible();
    });
    document
      .getElementById("addRight")
      .addEventListener("click", () => this.insertFigure("fig-right"));

    document
      .getElementById("addLeft")
      .addEventListener("click", () => this.insertFigure("fig-left"));

    document
      .getElementById("exportEpub")
      .addEventListener("click", () => exportEpub(this.md, this.sections));
  }

  togglePreview() {
    const showing = !this.preview.classList.contains("hidden");

    if (showing) {
      this.preview.classList.add("hidden");
      this.editor.classList.remove("hidden");
    } else {
      renderPreview(
        this.preview,
        this.md,
        this.sections,
        this.editor,
        enableResize,
      );

      this.editor.classList.add("hidden");
      this.preview.classList.remove("hidden");
    }
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

  getMeta() {
    return this.md.metaData;
  }

  insertFigure(type) {
    // side を "right" または "left" に変換
    const side = type === "fig-left" ? "left" : "right";

    // createFigureTemplate を使ってテンプレートを生成
    const template =
      "\n" + createFigureTemplate(side, "md", "キャプション") + "\n";

    // 現在のセクションを取得
    let text = this.sections.sections[this.sections.currentIndex];

    const marker = "::: section end";
    const pos = text.lastIndexOf(marker);

    if (pos === -1) {
      // section end が無い場合は末尾に追加
      text += template;
    } else {
      // section end の直前に挿入
      text = text.slice(0, pos) + template + "\n" + text.slice(pos);
    }

    // セクションを更新して再表示
    this.sections.sections[this.sections.currentIndex] = text;
    this.sections.load();
    this.updatePreviewIfVisible();
  }
}
