# okf-wiki-template — 你的私人知识库模板

把微信公众号文章（或任何文章链接）发给微信里的 AI Bot，AI 自动抓取、提炼、归档成结构化知识卡片，可搜索、可提问、可积累。

**这是一个空模板**：不含任何私人数据，只有目录骨架、约定说明、构建脚本、只读网页界面和示例文件。基于 [Open Knowledge Format (OKF) v0.2](https://github.com/GoogleCloudPlatform/open-knowledge-format) 协议。

## 三种用法，任选

| 途径 | 适合谁 | 怎么做 |
|------|--------|--------|
| ⭐ **一键复刻**（推荐） | 所有人 | 打开 [`PROMPT.md`](PROMPT.md)，复制全文，发给你微信里连接的 ZCode Bot。AI 会下载本模板、搭好一切 |
| 跟着教程手动搭 | 想搞懂原理的人 | 阅读 [保姆级教程](tutorials/zcode-wechat-wiki-tutorial.md)：3 步主线 + GitHub 备份 / 网页界面两个进阶篇 |
| 只当参考 | 想自己造的人 | 抄走目录结构、README 约定和构建脚本，按自己的喜好改造 |

> 还没有把微信连上 ZCode？教程「小白主线」只需要 3 步：[装 ZCode 桌面端](https://zcode.z.ai/cn) → 扫码连接微信 Bot Channel → 发送 PROMPT。
>
> 📄 **想离线阅读或直接转发给朋友？** [下载 PDF 版教程](tutorials/zcode-wechat-wiki-tutorial.pdf)（12 页 A4，含全部配图，手机上可直接打开）。

## 目录结构

```
okf-wiki-template/
├── PROMPT.md            # ⭐ 一键构建：复制全文发给你的 AI Bot
├── README.md            # 本文件：约定说明书（AI 的行为依据）
├── index.md             # OKF bundle 根索引
├── log.md               # 变更日志（AI 每入库一篇记一笔）
├── concepts/            # 知识主体：每篇文章一个 .md 概念文件
│   ├── index.md         #   按主题分类的总目录
│   └── sample-*.md      #   两个格式示例（可删）
├── references/          # 外部材料镜像（可选）
├── tutorials/           # 保姆级教程（含全部配图）
├── ui/                  # 只读网页界面源码（纯静态，Markdown 是唯一事实来源）
└── scripts/
    └── build-index.mjs  # 把 Markdown 目录构建成 ui/data/index.json
```

## 知识文件长什么样？

每篇文章提炼为一个概念文件：YAML frontmatter（type / title / description / tags / generated / status / sources）+ 四段式正文（定义 / 核心要点 / 实践应用 / 备注）。完整规范见下方「OKF 约定」，实例见 [`concepts/`](concepts/index.md) 里的两个示例文件。

## OKF 约定（AI 的行为依据）

本 bundle 遵循 OKF v0.2，要点如下（完整字段表见协议原文）：

### frontmatter 字段

| 字段 | 必需 | 说明 |
|------|------|------|
| `type` | 是 | 本模板约定：`Article`（单篇文章沉淀页）/ `Topic`（多篇综合主题页）/ `Reference`（外部材料镜像） |
| `title` | 推荐 | 人类可读标题 |
| `description` | 推荐 | 一句话摘要，用于索引/预览 |
| `tags` | 推荐 | YAML 列表，小写短标签 |
| `generated` | 推荐 | `{ by, at }`，内容由谁在何时生成 |
| `status` | 可选 | `draft` / `stable` / `deprecated`，缺省 `stable` |
| `sources` | 推荐 | 来源列表，每条含 `id`/`resource`/`title`/`author`/`last_modified` |

### 正文约定

- 用 `# 定义` / `# 核心要点` / `# 实践应用` / `# 备注` 组织正文
- 概念间用相对链接交叉引用，构成隐式知识图
- 溯源脚注用 `[^id]`，对应 `sources[].id`

### 一致性规则

每个非保留名 `.md` 文件须含可解析的 YAML frontmatter 和非空 `type`；`index.md`、`log.md` 遵循协议保留文件结构。消费方不得因可选字段缺失或未知扩展键拒绝 bundle。

## 浏览网页界面

```bash
npm run dev    # 首次自动构建索引，浏览器访问 http://localhost:4173/ui/
```

> **Markdown 是唯一事实来源。** 界面只读、不回写；就算不装界面，用任何编辑器打开 `concepts/` 都能直接阅读全部知识。

## 常见问题

抓取失败、文章被删、git 冲突、时间不显示等真实踩坑记录，统一见教程末尾的 [常见问题](tutorials/zcode-wechat-wiki-tutorial.md#常见问题真实踩坑记录)。
