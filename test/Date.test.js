import { describe, test, expect, afterEach } from 'bun:test'
import {
	DAY,
	UNIT_MONTH,
	UNIT_WEEK,
	toZoned,
	age,
	timeline,
	interval,
	toHour,
	Time,
	now,
	labelsDay,
	labelsWeek,
	labelsMonth,
	labelsYear,
	parseDate,
	startOfToday,
	endOfToday,
	startOfWeek,
	endOfWeek,
	startOfMonth,
	endOfMonth,
	timeContext,
	formatRetention,
	expiresAt,
	timeLeft,
	timeAgo,
	formatDuration,
	durationInMS,
	formatISO,
} from '../lib/Date.js'

describe('toZoned', () => {
	test('round-trips epoch milliseconds', () => {
		expect(toZoned(1700000000000).epochMilliseconds).toBe(1700000000000)
	})

	test('throws on an invalid timestamp', () => {
		expect(() => toZoned(NaN)).toThrow()
	})
})

describe('age', () => {
	test('computes age in fractional years from year/month/day', () => {
		const currentYear = Temporal.Now.zonedDateTimeISO().year
		const result = age({ year: currentYear - 30, month: 1, day: 1 })
		expect(result).toBeGreaterThan(29)
		expect(result).toBeLessThan(31)
	})

	test('computes age from a timestamp', () => {
		const fortyYearsAgo = Date.now() - 40 * 365.25 * 24 * 3600 * 1000
		const result = age({ timestamp: fortyYearsAgo })
		expect(result).toBeGreaterThan(39)
		expect(result).toBeLessThan(41)
	})
})

describe('timeline', () => {
	test('returns one bucket per requested period, chronologically ordered', () => {
		const result = timeline(UNIT_MONTH, 3)
		expect(result.length).toBe(3)
		for (const bucket of result) expect(bucket.from).toBeLessThan(bucket.till)
		expect(result[0].till).toBeLessThan(result[1].from)
		expect(result[1].till).toBeLessThan(result[2].from)
	})
})

describe('interval', () => {
	test('spans from the first bucket start to the last bucket end', () => {
		const buckets = timeline(UNIT_WEEK, 2)
		const result = interval(UNIT_WEEK, 2)
		expect(result.from).toBeLessThanOrEqual(buckets[0].from)
		expect(result.till).toBeGreaterThanOrEqual(buckets[1].till)
	})
})

describe('toHour', () => {
	test('converts milliseconds to hours', () => {
		expect(toHour(5400000)).toBe(1.5)
	})
})

describe('now / Time.shift', () => {
	afterEach(() => {
		Time.shift = 0
	})

	test('returns the current time by default', () => {
		expect(Math.abs(now() - Date.now())).toBeLessThan(1000)
	})

	test('applies the configured shift', () => {
		Time.shift = 60000
		expect(Math.abs(now() - (Date.now() - 60000))).toBeLessThan(1000)
	})
})

describe('labelsDay / labelsWeek / labelsMonth / labelsYear', () => {
	test('return the requested number of labels', () => {
		expect(labelsDay(3).length).toBe(3)
		expect(labelsWeek(2).length).toBe(2)
		expect(labelsMonth(3).length).toBe(3)
		expect(labelsYear(2).length).toBe(2)
	})

	test('format each label kind as expected', () => {
		for (const label of labelsWeek(2)) expect(label.startsWith('W')).toBe(true)
		for (const label of labelsYear(2)) expect(/^\d{4}$/.test(label)).toBe(true)
	})
})

describe('parseDate', () => {
	test('parses full dates, year-months, and bare years', () => {
		expect(Number.isNaN(parseDate('2026-08-15'))).toBe(false)
		expect(Number.isNaN(parseDate('2026-08'))).toBe(false)
		expect(Number.isNaN(parseDate('2026'))).toBe(false)
	})

	test('returns NaN for missing or invalid input', () => {
		expect(Number.isNaN(parseDate(''))).toBe(true)
		expect(Number.isNaN(parseDate('not-a-date'))).toBe(true)
	})
})

