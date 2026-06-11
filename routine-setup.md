# Routine 创建步骤

## 前置准备

**1. Repo 结构**

```
meee2-competitive-monitor/
├── CLAUDE.md                  ← 反 bias 规则，Claude Code 自动读取
├── sources.json               ← 竞品数据源配置（你维护）
├── routine-prompt.md          ← 每日 routine 的 prompt
├── weekly-routine-prompt.md   ← 每周综述 routine 的 prompt
├── data/
│   ├── latest.json            ← 最新日报（Vercel build 读这个）
│   ├── 2026-05-13.json        ← 每日归档
│   └── weekly/
│       └── 2026-05-24.json    ← 每周 AI 综述（周日为 key）
└── app/                       ← Next.js 面板（日报 + 周报页）
```

面板有两个视图：
- `/` 日报 —— 读 `data/latest.json`，顶部可切到「周报 →」和历史日报 dropdown
- `/weekly/<周日>` 周报 —— 上半「本周事实」由代码从日报**确定性聚合**，下半「分析师视角」读 `data/weekly/<周日>.json` 的 AI 综述（没有时优雅显示"待生成"）

在 GitHub 上创建这个 repo，先手动放一个空的 `data/latest.json`：

```json
{"report_date": null, "competitors": [], "alerts": [], "summary": {}}
```

**2. Vercel 连接**

Vercel 导入这个 repo，Framework 选 Next.js。
连接后每次 `git push main` 自动触发 build。

**3. GitHub 权限（关键）**

在 Routine 创建/编辑页必须勾选 ✅ **Allow unrestricted branch pushes**。

不勾选时，云端 session 只能 push 到 `claude/` 前缀的分支（并开 PR），
报告永远到不了 `main`，Vercel 也就不会 rebuild —— 这正是之前所有报告
都堆在 `claude/*` 分支上的原因。勾上后，`routine-prompt.md` STEP 5 的
`git push origin main` 才能真正生效，报告直接落到 main，Vercel 自动更新。

> 已经存在的一堆 `claude/*` 历史分支可以安全删除（它们的内容已通过
> PR 合并进 main）：
> ```bash
> git fetch --prune origin
> git branch -r | grep 'origin/claude/' | sed 's# *origin/##' \
>   | xargs -I{} git push origin --delete {}
> ```

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

## 创建每周综述 Routine（第二个，独立）

每周综述是**独立的第二个 routine**，不与每日 routine 共用 —— 触发时间即语义、失败互不拖累、prompt 干净。

再开一个 **New routine**，大部分配置同上，只改这几项：

| 字段 | 填写内容 |
|------|---------|
| Name | `meee2-weekly-review` |
| Prompt | 粘贴 `weekly-routine-prompt.md` 的全部内容 |
| Repositories | 同一个 repo，**同样勾选 ✅ Allow unrestricted branch pushes** |
| Trigger | **Schedule → Weekly → 周一 08:00**（总结刚过完的自然周） |

> **为什么排周一早上**：`weekly-routine-prompt.md` 的 STEP 0 会自动取"最近一个已结束的自然周（周一–周日）"。周一跑，总结的正好是上一周。它是幂等的——同一周重复跑不会重复写。

这个 routine **完全不抓网络**，只读 `data/` 里的日报 JSON 重组成综述，所以 token 消耗很低。

> ⚠️ 两个 routine 各占每日配额里的一次 run。每日 ×7 + 每周 ×1 = 一周 8 次，Pro 计划（5 次/天）完全够。

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
  ├─ [每日 routine] 每天 08:00
  │    └─ Claude Code 云 session
  │         ├─ git clone your-repo
  │         ├─ 读 CLAUDE.md（反 bias 规则）
  │         ├─ 读 sources.json（竞品列表）
  │         ├─ 读 data/latest.json（baseline）
  │         ├─ WebFetch 抓取各竞品 URL
  │         ├─ Diff 分析 + 生成 JSON
  │         ├─ git commit + push main → Vercel 自动 build
  │         └─ POST Slack webhook（如有高威胁 alert）
  │
  └─ [每周 routine] 周一 08:00
       └─ Claude Code 云 session（不抓网络）
            ├─ 读上一自然周的 7 份 data/<date>.json
            ├─ 心算事实层 + 写 AI 综述 + 建议
            ├─ 写 data/weekly/<周日>.json
            ├─ git commit + push main → Vercel 自动 build
            └─ POST Slack webhook（如有高优建议）

页面侧：
  /                  日报（latest.json）
  /history/<date>    历史日报
  /weekly/<周日>      周报 = 代码算的「事实」+ AI 写的「分析师视角」
```

**成本**：
- Routine session：计入每日 5/15/25 次配额，不额外收费
- Token 消耗：算进你的计划 token 配额（18 个竞品 × 每日，约消耗中等量）
- Vercel：免费 tier 够用
- GitHub：免费
- 总额外费用：$0（包含在 Claude 订阅里）
