# Routine 创建步骤

## 前置准备

**1. Repo 结构**

```
meee2-competitive-monitor/
├── CLAUDE.md          ← 反 bias 规则，Claude Code 自动读取
├── sources.json       ← 竞品数据源配置（你维护）
├── data/
│   ├── latest.json    ← 最新报告（Vercel build 读这个）
│   └── 2026-05-13.json
└── app/               ← Next.js 面板（读 data/latest.json）
```

在 GitHub 上创建这个 repo，先手动放一个空的 `data/latest.json`：

```json
{"report_date": null, "competitors": [], "alerts": [], "summary": {}}
```

**2. Vercel 连接**

Vercel 导入这个 repo，Framework 选 Next.js。
连接后每次 `git push main` 自动触发 build。

**3. GitHub 权限**

在 Routine 创建时需要勾选 **Allow unrestricted branch pushes**，
否则 Claude 只能 push 到 `claude/` 前缀的分支，面板不会更新。

---

## 创建 Routine

打开 [claude.ai/code/routines](https://claude.ai/code/routines) → **New routine**

### 基本信息

| 字段 | 填写内容 |
|------|---------|
| Name | `meee2-competitive-monitor` |
| Model | Claude Sonnet 4.5（够用，比 Opus 便宜） |

### Prompt

把 `routine-prompt.md` 的全部内容粘贴进去。

### Repositories

添加你的 GitHub repo（`your-username/meee2-competitive-monitor`）。

勾选 ✅ **Allow unrestricted branch pushes**（否则无法 push main）。

### Environment

选 **Default** environment，然后点击编辑，添加环境变量：

| 变量名 | 值 |
|--------|-----|
| `SLACK_WEBHOOK_URL` | 你的 Slack Incoming Webhook URL（可选） |

Network access 保持 **Trusted**（默认允许 GitHub API、常见网站）。

### Select a trigger

选 **Schedule** → **Daily**

时间选你想要的本地时间，建议早上（比如 08:00），这样工作前报告就准备好了。

### Connectors

默认会显示你 claude.ai 账户里已连接的 MCP connectors。
这个 Routine 不需要额外 connector，GitHub 访问通过 repo 克隆和 git push 完成。

可以把不需要的 connector 都移除，减少权限暴露。

### Create

点 **Create**。

---

## 验证

创建后立刻点 **Run now** 测试一次：

1. 进入 session 查看 Claude 的执行过程
2. 确认 `data/latest.json` 被成功 push
3. 确认 Vercel 检测到 push 并触发 build
4. 如果配置了 Slack，检查通知是否收到

---

## 使用限制

| 计划 | 每日 Routine 次数 |
|------|-----------------|
| Pro ($20/月) | 5 次/天 |
| Max ($100/月) | 15 次/天 |
| Max ($200/月) | 15 次/天 |
| Team / Enterprise | 25 次/天 |

竞品监控每天跑 1 次，Pro 计划完全够用。

---

## 日常使用

**手动触发**：在 [claude.ai/code/routines](https://claude.ai/code/routines) 点 **Run now**

**暂停**：在 Routine 详情页切换 **Repeats** 开关

**查看历史**：每次 run 都是独立 session，可以点进去看 Claude 的完整执行过程

**修改竞品**：直接编辑 repo 里的 `sources.json`，下次 run 自动生效

**修改分析逻辑**：编辑 Routine 的 prompt，或修改 `CLAUDE.md`

---

## 整体链路

```
claude.ai/code/routines
  └─ 每日 08:00 自动触发
       └─ Claude Code 云 session 启动
            ├─ git clone your-repo
            ├─ 读 CLAUDE.md（反 bias 规则）
            ├─ 读 sources.json（竞品列表）
            ├─ 读 data/latest.json（baseline）
            ├─ WebFetch 抓取各竞品 URL
            ├─ Diff 分析 + 生成 JSON
            ├─ git commit + push main
            │    └─ Vercel 检测 push → 自动 build → 面板更新
            └─ POST Slack webhook（如有高威胁 alert）
```

**成本**：
- Routine session：计入每日 5/15/25 次配额，不额外收费
- Token 消耗：算进你的计划 token 配额（18 个竞品 × 每日，约消耗中等量）
- Vercel：免费 tier 够用
- GitHub：免费
- 总额外费用：$0（包含在 Claude 订阅里）
