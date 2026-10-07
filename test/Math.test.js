import { describe, test, expect } from 'bun:test'
import { rand, chances, randEquidistant } from '../lib/Math.js'

describe('rand', () => {
	test('returns an integer within [min, limit)', () => {
		for (let i = 0; i < 50; ++i) {
			const value = rand(10, 5)
			expect(value).toBeGreaterThanOrEqual(5)
			expect(value).toBeLessThan(10)
			expect(Number.isInteger(value)).toBe(true)
		}
	})

	test('throws on an invalid limit', () => {
		expect(() => rand(0)).toThrow()
	})

	test('throws on an invalid min', () => {
		expect(() => rand(10, -1)).toThrow()
	})
})

describe('chances', () => {
	test('always true at 100%', () => {
		expect(chances(100)).toBe(true)
	})

	test('always false at 0%', () => {
		expect(chances(0)).toBe(false)
	})
})

describe('randEquidistant', () => {
	test('returns a multiple of the step within range', () => {
		// limit=1 forces rand(1) to always be 0, making this deterministic
		expect(randEquidistant(1, 10)).toBe(10)
	})
})
