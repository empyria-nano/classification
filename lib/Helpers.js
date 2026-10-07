import _ from 'isa.js'

const TEMP_PARAM = /\$\{([0-9a-zA-Z_]+)\}/g
const TEMP_OPTIO = /!\[([^\]]+)\]/g

/**
 * Checks whether a value is neither `undefined` nor `null`.
 * @param {*} value - Value to check.
 * @returns {boolean} True if `value` is defined.
 */
export function defined(value) {
	return value !== undefined && value !== null
}

/**
 * Renders a template parameter value as a human-readable string.
 * Functions are invoked with `', '`, arrays are joined, objects are
 * rendered as `key: "value"` pairs, and booleans are JSON-stringified.
 * @param {*} value - Value to render.
 * @returns {*} Rendered string, or `value` unchanged if not a recognised type.
 */
export function expandParam(value) {
	if (!defined(value)) return value
	if (_.isFunction(value)) return value(', ')
	if (_.isArray(value)) return value.join(', ')
	if (_.isObject(value))
		return Object.keys(value)
			.map(
				(key) =>
					key +
					': ' +
					((_.isString(value[key]) ? '"' : '') +
						value[key] +
						(_.isString(value[key]) ? '"' : '')),
			)
			.join(', ')
	if (_.isBoolean(value)) return JSON.stringify(value)
	return value
}

/**
 * Picks values off an object by key, in order.
 * @param {Object} obj - Source object.
 * @param {Array<string>} keys - Keys to extract.
 * @returns {Array} Values corresponding to `keys`, in order.
 */
export function pick(obj, keys) {
	return keys.map((k) => obj[k])
}

/**
 * Normalizes a string into a constant-style name: upper-cased, trimmed,
 * with spaces and hyphens replaced by underscores.
 * @param {string} value - Input string.
 * @returns {string} Normalized identifier.
 */
export function namify(value) {
	return value.toUpperCase().trim().replaceAll(' ', '_').replaceAll('-', '_')
}

/**
 * Copies `keys` from `source` onto `target`, but only where `target`
 * doesn't already have a defined value and `source` does. Mutates `target`.
 * @param {Object} target - Object to fill in.
 * @param {Object} source - Object to read values from.
 * @param {Array<string>} [keys] - Keys to consider; defaults to all of `source`'s keys.
 * @returns {Object} The mutated `target`.
 */
export function assignIfDefined(target, source, keys) {
	keys ??= Object.keys(source)
	for (const key of keys)
		if (!defined(target[key]) && defined(source[key])) target[key] = source[key]
	return target
}

/**
 * Applies {@link assignIfDefined} for each source object, in order. Mutates `target`.
 * @param {Object} target - Object to fill in.
 * @param {...Object} sources - Source objects, applied in order.
 * @returns {Object} The mutated `target`.
 */
export function assignAllIfDefined(target, ...sources) {
	for (const source of sources)
		if (defined(source)) assignIfDefined(target, source, Object.keys(source))
	return target
}

/**
 * Shallow-copies only the defined properties of `source` into a new object.
 * @param {Object} source - Source object.
 * @returns {Object} New object containing `source`'s defined properties.
 */
export function cloneIfDefined(source) {
	return assignIfDefined({}, source, source && Object.keys(source))
}

/**
 * Builds a new object from selected keys of `source`, skipping undefined/null values.
 * @param {Object} source - Source object.
 * @param {Array<string>} [keys] - Keys to include.
 * @returns {Object} New object with the defined selected keys.
 */
export function pickIfDefined(source, keys = []) {
	const res = {}
	for (const key of keys) if (defined(source[key])) res[key] = source[key]
	return res
}

/**
 * Collects and flattens the defined values at the given keys, filtering out falsy items.
 * @param {Object} source - Source object.
 * @param {Array<string>} [keys] - Keys to collect from.
 * @returns {Array} Flattened, truthy values found at `keys`.
 */
export function collectDefinedValues(source, keys = []) {
	const res = []
	for (const key of keys)
		if (defined(source[key]))
			res.push(...(Array.isArray(source[key]) ? source[key] : [source[key]]))
	return res.filter((item) => item)
}

/**
 * Builds a shallow copy of `object` containing only its defined own properties.
 * @param {Object} object - Source object.
 * @returns {Object} New object with defined properties only.
 */
export function cloneDefined(object) {
	const res = {}
	for (const key in object) if (defined(object[key])) res[key] = object[key]
	return res
}

/**
 * Copies all defined properties from `source` onto `target`, overwriting existing values. Mutates `target`.
 * @param {Object} [target={}] - Object to write into.
 * @param {Object} [source={}] - Object to read from.
 * @returns {Object} The mutated `target`.
 */
export function assignDefined(target = {}, source = {}) {
	for (const key in source) {
		if (defined(source[key])) target[key] = source[key]
	}
	return target
}

