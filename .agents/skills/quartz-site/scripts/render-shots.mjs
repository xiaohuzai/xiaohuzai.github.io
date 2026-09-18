#!/usr/bin/env node
// 站点渲染取证：批量截图 + 拼版对比
//
// 为什么要有这个脚本：
//   「看一眼截图觉得没问题」在本仓库被证明不可靠（曾据一张错位的截图误判中文加粗失效，
//   差点提交错误修复）。所以把截图流程固化下来：固定视口、固定等待、亮暗各一张、
//   自动拼版，便于横向对比与留证。
//
// 依赖 playwright-core（不写进 package.json，避免拖慢 CI）：
//   mkdir -p /tmp/shots-tool && cd /tmp/shots-tool && npm i playwright-core
//   然后 NODE_PATH=/tmp/shots-tool/node_modules node <本脚本> ...
//   浏览器二进制复用本机 ms-playwright 缓存，不必额外下载。
//
// 用法：
//   单个 URL：
//     node render-shots.mjs --out /tmp/shots --url http://localhost:8899/notes/xxx
//
//   多个构建产物对比（同一页面路径，不同 base）：
//     node render-shots.mjs --out /tmp/shots \
//       --page "notes/ai4s/0-基础各种-knowhow/分子.html" \
//       --target "now=file:///Users/me/repo/public" \
//       --target "flexoki=file:///Users/me/repo/public-flexoki"
//
//   可选：--width 1440 --height 950 --modes light,dark --full --cols 3
//
// 产物：<out>/<name>-<mode>.png 以及 <out>/_sheet-<mode>.png

import fs from "node:fs"
import path from "node:path"
import os from "node:os"

// ---------- 参数 ----------
const argv = process.argv.slice(2)
const flag = (name, def) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : def
}
const multi = (name) => argv.flatMap((a, i) => (a === `--${name}` && argv[i + 1] ? [argv[i + 1]] : []))

const outDir = flag("out", "/tmp/shots")
const url = flag("url")
const page = flag("page")
const width = Number(flag("width", 1440))
const height = Number(flag("height", 950))
const modes = flag("modes", "light,dark").split(",").map((s) => s.trim())
const fullPage = argv.includes("--full")
const cols = Number(flag("cols", 0))
const targets = multi("target")

if (!url && targets.length === 0) {
  console.error("需要 --url 或至少一个 --target。见文件头部用法。")
  process.exit(1)
}

// ---------- 找 Chromium ----------
function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH
  const cache = path.join(os.homedir(), "Library/Caches/ms-playwright")
  const dirs = fs.existsSync(cache) ? fs.readdirSync(cache) : []
  const pick = (prefix) => dirs.filter((d) => d.startsWith(prefix)).sort().pop()

  // 优先 headless shell：chromium-<rev>/ 下只有 "Google Chrome for Testing.app"，
  // 并没有常见脚本里写的 Chromium 可执行文件，用它会报 executable doesn't exist。
  const shell = pick("chromium_headless_shell-")
  if (shell) {
    for (const rel of [
      "chrome-headless-shell-mac-arm64/chrome-headless-shell",
      "chrome-headless-shell-mac-x64/chrome-headless-shell",
      "chrome-headless-shell-linux64/chrome-headless-shell",
    ]) {
      const p = path.join(cache, shell, rel)
      if (fs.existsSync(p)) return p
    }
  }
  const chrome = pick("chromium-")
  if (chrome) {
    const p = path.join(cache, chrome, "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing")
    if (fs.existsSync(p)) return p
  }
  for (const p of ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]) {
    if (fs.existsSync(p)) return p
  }
  throw new Error("找不到可用的 Chromium。先跑：npx playwright install chromium")
}

// ---------- 载入 playwright ----------
// 注意：ESM 的裸模块解析**不走 NODE_PATH**（那是 CommonJS 的机制），所以不能靠环境变量
// 指到别处。这里按顺序找：先常规解析（脚本旁边/仓库里有 node_modules），再试几个候选目录。
async function loadPlaywright() {
  const { createRequire } = await import("node:module")
  const { pathToFileURL } = await import("node:url")
  try {
    return await import("playwright-core")
  } catch {}
  const candidates = [
    process.env.SHOTS_TOOL_MODULES,
    path.join(process.cwd(), "node_modules"),
    // macOS 的 os.tmpdir() 是 /var/folders/… 而不是 /tmp，所以两条都试
    "/tmp/shots-tool/node_modules",
    path.join(os.tmpdir(), "shots-tool", "node_modules"),
  ].filter(Boolean)
  for (const dir of candidates) {
    try {
      const req = createRequire(path.join(dir, "noop.js"))
      const resolved = req.resolve("playwright-core")
      return await import(pathToFileURL(resolved).href)
    } catch {}
  }
  return null
}

