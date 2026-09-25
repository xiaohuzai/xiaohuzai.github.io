---
tags:
  - 生物
  - AlphaFold
---

跟着开源教程 [kilianmandon/alphafold-decoded](https://github.com/kilianmandon/alphafold-decoded)（Hands-on AlphaFold implementation for educational purposes）逐步手写 AlphaFold 的笔记，一篇配一课。代码引用均指向教程仓库的 `solutions/` 目录。

## 小节

| 课程 | 笔记 | 讲什么 |
| --- | --- | --- |
| 第 4 课 Feature Extraction | [[Feature Extraction]] | a3m 文件怎么变成 AlphaFold 的输入特征：初始处理、选簇中心、Masking、簇分配、簇平均、特征堆叠 |
| 第 3 课 Attention | [[AlphaFold 中的注意力详解（上篇）：单头 · 多头 · 全局 · 门控\|注意力详解·上篇]] | 单头 / 多头 / Global / 门控——同一套缩放点积公式的不同配置 |
| 第 5、8、9 课 | [[AlphaFold 中的注意力详解（下篇）\|注意力详解·下篇]] | 按 AF2 算法 7、8、13/14、19、22 逐一拆解每一种注意力（含 IPA） |

建议阅读顺序：Feature Extraction（输入数据从哪来）→ 注意力上篇（机制地基）→ 下篇（AF2 里的每一种注意力）。

## 相关笔记

- [[AlphaFold 课程总览|EMBL-EBI《AlphaFold》课程总览]]——偏科普的官方在线课程笔记，适合先建立全貌。
