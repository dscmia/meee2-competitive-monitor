# meee2 竞品监控 — Routine Prompt

## 你的任务

执行 meee2 竞品监控的完整 pipeline，将结果以 JSON 格式 commit 到这个 repo，触发 Vercel 重新 build 面板。

---

## STEP 0 — 读取 baseline

```bash
cat data/latest.json
```

如果文件不存在，baseline 视为空，所有竞品视为首次发现。

将每个竞品的 `content_hash` 记入工作记忆，用于后续快速 diff。

---

## STEP 1 — 读取数据源配置

```bash
cat sources.json
```

按 `threat` 字段排序处理（crit → hi → md → lo）。

---

## STEP 2 — 抓取 + Diff 分析

对 sources.json 中每个竞品，按顺序执行：

### 2a. 抓取

对每个竞品按以下三级策略依次尝试，任意一级成功即停止，记录实际使用的 URL。

**第一级 — 主 URL（`urls` 字段）**

用 WebFetch 依次尝试 `urls` 列表中的每个地址（优先顺序已在 sources.json 中排定）。

**各类数据源解析规则（按 URL 特征判断类型）：**

- **HN Algolia API**（URL 含 `hn.algolia.com`）：返回 JSON，提取 `hits[]` 每条的 `title`、`url`、`story_text`（前 300 字符）、`created_at`。标注「来源：HN 社区讨论，非官方」
- **RSS/Atom feed**（URL 含 `feed.xml`、`rss.xml`、`/feed/`、`/rss/`，或 `producthunt.com/feed`）：返回 XML，提取 `<item>` 或 `<entry>` 的 `<title>`、`<link>`、`<description>/<summary>` 和 `<pubDate>/<updated>`。Product Hunt feed 为官方发布内容
- **App Store Lookup API**（URL 含 `itunes.apple.com/lookup?bundleId`）：返回 JSON，提取 `results[0]` 的 `trackName`、`version`、`currentVersionReleaseDate`、`releaseNotes`（前 400 字符）。这是一手官方 release notes
- **普通网页**：提取正文文本，去掉导航栏、页脚等噪音

判断抓取是否成功：内容长度 > 200 字符 且 不是错误页（含 "403 Forbidden"、"Access Denied"、"Just a moment..." 等）。

只要有一个 URL 成功，即停止尝试，进入 2b。

**第二级 — Fallback URL（`fallback_urls` 字段，仅当第一级全部失败时）**

用 WebFetch 抓取 `fallback_urls`（均为 HN Algolia 备用查询），解析规则同上。

- 只要返回有效内容，即视为成功，进入 2b

**第三级 — WebSearch 兜底（仅当前两级均失败时）**

用 WebSearch 工具搜索 `websearch_query` 字段中的查询词。

- 取前 3 条结果的标题 + 摘要
- 只要返回任何结果，即视为成功，进入 2b
- 同样须在分析中标注「来源：WebSearch 结果，非官方原文」

**三级全部失败才标注 `fetch_status: "error"`。**

**并发策略：**
- `crit` / `hi` 竞品：逐个串行处理（确保分析质量）
- `md` / `lo` 竞品：同一批次内的所有 URL 可在同一轮并行 WebFetch，节省时间

### 2b. 快速 diff

**对 `new_entrant_watch` 类别（Product Hunt）：跳过此步，直接进入 2c。**  
原因：Product Hunt feed 每天内容完全不同，raw diff 无意义。

**对其他竞品：**

判断 `has_changes` 的标准因来源类型而异——

- **RSS feed 来源**：对比本次与 baseline 中的 `<title>` 列表。有新 title 出现 → `has_changes: true`
- **HN Algolia 来源**：对比 `watch_keywords` 在本次 `hits` 中的出现情况与 baseline。若出现了 baseline 中未出现的关键词组合，或有明显更高频率 → `has_changes: true`。仅仅是文章列表轮换（标题与 watch_keywords 无关）→ `has_changes: false`
- **普通网页 / App Store**：对比正文/版本号与 baseline。版本号变化或出现新功能描述 → `has_changes: true`

如果 `has_changes: false` → 标注 `no_change_reason`（一句话说明），跳过 2c

### 2c. 深度分析

**`new_entrant_watch` 类别（Product Hunt AI 新品雷达）：**

目标是检测今日上新的 AI 产品中是否有潜在新竞品。对每条 entry：
1. 用产品名称+描述与 meee2 差异化锚点（CLAUDE.md 规则 5）快速匹配
2. 若有 ≥2 个 `watch_keywords` 命中 → 记录到 `changes`，type 为 `new_entrant`，建议下次加入 sources.json
3. 无命中 → `has_changes: false`，`no_change_reason` 写「今日 PH AI 上新 X 款，无与 meee2 高度重叠者」

**其他竞品（仅 `has_changes: true` 时执行）：**

