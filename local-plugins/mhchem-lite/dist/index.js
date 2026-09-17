// mhchem-lite：在构建时把 `\ce{...}` 翻译成 KaTeX。
//
// 背景：本仓库构建链路里的 KaTeX 没有注册 mhchem 扩展，直接写 `\ce{...}` 会渲染成红色的 "\ce"
// （Obsidian 用 MathJax，本来就认 `\ce`）。这里在解析 markdown 之前（textTransform）把 `\ce{...}`
// 改写成等价的 KaTeX，于是「Obsidian 里怎么写，站上就怎么渲染」。
//
// 只翻译有把握的写法：遇到不认识的字符就退化成 \mathrm{原文} 并打警告——宁可显示成直立方块，
// 也不要渲染出错误的化学式。
const ARROWS = new Map([
  ["<=>>", "\\rightleftharpoons"],
  ["<<=>", "\\leftrightharpoons"],
  ["<=>", "\\rightleftharpoons"],
  ["<->", "\\leftrightarrow"],
  ["->", "\\rightarrow"],
  ["<-", "\\leftarrow"],
  ["=>", "\\Rightarrow"],
  ["<=", "\\Leftarrow"],
])

const ELEMENT = /^([A-Z][a-z]?|\(|\)|\[|\]|\.)/
const SAFE = /^[A-Za-z()\[\]{},.=+\-^0-9*'\\]*$/
// 这些符号后面的小数字是下标（NH3+ → NH₃⁺）；金属和右括号后面的数字是电荷量（Ca2+ → Ca²⁺）
const NONMETAL = new Set([
  "H", "C", "N", "O", "P", "S", "F", "Cl", "Br", "I", "B", "Si", "Se", "Te", "As",
])

function fallback(token, warn) {
  warn(`不认识的写法，退化为直立方块：\\ce{${token}}`)
  return `\\mathrm{${token.replace(/[\\${}]/g, "").replace(/\^/g, "")}}`
}

// 一个物种（空白分隔的一个 token）→ KaTeX
export function convertSpecies(token, warn = () => {}) {
  if (!SAFE.test(token)) return fallback(token, warn)
  let out = ""
  let i = 0
  let m
  // 开头的计量系数：2H2O、3O2
  if ((m = token.match(/^(\d+(?:\.\d+)?)(?=[A-Z([])/))) {
    out += m[1] + "\\,"
    i = m[1].length
  }
  while (i < token.length) {
    const rest = token.slice(i)
    // 0) LaTeX 宏原样透传：\ddot{N}（孤对电子）、\alpha 等
    if ((m = rest.match(/^\\[a-zA-Z]+(\{[^{}]*\})?/))) {
      out += m[0]
      i += m[0].length
      continue
    }
    // 1) 同位素或前缀上标：^{14}C、^14C（后面不是正负号才是同位素）
    if ((m = rest.match(/^\^(\{[^}]*\}|\d+)(?=[A-Za-z([])/))) {
      out += `^{${m[1].replace(/[{}]/g, "")}}`
      i += m[0].length
      continue
    }
    // 2) 电荷：+ - 2+ 2- ^2- ^+（后面是结尾或另一个符号才算电荷，否则是化学键）
    if ((m = rest.match(/^\^?(\d*)([+-])(?=$|[+\-])/))) {
      out += `^{${m[1]}${m[2]}}`
      i += m[0].length
      continue
    }
    // 3) 元素符号 / 括号 / 结晶水点
    if ((m = rest.match(ELEMENT))) {
      const sym = m[1]
      i += sym.length
      if (sym === ".") {
        out += "\\cdot "
        continue
      }
      let sub = ""
      const dm = token.slice(i).match(/^(\d+)/)
      if (dm) {
        const after = token.slice(i + dm[1].length)
        const digitsAreCharge = /^[+-]/.test(after) && !NONMETAL.has(sym)
        if (!digitsAreCharge) {
          sub = `_{${dm[1]}}`
          i += dm[1].length
        }
      }
      out += sym + sub
      continue
    }
    // 4) 状态符号等小写文本：(l) (s) (g) (aq)
    if ((m = rest.match(/^[a-z]+/))) {
      out += `\\mathrm{${m[0]}}`
      i += m[0].length
      continue
    }
    // 5) 系数或纯数字
    if ((m = rest.match(/^\d+(?=[A-Z([])/))) {
      out += m[0] + "\\,"
      i += m[0].length
      continue
    }
    if ((m = rest.match(/^\d+(?:\.\d+)?/))) {
      out += m[0]
      i += m[0].length
      continue
    }
    // 6) 化学键（TeX 里 - 和 = 会被当运算符，间距不对）
    if (rest[0] === "-") {
      out += "\\text{-}"
      i += 1
      continue
    }
    if (rest[0] === "=") {
      out += "{=}"
      i += 1
      continue
    }
    out += "\\text{" + rest[0] + "}"
    i += 1
  }
  return out
}

// \ce{...} 的内容 → KaTeX
export function convertCeBody(body, warn = () => {}) {
  const tokens = body.trim().split(/\s+/).filter(Boolean)
  return tokens
    .map((t) => {
      if (t === "+") return "+"
      if (t === ".") return "\\cdot"
      if (ARROWS.has(t)) return ARROWS.get(t)
      return convertSpecies(t, warn)
    })
    .join(" ")
}

// 整篇文本里替换 \ce{...}（跳过 ``` 代码块）
export function convertCe(src, warn = () => {}) {
  let fence = false
  return src
    .split("\n")
    .map((line) => {
      if (line.trimStart().startsWith("```")) {
        fence = !fence
        return line
      }
      if (fence) return line
      let out = ""
      let i = 0
      while (i < line.length) {
        const at = line.indexOf("\\ce{", i)
        if (at === -1) {
          out += line.slice(i)
          break
        }
        out += line.slice(i, at)
        let depth = 0
        let j = at + 3
        for (; j < line.length; j++) {
          if (line[j] === "{") depth++
          else if (line[j] === "}" && --depth === 0) break
        }
        if (depth !== 0) {
          out += line.slice(at)
          break
        }
        out += convertCeBody(line.slice(at + 4, j), warn)
        i = j + 1
      }
      return out
    })
    .join("\n")
}

export function MhchemLite() {
  return {
    name: "mhchem-lite",
    textTransform(_ctx, src) {
      return convertCe(src, (msg) => console.warn(`[mhchem-lite] ${msg}`))
    },
  }
}
