import { v4 as uuidv4 } from "uuid";

export function createContentXML() {
  const identifier = `urn:uuid:${uuidv4()}`;
  const container = document.getElementById("epub-meta");
  const getValue = (selector) => container.querySelector(selector)?.value || "";
  const getSelectValue = (selector) =>
    container.querySelector(selector)?.value || "";

  const meta = {
    title: getValue('sl-input[name="title"]'),
    creator: getValue('sl-input[name="creator"]'),
    language: getSelectValue('sl-select[name="language"]'),
    publisher: getValue('sl-input[name="publisher"]'),
    date: new date(),
    description: getValue('sl-textarea[name="description"]'),
  };

  return `
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/"
          xmlns:opf="http://www.idpf.org/2007/opf">
  <dc:title>${meta.title}</dc:title>
  <dc:creator>${meta.creator}</dc:creator>
  <dc:language>${meta.language}</dc:language>
  <dc:publisher>${meta.publisher}</dc:publisher>
  <dc:date>${meta.date}</dc:date>
  <dc:description>${meta.description}</dc:description>
  <dc:identifier id="BookId">${identifier}</dc:identifier>
</metadata>
`.trim();
}
