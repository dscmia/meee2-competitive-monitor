import { notFound } from 'next/navigation'
import { getWeeklyDates, getWeeklySummary, getWeeklyAnalysis } from '../../data'
import { WeeklyClient } from '../../WeeklyClient'

// Static export — one pre-rendered page per natural week that has daily data.
export const dynamic = 'force-static'
export const revalidate = false

export function generateStaticParams() {
  return getWeeklyDates().map(week => ({ week }))
}

export default async function WeeklyPage({
  params,
}: {
  params: Promise<{ week: string }>
}) {
  const { week } = await params
  const weeks = getWeeklyDates()
  if (!weeks.includes(week)) notFound()

  const facts = getWeeklySummary(week)
  const analysis = getWeeklyAnalysis(week)
  return (
    <WeeklyClient
      facts={facts}
      analysis={analysis}
      weeks={weeks}
      currentWeek={week}
    />
  )
}
