---
title: "博客样式测试：代码、图片、公式、流程图"
date: 2026-07-23T18:30:00+08:00
draft: false
tags: ["测试", "Congo", "Hugo"]
categories: ["技术"]
summary: "迁移到 Congo 主题后的渲染测试 —— 验证代码高亮、图片、KaTeX 公式、Mermaid 流程图都能正常显示。"
---

这是迁移到 Congo 主题后的第一篇测试文章。用来一次性验证下面这些类型的内容都能正常渲染。

## 代码高亮

```python
def fibonacci(n: int) -> int:
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print([fibonacci(i) for i in range(10)])
```

```typescript
interface AgentState {
  messages: Message[];
  tools: Tool[];
  isStreaming: boolean;
}

const stream = (state: AgentState): AsyncIterator<string> => {
  // ...
};
```

## 图片

放张测试图占位（如果你看到这张图能渲染，说明 Congo 默认的图片 lazy load + 路径都对）：

![替代文本（描述图内容供屏幕阅读器使用）](https://placehold.co/800x400/2563eb/ffffff?text=Congo+%E4%B8%BB%E9%A2%98%E6%B5%8B%E8%AF%95%E5%9B%BE)

## KaTeX 公式

{{< katex >}}

行内公式：欧拉恒等式 $e^{i\pi} + 1 = 0$ 被誉为最美的公式。

块级公式：

$$
\nabla \times \vec{\mathbf{B}} - \frac{1}{c}\frac{\partial \vec{\mathbf{E}}}{\partial t} = \frac{4\pi}{c}\vec{\mathbf{j}}
$$

## Mermaid 流程图

{{< mermaid >}}
graph TD
    A[用户输入] --> B{路由判断}
    B -->|API 调用| C[背景 LLM 推理]
    B -->|工具调用| D[执行 tool]
    C --> E[流式返回]
    D --> E
    E --> F[渲染到 sidepanel]
{{< /mermaid >}}

序列图（验证 mermaid 多种类型都能渲染）：

{{< mermaid >}}
sequenceDiagram
    participant U as User
    participant SP as Sidepanel
    participant BG as Background SW
    participant LLM as LLM API

    U->>SP: 输入消息
    SP->>BG: chrome.runtime.sendMessage
    BG->>LLM: fetch stream
    LLM-->>BG: chunk
    BG-->>SP: port.postMessage
    SP-->>U: 流式显示
{{< /mermaid >}}

## 表格

| 框架 | 抽象层级 | 状态 |
|---|---|---|
| LangChain | SDK + Agent | 1.0 稳定 |
| LangGraph | 状态图引擎 | 1.0 稳定 |
| Pi Agent | TS Agent runtime | 活跃 |
| Deep Agents | LangChain 高层封装 | 活跃 |

## 任务清单

- [x] PaperMod → Congo 主题迁移
- [x] 启用 Profile 布局 + GitHub 社交链接
- [x] 验证代码高亮 / 图片 / 公式 / 流程图
- [ ] 给博客加个头像
- [ ] 选个 Congo 内置 colorScheme

## 总结

如果上面这些元素全都渲染正常，说明 Congo 主题配置无误。可以放心把 PaperMod 替换掉了。