import { describe, test, expect } from 'bun:test'
import { OK, NA, ANY, ALL, isToday, startOfDay, endOfDay, day, now, DAY } from '../ArClass.js'

describe('status constants', () => {
	test('expose their expected values', () => {
		expect(OK).toBe('OK')
		expect(NA).toBe('NA')
		expect(ANY).toBe('*')
		expect(ALL).toBe('ALL')
	})
})

describe('isToday', () => {
	test('is true for the current time', () => {
		expect(isToday(now())).toBe(true)
	})

	test('is false for a timestamp far in the past', () => {
		expect(isToday(now() - 10 * DAY)).toBe(false)
	})
})

describe('startOfDay / endOfDay', () => {
	test('span exactly one day', () => {
		const ts = now()
		expect(endOfDay(ts) - startOfDay(ts)).toBe(DAY - 1)
	})

	test('throw on an invalid timestamp', () => {
		expect(() => startOfDay(NaN)).toThrow()
		expect(() => endOfDay(NaN)).toThrow()
	})
})

describe('day', () => {
	test('matches startOfDay/endOfDay', () => {
		const ts = now()
		expect(day(ts)).toEqual({ startDate: startOfDay(ts), endDate: endOfDay(ts) })
	})
})