检查是否涉及该竞品的 `watch_keywords`，以及是否触碰 meee2 的差异化锚点（见 CLAUDE.md 规则 5）。

每条发现必须：
1. 先引原文（用引号，≤ 80 字）
2. 再写推断（明确标注"推断："）
3. 标明 source URL

---

## STEP 3 — 生成 JSON 报告

将分析结果组装为以下格式的 JSON，存为变量备用：

```json
{
  "report_date": "YYYY-MM-DD",
  "generated_at": "ISO8601",
  "summary": {
    "total_tracked": 14,
    "fetched_ok": 0,
    "fetch_error": 0,
    "has_changes": 0,
    "new_alerts": 0
  },
  "competitors": [
    {
      "id": "竞品id",
      "name": "竞品名",
      "category": "orchestrator|workspace|comms|peripheral|new_entrant_watch",
      "threat": "crit|hi|md|lo",
      "threat_changed": false,
      "has_changes": false,
      "fetch_status": "ok|error|skipped",
      "fetched_urls": ["https://..."],
      "raw_snapshot": "抓取内容前1500字符，用于下次diff",
      "content_hash": "raw_snapshot前200字符的特征串",
      "last_seen_at": "ISO8601",
      "changes": [
        {
          "type": "new_feature|pricing|positioning|hiring|other",
          "description": "一句话描述变化",
          "evidence": "「原文引用，≤80字」",
          "source_url": "https://...",
          "meee2_relevance": "触碰了哪条差异化锚点，或null",
          "threat_signal": true
        }
      ],
      "key_findings": ["核心发现1", "核心发现2"],
      "no_change_reason": null
    }
  ],
  "alerts": [
    {
      "competitor_id": "id",
      "competitor_name": "名称",
      "severity": "crit|hi",
      "headline": "一句话描述",
      "evidence": "「原文引用」",
      "action_suggestion": "建议 meee2 团队做什么"
    }
  ]
}
```

只有 `threat_signal: true` 的变化进入 `alerts`。`alerts` 只包含 crit 和 hi 级别。

---

## STEP 4 — 写入文件

```bash
DATE=$(date -u +%Y-%m-%d)

# 写入日期归档
cat > data/$DATE.json << 'REPORT'
[把完整 JSON 贴在这里]
REPORT

# 覆写 latest
cp data/$DATE.json data/latest.json

echo "文件写入完成：data/$DATE.json 和 data/latest.json"
```

---

## STEP 5 — Git commit + push（直接进 main，不开分支、不开 PR）

**重要：报告必须直接 commit 到 `main` 分支并 push。不要创建 `claude/*` 功能分支，不要开 Pull Request。** Vercel 监听的是 `main`，只有 push 到 main 才会触发面板重新 build。

如果 push 被拒绝（提示只能 push `claude/` 前缀分支），说明 Routine 配置里没勾选 **Allow unrestricted branch pushes** —— 这是配置问题，按 STEP 5 末尾的兜底逻辑把完整 JSON 打到终端，并在输出里提示需要去 Routine 设置里开启该选项。

```bash
# 确保在 main 上，且与远端同步（避免 push 冲突）
git checkout main
git pull --rebase origin main || true

git config user.email "routine@meee2.ai"
git config user.name "meee2 competitive monitor"

git add data/
git diff --staged --stat

git commit -m "chore: competitive report $(date -u +%Y-%m-%d)

$(cat data/latest.json | python3 -c "
import json,sys
r=json.load(sys.stdin)
print(f'tracked: {r[\"summary\"][\"total_tracked\"]}')
print(f'changes: {r[\"summary\"][\"has_changes\"]}')
print(f'alerts:  {r[\"summary\"][\"new_alerts\"]}')
")"

git push origin main
```

Push 成功后输出：
```
✅ 报告已 push，Vercel 将自动 build
   日期: YYYY-MM-DD
   有变化竞品: X 个
   触发 alerts: X 条
```

---

## STEP 6 — 发送 Slack 通知（如有高威胁 alert）

如果 `alerts` 数组非空，用 WebFetch POST 到 Slack webhook：

```
POST $SLACK_WEBHOOK_URL
Content-Type: application/json

{
  "text": "🔴 meee2 竞品预警 YYYY-MM-DD\n[竞品名] [headline]\n> [evidence]\n💡 [action_suggestion]"
}
```

环境变量 `SLACK_WEBHOOK_URL` 在 Routine 的 environment 配置里设置。
如果变量未设置，跳过此步骤，不报错。

---

## 执行约束

- 某个 URL 抓取失败 → 继续下一个，不中断整体流程
- lo 威胁竞品若时间不够可跳过，在 summary 中标注
- 永远不在 JSON 里编造未抓取到的内容
- git push 失败时，打印完整 JSON 到终端，方便手动处理
