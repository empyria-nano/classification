import { describe, test, expect } from 'bun:test'
import { chunkDocument } from '../lib/Chunker.js'

describe('chunkDocument', () => {
	test('returns a short document as a single chunk', () => {
		const result = chunkDocument('This is a short sentence. Another one follows.')
		expect(result).toEqual([
			{ index: 0, content: 'This is a short sentence. Another one follows.' },
		])
	})

	test('splits a long document into multiple, sequentially-indexed chunks', () => {
		const sentence = 'The quick brown fox jumps over the lazy dog. '
		const longText = sentence.repeat(60)
		const result = chunkDocument(longText, {
			targetWords: 100,
			overlapWords: 10,
			minChunkWords: 20,
		})
		expect(result.length).toBeGreaterThan(1)
		expect(result.map((c) => c.index)).toEqual(result.map((_, i) => i))
	})

	test('splits a single very long sentence at the word level', () => {
		const words = Array.from({ length: 500 }, (_, i) => `word${i}`).join(' ')
		const result = chunkDocument(words, { targetWords: 100 })
		expect(result.length).toBeGreaterThan(1)
	})

	test('returns an empty array for empty or non-string input', () => {
		expect(chunkDocument('')).toEqual([])
		expect(chunkDocument('   ')).toEqual([])
		expect(chunkDocument(null)).toEqual([])
		expect(chunkDocument(123)).toEqual([])
	})
})
