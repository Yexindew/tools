---
name: html-doc
description: 写 HTML 文档（PPT演示/左侧目录文章/单页报告/PRD）的标准模板和规范。支持三种文档类型：全屏翻页Deck、侧边栏章节文章、轻量单页文档。内置标注系统、S3上传、自检清单和踩坑备忘。当用户要写HTML文档、做技术分享、输出报告时使用。

metadata:
  skillhub.creator: "yanli06"
  skillhub.updater: "yanli06"
  skillhub.version: "V4"
  skillhub.source: "FRIDAY Skillhub"
  skillhub.skill_id: "80424"
  skillhub.high_sensitive: "false"
---

# HTML 文档 Skill

> 所有角色写 HTML 文档（文章/PPT/报告/PRD）时必须遵守。
> 调起时先问文档类型，再按模板进行。

---

## 第一步：确认文档类型（必问）

**被调起后，先问：**

> 你要写哪种 HTML 文档？
>
> **A. PPT / 分享演示** — 全屏翻页 Deck，适合汇报、复盘、分享
> **B. 左侧目录文章** — 侧边栏章节导航，适合系列文章/技术文档/书籍
> **C. 单页文档** — 无侧栏，轻量场景（审计报告/知识图/数据看板）
> **D. PRD** — 待加模板，暂时用 C 类型代替

用户选择后，跳转到对应模板章节，不用再问其他问题，直接开写。

---

## A. PPT / 分享演示 Deck

### 执行流程（Claude 来做，不是用户手动操作）

**第一步：和用户沟通内容**，确认：
- 主题 / 标题 / 副标题
- 有几页，每页核心观点是什么
- 有没有数据、图片、对话等素材

**第二步：获取模板**：优先 Read `~/ai/team/knowledge/templates/ppt-deck-template.html`；该文件不存在则 WebFetch `https://s3plus-bj02.vip.sankuai.com/openclaw/pde/ppt-deck-template.html`。以模板为骨架填写内容，调整 `const TOTAL = N` 和 `.tl-node` 数量。

**第三步：Write 到目标路径**，文件名由用户指定或按主题自动命名（如 `~/Desktop/xxx-2026-06.html`）。

**第四步：推送到 GitHub Pages**，用下方"推送 GitHub Pages"章节的命令推送，把链接告诉用户。

> 整个过程用户不需要复制文件、不需要手动操作。推送是默认行为，不需要询问。

### 内置组件

| 组件 | class | 说明 |
|------|-------|------|
| 封面 | `.cover-hero` `.cover-hl` `.cover-stats` | 大标题 + 渐变高亮 + 数字 |
| 章节标签 | `.ch-tag` `.ch-heading` `.ch-desc` | 每页左上角 |
| 悬停卡片 | `.hcard` `.hcard.red` `.hcard-more` | hover 浮起，`.hcard-more` 展开隐藏内容 |
| 数字卡 | `.stat-card` | 大数字展示 |
| 对话卡 | `.dialogue-wrap` `.dialogue-line` | 还原真实对话 |
| 气泡墙 | `.starfield-voices` `.v-bubble` `.vb-lg` | 用户原声散落网格 |
| 下一步 | `.next-card` | 4格并排待办 |
| 横向柱状图 | `.hbar` `.hbar-row` `.hbar-fill.hl/.muted` | 数据对比 |
| 图片预览 | `.p3-thumb` + `.p3-preview` | hover 弹出大图，锚点间直接滑动自动切换 |
| 结尾洞察 | `.insight-card` | Thanks 页底部洞察卡 |

### 图片预览写法

```html
<div class="p3-thumb">
  <div class="p3-thumb-imgs">
    <img src="./before.png"> <img src="./after.png">
  </div>
  <!-- 内容由 JS 复制到全局浮层，mouseenter 自动展开 -->
  <div class="p3-preview">
    <div class="p3-preview-title">预览标题</div>
    <div class="p3-preview-compare">
      <div class="p3-preview-side">
        <span class="p3-preview-label before">BEFORE</span>
        <img src="./before.png">
      </div>
      <div class="p3-preview-side">
        <span class="p3-preview-label after">AFTER</span>
        <img src="./after.png">
      </div>
    </div>
  </div>
</div>
```

> 鼠标移入展开，移出关闭；从一个缩略图直接滑向下一个会无缝切换（120ms 延迟防抖）。