/**
 * Reads a nested value from an object using a dot-separated path.
 * @param {Object} object - Source object.
 * @param {string} path - Dot-separated path, e.g. `"a.b.c"`.
 * @returns {*} The value at `path`, or `undefined` if any step is missing.
 */
export function getByPath(object, path) {
	let steps = path.split('.')
	let ref = object
	for (const step of steps) ref = ref && ref[step]
	return ref
}

/**
 * Writes a value into an object at a dot-separated path. Mutates `obj`.
 * @param {Object} obj - Object to write into.
 * @param {string} path - Dot-separated path, e.g. `"a.b.c"`.
 * @param {*} value - Value to set.
 * @param {boolean} [create=false] - Create missing intermediate objects along the path.
 * @returns {Object} The mutated `obj`.
 */
export function updateByPath(obj, path, value, create = false) {
	let steps = path.split('.')
	let ref = obj

	for (let i = 0; i < steps.length - 1; ++i) {
		if (!ref[steps[i]] && create) ref[steps[i]] = {}

		ref = ref[steps[i]]
	}
	ref[steps[steps.length - 1]] = value

	return obj
}

/**
 * Deep-clones a JSON-serializable object via `JSON.stringify`/`parse`,
 * stripping `$$strict` and any requested attributes.
 * @param {Object} obj - Object to clone.
 * @param {Array<string>} [attributesToIgnore=[]] - Top-level keys to remove from the clone.
 * @returns {Object} Deep-cloned object (or `obj` unchanged if not defined).
 */
export function clone(obj, attributesToIgnore = []) {
	if (!defined(obj)) return obj

	let res = JSON.parse(JSON.stringify(obj))
	delete res.$$strict
	for (const attrib of attributesToIgnore) delete res[attrib]
	return res
}

/**
 * Deep-clones only the selected keys of an object.
 * @param {Object} obj - Source object.
 * @param {Array<string>} [attributesToKeep=[]] - Keys to include in the clone.
 * @returns {Object} Deep-cloned object containing only `attributesToKeep`.
 */
export function cloneSelected(obj, attributesToKeep = []) {
	if (!defined(obj)) return obj

	let res = {}
	for (const attrib of attributesToKeep) res[attrib] = obj[attrib]
	res = JSON.parse(JSON.stringify(res))
	return res
}

/**
 * Converts a calendar date/time into a millisecond timestamp.
 * @param {number} year - Full year.
 * @param {number} [month=1] - Month (1-12).
 * @param {number} [day=1] - Day of month.
 * @param {number} [hour=0] - Hour (0-23).
 * @param {number} [minute=0] - Minute.
 * @param {number} [second=0] - Second.
 * @returns {number} Milliseconds since epoch.
 */
export function date2timestamp(year, month = 1, day = 1, hour = 0, minute = 0, second = 0) {
	return Temporal.PlainDateTime.from({ year, month, day, hour, minute, second }).toZonedDateTime(
		Temporal.Now.timeZoneId(),
	).epochMilliseconds
}

/**
 * Builds a new object whose keys are {@link namify}-normalized versions of `obj`'s keys.
 * @param {Object} [obj={}] - Source object.
 * @returns {Object} Object with constant-style keys.
 */
export function constantify(obj = {}) {
	let res = {}
	for (let key in obj) res[namify(key)] = obj[key]
	return res
}

/**
 * Builds an enum-like object mapping normalized names to their original (trimmed) values.
 * @param {Array<string>} [values=[]] - Enum values.
 * @param {string} [prefix=''] - Prefix added before normalizing each key.
 * @returns {Object<string, string>} Map of normalized name to original value.
 */
export function enumise(values = [], prefix = '') {
	let res = {}
	for (let value of values) {
		let key = namify(prefix + value)
		res[key] = value.trim?.() ?? value
	}
	return res
}

/**
 * Applies {@link enumise} to every value array in an object.
 * @param {Object<string, Array<string>>} [obj={}] - Map of group name to value list.
 * @returns {Object<string, Object>} Map of group name to its enumised object.
 */
export function enumiseAll(obj = {}) {
	let res = {}
	for (let key in obj) res[key] = enumise(obj[key])
	return res
}

/**
 * Fills `{name}` placeholders in a string from a variables object.
 * A placeholder immediately wrapped in extra braces (`{{name}}`) is left literal.
 * @param {string} string - Template string.
 * @param {Object} variables - Values keyed by placeholder name.
 * @returns {string} String with placeholders substituted (missing values become `''`).
 */
export function templating(string, variables) {
	return string.replace(/\{([0-9a-zA-Z_]+)\}/g, (match, i, index) => {
		if (string[index - 1] === '{' && string[index + match.length] === '}') {
			return i
		} else {
			return defined(variables[i]) ? variables[i] : ''
		}
	})
}

