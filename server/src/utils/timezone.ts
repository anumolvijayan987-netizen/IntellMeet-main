/**
 * Timezone conversion and formatting utilities for IntellMeet
 */

// Supported timezones with UTC minute offsets
export const TIMEZONE_OFFSETS: Record<string, number> = {
  'UTC': 0,
  'UTC+0': 0,
  'GMT': 0,
  'UTC-12': -720,
  'UTC-11': -660,
  'UTC-10': -600,
  'UTC-9': -540,
  'UTC-8': -480, // US Pacific
  'UTC-7': -420, // US Mountain
  'UTC-6': -360, // US Central
  'UTC-5': -300, // US Eastern
  'UTC-4': -240, // US Atlantic
  'UTC-3': -180,
  'UTC-2': -120,
  'UTC-1': -60,
  'UTC+1': 60,  // Central European
  'UTC+2': 120, // Eastern European
  'UTC+3': 180, // Moscow / Arabia
  'UTC+4': 240, // Dubai / Gulf
  'UTC+5': 300, // Pakistan
  'UTC+5:30': 330, // India Standard Time (IST)
  'UTC+6': 360, // Bangladesh
  'UTC+7': 420, // Indochina / Bangkok
  'UTC+8': 480, // Singapore / China / Perth
  'UTC+9': 540, // Japan / Korea
  'UTC+9:30': 570, // Adelaide
  'UTC+10': 600, // Sydney / Melbourne
  'UTC+11': 660,
  'UTC+12': 720, // New Zealand
  // Common named aliases
  'America/New_York': -300,
  'America/Los_Angeles': -480,
  'America/Chicago': -360,
  'Europe/London': 0,
  'Europe/Paris': 60,
  'Europe/Berlin': 60,
  'Asia/Kolkata': 330,
  'Asia/Calcutta': 330,
  'Asia/Tokyo': 540,
  'Asia/Singapore': 480,
  'Australia/Sydney': 600,
}

/**
 * Extracts offset in minutes from a timezone string like 'UTC-5', 'UTC+5:30', or 'America/New_York'
 */
export function parseTimezoneOffsetMinutes(tzString = 'UTC'): number {
  if (TIMEZONE_OFFSETS[tzString] !== undefined) {
    return TIMEZONE_OFFSETS[tzString]
  }

  // Check pattern matching e.g. UTC-5, UTC+05:30, GMT+2
  const match = tzString.match(/(?:UTC|GMT)\s*([+-])\s*(\d{1,2})(?::(\d{2}))?/i)
  if (match) {
    const sign = match[1] === '-' ? -1 : 1
    const hours = parseInt(match[2], 10)
    const mins = match[3] ? parseInt(match[3], 10) : 0
    return sign * (hours * 60 + mins)
  }

  return 0
}

/**
 * Converts a local date string (YYYY-MM-DD), time string (HH:mm), and timezone string to a UTC Date object
 */
export function convertToUtcDate(dateStr: string, timeStr: string, tzString = 'UTC'): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split('-')
  const [hourStr, minStr] = timeStr.split(':')

  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10) - 1 // 0-indexed
  const day = parseInt(dayStr, 10)
  const hour = parseInt(hourStr || '0', 10)
  const minute = parseInt(minStr || '0', 10)

  // Get local timestamp as if it were UTC milliseconds
  const utcEquivalentMs = Date.UTC(year, month, day, hour, minute, 0, 0)

  // Subtract offset to get true UTC timestamp
  const offsetMinutes = parseTimezoneOffsetMinutes(tzString)
  const trueUtcMs = utcEquivalentMs - (offsetMinutes * 60 * 1000)

  return new Date(trueUtcMs)
}

/**
 * Formats a UTC date into a localized time string for a specific timezone
 */
export function formatInTimezone(utcDate: Date, tzString = 'UTC'): {
  dateString: string
  timeString: string
  formattedFull: string
} {
  const offsetMinutes = parseTimezoneOffsetMinutes(tzString)
  const localMs = utcDate.getTime() + (offsetMinutes * 60 * 1000)
  const localDate = new Date(localMs)

  const y = localDate.getUTCFullYear()
  const m = String(localDate.getUTCMonth() + 1).padStart(2, '0')
  const d = String(localDate.getUTCDate()).padStart(2, '0')
  const hours = localDate.getUTCHours()
  const mins = String(localDate.getUTCMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 === 0 ? 12 : hours % 12

  const dateString = `${y}-${m}-${d}`
  const timeString = `${displayHour}:${mins} ${ampm}`
  const formattedFull = `${dateString} at ${timeString} (${tzString})`

  return { dateString, timeString, formattedFull }
}
