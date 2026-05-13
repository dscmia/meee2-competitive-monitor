# meee2 competitive monitor

Claude Code Routine 每天自动抓取竞品动态，生成 JSON 报告并 push 到 repo，触发 Vercel 更新面板。

## 文件结构

```
├── CLAUDE.md              ← 分析规则（反 bias、威胁等级、meee2 差异化锚点）
├── routine-prompt.md      ← 粘贴到 claude.ai/code/routines 的执行 prompt
├── routine-setup.md       ← Routine 创建操作手册
├── sources.json           ← 竞品数据源配置（你来维护）
└── data/
    ├── latest.json        ← 最新报告（Vercel build 读这个）
    └── YYYY-MM-DD.json    ← 按日期归档
```

## 开始使用

参考 `routine-setup.md`。