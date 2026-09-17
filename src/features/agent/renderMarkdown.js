import { marked, Renderer } from "marked";

const renderer = new Renderer();
renderer.html = () => "";

/**
 * 把模型 answer 编成 HTML。丢掉原文里的裸 HTML，只保留 markdown 结构。
 * @param {unknown} src
 * @returns {string}
 */
export function renderMarkdown(src) {
  const text = String(src ?? "").trim();
  if (!text) return "";
  return marked.parse(text, { async: false, gfm: true, renderer });
}
