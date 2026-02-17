export class SectionManager {
  constructor(editor, initialDoc, templateFn) {
    this.editor = editor;
    this.templateFn = templateFn;

    this.sections = [initialDoc];
    this.currentIndex = 0;
  }

  /* =============================
     Internal helper
  ============================= */

  notifyChange() {
    // textareaを書き換えたことを外部に通知
    this.editor.dispatchEvent(new Event("input", { bubbles: true }));
  }

  /* =============================
     Core
  ============================= */

  loadInitial() {
    this.load();
  }

  save() {
    this.sections[this.currentIndex] = this.editor.value;
  }

  load() {
    this.editor.value = this.sections[this.currentIndex] || "";

    // 👇 ここが最重要
    this.notifyChange();
  }

  /* =============================
     Navigation
  ============================= */

  add() {
    this.save();

    const template = this.templateFn(this.sections.length);

    this.sections.push(template);
    this.currentIndex = this.sections.length - 1;

    this.load();
  }

  prev() {
    if (this.currentIndex > 0) {
      this.save();
      this.currentIndex--;
      this.load();
    }
  }

  next() {
    if (this.currentIndex < this.sections.length - 1) {
      this.save();
      this.currentIndex++;
      this.load();
    }
  }

  /* =============================
     API
  ============================= */

  getCurrentMarkdown() {
    this.save();
    return this.sections[this.currentIndex] || "";
  }

  setCurrentMarkdown(text) {
    this.sections[this.currentIndex] = text;
    console.log(this.currentIndex, text);
    console.log(this.sections);
    this.editor.value = text; // 直接UI更新
  }

  rebuildAll() {
    return this.sections.join("\n\n");
  }
}
