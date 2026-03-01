//import { createContentXML } from "./createContentLXML.js";

document
  .getElementById("save-button")
  .addEventListener("click", async (event) => {
    event.preventDefault(); // フォームの送信を止める
    const form = document.getElementById("epub-meta");
    const data = {};
    const elements = form.querySelectorAll("[name]");

    elements.forEach((el) => {
      const name = el.getAttribute("name");
      if (!name) return;
      // Shoelaceの要素は .value で値を取得できる
      data[name] = el.value;
    });

    console.log("📘 送信データ:", data);

    // ここでAPIに送信するなら、例えば：
    /*
    const response = await fetch('/api/epub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    */
  });
