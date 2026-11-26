export function formatDue(due: number | undefined): string {
  if (!due) return '—'
  const diff = due - Date.now()
  if (diff <= 0) return '现在'
  const minutes = Math.round(diff / 60000)
  if (minutes < 60) return `${Math.max(1, minutes)} 分钟后`
  const hours = Math.round(diff / 3600000)
  if (hours < 24) return `${hours} 小时后`
  const days = Math.round(diff / 86400000)
  if (days < 30) return `${days} 天后`
  const months = Math.round(days / 30)
  if (months < 12) return `${months} 个月后`
  return `${Math.round(days / 365)} 年后`
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  if (minutes === 0) return `${seconds} 秒`
  return `${minutes} 分 ${String(seconds).padStart(2, '0')} 秒`
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0')
}
