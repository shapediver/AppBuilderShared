import * as fs from "node:fs";
import * as path from "node:path";

/** AppBuilderShared root (`src/shared`). */
export const APPBUILDER_SHARED_ROOT = path.resolve(__dirname, "../..");

const FROM_RE =
	/(?:^|\n)(?:import|export)(?:\s+type)?\s+([\s\S]*?)\s+from\s+["']([^"']+)["']/g;
const SIDE_EFFECT_RE = /^\s*import\s+["']([^"']+)["']/gm;
const DYNAMIC_RE = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;
const FOLLOWABLE_PREFIXES = ["@AppBuilderLib/", "@AppBuilderShared/"] as const;

export type AllowedExternal = (
	specifier: string,
	importedNames: string[],
) => boolean;

type ParsedImport = {
	specifier: string;
	importedNames: string[];
};

function importedNamesFromClause(clause: string): string[] {
	const named = clause.match(/\{([^}]*)\}/);
	if (!named) {
		return [];
	}
	return named[1]
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean)
		.map((part) => {
			const withoutType = part.replace(/^type\s+/, "");
			const [name] = withoutType.split(/\s+as\s+/);
			return name.trim();
		})
		.filter(Boolean);
}

function parseImports(source: string): ParsedImport[] {
	const imports: ParsedImport[] = [];
	for (const match of source.matchAll(FROM_RE)) {
		imports.push({
			specifier: match[2],
			importedNames: importedNamesFromClause(match[1]),
		});
	}
	for (const match of source.matchAll(SIDE_EFFECT_RE)) {
		imports.push({specifier: match[1], importedNames: []});
	}
	for (const match of source.matchAll(DYNAMIC_RE)) {
		imports.push({specifier: match[1], importedNames: []});
	}
	return imports;
}

function isFollowable(specifier: string): boolean {
	return (
		specifier.startsWith(".") ||
		FOLLOWABLE_PREFIXES.some((prefix) => specifier.startsWith(prefix))
	);
}

function resolveFollowable(
	fromFile: string,
	specifier: string,
	srcShared: string,
): string | undefined {
	let base: string;
	if (specifier.startsWith(".")) {
		base = path.resolve(path.dirname(fromFile), specifier);
	} else if (specifier.startsWith("@AppBuilderLib/")) {
		base = path.join(srcShared, specifier.slice("@AppBuilderLib/".length));
	} else if (specifier.startsWith("@AppBuilderShared/")) {
		base = path.join(
			srcShared,
			specifier.slice("@AppBuilderShared/".length),
		);
	} else {
		return undefined;
	}

	const candidates = [
		base,
		`${base}.ts`,
		`${base}.tsx`,
		`${base}.js`,
		`${base}.jsx`,
		path.join(base, "index.ts"),
		path.join(base, "index.tsx"),
	];
	return candidates.find((candidate) => fs.existsSync(candidate));
}

function formatImport(specifier: string, importedNames: string[]): string {
	return importedNames.length > 0
		? `${specifier} (${importedNames.join(", ")})`
		: specifier;
}

function relativeToShared(filePath: string, srcShared: string): string {
	return path.relative(srcShared, filePath).replaceAll("\\", "/");
}

/**
 * Walk `startFile`'s import graph under AppBuilderShared and return disallowed
 * specifiers. Follows relative, `@AppBuilderLib/`, and `@AppBuilderShared/`
 * imports. `shared/lib/zod.ts` is a terminal node (the `zod` package is not
 * walked). Unresolved followable specifiers are reported as failures.
 */
export function collectDisallowedImports(
	startFile: string,
	options: {
		isAllowedExternal: AllowedExternal;
		srcShared?: string;
	},
): string[] {
	const srcShared = options.srcShared ?? APPBUILDER_SHARED_ROOT;
	const zodWrapper = path.join(srcShared, "shared/lib/zod.ts");
	const disallowed: string[] = [];
	const stack = [startFile];
	const visited = new Set<string>();

	while (stack.length > 0) {
		const filePath = stack.pop() as string;
		if (visited.has(filePath)) {
			continue;
		}
		visited.add(filePath);

		const source = fs.readFileSync(filePath, "utf8");
		const from = relativeToShared(filePath, srcShared);

		for (const {specifier, importedNames} of parseImports(source)) {
			if (options.isAllowedExternal(specifier, importedNames)) {
				continue;
			}
			if (isFollowable(specifier)) {
				const resolved = resolveFollowable(
					filePath,
					specifier,
					srcShared,
				);
				if (!resolved) {
					disallowed.push(`${from}: unresolved ${specifier}`);
					continue;
				}
				if (path.resolve(resolved) === path.resolve(zodWrapper)) {
					continue;
				}
				stack.push(resolved);
				continue;
			}
			disallowed.push(
				`${from}: ${formatImport(specifier, importedNames)}`,
			);
		}
	}

	return disallowed;
}
