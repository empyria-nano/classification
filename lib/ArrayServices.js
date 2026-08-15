import { rand } from './Math.js'
import { defined } from './Helpers.js'

function* enumerate(iterable) {
	let i = 0

	for (const x of iterable) {
		yield [i, x]
		i++
	}
}

/**
 * Finds the last element (scanning from the end) matching a predicate.
 * @param {Array} array - Array to search.
 * @param {(item: *) => boolean} fn - Predicate.
 * @returns {Promise<*|null>} The matching element, or `null` if none found.
 */
export async function findLast(array, fn) {
	for (let i = array.length - 1; i >= 0; --i) if (fn(array[i])) return array[i]
	return null
}

/**
 * Finds the first element matching an async predicate, checked sequentially.
 * @param {Array} array - Array to search.
 * @param {(item: *) => Promise<boolean>} asncFn - Async predicate.
 * @returns {Promise<*|null>} The matching element, or `null` if none found.
 */
export async function findAsync(array, asncFn) {
	for (let element of array) if (await asncFn(element)) return element
	return null
}

/**
 * Maps an array through an async function, awaiting each call sequentially.
 * @param {Array} array - Array to map.
 * @param {(item: *, index: number) => Promise<*>} asncFn - Async mapper.
 * @returns {Promise<Array>} Array of mapped results, in order.
 */
export async function mapAsync(array, asncFn) {
	let res = []
	for (const [index, element] of enumerate(array)) res.push(await asncFn(element, index))
	return res
}

/**
 * Filters an array using an async predicate, checked sequentially.
 * @param {Array} array - Array to filter.
 * @param {(item: *) => Promise<boolean>} asncFn - Async predicate.
 * @returns {Promise<Array>} Elements for which the predicate resolved truthy.
 */
export async function filterAsync(array, asncFn) {
	let res = []
	for (let element of array) if (await asncFn(element)) res.push(element)
	return res
}

/**
 * Pushes each element onto `array` only if not already present (by `includes`).
 * Mutates and returns `array`.
 * @param {Array} array - Target array.
 * @param {...*} elements - Elements to add if missing.
 * @returns {Array} The same `array`, for chaining.
 */
export function pushIfNotIncluded(array, ...elements) {
	for (let element of elements) {
		if (!array.includes(element)) array.push(element)
	}
	return array
}

/**
 * Returns a new array with `newItem` inserted at `index`.
 * @param {Array} array - Source array (not mutated).
 * @param {number} index - Position to insert at.
 * @param {*} newItem - Item to insert.
 * @returns {Array} New array with the item inserted.
 */
export function insertAt(array, index, newItem) {
	return [...array.slice(0, index), newItem, ...array.slice(index)]
}

/**
 * Groups array items into an object keyed by a property value.
 * @param {Array<Object>} array - Array of objects.
 * @param {string} k - Property name to group by.
 * @returns {Object<string, Array>} Map of key value to items sharing that value.
 */
export function groupBy(array, k) {
	return array.reduce((acc, item) => {
		return ((acc[item[k]] = [...(acc[item[k]] || []), item]), acc)
	}, {})
}

/**
 * Checks whether any element of `list` is present in `array`.
 * @param {Array} array - Array to check against.
 * @param {Array} list - Candidate elements.
 * @returns {*} The first matching element found in `list`, or `undefined`.
 */
export function hasIntersection(array, list) {
	return list?.find((item) => array?.includes(item))
}

/**
 * Pushes `value` onto `array` only if it is currently empty. Mutates and returns `array`.
 * @param {Array} array - Target array.
 * @param {*} value - Default item to add when empty.
 * @returns {Array} The same `array`, for chaining.
 */
export function ensureDefaultItem(array, value) {
	if (array.length === 0) array.push(value)
	return array
}

/**
 * Picks a uniformly random element from an array.
 * @param {Array} array - Non-empty array.
 * @returns {*} A random element.
 * @throws {Error} If `array` is not a valid array.
 */
export function randomElement(array) {
	if (!array || !Array.isArray(array)) throw Error(`Invalid array argument: ${array}`)

	return array[rand(array.length)]
}

/**
 * Picks a random, duplicate-free subset of an array.
 * @param {Array} array - Source array to sample from.
 * @param {number} minNumber - Minimum number of elements to pick.
 * @param {number} maxNumber - Maximum number of elements to pick.
 * @returns {Array} Random subset (size between `minNumber` and `maxNumber`).
 */
export function randomElements(array, minNumber, maxNumber) {
	const elements = []
	const count = rand(maxNumber, minNumber)

	let maxTry = 1000
	while (maxTry-- > 0 && elements.length < count) {
		pushIfNotIncluded(elements, randomElement(array))
	}

	return elements
}

/**
 * Picks an element according to a cumulative probability distribution.
 * @param {Array} array - Candidate values.
 * @param {Array<number>} distribution - Cumulative probabilities aligned with `array`
 *   (e.g. `[0.2, 0.5, 1]`), same length as `array`.
 * @returns {*} The selected element.
 * @throws {Error} If `array`/`distribution` are invalid or mismatched in length.
 */
export function randomElementByDistribution(array, distribution) {
	if (!array || !Array.isArray(array)) throw Error(`Invalid array argument: ${array}`)
	if (!distribution || !Array.isArray(distribution) || array.length !== distribution.length)
		throw Error(`Invalid distribution argument: ${distribution}`)

	let point = Math.random()
	let index = distribution.findIndex((item) => item >= point)
	return array[Math.min(Math.max(index, 0), array.length - 1)]
}

/**
 * Computes all permutations of an array.
 * @param {Array} arr - Input array.
 * @returns {Array<Array>} All permutations of `arr`.
 */
export function permutations(arr) {
	if (arr.length <= 2) return arr.length === 2 ? [arr, [arr[1], arr[0]]] : [arr]
	return arr.reduce(
		(acc, item, i) =>
			acc.concat(
				permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map((val) => [
					item,
					...val,
				]),
			),
		[],
	)
}

/**
 * Flattens a mix of arrays and scalars into a single array, dropping
 * `undefined`/`null` entries.
 * @param {...*} elements - Arrays and/or scalar values.
 * @returns {Array} Flattened, compacted array.
 */
export function concat(...elements) {
	const arr = []

	for (const element of elements) {
		if (!defined(element)) continue
		if (Array.isArray(element)) arr.push(...element)
		else arr.push(element)
	}

	return arr
}

/**
 * Wraps a non-array value in a single-element array; arrays pass through unchanged.
 * @param {*} object - Value or array.
 * @returns {Array} `object` itself if already an array, otherwise `[object]`.
 */
export function asArray(object) {
	return Array.isArray(object) ? object : [object]
}

/**
 * Computes every non-empty combination (the power set minus the empty set)
 * of `valuesArray`, sorted by combination length.
 * @param {Array} valuesArray - Input values (should be small — cost is 2^n).
 * @returns {Array<Array>} All non-empty subsets, shortest first.
 */
export function combinations(valuesArray) {
	var combi = []
	var temp = []
	var slent = Math.pow(2, valuesArray.length)

	for (var i = 0; i < slent; i++) {
		temp = []
		for (var j = 0; j < valuesArray.length; j++) {
			if (i & Math.pow(2, j)) {
				temp.push(valuesArray[j])
			}
		}
		if (temp.length > 0) {
			combi.push(temp)
		}
	}

	combi.sort((a, b) => a.length - b.length)
	return combi
}
