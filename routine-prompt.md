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

### 2a. 抓取（两阶段策略）

**阶段 1 — WebFetch 直接抓取**

用 WebFetch 工具抓取该竞品的每个 source URL（无需任何代理前缀）。

并发策略：
- `crit` / `hi` 竞品：逐个串行处理（确保分析质量）
- `md` / `lo` 竞品：同一批次内的所有 URL 可在同一轮并行 WebFetch，节省时间

抓取规则：提取正文文本，去掉导航栏、页脚等噪音，记录抓取时间。

**阶段 2 — WebSearch 兜底（当阶段 1 所有 URL 均返回 403/404/timeout 时自动触发）**

用 WebSearch 工具，对该竞品执行 sources.json 中的 `fallback_search` 查询（若无该字段则自行构造：`[竞品名] changelog new features [当前年份]`）。

从搜索结果摘要提取有效内容时：
- 只记录搜索结果中明确描述的产品变化，不得填充联想
- `fetch_status` 记为 `"search"`（区别于直接抓取的 `"ok"`）
- `fetched_urls` 填入实际搜索结果来源 URL（非搜索引擎主页）
- 每条 `evidence` 须注明内容来自搜索摘要

**失败处理：** 两阶段均无有效内容 → `fetch_status: "error"`，不得推测。

### 2b. 快速 diff

计算本次抓取内容与 baseline 中该竞品 `raw_snapshot` 的差异：
- 如果内容基本相同（关键词无变化）→ 标注 `has_changes: false`，跳过深度分析
- 如果有变化 → 进入 2c

### 2c. 深度分析（仅有变化时）

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
    "total_tracked": 18,
    "fetched_ok": 0,
    "fetch_error": 0,
    "has_changes": 0,
    "new_alerts": 0
  },
  "competitors": [
    {
      "id": "竞品id",
      "name": "竞品名",
      "category": "orchestrator|workspace|comms|peripheral",
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

## STEP 5 — Git commit + push

```bash
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
