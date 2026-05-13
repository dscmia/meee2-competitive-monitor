export type ThreatLevel = 'crit' | 'hi' | 'md' | 'lo'
export type FetchStatus = 'ok' | 'error' | 'skipped'
export type Category = 'orchestrator' | 'workspace' | 'comms' | 'peripheral'
export type ChangeType = 'new_feature' | 'pricing' | 'positioning' | 'hiring' | 'other'

export interface Change {
  type: ChangeType
  description: string
  evidence: string
  source_url: string
  meee2_relevance: string | null
  threat_signal: boolean
}

export interface Competitor {
  id: string
  name: string
  category: Category
  threat: ThreatLevel
  threat_changed: boolean
  has_changes: boolean
  fetch_status: FetchStatus
  fetched_urls: string[]
  raw_snapshot: string
  content_hash: string
  last_seen_at: string
  changes: Change[]
  key_findings: string[]
  no_change_reason: string | null
}

export interface Alert {
  competitor_id: string
  competitor_name: string
  severity: 'crit' | 'hi'
  headline: string
  evidence: string
  action_suggestion: string
}

export interface ReportSummary {
  total_tracked: number
  fetched_ok: number
  fetch_error: number
  has_changes: number
  new_alerts: number
}

export interface Report {
  report_date: string | null
  generated_at: string | null
  summary: ReportSummary
  competitors: Competitor[]
  alerts: Alert[]
}
