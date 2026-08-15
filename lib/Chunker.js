/**
 * Splits document text into overlapping, sentence-aware chunks
 * for granular embedding and RAG retrieval.
 *
 * Pure function — no dependencies, no side effects.
 *
 * Usage:
 *   import { chunkDocument } from './chunker.js'
 *   const chunks = chunkDocument(content)
 *   // [{ index: 0, content: '...' }, { index: 1, content: '...' }, ...]
 */

const DEFAULTS = {
	targetWords: 400,
	overlapWords: 60,
	minChunkWords: 80,
}

/**
 * Split text into sentences.
 *
 * Handles: period/exclamation/question followed by space or newline,
 * plus bare newlines (double newline = paragraph break).
 * Keeps the delimiter attached to the sentence that ends with it.
 */
const splitSentences = (text) => {
	const sentences = []

	// Split on sentence-ending punctuation followed by whitespace, or on double newlines
	const parts = text.split(/(?<=[.!?])\s+|(?:\r?\n){2,}/)

	for (const part of parts) {
		const trimmed = part.trim()
		if (trimmed.length > 0) {
			sentences.push(trimmed)
		}
	}

	return sentences
}

/**
 * Count words in a string.
 */
const wordCount = (text) => {
	const trimmed = text.trim()
	if (trimmed.length === 0) return 0
	return trimmed.split(/\s+/).length
}

/**
 * Split a single long sentence into word-level chunks.
 * Fallback for sentences that exceed the target size
 * (common in legal/regulatory text with semicolon-separated clauses).
 */
const splitLongSentence = (sentence, targetWords) => {
	const words = sentence.split(/\s+/)
	const parts = []
	for (let i = 0; i < words.length; i += targetWords) {
		parts.push(words.slice(i, i + targetWords).join(' '))
	}
	return parts
}

/**
 * Build chunks from an array of sentences using a sliding window
 * with overlap.
 *
 * Strategy:
 *   - Accumulate sentences until we reach targetWords
 *   - Emit a chunk
 *   - Rewind by overlapWords worth of sentences for the next chunk
 *   - If the final chunk is below minChunkWords, merge it into the previous one
 */
const buildChunks = (sentences, options) => {
	const { targetWords, overlapWords, minChunkWords } = { ...DEFAULTS, ...options }

	if (sentences.length === 0) return []

	const chunks = []
	let i = 0

	while (i < sentences.length) {
		const chunkSentences = []
		let words = 0
		let j = i

		// accumulate sentences until we hit the target
		while (j < sentences.length && words < targetWords) {
			const sentence = sentences[j]
			const sw = wordCount(sentence)

			// if a single sentence exceeds target, split it at word level
			if (sw > targetWords && chunkSentences.length === 0) {
				const subParts = splitLongSentence(sentence, targetWords)
				// take the first part as this chunk, rest will be picked up on next iteration
				chunkSentences.push(subParts[0])
				words += wordCount(subParts[0])
				// replace the original sentence with its sub-parts for future iterations
				sentences.splice(j, 1, ...subParts)
				j++
				break
			}

			chunkSentences.push(sentence)
			words += sw
			j++
		}

		if (chunkSentences.length > 0) {
			chunks.push(chunkSentences.join(' '))
		}

		// advance: move forward but rewind by enough sentences to cover the overlap
		if (j >= sentences.length) break

		// find how many sentences from the end of current chunk to rewind for overlap
		let overlapCount = 0
		let overlapWordsAccum = 0
		for (let k = chunkSentences.length - 1; k >= 0; k--) {
			overlapWordsAccum += wordCount(chunkSentences[k])
			overlapCount++
			if (overlapWordsAccum >= overlapWords) break
		}

		i = j - overlapCount
		// safety: always advance at least one sentence to avoid infinite loops
		if (i <= j - chunkSentences.length) {
			i = j - chunkSentences.length + 1
		}
	}

	// merge final tiny chunk into the previous one
	if (chunks.length > 1 && wordCount(chunks[chunks.length - 1]) < minChunkWords) {
		const last = chunks.pop()
		chunks[chunks.length - 1] += ' ' + last
	}

	return chunks
}

/**
 * Split document content into overlapping chunks.
 *
 * @param {string} content - Full document text
 * @param {object} [options]
 * @param {number} [options.targetWords=400]    - Target words per chunk
 * @param {number} [options.overlapWords=60]    - Overlap between consecutive chunks
 * @param {number} [options.minChunkWords=80]   - Minimum size for the last chunk (otherwise merged)
 * @returns {Array<{ index: number, content: string }>}
 */
export const chunkDocument = (content, options = {}) => {
	if (!content || typeof content !== 'string') return []

	const trimmed = content.trim()
	if (trimmed.length === 0) return []

	const opts = { ...DEFAULTS, ...options }

	// short document — return as single chunk, no splitting needed
	if (wordCount(trimmed) <= opts.targetWords + opts.minChunkWords) {
		return [{ index: 0, content: trimmed }]
	}

	const sentences = splitSentences(trimmed)

	if (sentences.length === 0) return []

	// single long sentence (no sentence boundaries found) — split at word level
	if (sentences.length === 1) {
		const parts = splitLongSentence(sentences[0], opts.targetWords)
		return parts.map((content, index) => ({ index, content }))
	}

	const chunks = buildChunks(sentences, opts)

	return chunks.map((content, index) => ({ index, content }))
}
