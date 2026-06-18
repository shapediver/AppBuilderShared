import * as fs from "node:fs";
import * as path from "node:path";
import {
	THEME_COMPONENT_DEFAULT_PROPS_REGISTRY_KEYS,
	isRegisteredThemeComponentKey,
	parseThemeComponentNameFromConfigPath,
} from "./themeRegistryDocParity.helpers";

const DOC_FLAT_PATH = path.resolve(process.cwd(), "public/doc-flat.json");

type DocFlatFile = {
	entries: Array<{configPath?: string}>;
};

/**
 * Registry keys validated at settings-parse time but without a matching doc-flat row.
 * - Mantine-only keys: documented via @docLink, not @docAttached.
 * - AppBuilderContainer: doc-flat uses AppBuilderContainerWrapper (wrapper useProps id).
 */
const REGISTRY_KEYS_WITHOUT_DOC_FLAT_ALLOWLIST = new Set([
	"Accordion",
	"AppBuilderContainer",
	"Button",
	"Group",
	"Paper",
	"Text",
]);

/**
 * doc-flat theme defaultProps rows intentionally absent from themeComponentDefaultPropsRegistry.
 * Dynamic runtime keys (NumberAttribute, StringAttribute, ViewportAnchor2d/3d) use computed
 * useProps ids and are not @docAttached — none appear in doc-flat.
 */
const DOC_FLAT_KEYS_WITHOUT_REGISTRY_ALLOWLIST = new Set<string>([]);

function readDocFlatThemeComponentNames(): string[] {
	if (!fs.existsSync(DOC_FLAT_PATH)) {
		throw new Error(
			`Missing ${DOC_FLAT_PATH} — run pnpm run docs before parity tests`,
		);
	}
	const docFlat = JSON.parse(
		fs.readFileSync(DOC_FLAT_PATH, "utf8"),
	) as DocFlatFile;
	if (!Array.isArray(docFlat.entries)) {
		throw new Error(
			`${DOC_FLAT_PATH} has no entries array — regenerate with pnpm run docs`,
		);
	}

	return docFlat.entries
		.map((entry) =>
			parseThemeComponentNameFromConfigPath(entry.configPath ?? ""),
		)
		.filter((name): name is string => name !== null)
		.sort();
}

describe("theme registry vs doc-flat parity (C3)", () => {
	let registryKeys: string[] = [];
	let docFlatKeys: string[] = [];
	let registryInDoc: string[] = [];
	let registryMissingDoc: string[] = [];
	let docMissingRegistry: string[] = [];

	beforeAll(() => {
		registryKeys = [...THEME_COMPONENT_DEFAULT_PROPS_REGISTRY_KEYS].sort();
		docFlatKeys = readDocFlatThemeComponentNames();
		registryInDoc = registryKeys.filter((k) => docFlatKeys.includes(k));
		registryMissingDoc = registryKeys.filter(
			(k) => !docFlatKeys.includes(k),
		);
		docMissingRegistry = docFlatKeys.filter(
			(k) => !isRegisteredThemeComponentKey(k),
		);
	});

	it("loads doc-flat.json from repo public/", () => {
		const raw = fs.readFileSync(DOC_FLAT_PATH, "utf8");
		const docFlat = JSON.parse(raw) as DocFlatFile;
		expect(docFlat.entries.length).toBeGreaterThan(0);
		expect(docFlat.entries[0]?.configPath).toMatch(
			/^themeOverrides\.components\./,
		);
	});

	it("parseThemeComponentNameFromConfigPath matches doc-flat configPath rows", () => {
		expect(
			parseThemeComponentNameFromConfigPath(
				"themeOverrides.components.Icon.defaultProps",
			),
		).toBe("Icon");
		expect(parseThemeComponentNameFromConfigPath("widgets.foo")).toBeNull();
	});

	it("exports registry keys and isRegisteredThemeComponentKey", () => {
		expect(
			THEME_COMPONENT_DEFAULT_PROPS_REGISTRY_KEYS.length,
		).toBeGreaterThan(0);
		expect(isRegisteredThemeComponentKey("Icon")).toBe(true);
		expect(isRegisteredThemeComponentKey("NotARealComponentKey")).toBe(
			false,
		);
		expect(
			THEME_COMPONENT_DEFAULT_PROPS_REGISTRY_KEYS.every((k) =>
				isRegisteredThemeComponentKey(k),
			),
		).toBe(true);
	});

	it("every registry key has a doc-flat entry or is allowlisted", () => {
		const unexpected = registryMissingDoc.filter(
			(k) => !REGISTRY_KEYS_WITHOUT_DOC_FLAT_ALLOWLIST.has(k),
		);
		expect(unexpected).toEqual([]);
	});

	it("every doc-flat theme defaultProps entry is in registry or is allowlisted", () => {
		const unexpected = docMissingRegistry.filter(
			(k) => !DOC_FLAT_KEYS_WITHOUT_REGISTRY_ALLOWLIST.has(k),
		);
		expect(unexpected).toEqual([]);
	});

	it("reports parity stats", () => {
		const stats = {
			registryKeys: registryKeys.length,
			docFlatThemeKeys: docFlatKeys.length,
			overlap: registryInDoc.length,
			registryOnly: registryMissingDoc.length,
			docOnly: docMissingRegistry.length,
			registryOnlyKeys: registryMissingDoc,
			docOnlyKeys: docMissingRegistry,
		};

		// eslint-disable-next-line no-console -- intentional parity report for CI logs
		console.log(
			"theme registry ↔ doc-flat parity:",
			JSON.stringify(stats, null, 2),
		);

		expect(stats.overlap + stats.registryOnly).toBe(stats.registryKeys);
		expect(stats.overlap + stats.docOnly).toBe(stats.docFlatThemeKeys);
	});
});
