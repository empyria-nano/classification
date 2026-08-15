import { describe, test, expect } from 'bun:test'
import {
	defined,
	expandParam,
	pick,
	namify,
	assignIfDefined,
	assignAllIfDefined,
	cloneIfDefined,
	pickIfDefined,
	collectDefinedValues,
	cloneDefined,
	assignDefined,
	getByPath,
	updateByPath,
	clone,
	cloneSelected,
	date2timestamp,
	constantify,
	enumise,
	enumiseAll,
	templating,
	contexting,
	until,
	withRetry,
	cloneSchema,
} from '../lib/Helpers.js'

describe('defined', () => {
	test('distinguishes defined from nullish values', () => {
		expect(defined(0)).toBe(true)
		expect(defined(undefined)).toBe(false)
		expect(defined(null)).toBe(false)
	})
})

describe('expandParam', () => {
	test('joins arrays', () => {
		expect(expandParam([1, 2])).toBe('1, 2')
	})

	test('renders objects as key/value pairs', () => {
		expect(expandParam({ a: 1, b: 'x' })).toBe('a: 1, b: "x"')
	})

	test('passes through undefined unchanged', () => {
		expect(expandParam(undefined)).toBeUndefined()
	})
})

describe('pick', () => {
	test('extracts values by key, in order', () => {
		expect(pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual([1, 3])
	})
})

describe('namify', () => {
	test('normalizes into a constant-style name', () => {
		expect(namify(' hello-world ')).toBe('HELLO_WORLD')
	})
})

describe('assignIfDefined', () => {
	test('fills in only missing keys', () => {
		expect(assignIfDefined({ a: 1 }, { a: 2, b: 3 })).toEqual({ a: 1, b: 3 })
	})
})

describe('assignAllIfDefined', () => {
	test('applies sources in order without overwriting', () => {
		expect(assignAllIfDefined({}, { a: 1 }, { a: 2, b: 3 })).toEqual({ a: 1, b: 3 })
	})
})

describe('cloneIfDefined', () => {
	test('keeps only defined properties', () => {
		expect(cloneIfDefined({ a: 1, b: undefined })).toEqual({ a: 1 })
	})
})

describe('pickIfDefined', () => {
	test('builds an object from defined selected keys', () => {
		expect(pickIfDefined({ a: 1, b: undefined, c: 3 }, ['a', 'b', 'c'])).toEqual({ a: 1, c: 3 })
	})
})

describe('collectDefinedValues', () => {
	test('flattens and filters defined values', () => {
		expect(collectDefinedValues({ a: [1, 2], b: 3, c: undefined }, ['a', 'b', 'c'])).toEqual([
			1, 2, 3,
		])
	})
})

describe('cloneDefined', () => {
	test('drops nullish own properties', () => {
		expect(cloneDefined({ a: 1, b: null, c: 3 })).toEqual({ a: 1, c: 3 })
	})
})

describe('assignDefined', () => {
	test('overwrites target with defined source values', () => {
		expect(assignDefined({ a: 1 }, { a: 2, b: 3 })).toEqual({ a: 2, b: 3 })
	})
})

describe('getByPath', () => {
	test('reads a nested value', () => {
		expect(getByPath({ a: { b: { c: 42 } } }, 'a.b.c')).toBe(42)
	})

	test('returns undefined for a missing path', () => {
		expect(getByPath({ a: {} }, 'a.b.c')).toBeUndefined()
	})
})

describe('updateByPath', () => {
	test('writes a nested value, creating missing objects', () => {
		expect(updateByPath({}, 'a.b', 5, true)).toEqual({ a: { b: 5 } })
	})

	test('throws when an intermediate object is missing and create is false', () => {
		expect(() => updateByPath({}, 'a.b', 5, false)).toThrow()
	})
})

describe('clone', () => {
	test('deep-clones and strips $$strict', () => {
		expect(clone({ a: 1, $$strict: true })).toEqual({ a: 1 })
	})

	test('passes through undefined unchanged', () => {
		expect(clone(undefined)).toBeUndefined()
	})
})

describe('cloneSelected', () => {
	test('deep-clones only the selected keys', () => {
		expect(cloneSelected({ a: 1, b: 2 }, ['a'])).toEqual({ a: 1 })
	})
})

describe('date2timestamp', () => {
	test('matches the equivalent Temporal conversion', () => {
		const expected = Temporal.PlainDateTime.from({
			year: 2024,
			month: 1,
			day: 1,
		}).toZonedDateTime(Temporal.Now.timeZoneId()).epochMilliseconds
		expect(date2timestamp(2024, 1, 1)).toBe(expected)
	})
})

describe('constantify', () => {
	test('normalizes keys into constant style', () => {
		expect(constantify({ fooBar: 1, 'baz qux': 2 })).toEqual({ FOOBAR: 1, BAZ_QUX: 2 })
	})
})

describe('enumise', () => {
	test('builds a normalized-name to value map', () => {
		expect(enumise(['Foo', 'bar baz'], 'PRE_')).toEqual({
			PRE_FOO: 'Foo',
			PRE_BAR_BAZ: 'bar baz',
		})
	})
})

describe('enumiseAll', () => {
	test('applies enumise to every group', () => {
		expect(enumiseAll({ group: ['a', 'b'] })).toEqual({ group: { A: 'a', B: 'b' } })
	})
})

describe('templating', () => {
	test('fills placeholders from variables', () => {
		expect(templating('Hello {name}, age {age}', { name: 'Bob', age: 30 })).toBe(
			'Hello Bob, age 30',
		)
	})

	test('treats double-braced placeholders as literal', () => {
		expect(templating('{{escaped}}', {})).toBe('{escaped}')
	})
})

describe('contexting', () => {
	test('substitutes ${param} placeholders', () => {
		expect(contexting('Hello ${name}!', { name: 'Bob' })).toBe('Hello Bob!')
	})

	test('drops an optional block when its parameter is missing', () => {
		expect(contexting('A![${x}]B', {})).toBe('AB')
	})
})

describe('until', () => {
	test('resolves OK once the status function succeeds', async () => {
		expect(await until(() => true)).toBe('OK')
	})

	test('throws once retries are exhausted', async () => {
		await expect(until(() => false, { maxRetries: 1, patience: 1 })).rejects.toThrow()
	})
})

describe('withRetry', () => {
	test('retries until the wrapped function succeeds', async () => {
		let attempts = 0
		const fn = withRetry(
			null,
			async () => {
				attempts++
				if (attempts < 2) throw new Error('not yet')
				return 'done'
			},
			{ maxRetries: 2 },
		)
		expect(await fn()).toBe('done')
		expect(attempts).toBe(2)
	})

	test('throws the last error once retries are exhausted', async () => {
		const fn = withRetry(
			null,
			async () => {
				throw new Error('always fails')
			},
			{ maxRetries: 1 },
		)
		await expect(fn()).rejects.toThrow('always fails')
	})
})

describe('cloneSchema', () => {
	test('clones a properties-shaped schema', () => {
		const typeDef = { type: 'object', title: 'T', properties: { a: { type: 'string' } } }
		expect(cloneSchema(typeDef)).toEqual({
			type: 'object',
			properties: { a: { type: 'string' } },
			title: 'T',
			description: undefined,
			required: undefined,
			oneOf: undefined,
			additionalProperties: false,
		})
	})
})
