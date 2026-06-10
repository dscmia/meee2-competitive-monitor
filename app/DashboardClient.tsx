'use client'

import { useState } from 'react'
import type { Report, Competitor } from './types'
import { Sidebar } from './Sidebar'
import { Detail } from './Detail'
import { AlertsBanner } from './AlertsBanner'
import styles from './dashboard.module.css'

interface Props {
  report: Report
  historyDates: string[]
  // present when viewing an archived report under /history/<date>
  currentDate?: string
}

export function DashboardClient({ report, historyDates, currentDate }: Props) {
  const [activeId, setActiveId] = useState<string | null>(
    report.competitors[0]?.id ?? null
  )

  const active: Competitor | null =
    report.competitors.find(c => c.id === activeId) ?? null

  const hasAlerts = report.alerts.length > 0
  const reportDate = report.report_date ?? '—'
  const generatedAt = report.generated_at
    ? new Date(report.generated_at).toLocaleString('zh-CN', {
        month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—'

  return (
    <div className={styles.shell}>
      {/* topbar */}
      <header className={styles.topbar}>
        <div className={styles.topLeft}>
          <div className={styles.brand}>
            meee<span className={styles.brandAccent}>2</span>
            <span className={styles.brandSep}>·</span>
            <span className={styles.brandSub}>竞品情报</span>
          </div>
          <div className={styles.topDate}>{reportDate} · {generatedAt}</div>
        </div>
        <div className={styles.topRight}>
          {historyDates.length > 0 && (
            <select
              className={styles.historySelect}
              value={currentDate ?? 'latest'}
              onChange={e => {
                const v = e.target.value
                window.location.href = v === 'latest' ? '/' : `/history/${v}`
              }}
            >
              <option value="latest">
                最新{historyDates[0] ? ` · ${historyDates[0]}` : ''}
              </option>
              {historyDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
          <div className={styles.statsChips}>
            <span className={styles.chip}>
              <span className={styles.chipN}>{report.summary.total_tracked}</span> 跟踪
            </span>
            <span className={`${styles.chip} ${report.summary.new_alerts > 0 ? styles.chipAlert : ''}`}>
              <span className={styles.chipN}>{report.summary.new_alerts}</span> alerts
            </span>
            <span className={styles.chip}>
              <span className={styles.chipN}>{report.summary.has_changes}</span> 变化
            </span>
          </div>
        </div>
      </header>

      {/* alerts banner */}
      {hasAlerts && <AlertsBanner alerts={report.alerts} />}

      {/* body */}
      <div className={styles.body}>
        <Sidebar
          competitors={report.competitors}
          summary={report.summary}
          activeId={activeId}
          onSelect={setActiveId}
        />
        <main className={styles.main}>
          <div className={styles.detailTopbar}>
            <span className={styles.detailHint}>
              {active ? active.name : '← 选择竞品查看详情'}
            </span>
          </div>
          <Detail competitor={active} />
        </main>
      </div>
    </div>
  )
}
