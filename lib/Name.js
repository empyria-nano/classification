import { transliterate } from 'transliteration'

/**
 * Normalizes a string into a transliterated, whitespace-free, upper-case code.
 * Useful for turning free-text names into stable comparison keys.
 * @param {string} str - Input string.
 * @returns {string} Transliterated, upper-cased, whitespace-stripped result (or the falsy input as-is).
 */
export function TRANS(str) {
	return str && transliterate(str.trim().replace(/\s+/g, '').trim().toUpperCase())
}

/**
 * Capitalises the first character of a string, leaving the rest untouched.
 * @param {string} str - Input string.
 * @returns {string} String with its first character upper-cased (or the falsy input as-is).
 */
export function capitalise(str) {
	if (!str) return str
	return `${str.substring(0, 1).toUpperCase()}${str.substring(1)}`
}

/**
 * Truncates a string to `limit` characters, appending `...` if it was cut.
 * @param {string} str - Input string.
 * @param {number} limit - Maximum length before truncation.
 * @returns {string} Truncated string (or the falsy input as-is).
 */
export function shortify(str, limit) {
	if (!str) return str
	return `${str.substring(0, limit)}${str.length > limit ? '...' : ''}`
}

export { transliterate }
