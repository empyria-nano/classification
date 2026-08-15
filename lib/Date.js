import ms from 'ms'

/** One day, in milliseconds. */
export const DAY = ms('1d')
/** One year, in milliseconds. */
export const YEAR = ms('1y')

export const UNIT_YEAR = 'year'
export const UNIT_QUARTER = 'quarter'
export const UNIT_MONTH = 'month'
export const UNIT_WEEK = 'week'
export const UNIT_DAY = 'day'

/** Number of `timeline`/`interval` steps typically shown per unit, keyed by {@link UNIT_YEAR} etc. */
export const DATE_UNIT_COUNTER = {
	[UNIT_YEAR]: 2,
	[UNIT_QUARTER]: 4,
	[UNIT_MONTH]: 3,
	[UNIT_WEEK]: 4,
	[UNIT_DAY]: 7,
}

/** All supported date units, from largest to smallest. */
export const DATE_UNIT_LIST = [UNIT_YEAR, UNIT_QUARTER, UNIT_MONTH, UNIT_WEEK, UNIT_DAY]

/** Display prefix prepended to a formatted period label, keyed by unit. */
export const DATE_PREFIXES = {
	[UNIT_YEAR]: '',
	[UNIT_QUARTER]: 'Q',
	[UNIT_MONTH]: '',
	[UNIT_WEEK]: 'W',
	[UNIT_DAY]: '',
}

/**
 * @deprecated Unused since the Luxon → Temporal migration (Temporal has no format-token
 * mini-language; {@link timeline} formats via `Intl`/`ZonedDateTime#toLocaleString` internally
 * now). Kept only so existing imports of this constant don't break.
 */
export const DATE_FORMATS = {
	[UNIT_YEAR]: 'y',
	[UNIT_QUARTER]: 'q y',
	[UNIT_MONTH]: 'LLL yy',
	[UNIT_WEEK]: 'WW y',
	[UNIT_DAY]: 'D',
}

/** Step added to a period's start to reach the start of the next period, keyed by unit. */
const UNIT_STEP = {
	[UNIT_YEAR]: { years: 1 },
	[UNIT_QUARTER]: { months: 3 },
	[UNIT_MONTH]: { months: 1 },
	[UNIT_WEEK]: { weeks: 1 },
	[UNIT_DAY]: { days: 1 },
}

const quarterStartMonth = (month) => Math.floor((month - 1) / 3) * 3 + 1
const quarterOf = (zdt) => Math.ceil(zdt.month / 3)

/**
 * Converts a millisecond timestamp into a {@link Temporal.ZonedDateTime} in the system's
 * current time zone. Used throughout this module as the entry point from plain epoch millis.
 * @param {number} timestamp - Milliseconds since epoch.
 * @returns {Temporal.ZonedDateTime} Zoned date-time in the system time zone.
 */
export function toZoned(timestamp) {
	return Temporal.Instant.fromEpochMilliseconds(timestamp).toZonedDateTimeISO(
		Temporal.Now.timeZoneId(),
	)
}

/**
 * Start of the period (year/quarter/month/week/day) containing `zdt`.
 * @param {Temporal.ZonedDateTime} zdt - Reference date-time.
 * @param {string} unit - One of {@link UNIT_YEAR}, {@link UNIT_QUARTER}, {@link UNIT_MONTH}, {@link UNIT_WEEK}, {@link UNIT_DAY}.
 * @returns {Temporal.ZonedDateTime} Start of that period, at midnight.
 */
function startOfUnit(zdt, unit) {
	switch (unit) {
		case UNIT_YEAR:
			return zdt.with({ month: 1, day: 1 }).startOfDay()
		case UNIT_QUARTER:
			return zdt.with({ month: quarterStartMonth(zdt.month), day: 1 }).startOfDay()
		case UNIT_MONTH:
			return zdt.with({ day: 1 }).startOfDay()
		case UNIT_WEEK:
			return zdt.subtract({ days: zdt.dayOfWeek - 1 }).startOfDay()
		default:
			return zdt.startOfDay()
	}
}

