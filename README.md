# 小虎崽的博客

个人博客:记录 AI、自动驾驶与工程实践。

## 技术栈

- **Hugo** 静态站生成
- **Congo** 主题([jpanther/congo](https://github.com/jpanther/congo))
- **GitHub Pages** 托管 + GitHub Actions 自动部署
- 部署触发:`push` 到 `main` 分支 → Actions build → deploy

## 本地开发

```bash
git clone --recurse-submodules https://github.com/xiaohuzai/xiaohuzai.github.io.git
cd xiaohuzai.github.io/site
hugo server   # http://localhost:1313/
```

## 写博客

在 `content/posts/` 下新建 markdown 文件,front matter 至少包含:

```yaml
---
title: "你的标题"
date: 2026-07-23T18:00:00+08:00
draft: false
tags: ["标签1", "标签2"]
categories: ["分类"]
summary: "一句话简介"
---
```

`git push` 到 main → 几分钟后博客自动更新。

## 站点

👉 https://xiaohuzai.github.io/