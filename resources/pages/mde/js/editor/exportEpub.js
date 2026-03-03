import JSZip from "jszip";
import { transformHtmlForEpub } from "./transformHtmlForEpub.js";

// layout: "fixed" または "reflow"
export async function exportEpub(md, sections, { layout = "reflow" } = {}) {
  const zip = new JSZip();

  // ---------- mimetype ----------
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  // ---------- container ----------
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

  // ---------- section分割 ----------
  const files = [];
  const allText = sections.rebuildAll();
  const blocks =
    allText.match(/::: (cover|section) start[\s\S]*?::: \1 end/g) || [];

  let index = 0;

  for (const block of blocks) {
    const rawHtml = md.render(block);
    const transformedHtml = transformHtmlForEpub(rawHtml, layout); // layoutを渡す！

    const name = block.includes("cover")
      ? "title.xhtml"
      : `section${++index}.xhtml`;

    OEBPS.file(
      name,
      `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${md.metaData.title || "Untitled"}</title>
  <meta charset="UTF-8"/>
  <link rel="stylesheet" href="book.css"/>
</head>
<body>
${transformedHtml}
</body>
</html>`,
    );

    files.push(name);
  }

  // ---------- CSS ----------
  const cssFixed = `
html, body {
  margin: 0;
  padding: 0;
  width: 768px;
  height: 1024px;
  position: relative;
  font-family: serif;
  overflow: hidden;
}

h1,h2,h3,h4,h5,h6 {
  font-weight :bold;
  font-size: 16px;
}
.epub-content {
  position: absolute;
}

.epub-cover {
  top: 0;
  left: 0;
  width: 768px;
  height: 1024px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  overflow: hidden;
}

.epub-cover-center {
  max-width: 600px;
}

.epub-cover h1 {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 20px;
}

.epub-cover h2 {
  font-size: 24px;
  margin-bottom: 12px;
}

.epub-cover p {
  font-size: 16px;
}

.epub-figure {
  position: absolute;
}

.image-right {
  left: 480px;
  top: 100px;
}

.image-left {
  left: 50px;
  top: 100px;
}

.epub-img {
  display: block;
  width: 100%;
  height: auto;
}

.epub-width-25 { width: 25%; }
.epub-width-35 { width: 35%; }
.epub-width-50 { width: 50%; }
.epub-width-80 { width: 80%; }
.epub-width-100 { width: 100%; }

.image-block img {
  width: 100%;
  height: auto;
}

.epub-text {
  position: absolute;
  top: 100px;
  left: 50px;
  width: 400px;
  line-height: 1.6;
}
`;

  const cssReflow = `
html, body {
  margin: 1em;
  padding: 0;
  font-family: serif;
  line-height: 1.6;
  font-size: 16px;
}

h1,h2,h3,h4,h5,h6 {
  font-weight: bold;
  font-size: 1em;
}

.epub-content {
  position: static;
  margin-bottom: 2em;
}

.epub-cover {
  text-align: center;
  margin: 4em auto;
}

.epub-cover-center {
  max-width: 600px;
  margin: 0 auto;
}

.epub-cover h1 {
  font-size: 2em;
  margin-bottom: 0.5em;
}

.epub-cover h2 {
  font-size: 1.5em;
  margin-bottom: 0.5em;
}

.epub-cover p {
  font-size: 1em;
  color: #666;
}

.epub-figure {
  margin: 1em 0;
}

.epub-float-right {
  float: right;
  margin: 0 0 1em 1em;
  max-width: 50%;
}

.epub-float-left {
  float: left;
  margin: 0 1em 1em 0;
  max-width: 50%;
}

.epub-width-25 { width: 25%; }
.epub-width-35 { width: 35%; }
.epub-width-50 { width: 50%; }
.epub-width-80 { width: 80%; }
.epub-width-100 { width: 100%; }

.epub-img {
  display: block;
  width: 100%;
  height: auto;
}

.image-block img {
  width: 100%;
  height: auto;
}
`;

  OEBPS.file("book.css", layout === "fixed" ? cssFixed : cssReflow);

  // ---------- metadata ----------
  const meta = md.metaData;

  const manifest = files
    .map(
      (f, i) =>
        `<item id="item${i}" href="${f}" media-type="application/xhtml+xml"/>`,
    )
    .join("\n");

  const spine = files.map((_, i) => `<itemref idref="item${i}"/>`).join("\n");

  // ---------- OPF ----------
  OEBPS.file(
    "content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0"
xmlns="http://www.idpf.org/2007/opf"
unique-identifier="bookid">

<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:identifier id="bookid">${meta.identifier || "bookid"}</dc:identifier>
  <dc:title>${meta.title || "Untitled"}</dc:title>
  <dc:language>${meta.language || "ja"}</dc:language>
  <dc:creator>${meta.creator || "Unknown"}</dc:creator>
</metadata>

<manifest>
${manifest}
<item id="css" href="book.css" media-type="text/css"/>
</manifest>

<spine>
${spine}
</spine>

</package>`,
  );

  // ---------- export ----------
  const blob = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "book.epub";
  a.click();
}