/**
 * End of the period (year/quarter/month/week/day) containing `zdt`, one nanosecond
 * before the next period starts.
 * @param {Temporal.ZonedDateTime} zdt - Reference date-time.
 * @param {string} unit - One of {@link UNIT_YEAR}, {@link UNIT_QUARTER}, {@link UNIT_MONTH}, {@link UNIT_WEEK}, {@link UNIT_DAY}.
 * @returns {Temporal.ZonedDateTime} End of that period.
 */
function endOfUnit(zdt, unit) {
	return startOfUnit(zdt, unit).add(UNIT_STEP[unit]).subtract({ nanoseconds: 1 })
}

/**
 * Renders a date-time as a period label, matching the granularity of `unit`.
 * @param {Temporal.ZonedDateTime} zdt - Reference date-time.
 * @param {string} unit - One of {@link UNIT_YEAR}, {@link UNIT_QUARTER}, {@link UNIT_MONTH}, {@link UNIT_WEEK}, {@link UNIT_DAY}.
 * @returns {string} Label such as `"2026"`, `"3 2026"`, `"Aug 26"`, `"33 2026"`, or a localized short date.
 */
function formatUnit(zdt, unit) {
	switch (unit) {
		case UNIT_YEAR:
			return String(zdt.year)
		case UNIT_QUARTER:
			return `${quarterOf(zdt)} ${zdt.year}`
		case UNIT_MONTH:
			return `${zdt.toLocaleString(undefined, { month: 'short' })} ${String(zdt.year).slice(-2)}`
		case UNIT_WEEK:
			return `${String(zdt.weekOfYear).padStart(2, '0')} ${zdt.year}`
		default:
			return zdt.toLocaleString(undefined, {
				year: 'numeric',
				month: 'numeric',
				day: 'numeric',
			})
	}
}

/**
 * Computes an age in years, either from a birth timestamp or a birth date's parts.
 * @param {Object} params
 * @param {number} [params.timestamp] - Birth date as milliseconds since epoch. Takes
 *   precedence over `year`/`month`/`day` when given.
 * @param {number} [params.year] - Birth year, used when `timestamp` is not given.
 * @param {number} [params.month=1] - Birth month (1-12).
 * @param {number} [params.day=1] - Birth day of month.
 * @returns {number} Age in years (fractional).
 */
export function age({ timestamp, year, month = 1, day = 1 }) {
	const target = timestamp
		? toZoned(timestamp)
		: Temporal.Now.zonedDateTimeISO().with({ year, month, day })
	const nowZdt = Temporal.Now.zonedDateTimeISO()
	const years = target
		.until(nowZdt, { largestUnit: 'years' })
		.total({ unit: 'years', relativeTo: target })
	return Math.abs(years)
}

/**
 * Builds a chronological list of period buckets ending at the current unit,
 * e.g. the last `count` months.
 * @param {string} unit - One of {@link UNIT_YEAR}, {@link UNIT_QUARTER}, {@link UNIT_MONTH}, {@link UNIT_WEEK}, {@link UNIT_DAY}.
 * @param {number} count - Number of periods to include.
 * @returns {Array<{name: string, from: number, till: number}>} Periods in chronological order (oldest first).
 */
export function timeline(unit, count) {
	const res = []

	const start = unit === UNIT_DAY ? 1 : 0
	const end = unit === UNIT_DAY ? count + 1 : count
	for (let i = start; i < end; ++i) {
		const time = Temporal.Now.zonedDateTimeISO().subtract({ [`${unit}s`]: i })
		res.push({
			name: DATE_PREFIXES[unit] + formatUnit(time, unit),
			from: startOfUnit(time, unit).epochMilliseconds,
			till: endOfUnit(time, unit).epochMilliseconds,
		})
	}

	return res.reverse()
}

/**
 * Computes the overall `[from, till]` bounds spanned by `count` periods of `unit`.
 * @param {string} unit - One of {@link UNIT_YEAR}, {@link UNIT_QUARTER}, {@link UNIT_MONTH}, {@link UNIT_WEEK}, {@link UNIT_DAY}.
 * @param {number} count - Number of periods to span.
 * @returns {{from: number, till: number}} Milliseconds-since-epoch bounds.
 */
export function interval(unit, count) {
	const _tl = timeline(unit, count)
	return {
		from: _tl[0].from,
		till: _tl[_tl.length - 1].till,
	}
}