---

## B. 左侧目录文章

**执行流程**：先和用户确认系列名、章节列表、本章内容；然后以下方骨架为基础直接 Write 到目标路径，不需要用户手动复制任何文件；最后推送到 GitHub Pages，把链接告诉用户。

**模板预览**：https://s3plus-bj02.vip.sankuai.com/openclaw/pde/html-template.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>文章标题 — 系列名</title>
<link rel="stylesheet" href="https://s3plus-bj02.vip.sankuai.com/openclaw/pde/template.css">
</head>
<body>

<button class="menu-btn" id="menuBtn">☰</button>
<div class="overlay" id="overlay"></div>

<nav class="sidebar" id="sidebar">
  <div class="sidebar-title">系列大标题（英文全大写）</div>
  <div class="sidebar-book">系列副标题</div>
  <ul class="sidebar-list">
    <li class="done"><a href="章节1链接"><span class="ch-num">1</span>章节1标题</a></li>
    <li class="active"><a href="#"><span class="ch-num">2</span>本章标题</a></li>
    <li><a href="#"><span class="ch-num">3</span>章节3标题</a></li>
  </ul>
  <div class="sidebar-footer">
    严历 × 角色名 出品<br>最后更新：YYYY-MM-DD
  </div>
</nav>

<div class="main">
  <div class="container">
    <!-- 正文内容 -->
  </div>
</div>

<script src="https://s3plus-bj02.vip.sankuai.com/openclaw/pde/sidebar.js"></script>
<script src="https://s3plus-bj02.vip.sankuai.com/openclaw/pde/annotations.js"></script>
</body>
</html>
```

**footer 格式**：`严历 × 角色名 出品`（角色名填实际协作角色：凯/阿远/鲁班/貂蝉）

### 内容组件

| 组件 | class | 用途 |
|------|-------|------|
| 洞察框（金色） | `.insight` | 关键洞察、注意事项 |
| 对话框 | `.dialogue` + `.dialogue-line` | 原声对话，`.speaker`（可加 `.ayuan`/`.cc`/`.xx` 着色） |
| 场景框（蓝绿） | `.scene` + `.scene-title` | 还原真实场景 |
| 大引言 | `.pull-quote` + `.accent` | 金句，居中大字 |
| 踩坑框（红色） | `.danger-box` + `.danger-title` | 踩坑记录 |
| 章节导航 | `.chapter-nav` | 上一篇/下一篇链接 |
| SVG 占位 | `.svg-placeholder` | 架构图放这里 |

---

## C. 单页文档

适合审计报告、知识图、数据看板等无需侧栏的场景。**执行流程**：先和用户确认文档主题和内容；以下方骨架为基础直接 Write 到目标路径。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>文档标题</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif; background:#fff; color:#1a1a1a; line-height:1.9; padding:40px 50px; max-width:900px; margin:0 auto; }
@media(max-width:600px){ body{ padding:16px; } }
</style>
</head>
<body>

<!-- 正文内容 -->

<script src="https://s3plus-bj02.vip.sankuai.com/openclaw/pde/annotations.js"></script>
</body>
</html>
```

---

## 强制规范（缺一不可）

1. **白色背景** — `body { background: #fff }` 或 `#f8fafb`，禁止深色主题
2. **结论先行** — 最重要的结论/数字放第一屏，不需要滚动就能看到
3. **图优于文** — 用 SVG 流程图/拓扑图/雷达图表达关系，不堆文字卡片
4. **移动端适配** — 必须有 `<meta name="viewport">` + `@media(max-width:600px)` 响应式
5. **单文件** — CSS + SVG 全部内联，不引外部 CDN；annotations.js 例外（内部同源 S3）
6. **标注组件** — `</body>` 前加 annotations.js（所有类型均需，模板已内置）

---

## 标注系统

在 `</body>` 前加一行（B/C 类型必须；A 类型模板已内置）：

```html
<script src="https://s3plus-bj02.vip.sankuai.com/openclaw/pde/annotations.js"></script>
```

就这一行，自动提供：
- 首次访问弹框问名字，localStorage 记住
- 划词 → 💬 评论 / 🔖 划线
- 点击高亮 → 就地气泡（评论 + 回复 + 🗑删除）
- 右侧「📝批注」按钮 → 全览侧栏

