import { describe, test, expect } from 'bun:test'
import {
	findLast,
	findAsync,
	mapAsync,
	filterAsync,
	pushIfNotIncluded,
	insertAt,
	groupBy,
	hasIntersection,
	ensureDefaultItem,
	randomElement,
	randomElements,
	randomElementByDistribution,
	permutations,
	concat,
	asArray,
	combinations,
} from '../lib/ArrayServices.js'

describe('findLast', () => {
	test('finds the last matching element', async () => {
		expect(await findLast([1, 2, 3, 4], (x) => x % 2 === 0)).toBe(4)
	})

	test('returns null when nothing matches', async () => {
		expect(await findLast([1, 3, 5], (x) => x % 2 === 0)).toBe(null)
	})
})

describe('findAsync', () => {
	test('finds the first element an async predicate accepts', async () => {
		expect(await findAsync([1, 2, 3], async (x) => x > 1)).toBe(2)
	})

	test('returns null when nothing matches', async () => {
		expect(await findAsync([1, 2], async () => false)).toBe(null)
	})
})

describe('mapAsync', () => {
	test('maps sequentially through an async function', async () => {
		expect(await mapAsync([1, 2, 3], async (x) => x * 2)).toEqual([2, 4, 6])
	})
})

describe('filterAsync', () => {
	test('filters using an async predicate', async () => {
		expect(await filterAsync([1, 2, 3, 4], async (x) => x % 2 === 0)).toEqual([2, 4])
	})
})

describe('pushIfNotIncluded', () => {
	test('adds only elements not already present', () => {
		expect(pushIfNotIncluded([1, 2], 2, 3)).toEqual([1, 2, 3])
	})
})

describe('insertAt', () => {
	test('inserts without mutating the source array', () => {
		const source = [1, 2, 4]
		expect(insertAt(source, 2, 3)).toEqual([1, 2, 3, 4])
		expect(source).toEqual([1, 2, 4])
	})
})

describe('groupBy', () => {
	test('groups items by a key', () => {
		const items = [
			{ k: 'a', v: 1 },
			{ k: 'b', v: 2 },
			{ k: 'a', v: 3 },
		]
		expect(groupBy(items, 'k')).toEqual({
			a: [
				{ k: 'a', v: 1 },
				{ k: 'a', v: 3 },
			],
			b: [{ k: 'b', v: 2 }],
		})
	})
})

describe('hasIntersection', () => {
	test('returns a shared element when present', () => {
		expect(hasIntersection([1, 2, 3], [3, 4])).toBe(3)
	})

	test('returns undefined when there is no overlap', () => {
		expect(hasIntersection([1, 2], [3, 4])).toBeUndefined()
	})
})

describe('ensureDefaultItem', () => {
	test('pushes the default only when the array is empty', () => {
		expect(ensureDefaultItem([], 'x')).toEqual(['x'])
		expect(ensureDefaultItem(['y'], 'x')).toEqual(['y'])
	})
})

describe('randomElement', () => {
	test('picks an element from the array', () => {
		expect(randomElement([42])).toBe(42)
	})

	test('throws on a non-array', () => {
		expect(() => randomElement(null)).toThrow()
	})
})

describe('randomElements', () => {
	test('picks a duplicate-free subset within the requested range', () => {
		const source = [1, 2, 3, 4, 5]
		const result = randomElements(source, 3, 3)
		expect(result.length).toBe(3)
		expect(new Set(result).size).toBe(3)
		for (const item of result) expect(source).toContain(item)
	})
})

describe('randomElementByDistribution', () => {
	test('picks a member of the array', () => {
		const result = randomElementByDistribution(['a', 'b'], [0.5, 1])
		expect(['a', 'b']).toContain(result)
	})

	test('throws on mismatched distribution length', () => {
		expect(() => randomElementByDistribution(['a', 'b'], [1])).toThrow()
	})
})

describe('permutations', () => {
	test('computes all orderings', () => {
		expect(permutations([1, 2])).toEqual([
			[1, 2],
			[2, 1],
		])
	})

	test('handles a single element', () => {
		expect(permutations([1])).toEqual([[1]])
	})
})

describe('concat', () => {
	test('flattens arrays and scalars, dropping nullish values', () => {
		expect(concat([1, 2], 3, null, undefined, [4])).toEqual([1, 2, 3, 4])
	})
})

describe('asArray', () => {
	test('wraps a scalar', () => {
		expect(asArray(5)).toEqual([5])
	})

	test('leaves an array untouched', () => {
		expect(asArray([1, 2])).toEqual([1, 2])
	})
})

describe('combinations', () => {
	test('computes every non-empty subset, shortest first', () => {
		expect(combinations([1, 2])).toEqual([[1], [2], [1, 2]])
	})
})