/**
 * Converts a millisecond duration to hours, rounded to 2 decimal places.
 * @param {number} value - Duration in milliseconds.
 * @returns {number} Duration in hours.
 */
export function toHour(value) {
	return Math.round((value / ms('1h')) * 100) / 100
}

/** Mutable clock offset (ms) subtracted by {@link now}; lets tests simulate a shifted "current time". */
export const Time = {
	shift: 0,
}

/**
 * Current time, adjusted by {@link Time.shift}.
 * @returns {number} Milliseconds since epoch.
 */
export function now() {
	return Date.now() - Time.shift
}

/**
 * Builds weekday-name labels for each of the last `scale` days.
 * @param {number} scale - Number of days to label.
 * @returns {Array<string>} Weekday names, oldest first.
 */
export function labelsDay(scale) {
	let labels = []
	for (let i = scale; i > 0; --i)
		labels.push(
			Temporal.Now.zonedDateTimeISO()
				.subtract({ days: i })
				.toLocaleString(undefined, { weekday: 'long' }),
		)
	return labels
}
/**
 * Builds ISO week-number labels (e.g. `"W32"`) for each of the last `scale` weeks.
 * @param {number} scale - Number of weeks to label.
 * @returns {Array<string>} Week labels, oldest first.
 */
export function labelsWeek(scale) {
	let labels = []
	for (let i = scale; i > 0; --i)
		labels.push('W' + Temporal.Now.zonedDateTimeISO().subtract({ weeks: i }).weekOfYear)
	return labels
}
/**
 * Builds month-name labels for each of the last `scale` months.
 * @param {number} scale - Number of months to label.
 * @returns {Array<string>} Month names, oldest first.
 */
export function labelsMonth(scale) {
	let labels = []
	for (let i = scale; i > 0; --i)
		labels.push(
			Temporal.Now.zonedDateTimeISO()
				.subtract({ months: i })
				.toLocaleString(undefined, { month: 'long' }),
		)
	return labels
}
/**
 * Builds year labels for each of the last `scale` years.
 * @param {number} scale - Number of years to label.
 * @returns {Array<string>} Year labels, oldest first.
 */
export function labelsYear(scale) {
	let labels = []
	for (let i = scale; i > 0; --i)
		labels.push(String(Temporal.Now.zonedDateTimeISO().subtract({ years: i }).year))
	return labels
}

/**
 * Parses a date string, trying `yyyy-MM-dd`, then `yyyy-MM`, then `yyyy`.
 * Interpreted in the system time zone at midnight.
 * @param {string} date - Date string to parse.
 * @returns {number} Milliseconds since epoch, or `NaN` if `date` is falsy or unparseable.
 */
export function parseDate(date) {
	if (!date) return NaN

	const tz = Temporal.Now.timeZoneId()

	try {
		return Temporal.PlainDate.from(date).toZonedDateTime(tz).epochMilliseconds
	} catch {}
	try {
		return Temporal.PlainYearMonth.from(date).toPlainDate({ day: 1 }).toZonedDateTime(tz)
			.epochMilliseconds
	} catch {}
	if (/^\d{4}$/.test(date)) {
		return Temporal.PlainDate.from({ year: Number(date), month: 1, day: 1 }).toZonedDateTime(tz)
			.epochMilliseconds
	}

	return NaN
}

/**
 * Start of the current day.
 * @returns {number} Milliseconds since epoch.
 */
export function startOfToday() {
	return startOfUnit(Temporal.Now.zonedDateTimeISO(), UNIT_DAY).epochMilliseconds
}

/**
 * End of the current day.
 * @returns {number} Milliseconds since epoch.
 */
export function endOfToday() {
	return endOfUnit(Temporal.Now.zonedDateTimeISO(), UNIT_DAY).epochMilliseconds
}

/**
 * Start of the current week.
 * @returns {number} Milliseconds since epoch.
 */
export function startOfWeek() {
	return startOfUnit(Temporal.Now.zonedDateTimeISO(), UNIT_WEEK).epochMilliseconds
}

/**
 * End of the current week.
 * @returns {number} Milliseconds since epoch.
 */