> ⚠️ S3 强制返回 `Content-Security-Policy: script-src 'self'`，inline `<script>` 块和 `onclick="..."` 均无效。所有交互 JS 必须放外部文件。

---

## 推送 GitHub Pages

仓库：`Yexindew/writings`，Token 从 memory 读取（永不过期）。
公网访问：`https://yexindew.github.io/writings/<文件名>`

**推送命令（用 GitHub API，无需本地 git）：**

```bash
# 1. 获取文件的 base64 内容
CONTENT=$(base64 -i <本地文件路径>)

# 2. 检查文件是否已存在（获取 sha，新文件则为空）
SHA=$(curl -s -H "Authorization: token YOUR_GITHUB_TOKEN" \
  "https://api.github.com/repos/Yexindew/writings/contents/<文件名>" \
  | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(d.get('sha',''))" 2>/dev/null)

# 3. 推送（新文件不传 sha，更新文件需带 sha）
curl -s -X PUT "https://api.github.com/repos/Yexindew/writings/contents/<文件名>" \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"add <文件名>\",\"content\":\"$CONTENT\",\"sha\":\"$SHA\"}" \
  | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(d.get('content',{}).get('html_url','ERROR:'+str(d)))"
```

> 推送成功后等约 30 秒 GitHub Pages 部署完成，访问 `https://yexindew.github.io/writings/<文件名>`。

---

## 配色参考

| 用途 | 色值 |
|------|------|
| 主色（文章） | `#0D7A5F`（深青绿） |
| 主色（PPT） | `#c0392b`（红），可改 `--primary` 变量 |
| 强调 | `#DC2626`（红，警示/缺失） |
| 警告 | `#D97706`（橙，半成品） |
| 背景 | `#f8fafb` 或 `#fff` |
| 正文 | `#1a1a1a` |
| 辅助文字 | `#6b7280` |

---

## 自检清单（提交前过一遍）

- [ ] 白底？
- [ ] 第一屏有结论？
- [ ] 有 SVG 图？（非纯文字堆砌）
- [ ] 有 viewport meta？
- [ ] 有 `@media(max-width:600px)`？
- [ ] 有标注组件？
- [ ] 完整 HTML 结构（DOCTYPE + html + head + body）？

**不通过 = 不推送，先修再传。**

---

## 踩坑备忘

| 坑 | 原因 | 正确做法 |
|----|------|---------|
| inline JS 不执行 | S3 CSP `script-src 'self'` | 提取为外部 .js 文件，先传 S3，再用 `<script src>` 引用 |
| PPT Deck 翻页/hover 全失效 | `<script>` IIFE 被 CSP 拦截 | 把整个 IIFE 提取成独立 .js 上传同源 S3 |
| onclick 不响应 | CSP 同理 | addEventListener 写在外部 JS |
| 图片 404（本地好使，S3 坏掉）| 相对路径 `./xxx.png` 在 S3 找不到文件 | 图片单独上传 S3，HTML 里换成完整 URL |
| 标注组件不出来 | 内联写法被拦截 | 只引一行 annotations.js |
| 手机划词没反应 | 缺 touchend | annotations.js 已内置 |
| S3 缓存不更新 | CDN 缓存 | URL 加 `?v=N` |
| PPT 图片预览不弹 | .p3-preview 要是 .p3-thumb 的直接子元素 | 检查 DOM 结构 |

---

## Hook 自动检查

每次 Write/Edit `.html` 文件后自动检查 6 项规范：

```json
{
  "event": "PostToolUse",
  "hooks": [{
    "matcher": "Write|Edit",
    "script": "bash ~/ai/team/skills/html-doc/postToolUse-check.sh $FILE_PATH"
  }]
}
```

检查项：❌ 深色背景 / ❌ 缺 viewport / ❌ 缺响应式 / ❌ 外部 CDN / ❌ 缺标注 / 🟡 缺 SVG / 🟡 含 inline script / 🟡 含相对路径图片

---

## 其他角色适配

| 角色 | 需要做的事 |
|------|-----------|
| 阿远 | 写 HTML 文档时读本文件，上传用 OpenClaw 的方式二 |
| 鲁班 | 写 HTML 文档时读本文件 |
| 貂蝉 | 有写 HTML 场景时读本文件 |
