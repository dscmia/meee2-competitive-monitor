'use client'

import { useState } from 'react'
import type { Alert } from './types'
import styles from './AlertsBanner.module.css'

const EMOJI = { crit: '🔴', hi: '🟠' } as const

export function AlertsBanner({ alerts }: { alerts: Alert[] }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className={styles.banner}>
      <div className={styles.bannerInner}>
        <div className={styles.bannerLeft}>
          <span className={styles.bannerLabel}>
            {alerts.length} 条 alerts
          </span>
          <div className={styles.alertList}>
            {alerts.map((a, i) => (
              <div key={i} className={styles.alert}>
                <span>{EMOJI[a.severity]}</span>
                <span className={styles.alertName}>{a.competitor_name}</span>
                <span className={styles.alertHeadline}>{a.headline}</span>
              </div>
            ))}
          </div>
        </div>
        <button
          className={styles.dismiss}
          onClick={() => setDismissed(true)}
          aria-label="关闭"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