export function endOfWeek() {
	return endOfUnit(Temporal.Now.zonedDateTimeISO(), UNIT_WEEK).epochMilliseconds
}

/**
 * Start of the current month.
 * @returns {number} Milliseconds since epoch.
 */
export function startOfMonth() {
	return startOfUnit(Temporal.Now.zonedDateTimeISO(), UNIT_MONTH).epochMilliseconds
}

/**
 * End of the current month.
 * @returns {number} Milliseconds since epoch.
 */
export function endOfMonth() {
	return endOfUnit(Temporal.Now.zonedDateTimeISO(), UNIT_MONTH).epochMilliseconds
}

/**
 * Snapshots the current date/time broken out into commonly-needed fields.
 * @returns {{today_iso: string, today_ms: number, timestamp_iso: string, timestamp_ms: number,
 *   year: number, quarter: number, month: number, week: number, day: number, hour: number,
 *   minute: number, second: number, millisecond: number, weekday: number, isWeekend: boolean}}
 */
export function timeContext() {
	const dt = Temporal.Now.zonedDateTimeISO()
	return {
		today_iso: dt.toPlainDate().toString(),
		today_ms: startOfUnit(dt, UNIT_DAY).epochMilliseconds,
		timestamp_iso: dt.toString({ timeZoneName: 'never' }),
		timestamp_ms: dt.epochMilliseconds,
		year: dt.year,
		quarter: quarterOf(dt),
		month: dt.month,
		week: dt.weekOfYear,
		day: dt.day,
		hour: dt.hour,
		minute: dt.minute,
		second: dt.second,
		millisecond: dt.millisecond,
		weekday: dt.day,
		isWeekend: dt.dayOfWeek === 6 || dt.dayOfWeek === 7,
	}
}

const DURATION_UNITS = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds']

/**
 * Renders a Temporal.Duration's non-zero fields as a comma-separated, pluralized phrase
 * (e.g. `"2 days, 3 hours"`), mirroring Luxon's `rescale().toHuman()`.
 * @param {Temporal.Duration} duration - Duration to render.
 * @returns {string} Human-readable phrase, or `"0 seconds"` if empty.
 */
function humanizeDuration(duration) {
	const parts = DURATION_UNITS.map((unit) => [unit, duration[unit]])
		.filter(([, value]) => value)
		.map(([unit, value]) => `${value} ${value === 1 ? unit.slice(0, -1) : unit}`)
	return parts.length > 0 ? parts.join(', ') : '0 seconds'
}

/**
 * Formats an ISO-8601 duration string as a human-readable phrase (e.g. `"2 days"`).
 * @param {string} iso - ISO-8601 duration string.
 * @returns {string} Human-readable duration, or `'—'` if `iso` is falsy.
 */
export const formatRetention = (iso) => {
	if (!iso) return '—'
	return humanizeDuration(Temporal.Duration.from(iso))
}

/**
 * Computes the ISO timestamp at which a retention period expires.
 * @param {string} completedAt - ISO-8601 instant (must include `Z` or a UTC offset) the retention period starts from.
 * @param {string} retention - ISO-8601 duration to add.
 * @returns {string} ISO-8601 expiry timestamp, or `'—'` if either argument is falsy.
 */
export const expiresAt = (completedAt, retention) => {
	if (!completedAt || !retention) return '—'

	const tz = Temporal.Now.timeZoneId()
	return Temporal.Instant.from(completedAt)
		.toZonedDateTimeISO(tz)
		.add(Temporal.Duration.from(retention))
		.toString({ timeZoneName: 'never' })
}

/**
 * Formats the time remaining until a retention period expires.
 * @param {string} completedAt - ISO-8601 instant (must include `Z` or a UTC offset) the retention period starts from.
 * @param {string} retention - ISO-8601 duration.
 * @param {Object} [options={}]
 * @param {boolean} [options.clean] - Omit the trailing `"left"` suffix.
 * @returns {string} Formatted countdown (e.g. `"1d 2h left"`), `'Expired'`, or `'—'` if inputs are missing.
 */
