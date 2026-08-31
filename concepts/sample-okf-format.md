---
type: Topic
title: 什么是 OKF：Open Knowledge Format 入门
description: 本知识库所遵循的开放知识格式协议——纯 Markdown + YAML 头，人和 AI 都能直接读写，一条硬性要求外加若干推荐字段。
tags: [okf, knowledge-format, markdown, sample]
generated:
  by: template
  at: 2026-08-31T00:00:00Z
status: stable
sources:
  - id: okf-spec-v0.2
    resource: https://github.com/GoogleCloudPlatform/open-knowledge-format
    title: Open Knowledge Format Specification v0.2
    author: org:GoogleCloudPlatform
    last_modified: 2026-08-31T00:00:00Z
---

> 💡 **这是一个示例文件**，演示 `type: Topic` 条目的写法。使用真实知识库时可删除。

# 定义

OKF（Open Knowledge Format，开放知识格式）是 Google 开源的一种知识组织协议（v0.2）：用纯 Markdown 文件 + YAML frontmatter 来承载结构化知识，不依赖任何私有工具或数据库。它的设计目标是**人和 AI 都能直接读写**——你用记事本就能看懂全部内容，AI 检索时也有稳定的字段可以解析。

# 核心要点

## 一条硬性要求

OKF v0.2 只有**一条**强制规则：每个知识文件必须带 YAML frontmatter，且其中 `type` 字段非空。其余字段全部按需生长——这就是"约定优于配置"。

## 推荐字段

| 字段 | 作用 |
|------|------|
| `title` / `description` | 人类可读标题与一句话摘要，索引和卡片预览靠它们 |
| `tags` | 小写短标签列表，支撑网页界面里的标签筛选 |
| `generated` | `{ by, at }`：这份内容由谁、在何时生成（AI 溯源） |
| `status` | `draft` / `stable` / `deprecated`，标记内容成熟度 |
| `sources` | 来源列表（原文链接、作者、日期），让每条知识可溯源 |

## 三类保留文件

- `index.md`（根目录）：bundle 总索引，唯一允许声明 `okf_version` 的地方
- `log.md`：变更日志，按 ISO 日期倒序，AI 每入库一篇都记一笔
- 各子目录的 `index.md`：该目录的分类目录

## 为什么适合"文章 → 知识库"场景

1. **零锁定**：Markdown 是通用语，任何编辑器、任何 AI 都能读
2. **可溯源**：每条知识都能沿 `sources` 找回原文
3. **可生长**：概念之间用相对链接交叉引用，自然形成知识图
4. **AI 友好**：字段稳定意味着 AI 入库、检索、汇报都有据可依

# 实践应用

- 用本模板搭好知识库后，你不需要懂 OKF 的任何细节——AI 会按约定自动生成合规文件
- 想手工写一篇知识笔记？复制任意概念文件改内容即可，只要保留 `type` 字段就是合法的 OKF 文件
- 消费方（网页界面、检索脚本）不得因可选字段缺失或未知扩展键拒绝整个 bundle——这保证了知识库可以宽松生长

# 备注

- 协议原文：GoogleCloudPlatform/open-knowledge-format（GitHub）
- 本模板 README 的「OKF 约定」一节是协议要点的中文速览
- 相关示例：[一篇公众号文章如何变成知识卡片](sample-wechat-article.md)
