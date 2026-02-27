import { createContentXML } from "./createContentLXML.js";

document.getElementById("save-button").addEventListener("click", async () => {
  //root folderを作成
  //META-INF folder
  //mimetypeを作成し、root folder
  //container.xml作成
  const container = `<?xml version="1.0"?>
<container version="1.0"
xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles>
<rootfile full-path="OEBPS/content.opf"
media-type="application/oebps-package+xml"/>
</rootfiles>
</container>`;
  //META-INF/container.xml
  //OEBPS folder作成
  //book.css配置
  //OEBPS/各xhtml
  const meta = createContentXML();
  console.log(meta);
  //OEBPS/content.opf
  //
});