export const timeLeft = (completedAt, retention, options = {}) => {
	if (!completedAt || !retention) return '—'

	const tz = Temporal.Now.timeZoneId()
	const expires = Temporal.Instant.from(completedAt)
		.toZonedDateTimeISO(tz)
		.add(Temporal.Duration.from(retention))
	const nowZdt = Temporal.Now.zonedDateTimeISO()
	if (expires.epochMilliseconds - nowZdt.epochMilliseconds <= 0) return 'Expired'

	const diff = nowZdt.until(expires, { largestUnit: 'days', smallestUnit: 'seconds' })
	const parts = []
	if (diff.days > 0) parts.push(`${diff.days}d`)
	if (diff.hours > 0) parts.push(`${diff.hours}h`)
	if (diff.minutes > 0) parts.push(`${diff.minutes}m`)
	parts.push(`${diff.seconds}s`)
	return `${parts.join(' ')} ${options?.clean ? '' : 'left'}`
}

/**
 * Formats how long ago an ISO timestamp occurred (e.g. `"3h ago"`).
 * @param {string} iso - ISO-8601 instant (must include `Z` or a UTC offset).
 * @returns {string} Human-readable elapsed time, or `'—'` if `iso` is falsy.
 */
export const timeAgo = (iso) => {
	if (!iso) return '—'

	const tz = Temporal.Now.timeZoneId()
	const past = Temporal.Instant.from(iso).toZonedDateTimeISO(tz)
	const nowZdt = Temporal.Now.zonedDateTimeISO()
	const diff = past.until(nowZdt, { largestUnit: 'days', smallestUnit: 'seconds' })

	const parts = []
	if (diff.days > 0) parts.push(`${diff.days}d`)
	if (diff.hours > 0) parts.push(`${diff.hours}h`)
	if (diff.minutes > 0) parts.push(`${diff.minutes}m`)
	if (parts.length === 0) parts.push(`${diff.seconds}s`)

	return `${parts.join(' ')} ago`
}

/**
 * Formats the duration between two ISO timestamps in the coarsest readable unit.
 * @param {string} start - ISO-8601 instant (must include `Z` or a UTC offset).
 * @param {string} end - ISO-8601 instant (must include `Z` or a UTC offset).
 * @returns {string} Formatted duration (e.g. `"2h 5mins"`, `"500ms"`), or `'—'` if either is missing.
 */
export const formatDuration = (start, end) => {
	if (!start || !end) return '—'

	const msDiff =
		Temporal.Instant.from(end).epochMilliseconds -
		Temporal.Instant.from(start).epochMilliseconds
	if (msDiff < 1000) return `${Math.round(msDiff)}ms`

	const h = Math.floor(msDiff / 3600000)
	const m = Math.floor((msDiff % 3600000) / 60000)
	const s = Math.round((msDiff % 60000) / 1000)

	if (h > 0) return `${h}h ${m > 0 ? `${m}mins` : ''}`.trim()
	if (m > 0 && s > 0) return `${m}m ${s}s`
	if (m > 0) return `${m}m`
	return `${s}s`
}

/**
 * Computes the duration between two ISO timestamps in milliseconds, capped at `maxDuration`.
 * @param {string} startDate - ISO-8601 instant (must include `Z` or a UTC offset).
 * @param {string} [endDate] - ISO-8601 instant; defaults to now.
 * @param {number} [maxDuration=Infinity] - Upper bound on the returned duration.
 * @returns {number} Duration in milliseconds.
 */
export const durationInMS = (startDate, endDate, maxDuration) => {
	const start = Temporal.Instant.from(startDate)
	const end = endDate ? Temporal.Instant.from(endDate) : Temporal.Now.instant()
	return Math.min(end.epochMilliseconds - start.epochMilliseconds, maxDuration ?? Infinity)
}

/**
 * Formats an ISO-8601 timestamp as `"yyyy-MM-dd HH:mm:ss"` in the system time zone.
 * @param {string} iso - ISO-8601 instant (must include `Z` or a UTC offset).
 * @returns {string} Formatted date/time string.
 */
export const formatISO = (iso) => {
	const tz = Temporal.Now.timeZoneId()
	return Temporal.Instant.from(iso)
		.toZonedDateTimeISO(tz)
		.toPlainDateTime()
		.toString({ smallestUnit: 'second' })
		.replace('T', ' ')
}
