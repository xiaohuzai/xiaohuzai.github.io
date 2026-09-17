// OFM 的 mermaid 客户端渲染脚本会动态 import 固定 CDN 地址（cdnjs），
// 无任何容错：cdnjs 不可达时 mermaid 块就停留在原始代码形态。
// 这里通过 import map 把该地址重定向到站内自带的
// /static/mermaid/（源文件在 quartz/static/mermaid/，与 CDN 版本同为 11.4.0），
// 渲染逻辑本身不变，只是不再依赖外部网络。
import { h } from "preact"

const CDN_URL = "https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.4.0/mermaid.esm.min.mjs"
const LOCAL_URL = "/static/mermaid/mermaid.esm.min.mjs"

export function MermaidOffline() {
  const opts = {
    htmlPlugins() {
      return []
    },
    externalResources(ctx) {
      const importMap = {
        imports: {
          [CDN_URL]: LOCAL_URL,
        },
      }
      return {
        additionalHead: [
          h("script", {
            type: "importmap",
            dangerouslySetInnerHTML: { __html: JSON.stringify(importMap) },
          }),
        ],
      }
    },
  }
  return opts
}
