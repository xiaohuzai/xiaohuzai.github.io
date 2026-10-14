// markmap-viz 的浏览器端 bundle：markmap-lib(no-plugins) + markmap-view + js-yaml。
// 为什么不用官方 markmap-autoloader：它运行时回 jsdelivr CDN 拉库，违反本站
// 「运行时零外网依赖」；这里把所有依赖打成一个 ESM 文件，由 local-plugins/markmap-viz
// 从 /static/markmap/bundle.js 按需 import（页面没有 ```markmap 块就不会加载）。
// 为什么用 no-plugins 基座：完整版静态拖着 katex/highlight.js/prismjs（>1MB），
// 本站 markmap 块只有大纲语法，砍掉后 gzip 约 140KB。frontmatter 用 20 行切片代替
// 官方插件（足够处理 ```markmap 块里的 markmap: YAML）。
//
// 重新构建：
//   npm i markmap-lib@0.18 markmap-view@0.18 js-yaml esbuild
//   npx esbuild entry.mjs --bundle --minify --format=esm --outfile=bundle.js
import { Transformer } from "markmap-lib/no-plugins"
import { Markmap, deriveOptions } from "markmap-view"
import * as yaml from "js-yaml"

const FM = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/
const transformer = new Transformer([])

export function transform(markdown) {
  let markmapOptions = {}
  const m = markdown.match(FM)
  if (m) {
    try {
      markmapOptions = yaml.load(m[1])?.markmap || {}
    } catch (e) {
      console.warn("[markmap-viz] frontmatter 解析失败，忽略", e)
    }
    markdown = markdown.slice(m[0].length)
  }
  return { ...transformer.transform(markdown), markmapOptions }
}

export { Markmap, deriveOptions }
