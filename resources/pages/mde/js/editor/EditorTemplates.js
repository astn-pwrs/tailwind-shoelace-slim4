export function createInitialDocument() {
  const year = new Date().getFullYear();

  return `::: meta start
title: 技術書タイトル
creator: 著者名
language: ja
identifier: book-id-001
publisher: MyPublisher
rights: © ${year} 著者名
::: meta end

::: section start

::: cover start
# タイトル
## サブタイトル

著者: 著者名
${year}
::: cover end

::: section end`;
}

export function createSectionTemplate(index = 1) {
  return `::: section start
# 見出し${index}

::: container start
本文
::: container end

::: section end`;
}

export function createFigureTemplate(
  side = "right",
  size = "md",
  caption = "キャプション",
) {
  const type = side === "left" ? "fig-left" : "fig-right";

  return `::: container start ${type} size="${size}"
![代替テキスト](path/to/image.jpg){caption="${caption}"}
回り込みする文
::: container end`;
}