describe('startOfToday / endOfToday', () => {
	test('span exactly one day', () => {
		expect(endOfToday() - startOfToday()).toBe(DAY - 1)
	})
})

describe('startOfWeek / endOfWeek', () => {
	test('span exactly seven days', () => {
		expect(endOfWeek() - startOfWeek()).toBe(7 * DAY - 1)
	})
})

describe('startOfMonth / endOfMonth', () => {
	test('span a plausible month length', () => {
		const span = endOfMonth() - startOfMonth()
		expect(span).toBeGreaterThanOrEqual(27 * DAY)
		expect(span).toBeLessThanOrEqual(31 * DAY)
	})
})

describe('timeContext', () => {
	test('returns a fully-shaped snapshot', () => {
		const ctx = timeContext()
		expect(typeof ctx.today_iso).toBe('string')
		expect(typeof ctx.timestamp_ms).toBe('number')
		expect(ctx.hour).toBeGreaterThanOrEqual(0)
		expect(ctx.hour).toBeLessThan(24)
		expect(typeof ctx.isWeekend).toBe('boolean')
	})
})

describe('formatRetention', () => {
	test('renders a duration as a human phrase', () => {
		expect(formatRetention('P30D')).toBe('30 days')
		expect(formatRetention('P1D')).toBe('1 day')
	})

	test('returns a placeholder for missing input', () => {
		expect(formatRetention(null)).toBe('—')
	})
})

describe('expiresAt', () => {
	test('adds the retention duration to the start time', () => {
		const start = new Date().toISOString()
		const result = expiresAt(start, 'PT1H')
		const diffMs =
			Temporal.Instant.from(result).epochMilliseconds -
			Temporal.Instant.from(start).epochMilliseconds
		expect(diffMs).toBe(3600000)
	})

	test('returns a placeholder when arguments are missing', () => {
		expect(expiresAt(null, 'PT1H')).toBe('—')
	})
})

describe('timeLeft', () => {
	test('counts down when not yet expired', () => {
		const start = new Date().toISOString()
		expect(timeLeft(start, 'PT2H')).toContain('left')
	})

	test('reports Expired once the retention has passed', () => {
		const longAgo = new Date(Date.now() - 10 * DAY).toISOString()
		expect(timeLeft(longAgo, 'PT1H')).toBe('Expired')
	})
})

describe('timeAgo', () => {
	test('formats elapsed time', () => {
		const ninetyMinutesAgo = new Date(Date.now() - 90 * 60 * 1000).toISOString()
		expect(timeAgo(ninetyMinutesAgo)).toBe('1h 30m ago')
	})

	test('returns a placeholder for missing input', () => {
		expect(timeAgo(null)).toBe('—')
	})
})

describe('formatDuration', () => {
	test('formats an hour-long span', () => {
		const start = new Date().toISOString()
		const end = new Date(Date.now() + 3600000).toISOString()
		expect(formatDuration(start, end)).toBe('1h')
	})

	test('returns a placeholder when arguments are missing', () => {
		expect(formatDuration(null, null)).toBe('—')
	})
})

describe('durationInMS', () => {
	test('computes the millisecond difference', () => {
		const start = new Date().toISOString()
		const end = new Date(Date.now() + 5000).toISOString()
		expect(durationInMS(start, end)).toBe(5000)
	})

	test('caps at maxDuration', () => {
		const start = new Date().toISOString()
		const end = new Date(Date.now() + 5000).toISOString()
		expect(durationInMS(start, end, 1000)).toBe(1000)
	})
})

describe('formatISO', () => {
	test('formats as "yyyy-MM-dd HH:mm:ss"', () => {
		expect(formatISO(new Date().toISOString())).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
	})

	test('throws on an unparseable instant', () => {
		expect(() => formatISO('not-an-iso-string')).toThrow()
	})
})
