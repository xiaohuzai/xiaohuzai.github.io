// mermaid 消毒外壳（站点自带，勿手改此文件的导出结构）
//
// OFM 的 mermaid 渲染脚本会把站点 CSS 变量原样传给 mermaid.initialize()。
// @quartz-themes 主题的部分颜色定义含 hsl(calc(...)) 运算表达式，
// mermaid 11.4 的颜色解析器不支持，会直接抛错并放弃整页渲染。
// 这里包一层：initialize 前剔除含 calc() 的颜色值，让其回落到
// mermaid 安全默认色；其余 API 全部透传给真实模块（real/ 目录）。
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
    const value = Reflect.get(t, prop, t)
    return typeof value === "function" ? value.bind(t) : value
  },
})

export default proxy
