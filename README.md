# Discord 多角色口语练习 Bot

一个模拟真实群聊的三角色 AI 对话机器人，部署在 Discord 频道中。三个角色（Ethan、Will、Zoe）拥有不同人格和立场，能围绕话题互相讨论、辩论，帮助你练习英语口语和思辨表达。

---

## 快速启动

```bash
cd ~/work-english-bot
python3 bot.py
```

三个 bot 会依次上线。看到 `✅ Ethan/Will/Zoe is online` 即可去 Discord 频道发消息。

---

## 环境要求

- Python 3.10+
- 依赖包：`discord.py`, `aiohttp`
- 代理：需要 TUN 代理（端口 `7897`），用于 Discord WebSocket 和 DeepSeek API 连接
- 网络：能访问 `gateway.discord.gg` 和 `api.deepseek.com`

### 安装依赖

```bash
pip3 install discord.py aiohttp
```

---

## 项目结构

```
~/work-english-bot/
├── bot.py          # 主程序（三角色 + 共享历史 + 防重复回复）
├── bot.log         # 运行日志（实时查看：tail -f bot.log）
└── README.md       # 本文档
```

---

## 三角色设定

| 角色 | 人格 | 风格 | 响应概率 |
|------|------|------|----------|
| **Ethan** | ENTP 创业者 | 爱挑刺、玩 devil's advocate、短句犀利 | 人类 75% / 其他 bot 60% |
| **Will** | INTJ 学者 | 结论先行、 dry humor、重构问题 | 人类 75% / 其他 bot 55% |
| **Zoe** | ENFP 创作者 | 温暖幽默、关注人性角度、偶尔 tangent | 人类 75% / 其他 bot 65% |

所有角色都遵循**语言跟随**：你发中文他们回中文，你发英文他们回英文。

---

## 运行控制

### 前台运行（调试）
```bash
cd ~/work-english-bot
python3 bot.py
```
按 `Ctrl+C` 停止。

### 后台运行（推荐）
```bash
cd ~/work-english-bot
nohup python3 bot.py > bot.log 2>&1 &
```

### 查看日志
```bash
tail -f ~/work-english-bot/bot.log
```

### 停止所有 bot
```bash
pkill -f "python.*bot.py"
```
如果进程还在，强制终止：
```bash
ps aux | grep "bot.py" | grep -v grep
kill -9 <PID>
```

---

## 核心机制

### 1. 共享对话历史
三个 bot 共享同一份 `shared_history`（最近 40 条消息），用 `threading.Lock` 保护，确保每个 bot 都能看到完整的群聊上下文。

### 2. 防重复回复
- `pending_replies` 字典：每条消息最多允许 2 个 bot 回应（人类消息最多 3 个）
- 原子抢占：bot 在决定回复前先 "claim" 该消息，避免多个 bot 同时回复同一条

### 3. 阅读 + 打字延迟
模拟真实人类节奏：
- **阅读延迟**：人类消息 ~0.15s/字符 + 2-4s；bot 消息 ~0.25s/字符 + 3-6s
- **打字延迟**：回复长度 / 45 字符每秒 + 随机抖动
- Discord `typing...` 指示器会在打字期间显示

### 4. 触发规则
- `@提及` → 必回
- 人类发消息 → 75% 概率回复（模拟热闹群聊）
- 其他 bot 发消息 → 按角色概率回复（Ethan 60%, Will 55%, Zoe 65%）

---

## 配置项

在 `bot.py` 顶部修改：

```python
# DeepSeek API（官方接口）
AIGC_URL = "https://api.deepseek.com/chat/completions"
AIGC_API_KEY = "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # 替换为你的 key
MODEL = "deepseek-chat"

# Discord 频道 ID
CHANNEL_ID = 1508373540586389647

# Bot Token（从 Discord Developer Portal 获取）
TOKENS = {
    "ethan": "YOUR_ETHAN_BOT_TOKEN",
    "will":  "YOUR_WILL_BOT_TOKEN",
    "zoe":   "YOUR_ZOE_BOT_TOKEN",
}

# 代理地址（TUN 代理端口）
PROXY = "http://127.0.0.1:7897"
```

---

## 常见问题

### 连接超时 / 无法登录
确保 TUN 代理已开启，且端口 `7897` 正确。`bot.py` 中已通过 `proxy=PROXY` 注入 Discord 客户端和 aiohttp 请求。

### API 返回 401 / 402
- 401：Token 过期，去 Discord Developer Portal 重新生成 Bot Token
- 402：API Key 余额不足，更换 DeepSeek API Key

### 三个 bot 都不回复
检查 `bot.log` 是否有 `Shard ID None has connected` 日志。如果没有，可能是网络或 Token 问题。如果有连接日志但不回复，检查 API Key 是否有效。

### 回复太长
已在 system prompt 中限制 "1-3 sentences max"。如果仍然太长，可以进一步缩短 prompt 中的句子数限制。

### 重复回复
`pending_replies` 机制已修复此问题。如果仍出现，检查是否有多个 `bot.py` 进程在跑：
```bash
ps aux | grep "bot.py"
```

---

## 迁移到新电脑

1. 复制 `~/work-english-bot/` 文件夹到新电脑
2. 安装依赖：`pip3 install discord.py aiohttp`
3. 确认 TUN 代理开启（端口 7897）
4. 运行：`python3 bot.py`

**注意**：Bot Token 和 API Key 是敏感信息，不要上传到公开仓库。

---

## 技术栈

- **discord.py** — Discord Bot 框架
- **aiohttp** — 异步 HTTP 请求 DeepSeek API
- **threading** — 每个 bot 独立线程 + 独立 event loop
- **DeepSeek Chat API** — 对话生成模型

---

*Created by CatDesk | 多角色口语练习 Bot*
