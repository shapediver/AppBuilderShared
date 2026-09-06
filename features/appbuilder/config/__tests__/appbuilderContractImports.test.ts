import * as fs from "node:fs";
import * as path from "node:path";

const CONTRACT_DIR = path.resolve(__dirname, "..");
const SRC_SHARED = path.resolve(CONTRACT_DIR, "../../..");
const ZOD_WRAPPER = path.join(SRC_SHARED, "shared/lib/zod.ts");

const CONTRACT_FILES = [
	"appbuilder.ts",
	"appbuildercharts.ts",
	"appbuilderColor.ts",
	"appbuilderagent.ts",
	"appBuilderActionType.ts",
] as const;

const FROM_RE =
	/(?:^|\n)(?:import|export)(?:\s+type)?\s+([\s\S]*?)\s+from\s+["']([^"']+)["']/g;
const SIDE_EFFECT_RE = /^\s*import\s+["']([^"']+)["']/gm;
const DYNAMIC_RE = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

const FOLLOWABLE_PREFIXES = ["@AppBuilderLib/", "@AppBuilderShared/"] as const;

type ParsedImport = {
	specifier: string;
	importedNames: string[];
};

function isAllowedExternal(
	specifier: string,
	importedNames: string[],
): boolean {
	if (specifier.startsWith("@shapediver/sdk.")) {
		return true;
	}
	if (specifier === "@shapediver/viewer.shared.types") {
		return true;
	}
	if (specifier === "@shapediver/viewer.session") {
		return (
			importedNames.length > 0 &&
			importedNames.every((name) => name === "TAG3D_JUSTIFICATION")
		);
	}
	if (
		specifier === "@AppBuilderLib/shared/lib/zod" ||
		specifier === "@AppBuilderShared/shared/lib/zod"
	) {
		return true;
	}
	return false;
}

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
): string | undefined {
	let base: string;
	if (specifier.startsWith(".")) {
		base = path.resolve(path.dirname(fromFile), specifier);
	} else if (specifier.startsWith("@AppBuilderLib/")) {
		base = path.join(SRC_SHARED, specifier.slice("@AppBuilderLib/".length));
	} else if (specifier.startsWith("@AppBuilderShared/")) {
		base = path.join(
			SRC_SHARED,
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

function relativeToShared(filePath: string): string {
	return path.relative(SRC_SHARED, filePath).replaceAll("\\", "/");
}

function collectDisallowed(startFile: string): string[] {
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
		const from = relativeToShared(filePath);

		for (const {specifier, importedNames} of parseImports(source)) {
			if (isAllowedExternal(specifier, importedNames)) {
				continue;
			}
			if (isFollowable(specifier)) {
				const resolved = resolveFollowable(filePath, specifier);
				if (!resolved) {
					disallowed.push(`${from}: unresolved ${specifier}`);
					continue;
				}
				if (path.resolve(resolved) === path.resolve(ZOD_WRAPPER)) {
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

describe("appbuilder contract import allowlist", () => {
	it.each(CONTRACT_FILES)(
		"%s only imports allowed packages (recursive)",
		(fileName) => {
			expect(
				collectDisallowed(path.join(CONTRACT_DIR, fileName)),
			).toEqual([]);
		},
	);
});
