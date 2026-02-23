import { createEpubMetadataXML } from "./createEpubMetadataXML.js";

document.getElementById("save-button").addEventListener("click", async () => {
  const meta = createEpubMetadataXML();
  console.log(meta);
});
