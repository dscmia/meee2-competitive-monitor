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

// ── Weekly summary ──
// Fact layer — computed deterministically at build time from daily reports.
export interface WeeklyCompetitorChange {
  id: string
  name: string
  threat: ThreatLevel
  dates: string[]   // days within the week this competitor had changes
  headline: string  // representative key_finding / change description
}

export interface WeeklyAlertRef {
  date: string      // the day this alert first fired
  alert: Alert
}

export interface ThreatMovement {
  competitor_id: string
  competitor_name: string
  from: ThreatLevel | null  // null when only a threat_changed flag was seen
  to: ThreatLevel
  dates: string[]
}

export interface WeeklyFacts {
  week_start: string          // Monday, YYYY-MM-DD
  week_end: string            // Sunday, YYYY-MM-DD
  days_covered: string[]      // daily reports that actually exist this week
  competitors_changed: WeeklyCompetitorChange[]
  alerts: WeeklyAlertRef[]
  threat_movements: ThreatMovement[]
  change_count: number
  alert_count: number
}

// Analysis layer — written by the weekly routine (AI), grounded only in the
// daily JSONs above. Stored at data/weekly/<sunday>.json.
export interface WeeklyRecommendation {
  headline: string
  detail: string
  priority: 'hi' | 'md' | 'lo'
  basis?: string  // which competitor/alert/date this is grounded in
}

export interface WeeklyAnalysis {
  week_start: string
  week_end: string
  generated_at: string
  narrative: string
  recommendations: WeeklyRecommendation[]
}
