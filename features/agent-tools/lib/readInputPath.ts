/**
 * One value from a tool call: `length`, `shelf.x`, or `items[0]`.
 * A leading `$.` is accepted. Filters, slices, wildcards, and `..` are rejected.
 */
export function readInputPath(
	document: unknown,
	path: string,
): {ok: true; value: unknown} | {ok: false; message: string} {
	let rest = path.trim();
	if (rest.startsWith("$")) {
		rest = rest.slice(1);
		if (rest.startsWith(".")) rest = rest.slice(1);
		else if (rest.length > 0 && !rest.startsWith("[")) {
			return {
				ok: false,
				message: `Path "${path}" uses an unsupported selector.`,
			};
		}
	}
	if (rest.includes("..") || /[*?:]/.test(rest)) {
		return {
			ok: false,
			message: `Path "${path}" uses an unsupported selector.`,
		};
	}
	let node: unknown = document;
	while (rest.length > 0) {
		const index = /^\[(\d+)\]/.exec(rest);
		if (index) {
			const next = indexValue(node, Number(index[1]));
			if (!next.ok) return fail(path);
			node = next.value;
			rest = rest.slice(index[0].length);
			if (rest.startsWith(".")) {
				rest = rest.slice(1);
				if (rest.length === 0) return fail(path);
			}
			continue;
		}
		const name = /^[A-Za-z_][A-Za-z0-9_]*/.exec(rest);
		if (!name) return fail(path);
		const next = childValue(node, name[0]);
		if (!next.ok) return fail(path);
		node = next.value;
		rest = rest.slice(name[0].length);
		if (rest.startsWith(".")) {
			rest = rest.slice(1);
			if (rest.length === 0) return fail(path);
		}
	}
	return {ok: true, value: node};
}

function fail(path: string): {ok: false; message: string} {
	return {ok: false, message: `Path "${path}" did not match a single value.`};
}

function childValue(
	node: unknown,
	key: string,
): {ok: true; value: unknown} | {ok: false} {
	if (typeof node !== "object" || node === null || Array.isArray(node)) {
		return {ok: false};
	}
	const record = node as Record<string, unknown>;
	if (!Object.prototype.hasOwnProperty.call(record, key)) return {ok: false};
	return {ok: true, value: record[key]};
}

function indexValue(
	node: unknown,
	index: number,
): {ok: true; value: unknown} | {ok: false} {
	if (!Array.isArray(node) || index < 0 || index >= node.length) {
		return {ok: false};
	}
	return {ok: true, value: node[index]};
}
