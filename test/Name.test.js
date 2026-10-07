import { describe, test, expect } from 'bun:test'
import { TRANS, capitalise, shortify, transliterate } from '../lib/Name.js'

describe('TRANS', () => {
	test('transliterates, strips whitespace, and upper-cases', () => {
		expect(TRANS('hello world')).toBe('HELLOWORLD')
	})

	test('passes through falsy input unchanged', () => {
		expect(TRANS('')).toBe('')
		expect(TRANS(null)).toBe(null)
	})
})

describe('capitalise', () => {
	test('upper-cases only the first character', () => {
		expect(capitalise('hello')).toBe('Hello')
	})

	test('passes through falsy input unchanged', () => {
		expect(capitalise('')).toBe('')
		expect(capitalise(null)).toBe(null)
	})
})

describe('shortify', () => {
	test('truncates and appends an ellipsis when over the limit', () => {
		expect(shortify('hello world', 5)).toBe('hello...')
	})

	test('leaves short strings untouched', () => {
		expect(shortify('hi', 5)).toBe('hi')
	})

	test('passes through falsy input unchanged', () => {
		expect(shortify('', 5)).toBe('')
	})
})

describe('transliterate', () => {
	test('is re-exported from the transliteration package', () => {
		expect(typeof transliterate).toBe('function')
	})
})
