import JSZip from "jszip";

export async function exportEpub(md, sections) {
  md.render(sections.rebuildAll());
  const zip = new JSZip();

  /* ---------- mimetype ---------- */

  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  /* ---------- container ---------- */

  zip.folder("META-INF").file(
    "container.xml",
    `<?xml version="1.0"?>
<container version="1.0"
xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles>
<rootfile full-path="OEBPS/content.opf"
media-type="application/oebps-package+xml"/>
</rootfiles>
</container>`,
  );

  const OEBPS = zip.folder("OEBPS");

  /* ---------- section分割 ---------- */

  const files = [];
  const allText = sections.rebuildAll();

  const blocks =
    allText.match(/::: (cover|section) start[\s\S]*?::: \1 end/g) || [];

  let index = 0;

  for (const block of blocks) {
    const html = md.render(block);

    const name = block.includes("cover")
      ? "title.xhtml"
      : `section${++index}.xhtml`;

    OEBPS.file(
      name,
      `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<title>${md.metaData.title || "Untitled"}</title>
<style>      
  html,body {
    height: 100vh;
    width: 100vw;
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
</style>
<link rel="stylesheet" href="book.css"/>
</head>
<body>
${html}
</body>
</html>`,
    );

    files.push(name);
  }

  /* ---------- CSS ---------- */

  OEBPS.file(
    "book.css",
    `.section {
        width: 100%;
        height: 100%;
        clear: both;
      }
      .content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        background-color: #e0e6e3;
      }

      .title-content {
        display: flex;
        justify-content: center;
        flex-direction: column;
        align-items: center;
        padding: 1em;
      }

      .title {
        font-size: 2.5em;
        margin: 0.2em 0;
      }

      .subtitle {
        font-size: 1.5em;
        margin: 0.2em 0;
        color: #555;
      }

      .title-content p {
        font-size: 1.2em;
        margin-top: 1em;
        color: #888;
      }
`,
  );

  /* ---------- metadata ---------- */

  const meta = md.metaData;

  const manifest = files
    .map(
      (f, i) =>
        `<item id="item${i}"
href="${f}"
media-type="application/xhtml+xml"/>`,
    )
    .join("\n");

  const spine = files.map((_, i) => `<itemref idref="item${i}"/>`).join("\n");

  /* ---------- OPF ---------- */

  OEBPS.file(
    "content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0"
xmlns="http://www.idpf.org/2007/opf"
unique-identifier="bookid">

<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="bookid">
${meta.identifier || "bookid"}
</dc:identifier>
<dc:title>
${meta.title || "Untitled"}
</dc:title>
<dc:language>
${meta.language || "ja"}
</dc:language>
<dc:creator>
${meta.creator || "Unknown"}
</dc:creator>
</metadata>

<manifest>
${manifest}
<item id="css"
href="book.css"
media-type="text/css"/>
</manifest>

<spine>
${spine}
</spine>

</package>`,
  );

  /* ---------- export ---------- */

  const blob = await zip.generateAsync({
    type: "blob",
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "book.epub";
  a.click();
}
