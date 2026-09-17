// mermaid 消毒外壳（站点自带，勿手改此文件的导出结构）
//
// 1. 颜色消毒：OFM 的 mermaid 渲染脚本会把站点 CSS 变量原样传给
//    mermaid.initialize()。@quartz-themes 主题的部分颜色定义含
//    hsl(calc(...)) 表达式，mermaid 11.4 的颜色解析器不支持，直接抛错。
//    这里在 initialize 前剔除含 calc() 的颜色值，回落安全默认色。
// 2. 并发防护：OFM 脚本对每个 nav 事件各起一次 run()（页面加载时 nav
//    会连发数次），并发的 run 互相改写正在解析的 DOM，导致
//    "Syntax error in text"。这里做两件事：
//    a) run 防抖合并，只渲染最后一次触发；
//    b) 执行前把节点恢复为首次捕获的原始文本（防止上一轮异步渲染
//       写入的半成品 SVG 被当成解析输入）。
const real = await import("./real/mermaid.esm.min.mjs")

function sanitize(themeVariables) {
  if (!themeVariables || typeof themeVariables !== "object") return themeVariables
  for (const key of Object.keys(themeVariables)) {
    const value = themeVariables[key]
    if (typeof value === "string" && value.includes("calc(")) {
      delete themeVariables[key]
    }
  }
  return themeVariables
}

const target = real.default
let debounceTimer = null
const savedText = new WeakMap()

const proxy = new Proxy(target, {
  get(t, prop, receiver) {
    if (prop === "initialize") {
      return function initialize(options) {
        if (options && typeof options === "object") {
          options.themeVariables = sanitize(options.themeVariables)
        }
        return t.initialize(options)
      }
    }
    if (prop === "run") {
      return function run(options) {
        return new Promise((resolve, reject) => {
          if (debounceTimer) clearTimeout(debounceTimer)
          debounceTimer = setTimeout(async () => {
            try {
              const nodes = options?.nodes ?? []
              for (const node of nodes) {
                if (!node || !node.isConnected) continue
                const current = node.innerHTML
                if (!savedText.has(node) && !current.includes("<svg")) {
                  savedText.set(node, current)
                }
                const original = savedText.get(node)
                if (original !== undefined && node.innerHTML !== original) {
                  node.innerHTML = original
                }
              }
              resolve(await t.run(options))
            } catch (err) {
              console.error("[mermaid-offline] run 失败:", err)
              try {
                const nodes = options?.nodes ?? []
                if (nodes[0]) {
                  console.warn(
                    "[mermaid-offline] 首个节点解析输入:",
                    JSON.stringify(nodes[0].innerHTML).slice(0, 300),
                  )
                }
              } catch {}
              reject(err)
            }
          }, 80)
        })
      }
    }
    const value = Reflect.get(t, prop, t)
    return typeof value === "function" ? value.bind(t) : value
  },
})

export default proxy
