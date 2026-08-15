import { now, toZoned } from './lib/Date.js'

export * from './lib/ArrayServices'
export * from './lib/Chunker'
export * from './lib/Date'
export * from './lib/Helpers'
export * from './lib/Math'
export * from './lib/Name'

/** Generic "operation succeeded" status flag. */
export const OK = 'OK'
/** Generic "not applicable" status flag. */
export const NA = 'NA'
/** Wildcard marker matching any value. */
export const ANY = '*'
/** Marker representing the full/unfiltered set. */
export const ALL = 'ALL'

/**
 * Checks whether a timestamp falls on the current calendar day.
 * @param {number} timestamp - Milliseconds since epoch.
 * @returns {boolean} True if `timestamp` is today.
 */
export function isToday(timestamp) {
	return startOfDay(timestamp) === startOfDay(now())
}

/**
 * Returns the start (00:00:00.000) of the day containing `timestamp`.
 * @param {number} timestamp - Milliseconds since epoch.
 * @returns {number} Milliseconds since epoch for the start of that day.
 */
export function startOfDay(timestamp) {
	return toZoned(timestamp).startOfDay().epochMilliseconds
}

/**
 * Returns the end (23:59:59.999) of the day containing `timestamp`.
 * @param {number} timestamp - Milliseconds since epoch.
 * @returns {number} Milliseconds since epoch for the end of that day.
 */
export function endOfDay(timestamp) {
	return toZoned(timestamp).startOfDay().add({ days: 1 }).epochMilliseconds - 1
}

/**
 * Builds the start/end bounds of the day containing `timestamp`.
 * @param {number} timestamp - Milliseconds since epoch.
 * @returns {{startDate: number, endDate: number}} Day boundaries in milliseconds.
 */
export function day(timestamp) {
	return {
		startDate: startOfDay(timestamp),
		endDate: endOfDay(timestamp),
	}
}
