// 为什么需要这个插件：
//   quartz.config.yaml 的 theme.colors 会被编译成 CSS 变量，但落在
//   @layer quartz-base（主题包声明的层顺序里优先级最低）；
//   @quartz-themes/core 在更高优先级的 @layer obsidian-theme 里用自己的调色板
//   （--lightgray: var(--background-secondary, var(--color-base-20)) → #f6f6f6），
//   结果是「配置里写了颜色但站上看不到」。
// 做法与依据：
//   CSS 层叠规则中，无 layer 的声明优先于任何 layer 里的声明（先比 layer 再比特异性）。
//   这里直接读 ctx.cfg.configuration.theme.colors，把两组颜色以「无 layer」样式重新注入，
//   让 quartz.config.yaml 重新成为调色板的唯一事实来源（改配置即生效，无需动本文件）。
import { h } from "preact"

export function ConfigPalette() {
  return {
    htmlPlugins() {
      return []
    },
    externalResources(ctx) {
      const colors = ctx.cfg.configuration.theme?.colors
      if (!colors?.lightMode || !colors?.darkMode) return undefined

      const block = (mode, selector) => {
        const declarations = Object.entries(colors[mode])
          .map(([name, value]) => `--${name}:${value};`)
          .join("")
        return `${selector}{${declarations}}`
      }
      const css = block("lightMode", ":root") + block("darkMode", ":root[saved-theme=dark]")

      return {
        css: [{ content: css, inline: true }],
      }
    },
  }
}