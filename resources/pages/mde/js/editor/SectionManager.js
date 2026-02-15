export class SectionManager {
  constructor(editor, initialDoc, templateFn) {
    this.editor = editor;
    this.templateFn = templateFn;

    this.sections = [initialDoc];
    this.currentIndex = 0;
  }

  loadInitial() {
    this.load();
  }

  save() {
    this.sections[this.currentIndex] = this.editor.value;
  }

  load() {
    this.editor.value = this.sections[this.currentIndex] || "";
  }

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

  getCurrentMarkdown() {
    this.save(); // 最新を反映
    return this.sections[this.currentIndex] || "";
  }

  setCurrentMarkdown(text) {
    this.sections[this.currentIndex] = text;
  }

  rebuildAll() {
    return this.sections.join("\n\n");
  }
}