/**
 * Resolves a statement containing `${param}` placeholders and optional
 * `![...]` blocks (dropped if any placeholder inside them is missing from `context`).
 * @param {string} statement - Statement template.
 * @param {Object} [context={}] - Values keyed by placeholder name.
 * @returns {string} Resolved statement (unchanged if not a string).
 */
export function contexting(statement, context = {}) {
	if (!statement || !_.isString(statement)) return statement

	const statementNoOpt = statement.replace(TEMP_OPTIO, (match, i) => {
		try {
			let replacement = i.replace(TEMP_PARAM, (m, im) => {
				if (!defined(context[im])) throw new Error(`Missing parameter: ${im}`)
				return expandParam(context[im])
			})
			return replacement
		} catch (err) {
			return ''
		}
	})

	const statementNoParams = statementNoOpt.replace(TEMP_PARAM, (match, i, index) => {
		if (statementNoOpt[index - 1] === '{' && statementNoOpt[index + match.length] === '}') {
			return i
		} else {
			return defined(context[i]) ? expandParam(context[i]) : ''
		}
	})

	return statementNoParams
}

/**
 * Polls `statusFn` until it returns truthy, retrying on failure/falsy results.
 * @param {() => Promise<*>|*} statusFn - Status check; return truthy when done.
 * @param {Object} [options={}]
 * @param {number} [options.maxRetries=0] - Additional attempts after the first.
 * @param {number} [options.patience=100] - Delay in ms between attempts.
 * @param {boolean} [options.terminateOnError=false] - Abort immediately if `statusFn` throws.
 * @returns {Promise<string>} `'OK'` once `statusFn` succeeds.
 * @throws {Error} If the max attempts are exhausted, or `statusFn` throws with `terminateOnError`.
 */
export async function until(statusFn, options = {}) {
	const maxAttempts = 1 + (options.maxRetries > 0 ? options.maxRetries : 0)
	let patience = options.patience > 0 ? options.patience : 100

	let attempt = 0
	while (attempt < maxAttempts) {
		try {
			if (await statusFn()) return 'OK'
		} catch (err) {
			console.error(err)
			if (options.terminateOnError) throw new Error('Status function terminated with error')
		}

		await timeout(patience)

		attempt++
	}
	throw new Error('Termination status never reached')
}

/**
 * Wraps an async function with retry-on-failure logic.
 * @param {*} self - `this` context to bind the wrapped function to.
 * @param {(...args: *[]) => Promise<*>} asyncFn - Function to wrap.
 * @param {Object} [options={}]
 * @param {number} [options.maxRetries=0] - Additional attempts after the first.
 * @param {() => Promise<{shouldRetry: boolean, delayMs: number}>} [options.beforeRetry] - Called before each retry; can veto or delay it.
 * @param {number} [options.delayMs] - Fixed delay in ms between attempts (used when `beforeRetry` isn't given).
 * @returns {(...args: *[]) => Promise<*>} Retrying, `self`-bound version of `asyncFn`.
 */
export function withRetry(self, asyncFn, options = {}) {
	return (async (...params) => {
		const maxAttempts = 1 + (options.maxRetries || 0)
		let lastError
		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				return await asyncFn.apply(this, params)
			} catch (error) {
				lastError = error
			}

			if (attempt === maxAttempts) {
				throw lastError
			}

			if (options.beforeRetry) {
				const { shouldRetry, delayMs } = await options.beforeRetry()

				if (!shouldRetry) throw lastError

				if (delayMs > 0) await timeout(delayMs)
			} else if (options.delayMs > 0) {
				await timeout(options.delayMs)
			}
		}
	}).bind(self)
}

/**
 * Builds a shallow copy of a JSON-schema-like type definition, overriding
 * its `title`/`description` and deep-cloning `allOf`/`properties`/`oneOf`.
 * @param {Object} typeDef - Source schema (`allOf` form or `properties` form).
 * @param {Object} [options={}]
 * @param {string} [options.title] - Override title.
 * @param {string} [options.description] - Override description.
 * @param {boolean} [options.additionalProperties] - Value for `additionalProperties` (properties form only).
 * @returns {Object} New schema object.
 */
export function cloneSchema(typeDef, options = {}) {
	return typeDef.allOf
		? {
				type: 'object',
				title: options.title || typeDef.title,
				description: options.description || typeDef.description,
				allOf: clone(typeDef.allOf),
			}
		: typeDef.properties
			? {
					type: 'object',
					properties: clone(typeDef.properties),
					title: options.title || typeDef.title,
					description: options.description || typeDef.description,
					required: typeDef.required?.slice(),
					oneOf: clone(typeDef.oneOf),
					additionalProperties: !!options.additionalProperties,
				}
			: clone(typeDef)
}
