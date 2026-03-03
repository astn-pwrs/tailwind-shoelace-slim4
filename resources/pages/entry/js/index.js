//import { createContentXML } from "./createContentLXML.js";

document
  .getElementById("save-button")
  .addEventListener("click", async (event) => {
    event.preventDefault(); // フォームの送信を止める
    const form = document.getElementById("epub-meta");
    const data = {};
    const elements = form.querySelectorAll("[name]");
    let api = "";
    elements.forEach((el) => {
      const name = el.getAttribute("name");
      if (!name) return;
      // Shoelaceの要素は .value で値を取得できる
      if (name == "api") api = el.value;
      else data[name] = el.value;
    });

    console.log("📘 送信データ:", data);
    const response = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  });
