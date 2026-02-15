import ePub from "epubjs";

export class EpubViewer {
  constructor() {
    this.target = document.documentElement;

    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.panZoomMode = false;

    this.MIN_SCALE = 1;
    this.MAX_SCALE = 2;

    this.dragging = false;

    this.events = {}; // イベント管理
  }

  /* =========================
     イベント API
  ========================= */
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach((cb) => cb(data));
    }
  }

  /* =========================
     初期化
  ========================= */
  init({ viewer, zoomWrapper }) {
    this.viewer = document.querySelector(viewer);
    this.zoomWrapper = document.querySelector(zoomWrapper);

    if (!this.viewer || !this.zoomWrapper) {
      console.error("viewer または zoomWrapper が見つかりません");
      return;
    }

    this.setupThemeObserver();
    this.loadEpubFromQuery();
    this.setupPanZoom();
  }

  /* =========================
     EPUB 読み込み
  ========================= */
  async loadEpubFromQuery() {
    const params = new URLSearchParams(location.search);
    const file = params.get("file") || "/horizontal.epub";

    this.book = ePub(file);

    // TOC 読み込み
    const navigation = await this.book.loaded.navigation;
    this.emit("tocLoaded", navigation.toc);

    this.rendition = this.book.renderTo(this.zoomWrapper, {
      width: "100%",
      height: "100%",
      flow: "paginated",
      spread: "auto",
      allowScriptedContent: true,
    });

    this.rendition.hooks.content.register((contents) => {
      this.injectTheme(contents);
    });

    // ページ移動イベント
    this.rendition.on("relocated", (location) => {
      const current = location.start.displayed.page;
      const total = location.start.displayed.total;

      this.emit("pageChanged", {
        current,
        total,
        location,
      });
    });

    this.rendition.on("rendered", () => {
      this.updateIframePointer();
      this.applyTheme();
    });

    this.rendition.display();
  }

  /* =========================
     メタデータ取得
  ========================= */
  async get(property) {
    const metadata = await this.book.loaded.metadata;

    switch (property) {
      case "title":
        return metadata.title;
      case "author":
      case "creator":
        return metadata.creator;
      case "publisher":
        return metadata.publisher;
      case "language":
        return metadata.language;
      default:
        return metadata[property];
    }
  }

  /* =========================
     テーマ監視
  ========================= */
  setupThemeObserver() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-theme"
        ) {
          const newTheme = this.target.getAttribute("data-theme");
          this.rendition?.views().forEach((view) => {
            if (view?.contents) this.injectTheme(view.contents, newTheme);
          });
        }
      }
    });

    observer.observe(this.target, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  }

  injectTheme(contents, newTheme) {
    const theme = newTheme || this.target.getAttribute("data-theme") || "light";

    contents.addStylesheetRules({
      "html, body": {
        background: theme === "dark" ? "#121212" : "#ffffff",
        color: theme === "dark" ? "#e0e0e0" : "#000000",
      },
      img: {
        filter: "none !important",
        background: "transparent !important",
      },
      "*": {
        backgroundColor: "transparent",
      },
    });
  }

  applyTheme() {
    const theme = this.target.getAttribute("data-theme");
    this.rendition?.views().forEach((view) => {
      if (view?.contents) this.injectTheme(view.contents, theme);
    });
  }

  /* =========================
     Pan / Zoom
  ========================= */
  setupPanZoom() {
    this.viewer.addEventListener(
      "wheel",
      (e) => {
        if (!this.panZoomMode) return;
        e.preventDefault();

        const rect = this.viewer.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const prev = this.scale;
        const delta = e.deltaY < 0 ? 1.1 : 0.9;

        this.scale = Math.min(
          this.MAX_SCALE,
          Math.max(this.MIN_SCALE, this.scale * delta),
        );
        const ratio = this.scale / prev;

        this.offsetX = mx - ratio * (mx - this.offsetX);
        this.offsetY = my - ratio * (my - this.offsetY);

        this.applyTransform();
      },
      { passive: false },
    );

    this.viewer.onmousedown = (e) => {
      if (!this.panZoomMode) return;
      this.dragging = true;
      this.startX = e.clientX - this.offsetX;
      this.startY = e.clientY - this.offsetY;
      this.viewer.style.cursor = "grabbing";
    };

    window.onmousemove = (e) => {
      if (!this.dragging) return;
      this.offsetX = e.clientX - this.startX;
      this.offsetY = e.clientY - this.startY;
      this.applyTransform();
    };

    window.onmouseup = () => {
      this.dragging = false;
      this.viewer.style.cursor = this.panZoomMode ? "grab" : "default";
    };
  }

  updateIframePointer() {
    const iframe = this.zoomWrapper.querySelector("iframe");
    if (iframe) iframe.style.pointerEvents = this.panZoomMode ? "none" : "auto";
  }

  applyTransform() {
    this.zoomWrapper.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
  }

  resetTransform() {
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.applyTransform();
  }

  /* =========================
     外部 API
  ========================= */
  next() {
    this.resetTransform();
    this.rendition.next();
  }

  prev() {
    this.resetTransform();
    this.rendition.prev();
  }

  toggleMode() {
    this.panZoomMode = !this.panZoomMode;
    this.updateIframePointer();
    this.viewer.style.cursor = this.panZoomMode ? "grab" : "default";
    if (!this.panZoomMode) this.resetTransform();
  }
}
