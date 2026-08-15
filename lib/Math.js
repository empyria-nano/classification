/**
 * Random integer in the half-open range `[min, limit)`.
 * @param {number} limit - Exclusive upper bound (must be > 0).
 * @param {number} [min=0] - Inclusive lower bound (must be >= 0).
 * @returns {number} Random integer.
 * @throws {Error} If `limit` or `min` is out of range.
 */
export function rand(limit, min = 0) {
	if (!(limit > 0) || !(min >= 0))
		throw new Error(`Invalid values passed. limit: ${limit} min: ${min}`)
	return Math.floor(Math.random() * Math.abs(limit - min)) + min
}

/**
 * Rolls a random chance.
 * @param {number} probability - Either a percentage (0-100, e.g. `25`) or a
 *   fraction (0-1, e.g. `0.25`); integers are treated as percentages.
 * @returns {boolean} True with the given probability.
 */
export function chances(probability) {
	return probability % 1 === 0
		? Math.floor(Math.random() * 100) >= 100 - probability
		: Math.random() >= 1 - probability
}

/**
 * Picks a random multiple of `equidistant` within `limit` steps.
 * @param {number} limit - Number of possible steps.
 * @param {number} equidistant - Step size.
 * @returns {number} A random value in `{equidistant, 2*equidistant, ..., limit*equidistant}`.
 */
export function randEquidistant(limit, equidistant) {
	return rand(limit) * equidistant + equidistant
}
