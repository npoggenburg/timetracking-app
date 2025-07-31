/**
 * Rounds decimal hours up to the nearest 15-minute increment
 * @param decimalHours - Hours in decimal format (e.g., 2.5 for 2h30m)
 * @returns Rounded decimal hours
 */
export function roundToNearestQuarterHour(decimalHours: number): number {
  const totalMinutes = decimalHours * 60
  const roundedMinutes = Math.ceil(totalMinutes / 15) * 15
  return roundedMinutes / 60
}

/**
 * Formats decimal hours back to display format (e.g., 2.5 -> "2h30m")
 * @param decimalHours - Hours in decimal format
 * @returns Formatted string (e.g., "2h30m")
 */
export function formatDecimalHours(decimalHours: number): string {
  const hours = Math.floor(decimalHours)
  const minutes = Math.round((decimalHours - hours) * 60)
  
  if (hours === 0 && minutes === 0) {
    return '0h'
  }
  
  let result = ''
  if (hours > 0) {
    result += `${hours}h`
  }
  if (minutes > 0) {
    result += `${minutes}m`
  }
  
  return result
}