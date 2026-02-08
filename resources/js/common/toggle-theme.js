export function toggleTheme() {
  // --------------------
  // theme toggle
  // --------------------
  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");

  // 初期テーマ
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const theme = saved ?? (prefersDark ? "dark" : "light");

  root.dataset.theme = theme;
  localStorage.setItem("theme", theme);
  updateButton(theme);

  // 切り替え
  toggle.addEventListener("click", () => {
    const isLight = root.dataset.theme !== "dark";
    const next = isLight ? "dark" : "light";
    root.classList.toggle("sl-theme-light", !isLight);
    root.classList.toggle("sl-theme-dark", isLight);
    root.dataset.theme = next;
    localStorage.setItem("theme", next);
    updateButton(next);
  });

  function updateButton(theme) {
    toggle.textContent = theme === "dark" ? "☀️" : "🌙";
    // toggle.innerHTML =
    //   theme === "dark"
    //     ? '<span class="flex items-center justify-center text-2xl leading-none text-black">☀️</span>'
    //     : '<span class="flex items-center justify-center text-2xl leading-none text-black">🌙</span>';
  }
}
