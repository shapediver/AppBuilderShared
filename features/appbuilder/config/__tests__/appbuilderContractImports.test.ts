import * as fs from "node:fs";
import * as path from "node:path";

const CONTRACT_DIR = path.resolve(__dirname, "..");
const CONTRACT_FILES = [
	"appbuilder.ts",
	"appbuildercharts.ts",
	"appbuilderColor.ts",
] as const;

const IMPORT_RE =
	/(?:^|\n)import(?:\s+type)?\s+([\s\S]*?)\s+from\s+["']([^"']+)["']/g;

function isAllowedSpecifier(
	specifier: string,
	importedNames: string[],
): boolean {
	if (specifier.startsWith(".")) {
		return true;
	}
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

describe("appbuilder contract import allowlist", () => {
	it.each(CONTRACT_FILES)("%s only imports allowed packages", (fileName) => {
		const source = fs.readFileSync(
			path.join(CONTRACT_DIR, fileName),
			"utf8",
		);
		const disallowed: string[] = [];
		for (const match of source.matchAll(IMPORT_RE)) {
			const clause = match[1];
			const specifier = match[2];
			const names = importedNamesFromClause(clause);
			if (!isAllowedSpecifier(specifier, names)) {
				disallowed.push(
					names.length > 0
						? `${specifier} (${names.join(", ")})`
						: specifier,
				);
			}
		}
		expect(disallowed).toEqual([]);
	});
});