const pw = await loadPlaywright()
if (!pw) {
  console.error(
    "缺少 playwright-core。建议装到临时目录（不要装进本仓库，避免拖慢 CI）：\n" +
      "  mkdir -p /tmp/shots-tool && cd /tmp/shots-tool && npm i playwright-core\n" +
      "然后直接运行本脚本即可（它会自动到 /tmp/shots-tool/node_modules 找）。\n" +
      "装在别处时用 SHOTS_TOOL_MODULES=<含 node_modules 的目录> 指定。",
  )
  process.exit(1)
}
// playwright-core 是 CJS 包，命名导出不一定被 ESM 的 lexer 识别出来，
// 直接从 default 兜一层，免得出现 "Cannot read properties of undefined (reading 'launch')"。
const chromium = pw.chromium ?? pw.default?.chromium
if (!chromium) {
  console.error("playwright-core 载入了但取不到 chromium 导出，请检查安装是否完整。")
  process.exit(1)
}

// ---------- 目标清单 ----------
const jobs =
  targets.length > 0
    ? targets.map((t) => {
        const eq = t.indexOf("=")
        if (eq < 0) throw new Error(`--target 需要 name=base 形式，收到：${t}`)
        const name = t.slice(0, eq)
        const base = t.slice(eq + 1)
        const u = page ? `${base.replace(/\/$/, "")}/${page.replace(/^\//, "")}` : base
        return { name, url: u }
      })
    : [{ name: "shot", url }]

fs.mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch({ executablePath: findChrome() })

// ---------- 逐个截图 ----------
for (const job of jobs) {
  for (const mode of modes) {
    // 每个模式用独立 context，避免主题偏好互相污染
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 })
    const tab = await ctx.newPage()
    try {
      await tab.goto(job.url, { waitUntil: "load", timeout: 30000 })
      // 等主题属性与懒加载资源稳定
      await tab.evaluate((m) => document.documentElement.setAttribute("saved-theme", m), mode)
      await tab.waitForTimeout(900)
      await tab.screenshot({ path: path.join(outDir, `${job.name}-${mode}.png`), fullPage })
    } catch (e) {
      console.error(`ERR ${job.name} ${mode}: ${e.message.split("\n")[0]}`)
    }
    await ctx.close()
  }
  console.log("shot", job.name)
}

// ---------- 拼版 ----------
const n = jobs.length
const columns = cols > 0 ? cols : n <= 1 ? 1 : n <= 4 ? 2 : 4
for (const mode of modes) {
  const cells = jobs
    .map((j) => {
      const f = path.join(outDir, `${j.name}-${mode}.png`)
      if (!fs.existsSync(f)) return ""
      const b64 = fs.readFileSync(f).toString("base64")
      return `<figure><img src="data:image/png;base64,${b64}"><figcaption>${j.name}</figcaption></figure>`
    })
    .join("")
  if (!cells) continue

  const sheetCtx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 })
  const sheet = await sheetCtx.newPage()
  await sheet.setContent(`<!doctype html><html><head><style>
body{margin:0;background:#2a2a2a;font-family:-apple-system,sans-serif}
.grid{display:grid;grid-template-columns:repeat(${columns},1fr);gap:10px;padding:10px}
figure{margin:0;position:relative}img{width:100%;display:block}
figcaption{position:absolute;left:8px;top:8px;background:#000d;color:#fff;padding:3px 12px;border-radius:3px;font-size:14px;font-weight:700}
</style></head><body><div class="grid">${cells}</div></body></html>`)
  await sheet.waitForTimeout(900)
  await sheet.screenshot({ path: path.join(outDir, `_sheet-${mode}.png`), fullPage: true })
  await sheetCtx.close()
  console.log("sheet", mode)
}

await browser.close()
